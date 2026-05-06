// src/api/product/productModel.ts
import { z } from "zod";

/* =======================
  Product Schemas (synced with Prisma Product model)
  Note: price/stock live on Variant, not Product.
======================= */

const productTypeEnum = z.enum(["in_stock", "preorder"]);
const productStatusEnum = z.enum(["active", "inactive", "archived"]);

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  status: productStatusEnum.default("active"),
  categoryId: z.string().uuid(),
  productType: productTypeEnum.default("in_stock"),

  currency: z.string().default("VND"),
  priceNote: z.string().nullable().optional(),
  shippingNote: z.string().nullable().optional(),
  viewCount: z.number().int().default(0),

  sellerName: z.string(),
  description: z.string().nullable().optional(),
  sizeDescription: z.string().nullable().optional(),
  packageDescription: z.string().nullable().optional(),
  preorderDescription: z.string().nullable().optional(),

  images: z.array(z.string()).default([]),
  preorderStartsAt: z.string().datetime().nullable().optional(),
  preorderEndsAt: z.string().datetime().nullable().optional(),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/* =======================
  Create product with optional variants
======================= */

/** Variant payload when creating a product (no id, productId set by server). Prisma Variant uses stockOnHand. */
export const CreateVariantInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  price: z.number().int().min(0).default(0),
  stock: z.number().int().min(0).default(0),
  images: z.array(z.string()).default([]),
  isDefault: z.boolean().optional().default(false),
});

export type CreateVariantInput = z.infer<typeof CreateVariantInputSchema>;

/** Create body: product fields + optional variants. For single-product flow, omit variants and send price/stock; backend creates a default variant. */
export const CreateProductSchema = z.object({
  body: ProductSchema.omit({
    id: true,
    viewCount: true,
    createdAt: true,
    updatedAt: true,
  }).extend({
    variants: z.array(CreateVariantInputSchema).optional(),
    price: z.number().int().min(0).optional(),
    stock: z.number().int().min(0).optional(),
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

export const GetProductBySlugSchema = z.object({
  params: z.object({
    slug: z.string().min(1, "Slug is required"),
  }),
});

export const DeleteProductSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const DeleteProductAssetSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    path: z.string().min(1, "Asset path is required"),
  }),
});

const productSortEnum = z.enum(["newest", "price_asc", "price_desc", "name_asc"]);

export const ProductListQuerySchema = z.object({
  category_id: z.string().uuid().optional(),
  product_type: productTypeEnum.optional(),
  keyword: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
  sort: productSortEnum.default("newest"),
});

export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;

export const ListProductSchema = z.object({
  query: z.object(ProductListQuerySchema.shape),
});

export const RecordProductViewBodySchema = z.object({
  viewerId: z.string().uuid().optional(),
});

export const RecordProductViewSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: RecordProductViewBodySchema.optional().default({}),
});

export const RecordProductViewResponseSchema = z.object({
  counted: z.boolean(),
});

export type Product = z.infer<typeof ProductSchema>;
