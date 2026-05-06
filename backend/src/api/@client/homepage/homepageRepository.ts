// src/api/homepage/homepageRepository.ts
import { prisma } from "@/common/databases/postgres/client";

const HOMEPAGE_PRODUCTS_PER_CATEGORY = 20;

export const homepageRepository = {
  /** Get categories sorted by createdAt desc, each with up to 20 products (sorted by createdAt desc). Products include all active variants so out-of-stock can be computed from total stock. */
  findCategoriesWithProducts: async () => {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        products: {
          where: { status: "active" },
          orderBy: { createdAt: "desc" },
          take: HOMEPAGE_PRODUCTS_PER_CATEGORY,
          include: {
            variants: {
              where: { status: "active" },
              orderBy: { id: "asc" },
            },
          },
        },
      },
    });
    return categories;
  },
};
