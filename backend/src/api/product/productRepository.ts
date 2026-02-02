// src/api/product/productRepository.ts
import type { Prisma } from "@prisma/client";
import { prisma } from "@/common/db/postgres/client";
import { ProductListQuery } from "./productModel";

export const productRepository = {
  findMany: async (params: ProductListQuery) => {
    const { page, limit, category_id, product_type, keyword } = params;
    const parsedPage = parseInt(page.toString());
    const parsedLimit = parseInt(limit.toString());

    const query: Prisma.ProductFindManyArgs = {
      where: {
        categoryId: category_id,
        productType: product_type,
        name: keyword ? { contains: keyword, mode: "insensitive" } : undefined,
      },
      include: {
        variants: true,
      },
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
      orderBy: { createdAt: "desc" },
    };

    return prisma.product.findMany(query);
  },

  findById: async (id: string) =>
    prisma.product.findUnique({
      where: { id },
      include: { variants: true },
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
