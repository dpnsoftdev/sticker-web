// src/api/variant/variantRepository.ts
import type { Prisma } from "@prisma/client";
import { prisma } from "@/common/db/postgres/client";
import { VariantListQuery } from "./variantModel";

export const variantRepository = {
  findMany: async (params: VariantListQuery) => {
    const { page, limit, product_id } = params;
    const parsedPage = parseInt(page.toString());
    const parsedLimit = parseInt(limit.toString());

    const query: Prisma.VariantFindManyArgs = {
      where: product_id ? { productId: product_id } : {},
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
      orderBy: { id: "asc" },
    };

    return prisma.variant.findMany(query);
  },

  findById: async (id: string) =>
    prisma.variant.findUnique({
      where: { id },
      include: { product: true },
    }),

  create: async (data: Prisma.VariantUncheckedCreateInput) => prisma.variant.create({ data }),

  update: async (id: string, data: Prisma.VariantUncheckedUpdateInput) =>
    prisma.variant.update({
      where: { id },
      data,
    }),

  delete: async (id: string) =>
    prisma.variant.delete({
      where: { id },
    }),
};
