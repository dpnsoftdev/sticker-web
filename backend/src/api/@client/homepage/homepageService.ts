// src/api/homepage/homepageService.ts
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { buildImageFullUrls, getDefaultVariant, isSoldOutProduct, getDefaultProductImageUrl } from "@/common/utils";
import { homepageRepository } from "./homepageRepository";
import type { HomepageCategory, HomepageProduct } from "./homepageModel";
import { ProductWithVariants } from "@/common/types";

function toHomepageProduct(product: ProductWithVariants): HomepageProduct {
  const defaultVariant = getDefaultVariant(product);
  return {
    _id: product.id,
    thumbnail: getDefaultProductImageUrl(product),
    name: product.name,
    price: defaultVariant != null ? defaultVariant.price : null,
    product_type: product.productType,
    slug: product.slug,
    out_of_stock: isSoldOutProduct(product),
  };
}

export const homepageService = {
  getCategoriesWithProducts: async () => {
    const rows = await homepageRepository.findCategoriesWithProducts();
    const data: HomepageCategory[] = rows
      .filter((cat) => cat.products.length > 0)
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description ?? null,
        images: buildImageFullUrls(cat.images ?? []),
        created_at: cat.createdAt?.toISOString(),
        updated_at: cat.updatedAt?.toISOString(),
        products: cat.products.map(toHomepageProduct),
      }));
    return ServiceResponse.success("Homepage data retrieved", data, StatusCodes.OK);
  },
};
