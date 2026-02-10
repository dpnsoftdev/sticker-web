// src/api/category/categoryRepository.ts
import type { Prisma } from "@prisma/client";
import { prisma } from "@/common/db/postgres/client";

export const categoryRepository = {
  findMany: async () =>
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),

  findBySlug: async (slug: string) =>
    prisma.category.findUnique({
      where: { slug },
    }),

  create: async (data: Prisma.CategoryCreateInput) => prisma.category.create({ data }),
};
