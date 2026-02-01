// src/api/variant/variantModel.ts
import { z } from "zod";

/* =======================
  Variant Schemas (synced with Prisma Variant model)
======================= */

export const VariantSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number().int().nullable(),
  stock: z.number().int().nullable(),
  images: z.array(z.string()).default([]),
});

/* =======================
  Requests
======================= */

export const CreateVariantSchema = z.object({
  body: VariantSchema.omit({ id: true }),
});

export const UpdateVariantSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: VariantSchema.partial().omit({ id: true, productId: true }),
});

export const GetVariantSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const VariantListQuerySchema = z.object({
  product_id: z.string().uuid().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

export type VariantListQuery = z.infer<typeof VariantListQuerySchema>;

export const ListVariantSchema = z.object({
  query: z.object(VariantListQuerySchema.shape),
});

export type Variant = z.infer<typeof VariantSchema>;
