import type { Prisma } from "@/common/lib/prisma-client";
import { StockReservationStatus } from "@/common/lib/prisma-client";

export const stockReservationRepository = {
  createMany: async (
    tx: Prisma.TransactionClient,
    data: Array<{
      orderId: string;
      variantId: string;
      quantity: number;
      expiresAt: Date | null;
    }>,
  ) => {
    if (data.length === 0) return { count: 0 };

    return tx.stockReservation.createMany({
      data: data.map((d) => ({
        orderId: d.orderId,
        variantId: d.variantId,
        quantity: d.quantity,
        status: "active" as const,
        expiresAt: d.expiresAt,
      })),
    });
  },

  findActiveByOrderId: async (tx: Prisma.TransactionClient, orderId: string) => {
    return tx.stockReservation.findMany({
      where: { orderId, status: "active" },
      orderBy: [{ variantId: "asc" }, { id: "asc" }],
    });
  },

  findActiveByOrderIdWithVariant: async (tx: Prisma.TransactionClient, orderId: string) => {
    return tx.stockReservation.findMany({
      where: { orderId, status: "active" },
      include: { variant: true },
      orderBy: [{ variantId: "asc" }, { id: "asc" }],
    });
  },

  findExpiredActive: async (tx: Prisma.TransactionClient, before: Date, limit: number) => {
    return tx.stockReservation.findMany({
      where: { status: "active", expiresAt: { not: null, lt: before } },
      orderBy: { id: "asc" },
      take: limit,
    });
  },

  updateStatus: async (tx: Prisma.TransactionClient, id: string, status: StockReservationStatus) => {
    return tx.stockReservation.updateMany({
      where: { id },
      data: { status },
    });
  },

  updateStatusMany: async (tx: Prisma.TransactionClient, ids: string[], status: StockReservationStatus) => {
    if (ids.length === 0) return { count: 0 };
    return tx.stockReservation.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
  },
};
