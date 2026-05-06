import { ORDER_STATUS, S3_PREFIX_FOLDERS } from "@/common/constants";
import { buildImageFullUrl } from "@/common/utils";
import { orderRepository } from "./orderRepository";
import { OrderStatus } from "@/common/lib/prisma-client";
import { emailService } from "../email/emailService";

type OrderEntity = NonNullable<Awaited<ReturnType<typeof orderRepository.findById>>>;

export function orderToApiDetail(order: OrderEntity) {
  const promotions = (order.promotions ?? []).map((p) => ({
    id: p.id,
    promotionId: p.promotionId,
    promotionCode: p.promotionCode,
    discountType: p.discountType,
    discountValue: Number(p.discountValue),
    appliedAmount: Number(p.appliedAmount),
  }));
  return {
    id: order.id,
    userId: order.userId ?? null,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    subtotalAmount: Number(order.subtotalAmount),
    discountAmount: Number(order.discountAmount),
    finalAmount: Number(order.finalAmount),
    adminNote: order.adminNote ?? null,
    contact: order.contact,
    shippingInfo: order.shippingInfo,
    payment: order.payment,
    promotions,
    items: order.items,
  };
}

/** Full CDN URLs on line item images (storefront / account). */
export function withResolvedItemImages<T extends { items: Array<{ image: string | null }> }>(order: T): T {
  return {
    ...order,
    items: order.items.map((it) => ({
      ...it,
      image: it.image ? buildImageFullUrl(it.image) : null,
    })) as T["items"],
  } as T;
}

/** Hide internal fields from customer-facing order payloads. */
export function stripAdminFields<T extends { adminNote?: unknown }>(order: T): T {
  return { ...order, adminNote: null } as T;
}

/** Allowed transitions (same status is always OK — idempotent). */
const ALLOWED_ORDER_TRANSITIONS = {
  pending_confirmation: [ORDER_STATUS.PAYMENT_CONFIRMED, ORDER_STATUS.CANCELLED],
  payment_confirmed: [ORDER_STATUS.SHIPPING, ORDER_STATUS.CANCELLED],
  shipping: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
  delivered: [] as OrderStatus[],
  cancelled: [] as OrderStatus[],
} satisfies Record<OrderStatus, OrderStatus[]>;

export function isAllowedStatusTransition(current: OrderStatus, next: OrderStatus): boolean {
  if (current === next) return true;
  return ALLOWED_ORDER_TRANSITIONS[current].includes(next);
}

export function getOrderCustomerEmailAndName(order: OrderEntity): {
  email: string | null;
  receiverName: string | null;
} {
  let email: string | null = null;
  let receiverName: string | null = null;
  const contact = order.contact;
  if (contact && typeof contact === "object" && !Array.isArray(contact)) {
    const raw = (contact as Record<string, unknown>).email;
    if (typeof raw === "string" && raw.includes("@")) {
      email = raw.trim();
    }
  }
  const shipping = order.shippingInfo;
  if (shipping && typeof shipping === "object" && !Array.isArray(shipping)) {
    const raw = (shipping as Record<string, unknown>).receiver_name;
    if (typeof raw === "string" && raw.trim()) {
      receiverName = raw.trim();
    }
  }
  return { email, receiverName };
}

export function notifyOrderStatusByEmail(order: OrderEntity, status: OrderStatus): void {
  const { email, receiverName } = getOrderCustomerEmailAndName(order);
  console.log("email", email);
  console.log("receiverName", receiverName);
  if (!email) return;
  void emailService.sendOrderStatusNotification({
    to: email,
    orderId: order.id,
    status,
    finalAmount: Number(order.finalAmount),
    currency: order.currency,
    receiverName,
  });
}

/** Parse data URL (e.g. data:image/jpeg;base64,...) into buffer and contentType. */
export function parseBillImageDataUrl(dataUrl: string): { buffer: Buffer; contentType: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl.trim());
  if (!match) return null;
  const [, contentType, base64] = match;
  if (!contentType || !base64) return null;
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0) return null;
  return { buffer, contentType };
}

/** True if the value is a base64 data URL (image data to upload). */
export function isBillImageDataUrl(value: string): boolean {
  return value.trim().startsWith("data:") && value.includes(";base64,");
}

/** True if the value is an S3 tmp key to move to bills folder. */
export function isBillImageTmpKey(value: string): boolean {
  const normalized = value.startsWith("/") ? value.slice(1) : value;
  return normalized.startsWith(`${S3_PREFIX_FOLDERS.TMP}/`);
}
