// src/api/product/productService.ts
import type { Prisma } from "@prisma/client";
import type { Product, Variant } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { assetService } from "@/api/assets/assetService";
import { productRepository } from "./productRepository";
import { variantRepository } from "@/api/variant/variantRepository";
import { prisma } from "@/common/db/postgres/client";
import { ProductListQuery } from "./productModel";
import { S3_PREFIX_FOLDERS } from "@/common/constants";

export const productService = {
  list: async (query: ProductListQuery) => {
    const products = await productRepository.findMany(query);
    return ServiceResponse.success("Products retrieved", products, StatusCodes.OK);
  },

  getById: async (id: string) => {
    const product = await productRepository.findById(id);
    if (!product) {
      return ServiceResponse.failure("Product not found", null, StatusCodes.NOT_FOUND);
    }

    return ServiceResponse.success("Product retrieved", product, StatusCodes.OK);
  },

  create: async (data: any) => {
    const { variants, categoryId, ...productData } = data;
    const productImages = Array.isArray(productData.images) ? productData.images : [];

    const productPayload: Prisma.ProductCreateInput = {
      ...productData,
      images: [], // set after moving tmp images to products/${productId}/...
      category: { connect: { id: categoryId } },
    };

    const { product, createdVariants } = await prisma.$transaction(
      async (tx): Promise<{ product: Product; createdVariants: Variant[] }> => {
        const created = await tx.product.create({ data: productPayload });
        const variantList: Variant[] = [];
        if (variants?.length) {
          for (const v of variants) {
            const variantPayload: Prisma.VariantCreateInput = {
              product: { connect: { id: created.id } },
              name: v.name,
              description: v.description ?? null,
              price: v.price ?? null,
              stock: v.stock ?? null,
              images: [], // set after moving tmp images to products/${productId}/variants/...
            };
            const variant = await tx.variant.create({ data: variantPayload });
            variantList.push(variant);
          }
        }
        return { product: created, createdVariants: variantList };
      },
    );

    if (productImages.length > 0) {
      const targetFolder = `${S3_PREFIX_FOLDERS.PRODUCTS}/${product.id}`;
      const resolvedProductImages = await assetService.moveTmpKeysToFolder(productImages, targetFolder);
      await productRepository.update(product.id, { images: resolvedProductImages });
    }

    if (createdVariants.length > 0 && Array.isArray(variants)) {
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

    const newProduct = await productRepository.findById(product.id);
    return ServiceResponse.success("Product created", newProduct!, StatusCodes.CREATED);
  },

  update: async (id: string, data: any) => {
    const product = await productRepository.update(id, data);
    return ServiceResponse.success("Product updated", product, StatusCodes.OK);
  },

  delete: async (id: string) => {
    await productRepository.delete(id);
    return ServiceResponse.success("Product deleted", null, StatusCodes.OK);
  },
};
