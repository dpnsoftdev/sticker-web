// src/api/variant/variantModel.ts
import { z } from "zod";

/* =======================
  Variant Schemas (synced with Prisma Variant model)
======================= */

export const VariantSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  price: z.number().int().min(0),
  stockOnHand: z.number().int().min(0),
  stockReserved: z.number().int().min(0).optional().default(0),
  /** Backward compat: editable stock = stockOnHand. Available to sell = stockOnHand - stockReserved. */
  stock: z.number().int().min(0).optional(),
  images: z.array(z.string()).default([]),
  isDefault: z.boolean().optional().default(false),
});

/* =======================
  Requests
======================= */

/** Create body: clients send `stock` (→ stockOnHand); stockOnHand/stockReserved optional. */
export const CreateVariantBodySchema = z.object({
  productId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  price: z.number().int().min(0).default(0),
  stock: z.number().int().min(0).optional(),
  stockOnHand: z.number().int().min(0).optional(),
  stockReserved: z.number().int().min(0).optional(),
  images: z.array(z.string()).default([]),
  isDefault: z.boolean().optional().default(false),
});

export const CreateVariantSchema = z.object({
  body: CreateVariantBodySchema,
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

export const RemoveVariantImageSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    key: z.string().min(1, "key is required"),
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

export type CreateVariantBody = z.infer<typeof CreateVariantBodySchema>;
