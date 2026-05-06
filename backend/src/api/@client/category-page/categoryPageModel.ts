// src/api/@client/category-page/categoryPageModel.ts
import { z } from "zod";

const ProductTypeEnum = z.enum(["in_stock", "preorder"]);
const sortEnum = z.enum(["newest", "price_asc", "price_desc", "name_asc"]);

/** Single product card for category page listing */
export const CategoryPageProductSchema = z.object({
  _id: z.string().uuid(),
  thumbnail: z.string(),
  name: z.string(),
  price: z.number().int().nullable(),
  product_type: ProductTypeEnum,
  slug: z.string(),
  out_of_stock: z.boolean(),
});

/** Path params for GET /category-page/:slug/products */
export const CategoryPageProductsParamsSchema = z.object({
  slug: z.string().min(1, "Category slug is required"),
});

/** Query for GET /category-page/:slug/products */
export const CategoryPageProductsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(12),
  sort: sortEnum.default("newest"),
  keyword: z.string().optional(),
});

/** Response: paginated list of product cards */
export const CategoryPageProductsResponseSchema = z.object({
  data: z.array(CategoryPageProductSchema),
  total: z.number().int().min(0),
});

export type CategoryPageProduct = z.infer<typeof CategoryPageProductSchema>;
export type CategoryPageProductsQuery = z.infer<typeof CategoryPageProductsQuerySchema>;
