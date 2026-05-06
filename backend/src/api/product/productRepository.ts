// src/api/product/productRepository.ts
import type { Prisma } from "@/common/lib/prisma-client";
import { prisma } from "@/common/databases/postgres/client";
import { ProductListQuery } from "./productModel";

/** Product has no top-level price; price lives on Variant. Price sorts fall back to createdAt. */
const orderByMap: Record<string, { createdAt?: "asc" | "desc"; name?: "asc" | "desc" }> = {
  newest: { createdAt: "desc" },
  price_asc: { createdAt: "desc" },
  price_desc: { createdAt: "desc" },
  name_asc: { name: "asc" },
};

export const productRepository = {
  findMany: async (params: ProductListQuery) => {
    const { page, limit, category_id, product_type, keyword, sort = "newest" } = params;
    const parsedPage = Math.max(1, parseInt(page.toString(), 10));
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit.toString(), 10)));

    const where: Prisma.ProductWhereInput = {
      ...(category_id && { categoryId: category_id }),
      ...(product_type && { productType: product_type }),
      ...(keyword && { name: { contains: keyword, mode: "insensitive" } }),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { variants: true },
        skip: (parsedPage - 1) * parsedLimit,
        take: parsedLimit,
        orderBy: orderByMap[sort] ?? orderByMap["newest"],
      }),
      prisma.product.count({ where }),
    ]);

    return { data: products, total };
  },

  findById: async (id: string) =>
    prisma.product.findUnique({
      where: { id },
      include: { variants: true },
    }),

  findBySlug: async (slug: string) =>
    prisma.product.findUnique({
      where: { slug },
      include: {
        variants: {
          where: { status: "active" },
          orderBy: [{ isDefault: "desc" }, { id: "asc" }],
        },
      },
    }),

  create: async (data: Prisma.ProductCreateInput) => prisma.product.create({ data }),

  update: async (id: string, data: Prisma.ProductUpdateInput) =>
    prisma.product.update({
      where: { id },
      data,
    }),

  delete: async (id: string) =>
    prisma.product.delete({
      where: { id },
    }),
};
