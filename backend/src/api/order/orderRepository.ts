import { Prisma, type OrderStatus } from "@/common/lib/prisma-client";
import { prisma } from "@/common/databases/postgres/client";

/** Match `contact.phone` or `shippingInfo.receiver_phone` to normalized variants (same rules as track OTP). */
function whereOrderByTrackPhoneVariants(phoneVariants: string[]): Prisma.OrderWhereInput | null {
  const uniq = Array.from(new Set(phoneVariants.filter(Boolean)));
  if (uniq.length === 0) return null;
  const or: Prisma.OrderWhereInput[] = [];
  for (const v of uniq) {
    or.push({ contact: { path: ["phone"], equals: v } });
    or.push({ shippingInfo: { path: ["receiver_phone"], equals: v } });
  }
  return { OR: or };
}

export const orderRepository = {
  create: async (data: Prisma.OrderCreateInput) =>
    prisma.order.create({
      data,
      include: {
        items: { include: { product: true, variant: true } },
        promotions: true,
      },
    }),

  findById: async (id: string) =>
    prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { product: true, variant: true } },
        promotions: true,
      },
    }),

  update: async (id: string, data: Prisma.OrderUpdateInput) =>
    prisma.order.update({
      where: { id },
      data,
      include: {
        items: { include: { product: true, variant: true } },
        promotions: true,
      },
    }),

  findManyByUserId: async (userId: string, params: { status?: string; page: number; limit: number }) => {
    const { status, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = { userId };
    if (status)
      where.status = status as "pending_confirmation" | "payment_confirmed" | "shipping" | "delivered" | "cancelled";

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: { include: { product: true, variant: true } },
          promotions: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total };
  },

  findByIdAndUserId: async (id: string, userId: string) =>
    prisma.order.findFirst({
      where: { id, userId },
      include: {
        items: { include: { product: true, variant: true } },
        promotions: true,
      },
    }),

  findMany: async (params: { status?: string; page: number; limit: number; keyword?: string }) => {
    const { status, page, limit, keyword } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {};
    if (status)
      where.status = status as "pending_confirmation" | "payment_confirmed" | "shipping" | "delivered" | "cancelled";
    if (keyword?.trim()) {
      const q = keyword.trim();
      where.OR = [{ id: { contains: q, mode: "insensitive" } }];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: { include: { product: true, variant: true } },
          promotions: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total };
  },

  /** Line items with order + product + variant for admin aggregate view. */
  findItemsForVariantAggregates: async (params: {
    excludeCancelled: boolean;
    orderStatus?: string;
    keyword?: string;
  }) => {
    const { excludeCancelled, orderStatus, keyword } = params;
    const orderWhere: Prisma.OrderWhereInput = {};
    if (orderStatus) {
      orderWhere.status = orderStatus as OrderStatus;
    } else if (excludeCancelled) {
      orderWhere.status = { not: "cancelled" };
    }

    const q = keyword?.trim();
    const itemWhere: Prisma.OrderItemWhereInput = {
      order: orderWhere,
    };
    if (q) {
      itemWhere.OR = [
        { productName: { contains: q, mode: "insensitive" } },
        { variantName: { contains: q, mode: "insensitive" } },
        { order: { id: { contains: q, mode: "insensitive" } } },
      ];
    }

    return prisma.orderItem.findMany({
      where: itemWhere,
      include: {
        order: { select: { id: true, status: true, createdAt: true } },
        product: { select: { id: true, name: true, slug: true } },
        variant: { select: { id: true, name: true } },
      },
      orderBy: [{ productId: "asc" }, { variantId: "asc" }, { orderId: "asc" }],
    });
  },

  /** Public order-track lookup: match contact.phone or shippingInfo.receiver_phone against normalized variants. */
  findOrdersByPhone: async (phoneVariants: string[]) => {
    const where = whereOrderByTrackPhoneVariants(phoneVariants);
    if (!where) return [];

    return prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        finalAmount: true,
        currency: true,
        items: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            quantity: true,
            productName: true,
            variantName: true,
            unitPrice: true,
            currency: true,
            image: true,
          },
        },
      },
    });
  },

  /** Whether at least one order exists for this phone (track lookup rules). */
  existsForTrackByPhone: async (phoneVariants: string[]) => {
    const where = whereOrderByTrackPhoneVariants(phoneVariants);
    if (!where) return false;

    const row = await prisma.order.findFirst({
      where,
      select: { id: true },
    });
    return !!row;
  },

  /** Public order-track: `contact.email` match (case-insensitive), same rule as claim-guest. */
  existsForTrackByEmail: async (email: string) => {
    const e = email.trim();
    const rows = await prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`
        SELECT id FROM "orders"
        WHERE lower(trim(COALESCE("contact"->>'email', ''))) = lower(trim(${e}))
        LIMIT 1
      `,
    );
    return rows.length > 0;
  },

  findOrdersByTrackEmail: async (email: string) => {
    const e = email.trim();
    const idRows = await prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`
        SELECT id FROM "orders"
        WHERE lower(trim(COALESCE("contact"->>'email', ''))) = lower(trim(${e}))
        ORDER BY "created_at" DESC
      `,
    );
    const ids = idRows.map((r) => r.id);
    if (ids.length === 0) return [];

    return prisma.order.findMany({
      where: { id: { in: ids } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        finalAmount: true,
        currency: true,
        items: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            quantity: true,
            productName: true,
            variantName: true,
            unitPrice: true,
            currency: true,
            image: true,
          },
        },
      },
    });
  },
};
