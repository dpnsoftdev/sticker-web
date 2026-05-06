// src/api/category/categoryRepository.ts
import type { Prisma } from "@/common/lib/prisma-client";
import { prisma } from "@/common/databases/postgres/client";

export const categoryRepository = {
  findMany: async () =>
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { products: true } },
      },
    }),

  findById: async (id: string) =>
    prisma.category.findUnique({
      where: { id },
    }),

  findBySlug: async (slug: string) =>
    prisma.category.findUnique({
      where: { slug },
    }),

  create: async (data: Prisma.CategoryCreateInput) => prisma.category.create({ data }),

  update: async (id: string, data: Prisma.CategoryUpdateInput) =>
    prisma.category.update({
      where: { id },
      data,
    }),

  delete: async (id: string) =>
    prisma.category.delete({
      where: { id },
    }),
};
