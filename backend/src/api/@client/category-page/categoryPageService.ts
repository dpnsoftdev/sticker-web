// src/api/@client/category-page/categoryPageService.ts
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { getDefaultProductImageUrl, getDefaultVariant, isSoldOutProduct } from "@/common/utils";
import type { ProductWithVariants } from "@/common/types";
import { categoryPageRepository } from "./categoryPageRepository";
import type { CategoryPageProduct, CategoryPageProductsQuery } from "./categoryPageModel";

function toCategoryPageProduct(product: ProductWithVariants): CategoryPageProduct {
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

export const categoryPageService = {
  getProductsByCategorySlug: async (slug: string, query: CategoryPageProductsQuery) => {
    const { category, data, total } = await categoryPageRepository.findProductsByCategorySlug(slug, query);

    if (!category) {
      return ServiceResponse.failure("Category not found", null, StatusCodes.NOT_FOUND);
    }

    const cards: CategoryPageProduct[] = data.map(toCategoryPageProduct);
    return ServiceResponse.success("Category products retrieved", { data: cards, total }, StatusCodes.OK);
  },
};
