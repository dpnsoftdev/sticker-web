// src/api/product/productService.ts
import type { Prisma, Product, Variant } from "@/common/lib/prisma-client";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { assetService } from "@/api/assets/assetService";
import { productRepository } from "./productRepository";
import { variantRepository } from "@/api/variant/variantRepository";
import { prisma } from "@/common/databases/postgres/client";
import { buildImageFullUrls, getVariantAvailable, normalizeS3Key } from "@/common/utils";
import { ProductListQuery } from "./productModel";
import { S3_PREFIX_FOLDERS } from "@/common/constants";
import { isS3MissingObjectBenignError } from "@/api/assets/assetService";

export const productService = {
  list: async (query: ProductListQuery) => {
    const { data, total } = await productRepository.findMany(query);
    const dataWithFullUrls = data.map((product) => ({
      ...product,
      images: buildImageFullUrls(product.images ?? []),
      variants: (product.variants ?? []).map((v) => ({
        ...v,
        images: buildImageFullUrls(v.images ?? []),
        stock: getVariantAvailable(v),
      })),
    }));
    return ServiceResponse.success("Products retrieved", { data: dataWithFullUrls, total }, StatusCodes.OK);
  },

  // using only at admin side
  getById: async (id: string) => {
    const product = await productRepository.findById(id);
    if (!product) {
      return ServiceResponse.failure("Product not found", null, StatusCodes.NOT_FOUND);
    }
    const variants = (product.variants ?? []).map((v) => ({
      ...v,
      stock: getVariantAvailable(v),
    }));
    return ServiceResponse.success("Product retrieved", { ...product, variants }, StatusCodes.OK);
  },

  getBySlug: async (slug: string) => {
    const product = await productRepository.findBySlug(slug);
    if (!product) {
      return ServiceResponse.failure("Product not found", null, StatusCodes.NOT_FOUND);
    }

    const variantList = product.variants ?? [];
    const isSingleProduct = variantList.length === 1;
    const images = isSingleProduct ? [] : buildImageFullUrls(product.images ?? []);
    const variants = variantList.map((v) => ({
      ...v,
      images: buildImageFullUrls(v.images ?? []),
      stock: getVariantAvailable(v),
    }));

    return ServiceResponse.success("Product retrieved", { ...product, images, variants }, StatusCodes.OK);
  },

  create: async (data: any) => {
    const { variants, categoryId, price: singlePrice, stock: singleStock, ...rest } = data;
    const productData = { ...rest };
    delete (productData as Record<string, unknown>).price;
    delete (productData as Record<string, unknown>).stock;

    const productImages = Array.isArray(productData.images) ? productData.images : [];

    const productPayload: Prisma.ProductCreateInput = {
      ...productData,
      images: [], // set after moving tmp images to products/${productId}/...
      category: { connect: { id: categoryId } },
    };

    const isSingleProduct = !variants?.length;

    // create product and variants together in a transaction
    const { product, createdVariants } = await prisma.$transaction(
      async (tx: Prisma.TransactionClient): Promise<{ product: Product; createdVariants: Variant[] }> => {
        const created = await tx.product.create({ data: productPayload });
        const variantList: Variant[] = [];

        if (isSingleProduct) {
          const defaultVariantPayload: Prisma.VariantCreateInput = {
            product: { connect: { id: created.id } },
            name: productData.name || "Default product variant",
            description: productData.description ?? null,
            price: typeof singlePrice === "number" ? singlePrice : 0,
            stockOnHand: typeof singleStock === "number" ? singleStock : 0,
            stockReserved: 0,
            isDefault: true,
            images: [],
          };
          const defaultVariant = await tx.variant.create({ data: defaultVariantPayload });
          variantList.push(defaultVariant);
        } else {
          for (const v of variants) {
            const variantPayload: Prisma.VariantCreateInput = {
              product: { connect: { id: created.id } },
              name: v.name,
              description: v.description ?? null,
              price: typeof v.price === "number" ? v.price : 0,
              stockOnHand: typeof v.stock === "number" ? v.stock : 0,
              stockReserved: 0,
              isDefault: Boolean(v.isDefault),
              images: [], // set after moving tmp images to products/${productId}/variants/...
            };
            const variant = await tx.variant.create({ data: variantPayload });
            variantList.push(variant);
          }
        }

        return { product: created, createdVariants: variantList };
      },
    );

    try {
      // move the /tmp images to the /product folder
      if (productImages.length > 0) {
        const targetFolder = `${S3_PREFIX_FOLDERS.PRODUCTS}/${product.id}`;
        const resolvedProductImages = await assetService.moveTmpKeysToFolder(productImages, targetFolder);
        await productRepository.update(product.id, { images: resolvedProductImages });

        // isSingleProduct - disable copying product images to variant images
        // if (isSingleProduct && createdVariants[0]) {
        //   await variantRepository.update(createdVariants[0].id, {
        //     images: resolvedProductImages,
        //   });
        // }
      }

      // move the /tmp images to the variant folders
      if (!isSingleProduct && Array.isArray(variants)) {
        const targetFolder = `${S3_PREFIX_FOLDERS.PRODUCTS}/${product.id}/variants`;
        for (let i = 0; i < createdVariants.length; i++) {
          const variantImages = variants[i]?.images;
          if (Array.isArray(variantImages) && variantImages.length > 0) {
            const resolvedVariantImages = await assetService.moveTmpKeysToFolder(variantImages, targetFolder);
            await variantRepository.update(createdVariants[i].id, {
              images: resolvedVariantImages,
            });
          }
        }
      }
    } catch {
      // rollback the transaction
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.variant.deleteMany({ where: { productId: product.id } });
        await tx.product.delete({ where: { id: product.id } });
      });
      return ServiceResponse.failure("Image upload failed", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }

    const newProduct = await productRepository.findById(product.id);
    return ServiceResponse.success("Product created", newProduct!, StatusCodes.CREATED);
  },

  update: async (id: string, data: any) => {
    let updatePayload = data;
    if (Array.isArray(data?.images)) {
      try {
        const targetFolder = `${S3_PREFIX_FOLDERS.PRODUCTS}/${id}`;
        const resolvedImages = await assetService.moveTmpKeysToFolder(data.images, targetFolder);
        updatePayload = { ...data, images: resolvedImages };
      } catch (err) {
        console.error("product update move images:", err);
        return ServiceResponse.failure("Failed to move product images", null, StatusCodes.INTERNAL_SERVER_ERROR);
      }
    }
    const product = await productRepository.update(id, updatePayload);
    return ServiceResponse.success("Product updated", product, StatusCodes.OK);
  },

  deleteAsset: async (productId: string, assetPath: string) => {
    const product = await productRepository.findById(productId);
    if (!product) {
      return ServiceResponse.failure("Product not found", null, StatusCodes.NOT_FOUND);
    }

    const normalizedPath = assetPath.startsWith("/") ? assetPath.slice(1) : assetPath;
    const expectedPrefix = `${S3_PREFIX_FOLDERS.PRODUCTS}/${productId}/`;
    if (!normalizedPath.startsWith(expectedPrefix)) {
      return ServiceResponse.failure("Asset does not belong to this product", null, StatusCodes.BAD_REQUEST);
    }

    const imageIndex = product.images.indexOf(normalizedPath);
    if (imageIndex === -1) {
      return ServiceResponse.failure("Asset not found on product", null, StatusCodes.NOT_FOUND);
    }

    try {
      await assetService.deleteObject(normalizedPath);
    } catch (err) {
      console.error("Failed to delete asset from S3:", err);
      return ServiceResponse.failure("Failed to delete asset from storage", null, StatusCodes.INTERNAL_SERVER_ERROR);
    }

    const updatedImages = product.images.filter((_, i) => i !== imageIndex);
    const variants = product.variants ?? [];

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: { images: updatedImages },
      });

      // check if the image key on variant and remove it
      for (const v of variants) {
        const imgs = v.images ?? [];
        const next = imgs.filter((img) => normalizeS3Key(img) !== normalizedPath);
        if (next.length !== imgs.length) {
          await tx.variant.update({
            where: { id: v.id },
            data: { images: next },
          });
        }
      }
    });

    return ServiceResponse.success("Asset deleted", { images: updatedImages }, StatusCodes.OK);
  },

  delete: async (id: string) => {
    const product = await productRepository.findById(id);
    if (!product) {
      return ServiceResponse.failure("Product not found", null, StatusCodes.NOT_FOUND);
    }

    const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderItemCount > 0) {
      return ServiceResponse.failure(
        "Cannot delete this product because it appears in one or more orders. Set status to archived or inactive instead.",
        null,
        StatusCodes.CONFLICT,
      );
    }

    const variantIds = (product.variants ?? []).map((v) => v.id);

    const productPrefix = `${S3_PREFIX_FOLDERS.PRODUCTS}/${id}`;
    try {
      await assetService.deleteObjectsByPrefix(productPrefix);
    } catch (err) {
      if (isS3MissingObjectBenignError(err)) {
        console.warn("Product S3 cleanup: object(s) already absent or not found, continuing product delete:", err);
      } else {
        console.error("Failed to delete product assets from S3:", err);
        return ServiceResponse.failure("Failed to delete product assets", null, StatusCodes.INTERNAL_SERVER_ERROR);
      }
    }

    let campaignItemWhere: Prisma.CampaignItemWhereInput;
    if (variantIds.length > 0) {
      campaignItemWhere = { OR: [{ productId: id }, { variantId: { in: variantIds } }] };
    } else {
      campaignItemWhere = { productId: id };
    }

    await prisma.$transaction(async (tx) => {
      if (variantIds.length > 0) {
        await tx.stockReservation.deleteMany({ where: { variantId: { in: variantIds } } });
      }
      await tx.campaignItem.deleteMany({ where: campaignItemWhere });
      await tx.variant.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });

    return ServiceResponse.success("Product deleted", null, StatusCodes.OK);
  },
};
