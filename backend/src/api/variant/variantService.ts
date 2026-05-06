// src/api/variant/variantService.ts
import type { Prisma } from "@/common/lib/prisma-client";
import { prisma } from "@/common/databases/postgres/client";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { assetService } from "@/api/assets/assetService";
import { variantRepository } from "./variantRepository";
import { CreateVariantBody, VariantListQuery } from "./variantModel";
import { S3_PREFIX_FOLDERS } from "@/common/constants";
import { normalizeS3Key } from "@/common/utils";

/** Keys under `products/{id}/variants/...` are variant uploads; others may mirror product.images. */
function isVariantFolderS3Key(key: string): boolean {
  return normalizeS3Key(key).includes("/variants/");
}

/** Map Prisma variant to API response; include backward-compat "stock" = stockOnHand. */
function mapVariantResponse(v: { stockOnHand: number; stockReserved: number; [k: string]: unknown }) {
  return { ...v, stock: v.stockOnHand };
}

export const variantService = {
  list: async (query: VariantListQuery) => {
    const variants = await variantRepository.findMany(query);
    return ServiceResponse.success(
      "Variants retrieved",
      variants.map((v) => mapVariantResponse(v)),
      StatusCodes.OK,
    );
  },

  getById: async (id: string) => {
    const variant = await variantRepository.findById(id);
    if (!variant) {
      return ServiceResponse.failure("Variant not found", null, StatusCodes.NOT_FOUND);
    }
    return ServiceResponse.success("Variant retrieved", mapVariantResponse(variant), StatusCodes.OK);
  },

  create: async (data: CreateVariantBody) => {
    const stockOnHand =
      typeof data.stock === "number" ? data.stock : typeof data.stockOnHand === "number" ? data.stockOnHand : 0;
    const stockReserved = typeof data.stockReserved === "number" ? data.stockReserved : 0;

    let images = Array.isArray(data.images) ? [...data.images] : [];
    if (images.length > 0) {
      try {
        const targetFolder = `${S3_PREFIX_FOLDERS.PRODUCTS}/${data.productId}/variants`;
        images = await assetService.moveTmpKeysToFolder(images, targetFolder);
      } catch (err) {
        console.error("variant create move images:", err);
        return ServiceResponse.failure("Failed to move variant images", null, StatusCodes.INTERNAL_SERVER_ERROR);
      }
    }

    const isDefault = Boolean(data.isDefault);
    if (isDefault) {
      await prisma.variant.updateMany({
        where: { productId: data.productId },
        data: { isDefault: false },
      });
    }

    const payload: Prisma.VariantCreateInput = {
      product: { connect: { id: data.productId } },
      name: data.name,
      description: data.description ?? null,
      price: typeof data.price === "number" ? data.price : 0,
      stockOnHand,
      stockReserved,
      images,
      isDefault,
    };
    const variant = await variantRepository.create(payload);
    return ServiceResponse.success("Variant created", mapVariantResponse(variant), StatusCodes.CREATED);
  },

  update: async (
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      price: number;
      stockOnHand: number;
      stock: number;
      images: string[];
      isDefault: boolean;
    }>,
  ) => {
    let existing: Awaited<ReturnType<typeof variantRepository.findById>> | null = null;
    if (data.isDefault === true || data.images !== undefined) {
      existing = await variantRepository.findById(id);
      if (!existing) {
        return ServiceResponse.failure("Variant not found", null, StatusCodes.NOT_FOUND);
      }
    }

    if (data.isDefault === true && existing?.productId) {
      await prisma.variant.updateMany({
        where: { productId: existing.productId, id: { not: id } },
        data: { isDefault: false },
      });
    }

    let resolvedImages: string[] | undefined = data.images;
    if (data.images !== undefined && existing) {
      try {
        const targetFolder = `${S3_PREFIX_FOLDERS.PRODUCTS}/${existing.productId}/variants`;
        resolvedImages = await assetService.moveTmpKeysToFolder(data.images, targetFolder);
      } catch (err) {
        console.error("variant update move images:", err);
        return ServiceResponse.failure("Failed to move variant images", null, StatusCodes.INTERNAL_SERVER_ERROR);
      }
    }

    const stockOnHand =
      typeof data.stockOnHand === "number" ? data.stockOnHand : typeof data.stock === "number" ? data.stock : undefined;
    const payload: Prisma.VariantUpdateInput = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(typeof data.price === "number" && { price: data.price }),
      ...(typeof stockOnHand === "number" && { stockOnHand }),
      ...(resolvedImages !== undefined && { images: resolvedImages }),
      ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
    };
    const variant = await variantRepository.update(id, payload);
    return ServiceResponse.success("Variant updated", mapVariantResponse(variant), StatusCodes.OK);
  },

  /**
   * Delete the object from S3, then remove its key from the variant's images array.
   */
  removeImage: async (variantId: string, key: string) => {
    const variant = await variantRepository.findById(variantId);
    if (!variant) {
      return ServiceResponse.failure("Variant not found", null, StatusCodes.NOT_FOUND);
    }
    const images = Array.isArray(variant.images) ? [...variant.images] : [];
    const normalizedTarget = normalizeS3Key(key);
    const idx = images.findIndex((k) => normalizeS3Key(k) === normalizedTarget);
    if (idx === -1) {
      return ServiceResponse.failure("Image key is not on this variant", null, StatusCodes.BAD_REQUEST);
    }

    // if (images.length <= 1) {
    //   return ServiceResponse.failure("Cannot remove the last image from a variant", null, StatusCodes.BAD_REQUEST);
    // }

    const canonicalKey = images[idx];
    await assetService.deleteObject(canonicalKey);
    const nextImages = images.filter((_, i) => i !== idx);

    const updated = await prisma.$transaction(async (tx) => {
      const vRow = await tx.variant.update({
        where: { id: variantId },
        data: { images: nextImages },
      });

      // check if the image key on product and remove it
      if (!isVariantFolderS3Key(canonicalKey) && variant.productId && variant.product) {
        const pImages = variant.product.images ?? [];
        const nextProductImages = pImages.filter((img) => normalizeS3Key(img) !== normalizedTarget);
        if (nextProductImages.length !== pImages.length) {
          await tx.product.update({
            where: { id: variant.productId },
            data: { images: nextProductImages },
          });
        }
      }

      return vRow;
    });

    return ServiceResponse.success("Variant image removed", mapVariantResponse(updated), StatusCodes.OK);
  },

  delete: async (id: string) => {
    await variantRepository.delete(id);
    return ServiceResponse.success("Variant deleted", null, StatusCodes.OK);
  },
};
