// src/api/category/categoryModel.ts
import { z } from "zod";

/* =======================
  Category Schemas (synced with Prisma Category model)
======================= */

export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable().optional(),
  image: z.array(z.string()).default([]),
});

/* =======================
  Requests
======================= */

export const CreateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    description: z.string().optional(),
    images: z.array(z.string()).default([]),
  }),
});

export type CreateCategoryBody = z.infer<typeof CreateCategorySchema>["body"];
export type Category = z.infer<typeof CategorySchema>;
