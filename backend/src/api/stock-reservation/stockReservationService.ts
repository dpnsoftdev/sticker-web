import { Prisma } from "@/common/lib/prisma-client";
import { stockReservationRepository } from "./stockReservationRepository";

/** Thrown when admin tries to confirm payment but reservations are no longer active (e.g. expired). */
export class CannotConfirmPaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CannotConfirmPaymentError";
  }
}

/** Thrown when requested quantity exceeds available stock (stockOnHand - stockReserved). */
export class InsufficientStockError extends Error {
  constructor(
    public readonly variantId: string,
    public readonly requested: number,
    public readonly available: number,
  ) {
    super(`Insufficient stock for variant ${variantId}: requested ${requested}, available ${available}`);
    this.name = "InsufficientStockError";
  }
}

/**
 * Lock variant rows by id in consistent order (to avoid deadlock) and return current stock.
 * Must be called inside an active transaction.
 */
async function lockVariantsAndGetStock(
  tx: Prisma.TransactionClient,
  variantIds: string[],
): Promise<Map<string, { stockOnHand: number; stockReserved: number }>> {
  const sorted = [...new Set(variantIds)].sort();
  if (sorted.length === 0) return new Map();

  const rows = await tx.$queryRaw<Array<{ id: string; stock_on_hand: number; stock_reserved: number }>>(Prisma.sql`
    SELECT id, stock_on_hand, stock_reserved
    FROM variants
    WHERE id IN (${Prisma.join(sorted)})
    ORDER BY id
    FOR UPDATE
  `);

  const map = new Map<string, { stockOnHand: number; stockReserved: number }>();
  for (const r of rows) {
    map.set(r.id, {
      stockOnHand: Number(r.stock_on_hand),
      stockReserved: Number(r.stock_reserved),
    });
  }
  return map;
}

/**
 * Aggregate requested quantity per variant from order items.
 */
function aggregateRequested(items: Array<{ variantId: string; quantity: number }>): Map<string, number> {
  const map = new Map<string, number>();
  for (const { variantId, quantity } of items) {
    map.set(variantId, (map.get(variantId) ?? 0) + quantity);
  }
  return map;
}

/**
 * Reserve stock for an order: lock variants, check availability, increment stockReserved, create reservations.
 * Call only inside a transaction. Does not create Order/OrderItem — caller does that.
 */
export async function reserveStockForOrder(
  tx: Prisma.TransactionClient,
  params: {
    orderId: string;
    items: Array<{ variantId: string; quantity: number }>;
    /** null = no automatic expiry (cron ignores these rows). */
    expiresAt: Date | null;
  },
): Promise<void> {
  const { orderId, items, expiresAt } = params;
  const requestedByVariant = aggregateRequested(items);
  const variantIds = [...requestedByVariant.keys()].sort();

  if (variantIds.length === 0) return;

  const stockByVariant = await lockVariantsAndGetStock(tx, variantIds);

  for (const variantId of variantIds) {
    const requested = requestedByVariant.get(variantId)!;
    const stock = stockByVariant.get(variantId);
    if (!stock) {
      throw new InsufficientStockError(variantId, requested, 0);
    }
    const available = stock.stockOnHand - stock.stockReserved;
    if (available < requested) {
      throw new InsufficientStockError(variantId, requested, available);
    }
  }

  for (const variantId of variantIds) {
    const requested = requestedByVariant.get(variantId)!;
    await tx.variant.update({
      where: { id: variantId },
      data: { stockReserved: { increment: requested } },
    });
  }

  await stockReservationRepository.createMany(
    tx,
    items.map((item) => ({
      orderId,
      variantId: item.variantId,
      quantity: item.quantity,
      expiresAt,
    })),
  );
}

/**
 * Confirm reservations for an order (payment confirmed): reduce stockReserved and stockOnHand, mark reservations confirmed.
 * Idempotent: if no active reservations, does nothing and returns false (already confirmed).
 */
export async function confirmStockForOrder(tx: Prisma.TransactionClient, orderId: string): Promise<boolean> {
  const reservations = await stockReservationRepository.findActiveByOrderId(tx, orderId);
  if (reservations.length === 0) return false;

  const variantIds = [...new Set(reservations.map((r) => r.variantId))].sort();
  await lockVariantsAndGetStock(tx, variantIds);

  for (const res of reservations) {
    await tx.variant.update({
      where: { id: res.variantId },
      data: {
        stockReserved: { decrement: res.quantity },
        stockOnHand: { decrement: res.quantity },
      },
    });
    await stockReservationRepository.updateStatus(tx, res.id, "confirmed");
  }
  return true;
}

/**
 * Release reservations (cancel / payment fail): reduce stockReserved, mark reservations released or expired.
 * Only affects active reservations. Idempotent if called twice.
 */
export async function releaseStockForOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
  status: "released" | "expired",
): Promise<number> {
  const reservations = await stockReservationRepository.findActiveByOrderId(tx, orderId);
  if (reservations.length === 0) return 0;

  const variantIds = [...new Set(reservations.map((r) => r.variantId))].sort();
  await lockVariantsAndGetStock(tx, variantIds);

  for (const res of reservations) {
    await tx.variant.update({
      where: { id: res.variantId },
      data: { stockReserved: { decrement: res.quantity } },
    });
    await stockReservationRepository.updateStatus(tx, res.id, status);
  }
  return reservations.length;
}

/**
 * When an order is cancelled after payment (reservations already confirmed / stockOnHand decremented),
 * put units back on hand and mark those reservations released.
 * No-op if there are no confirmed rows (e.g. legacy orders that never used reservations).
 */
export async function restoreFulfilledStockForCancelledOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<void> {
  const confirmed = await tx.stockReservation.findMany({
    where: { orderId, status: "confirmed" },
    orderBy: [{ variantId: "asc" }, { id: "asc" }],
  });
  if (confirmed.length === 0) return;

  const items = await tx.orderItem.findMany({
    where: { orderId },
    select: { variantId: true, quantity: true },
  });
  const requestedByVariant = aggregateRequested(items);
  const variantIds = [...requestedByVariant.keys()].sort();
  if (variantIds.length === 0) return;

  await lockVariantsAndGetStock(tx, variantIds);
  for (const variantId of variantIds) {
    const qty = requestedByVariant.get(variantId)!;
    await tx.variant.update({
      where: { id: variantId },
      data: { stockOnHand: { increment: qty } },
    });
  }

  await stockReservationRepository.updateStatusMany(
    tx,
    confirmed.map((r) => r.id),
    "released",
  );
}

/**
 * Rows marked expired with no expiry time need stock put back on reserved before confirm can run.
 * Only matches status=expired and expiresAt=null (e.g. after a manual DB fix).
 */
export async function reactivateUnlimitedExpiredReservations(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<number> {
  const rows = await tx.stockReservation.findMany({
    where: { orderId, status: "expired", expiresAt: null },
    orderBy: [{ variantId: "asc" }, { id: "asc" }],
  });
  if (rows.length === 0) return 0;

  const variantIds = [...new Set(rows.map((r) => r.variantId))].sort();
  await lockVariantsAndGetStock(tx, variantIds);

  for (const row of rows) {
    await tx.variant.update({
      where: { id: row.variantId },
      data: { stockReserved: { increment: row.quantity } },
    });
    await tx.stockReservation.update({
      where: { id: row.id },
      data: { status: "active", expiresAt: null },
    });
  }
  return rows.length;
}

/**
 * Claim and release a batch of expired active reservations.
 * Uses SELECT FOR UPDATE SKIP LOCKED so concurrent jobs don't double-release.
 * Returns number of reservations released.
 */
export async function releaseExpiredReservationsBatch(
  tx: Prisma.TransactionClient,
  before: Date,
  limit: number,
): Promise<number> {
  const claimed = await tx.$queryRaw<
    Array<{ id: string; order_id: string; variant_id: string; quantity: number }>
  >(Prisma.sql`
    SELECT id, order_id, variant_id, quantity
    FROM stock_reservations
    WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < ${before}
    ORDER BY id
    LIMIT ${limit}
    FOR UPDATE SKIP LOCKED
  `);

  if (claimed.length === 0) return 0;

  for (const row of claimed) {
    await tx.variant.update({
      where: { id: row.variant_id },
      data: { stockReserved: { decrement: row.quantity } },
    });
    await stockReservationRepository.updateStatus(tx, row.id, "expired");
  }

  return claimed.length;
}
