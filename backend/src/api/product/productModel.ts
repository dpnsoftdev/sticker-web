// src/api/product/productModel.ts
import { z } from "zod";

/* =======================
  Product Schemas (synced with Prisma Product model)
======================= */

const productTypeEnum = z.enum(["in_stock", "preorder"]);

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),

  categoryId: z.string().uuid(),
  productType: productTypeEnum.default("in_stock"),

  price: z.number().int().nullable(),
  stock: z.number().int().default(0).nullable(),

  currency: z.string().default("VND"),
  priceNote: z.string().nullable(),
  shippingNote: z.string().nullable(),

  viewCount: z.number().int().default(0),

  sellerName: z.string(),
  sizeDescription: z.string().nullable(),
  packageDescription: z.string().nullable(),
  preorderDescription: z.string().nullable(),

  images: z.array(z.string()).default([]),
  preorder: z.unknown().nullable(),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/* =======================
  Create product with optional variants
======================= */

/** Variant payload when creating a product (no id, productId set by server) */
export const CreateVariantInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  price: z.number().int().nullable().optional(),
  stock: z.number().int().nullable().optional(),
  images: z.array(z.string()).default([]),
});

export type CreateVariantInput = z.infer<typeof CreateVariantInputSchema>;

export const CreateProductSchema = z.object({
  body: ProductSchema.omit({
    id: true,
    viewCount: true,
    createdAt: true,
    updatedAt: true,
  }).extend({
    variants: z.array(CreateVariantInputSchema).optional(),
  }),
});

export const UpdateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: ProductSchema.partial().omit({
    id: true,
    viewCount: true,
    createdAt: true,
    updatedAt: true,
  }),
});

export const GetProductSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const ProductListQuerySchema = z.object({
  category_id: z.string().uuid().optional(),
  product_type: productTypeEnum.optional(),
  keyword: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
});

export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;

export const ListProductSchema = z.object({
  query: z.object(ProductListQuerySchema.shape),
});

export type Product = z.infer<typeof ProductSchema>;
