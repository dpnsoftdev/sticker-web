// src/api/homepage/homepageModel.ts
import { z } from "zod";

const ProductTypeEnum = z.enum(["in_stock", "preorder"]);

/** Homepage product item: minimal fields for listing */
export const HomepageProductSchema = z.object({
  _id: z.string().uuid(),
  thumbnail: z.string(),
  name: z.string(),
  price: z.number().int().nullable(),
  product_type: ProductTypeEnum,
  slug: z.string(),
  out_of_stock: z.boolean(),
});

/** Homepage category with its products */
export const HomepageCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  images: z.array(z.string()).default([]),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  products: z.array(HomepageProductSchema),
});

export const HomepageResponseSchema = z.array(HomepageCategorySchema);

export type HomepageProduct = z.infer<typeof HomepageProductSchema>;
export type HomepageCategory = z.infer<typeof HomepageCategorySchema>;
