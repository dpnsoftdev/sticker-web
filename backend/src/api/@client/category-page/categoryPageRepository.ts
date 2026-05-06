// src/api/@client/category-page/categoryPageRepository.ts
import { categoryRepository } from "@/api/category/categoryRepository";
import { productRepository } from "@/api/product/productRepository";
import type { CategoryPageProductsQuery } from "./categoryPageModel";

export const categoryPageRepository = {
  /**
   * Resolve category by slug, then return paginated products for that category.
   * Uses same filters as product list: sort, keyword. No full variant data needed for cards.
   */
  findProductsByCategorySlug: async (slug: string, query: CategoryPageProductsQuery) => {
    const category = await categoryRepository.findBySlug(slug);
    if (!category) return { category: null, data: [], total: 0 };

    const { page, limit, sort, keyword } = query;
    const { data, total } = await productRepository.findMany({
      category_id: category.id,
      page,
      limit,
      sort,
      keyword,
    });

    return { category, data, total };
  },
};
