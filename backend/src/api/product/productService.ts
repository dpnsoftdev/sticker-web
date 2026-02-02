// src/api/product/productService.ts
import type { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { assetService } from "@/api/assets/assetService";
import { productRepository } from "./productRepository";
import { variantRepository } from "@/api/variant/variantRepository";
import { ProductListQuery } from "./productModel";

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
    const images = Array.isArray(productData.images) ? productData.images : [];
    const resolvedImages = await assetService.moveTmpKeysToProducts(images);
    const payload: Prisma.ProductCreateInput = {
      ...productData,
      images: resolvedImages,
      category: { connect: { id: categoryId } },
    };
    const product = await productRepository.create(payload);

    if (variants?.length) {
      for (const v of variants) {
        const variantPayload: Prisma.VariantCreateInput = {
          product: { connect: { id: product.id } },
          name: v.name,
          description: v.description ?? null,
          price: v.price ?? null,
          stock: v.stock ?? null,
          images: v.images ?? [],
        };
        await variantRepository.create(variantPayload);
      }
    }

    const productWithVariants = await productRepository.findById(product.id);
    return ServiceResponse.success("Product created", productWithVariants!, StatusCodes.CREATED);
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
