import bcrypt from "bcryptjs";
import { randomInt, randomUUID } from "node:crypto";
import { StatusCodes } from "http-status-codes";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { orderRepository } from "./orderRepository";
import { productRepository } from "@/api/product/productRepository";
import { variantRepository } from "@/api/variant/variantRepository";
import { assetService } from "@/api/assets/assetService";
import {
  reserveStockForOrder,
  confirmStockForOrder,
  releaseStockForOrder,
  restoreFulfilledStockForCancelledOrder,
  reactivateUnlimitedExpiredReservations,
  InsufficientStockError,
  CannotConfirmPaymentError,
} from "@/api/stock-reservation/stockReservationService";
import { S3_PREFIX_FOLDERS, RESERVATION_TTL_MINUTES, ORDER_STATUS, PROMOTION_TYPE } from "@/common/constants";
import { OrderStatus, Prisma, StockReservationStatus } from "@/common/lib/prisma-client";
import { prisma } from "@/common/databases/postgres/client";
import { getFirebaseAuth } from "@/common/lib/firebase-admin";
import { getRedis } from "@/common/lib/redis-client";
import { OTP_MESSAGES } from "@/common/constants";
import { emailService } from "@/api/email/emailService";
import {
  generateIPKeyForCheckPhone,
  consumeOtpRequestSlot,
  generateIPKeyForOtpRequest,
  generateIPKeyForTrackEmailRequest,
} from "@/common/utils/otpRateLimit";
import { normalizeVietnamPhone, otpVerificationLogger } from "@/common/utils/otpVerification";
import { env } from "@/common/utils/envConfig";
import { buildImageFullUrl } from "@/common/utils";
import type { CreateOrderBody } from "./orderModel";
import {
  orderToApiDetail,
  withResolvedItemImages,
  stripAdminFields,
  isAllowedStatusTransition,
  isBillImageDataUrl,
  isBillImageTmpKey,
  parseBillImageDataUrl,
  notifyOrderStatusByEmail,
} from "./orderUtils";

const FIREBASE_TOKEN_INVALID = "Invalid or expired sign-in. Please verify your phone number again.";

const ORDER_TRACK_EMAIL_OTP_SALT_ROUNDS = 4;

function orderTrackEmailSessionKey(sessionId: string): string {
  return `order-track:email:${sessionId}`;
}

type OrderTrackEmailSessionRecord = {
  email: string;
  otpHash: string;
  verifyAttemptsLeft: number;
};

function generateOrderTrackSixDigitOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Track-by-phone list: shipping first, then payment flow, then delivered, then cancelled. */
const TRACK_ORDERS_STATUS_RANK: Record<OrderStatus, number> = {
  shipping: 0,
  pending_confirmation: 1,
  payment_confirmed: 2,
  delivered: 3,
  cancelled: 4,
};

function orderTrackBypassAuthAllowed(): boolean {
  return env.NODE_ENV === "development" || env.ORDER_TRACK_BYPASS_AUTH;
}

async function loadTrackOrdersForPhone(matchVariants: string[]) {
  const hasOrder = await orderRepository.existsForTrackByPhone(matchVariants);
  if (!hasOrder) {
    return ServiceResponse.failure(OTP_MESSAGES.NO_ORDER_FOR_PHONE, null, StatusCodes.NOT_FOUND);
  }
  try {
    const rows = await orderRepository.findOrdersByPhone(matchVariants);
    rows.sort((a, b) => {
      const ra = TRACK_ORDERS_STATUS_RANK[a.status] ?? 99;
      const rb = TRACK_ORDERS_STATUS_RANK[b.status] ?? 99;
      if (ra !== rb) return ra - rb;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    const orders = rows.map((o) => ({
      id: o.id,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      finalAmount: Number(o.finalAmount),
      currency: o.currency,
      items: o.items.map((it) => ({
        id: it.id,
        quantity: it.quantity,
        productName: it.productName,
        variantName: it.variantName,
        unitPrice: it.unitPrice,
        currency: it.currency,
        image: buildImageFullUrl(it.image ?? ""),
      })),
    }));
    return ServiceResponse.success(OTP_MESSAGES.VERIFIED_SUCCESS, { orders }, StatusCodes.OK);
  } catch (err) {
    otpVerificationLogger.error({ err }, "verifyPhoneAuth orders query failed");
    return ServiceResponse.failure(
      "Unable to load orders. Please try again later.",
      null,
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
}

async function loadTrackOrdersForEmail(emailNormalized: string) {
  const hasOrder = await orderRepository.existsForTrackByEmail(emailNormalized);
  if (!hasOrder) {
    return ServiceResponse.failure(OTP_MESSAGES.NO_ORDER_FOR_EMAIL, null, StatusCodes.NOT_FOUND);
  }
  try {
    const rows = await orderRepository.findOrdersByTrackEmail(emailNormalized);
    rows.sort((a, b) => {
      const ra = TRACK_ORDERS_STATUS_RANK[a.status] ?? 99;
      const rb = TRACK_ORDERS_STATUS_RANK[b.status] ?? 99;
      if (ra !== rb) return ra - rb;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
    const orders = rows.map((o) => ({
      id: o.id,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      finalAmount: Number(o.finalAmount),
      currency: o.currency,
      items: o.items.map((it) => ({
        id: it.id,
        quantity: it.quantity,
        productName: it.productName,
        variantName: it.variantName,
        unitPrice: it.unitPrice,
        currency: it.currency,
        image: buildImageFullUrl(it.image ?? ""),
      })),
    }));
    return ServiceResponse.success(OTP_MESSAGES.VERIFIED_SUCCESS, { orders }, StatusCodes.OK);
  } catch (err) {
    otpVerificationLogger.error({ err }, "verify order-track email orders query failed");
    return ServiceResponse.failure(
      "Unable to load orders. Please try again later.",
      null,
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  }
}

export const orderService = {
  create: async (body: CreateOrderBody, options?: { authenticatedUserId?: string }) => {
    const { contact, shippingInfo, payment, promotionCode, subtotalAmount, discountAmount, finalAmount, items } = body;

    let linkedUserId: string | null = null;
    const authId = options?.authenticatedUserId?.trim();
    if (authId) {
      const userRow = await prisma.user.findUnique({ where: { id: authId }, select: { id: true } });
      if (userRow) linkedUserId = userRow.id;
    }
    const billImageValue = payment?.bill_image ?? null;

    // Validate all products and variants exist and build snapshots for OrderItem
    const itemSnapshots: Array<{
      productId: string;
      variantId: string;
      quantity: number;
      productName: string;
      variantName: string | null;
      unitPrice: number;
      currency: string;
      image: string | null;
    }> = [];
    for (const item of items) {
      const product = await productRepository.findById(item.productId);
      if (!product) {
        return ServiceResponse.failure(`Product not found: ${item.productId}`, null, StatusCodes.BAD_REQUEST);
      }
      const variant = await variantRepository.findById(item.variantId);
      if (!variant || variant.productId !== item.productId) {
        return ServiceResponse.failure(
          `Variant not found or does not belong to product: ${item.variantId}`,
          null,
          StatusCodes.BAD_REQUEST,
        );
      }
      const image =
        (Array.isArray(variant.images) && variant.images[0]) ||
        (Array.isArray(product.images) && product.images[0]) ||
        null;
      itemSnapshots.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        productName: product.name,
        variantName: variant.name,
        unitPrice: variant.price,
        currency: product.currency ?? "VND",
        image,
      });
    }

    // When bill image is raw data (data URL or tmp key), don't store it in payment yet; we'll set bill_image after S3 upload
    const hasBillImageToProcess =
      billImageValue != null &&
      billImageValue !== "" &&
      (isBillImageDataUrl(billImageValue) || isBillImageTmpKey(billImageValue));
    const paymentForCreate = hasBillImageToProcess
      ? { ...payment, bill_image: null as string | null }
      : (payment as object);

    const expiresAt = env.ALLOW_UNLIMITED_RESERVATION
      ? null
      : new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000);

    let order;
    try {
      order = await prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            currency: "VND",
            status: ORDER_STATUS.PENDING_CONFIRMATION,
            ...(linkedUserId ? { user: { connect: { id: linkedUserId } } } : {}),
            subtotalAmount,
            discountAmount,
            finalAmount,
            contact: contact as object,
            shippingInfo: shippingInfo as object,
            payment: paymentForCreate,
            items: {
              create: itemSnapshots.map((s) => ({
                productId: s.productId,
                variantId: s.variantId,
                quantity: s.quantity,
                productName: s.productName,
                variantName: s.variantName,
                unitPrice: s.unitPrice,
                currency: s.currency,
                image: s.image,
              })),
            },
          },
          include: { items: { include: { product: true, variant: true } }, promotions: true },
        });

        if (promotionCode?.trim() && discountAmount > 0) {
          await tx.orderPromotion.create({
            data: {
              orderId: created.id,
              promotionCode: promotionCode.trim(),
              discountType: PROMOTION_TYPE.FIXED_AMOUNT,
              discountValue: discountAmount,
              appliedAmount: discountAmount,
            },
          });
        }

        await reserveStockForOrder(tx, {
          orderId: created.id,
          items: itemSnapshots.map((s) => ({ variantId: s.variantId, quantity: s.quantity })),
          expiresAt,
        });

        return tx.order.findUniqueOrThrow({
          where: { id: created.id },
          include: { items: { include: { product: true, variant: true } }, promotions: true },
        });
      });
    } catch (err) {
      if (err instanceof InsufficientStockError) {
        return ServiceResponse.failure(
          err.message,
          { variantId: err.variantId, requested: err.requested, available: err.available },
          StatusCodes.BAD_REQUEST,
        );
      }
      throw err;
    }

    // If bill image data was provided, upload or move to S3 at bills/{orderId} and update order payment
    if (hasBillImageToProcess && billImageValue) {
      const billPrefix = `${S3_PREFIX_FOLDERS.BILLS}/${order.id}`;
      let resolvedKey: string;

      if (isBillImageDataUrl(billImageValue)) {
        const parsed = parseBillImageDataUrl(billImageValue);
        if (!parsed) {
          return ServiceResponse.failure(
            "Invalid bill image data: expected a data URL (e.g. data:image/jpeg;base64,...)",
            null,
            StatusCodes.BAD_REQUEST,
          );
        }
        const uploadResult = await assetService.uploadFile(parsed.buffer, parsed.contentType, billPrefix);
        if (!uploadResult.success || !uploadResult.data?.key) {
          return ServiceResponse.failure(
            uploadResult.message ?? "Failed to upload bill image",
            null,
            StatusCodes.INTERNAL_SERVER_ERROR,
          );
        }
        resolvedKey = uploadResult.data.key;
      } else {
        // tmp key: move to bills/order_id
        const [movedKey] = await assetService.moveTmpKeysToFolder([billImageValue], billPrefix);
        resolvedKey = movedKey;
      }

      const updatedPayment = { ...(order.payment as Record<string, unknown>), bill_image: resolvedKey };
      await orderRepository.update(order.id, { payment: updatedPayment as Prisma.InputJsonValue });
      order.payment = updatedPayment;
    }

    return ServiceResponse.success("Order created successfully", orderToApiDetail(order), StatusCodes.CREATED);
  },

  getById: async (id: string) => {
    const order = await orderRepository.findById(id);
    if (!order) {
      return ServiceResponse.failure("Order not found", null, StatusCodes.NOT_FOUND);
    }
    return ServiceResponse.success("Order retrieved", orderToApiDetail(order), StatusCodes.OK);
  },

  listProductVariantAggregates: async (params: {
    page: number;
    limit: number;
    excludeCancelled: boolean;
    keyword?: string;
    orderStatus?: string;
  }) => {
    const rows = await orderRepository.findItemsForVariantAggregates({
      excludeCancelled: params.excludeCancelled,
      orderStatus: params.orderStatus,
      keyword: params.keyword,
    });

    type Group = {
      productId: string;
      variantId: string;
      productSlug: string | null;
      productName: string;
      variantName: string | null;
      unitPrice: number;
      currency: string;
      image: string | null;
      orders: Array<{
        orderId: string;
        status: OrderStatus;
        createdAt: string;
        quantity: number;
        orderItemId: string;
      }>;
    };

    const map = new Map<string, Group>();

    for (const row of rows) {
      const key = `${row.productId}:${row.variantId}`;
      let g = map.get(key);
      if (!g) {
        g = {
          productId: row.productId,
          variantId: row.variantId,
          productSlug: row.product.slug ?? null,
          productName: row.productName,
          variantName: row.variantName,
          unitPrice: row.unitPrice,
          currency: row.currency,
          image: row.image,
          orders: [],
        };
        map.set(key, g);
      }
      g.orders.push({
        orderId: row.order.id,
        status: row.order.status,
        createdAt: row.order.createdAt.toISOString(),
        quantity: row.quantity,
        orderItemId: row.id,
      });
    }

    const aggregated = Array.from(map.values()).map((g) => {
      const orderIds = new Set(g.orders.map((o) => o.orderId));
      const sortedOrders = [...g.orders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      const totalQuantity = g.orders.reduce((s, o) => s + o.quantity, 0);
      return {
        productId: g.productId,
        variantId: g.variantId,
        productSlug: g.productSlug,
        productName: g.productName,
        variantName: g.variantName,
        unitPrice: g.unitPrice,
        currency: g.currency,
        image: g.image,
        orderCount: orderIds.size,
        totalQuantity,
        orders: sortedOrders,
      };
    });

    aggregated.sort((a, b) => b.totalQuantity - a.totalQuantity);

    const total = aggregated.length;
    const start = (params.page - 1) * params.limit;
    const data = aggregated.slice(start, start + params.limit);

    return ServiceResponse.success("Product variant aggregates retrieved", { data, total }, StatusCodes.OK);
  },

  list: async (params: { status?: string; page: number; limit: number; keyword?: string }) => {
    const { orders, total } = await orderRepository.findMany(params);
    const data = orders.map((order) => orderToApiDetail(order));
    return ServiceResponse.success("Orders retrieved", { data, total }, StatusCodes.OK);
  },

  listMine: async (userId: string, params: { status?: string; page: number; limit: number }) => {
    const { orders, total } = await orderRepository.findManyByUserId(userId, params);
    const data = orders.map((order) => stripAdminFields(withResolvedItemImages(orderToApiDetail(order))));
    return ServiceResponse.success("Orders retrieved", { data, total }, StatusCodes.OK);
  },

  getMineById: async (userId: string, orderId: string) => {
    const order = await orderRepository.findByIdAndUserId(orderId, userId);
    if (!order) {
      return ServiceResponse.failure("Order not found", null, StatusCodes.NOT_FOUND);
    }
    return ServiceResponse.success(
      "Order retrieved",
      stripAdminFields(withResolvedItemImages(orderToApiDetail(order))),
      StatusCodes.OK,
    );
  },

  /**
   * Links historical guest orders to the current account when `contact.email` matches the
   * user's email (case-insensitive). Only updates `user_id`; JSON snapshots are untouched.
   */
  claimGuestOrdersByEmail: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) {
      return ServiceResponse.failure("User not found", null, StatusCodes.NOT_FOUND);
    }
    const email = user.email?.trim();
    if (!email) {
      return ServiceResponse.failure("Account email is missing", null, StatusCodes.BAD_REQUEST);
    }

    const rows = await prisma.$executeRaw(
      Prisma.sql`
        UPDATE "orders"
        SET "user_id" = ${userId}
        WHERE "user_id" IS NULL
        AND lower(trim(COALESCE("contact"->>'email', ''))) = lower(trim(${email}))
      `,
    );

    const linkedCount = Number(rows);
    const message =
      linkedCount === 0
        ? "No guest orders found with this email"
        : linkedCount === 1
          ? "Linked 1 order"
          : `Linked ${linkedCount} orders`;
    return ServiceResponse.success(message, { linkedCount }, StatusCodes.OK);
  },

  updateAdminNote: async (id: string, adminNote: string | null) => {
    const order = await orderRepository.findById(id);
    if (!order) {
      return ServiceResponse.failure("Order not found", null, StatusCodes.NOT_FOUND);
    }
    const normalized = adminNote === null || adminNote.trim() === "" ? null : adminNote.trim();
    const updated = await orderRepository.update(id, { adminNote: normalized });
    return ServiceResponse.success("Admin note updated", orderToApiDetail(updated), StatusCodes.OK);
  },

  updateStatus: async (id: string, status: OrderStatus) => {
    const order = await orderRepository.findById(id);
    if (!order) {
      return ServiceResponse.failure("Order not found", null, StatusCodes.NOT_FOUND);
    }

    const newStatus = status as OrderStatus;

    if (order.status === newStatus) {
      return ServiceResponse.success("Order status updated", orderToApiDetail(order), StatusCodes.OK);
    }

    if (!isAllowedStatusTransition(order.status, newStatus)) {
      return ServiceResponse.failure(
        `Invalid status transition: cannot change from "${order.status}" to "${newStatus}"`,
        { currentStatus: order.status, requestedStatus: newStatus },
        StatusCodes.BAD_REQUEST,
      );
    }

    try {
      if (newStatus === ORDER_STATUS.PAYMENT_CONFIRMED || newStatus === ORDER_STATUS.CANCELLED) {
        await prisma.$transaction(async (tx) => {
          if (newStatus === ORDER_STATUS.PAYMENT_CONFIRMED) {
            const didConfirm = await confirmStockForOrder(tx, id);
            // if (!didConfirm && env.ALLOW_UNLIMITED_RESERVATION) {
            //   const reactivated = await reactivateUnlimitedExpiredReservations(tx, id);
            //   if (reactivated > 0) {
            //     didConfirm = await confirmStockForOrder(tx, id);
            //   }
            // }
            if (!didConfirm) {
              const nConfirmed = await tx.stockReservation.count({
                where: { orderId: id, status: StockReservationStatus.confirmed },
              });
              if (nConfirmed === 0) {
                const nAny = await tx.stockReservation.count({ where: { orderId: id } });
                if (nAny > 0) {
                  throw new CannotConfirmPaymentError(
                    "Cannot confirm payment: stock reservation is no longer active (expired or released). The customer should place a new order.",
                  );
                }
              }
            }
          } else {
            if (order.status === ORDER_STATUS.PENDING_CONFIRMATION) {
              await releaseStockForOrder(tx, id, StockReservationStatus.released);
            } else if (order.status === ORDER_STATUS.PAYMENT_CONFIRMED || order.status === ORDER_STATUS.SHIPPING) {
              await restoreFulfilledStockForCancelledOrder(tx, id);
            }
          }

          await tx.order.update({
            where: { id },
            data: { status: newStatus },
          });
        });
      } else {
        await orderRepository.update(id, { status: newStatus });
      }
    } catch (err) {
      if (err instanceof CannotConfirmPaymentError) {
        return ServiceResponse.failure(err.message, null, StatusCodes.CONFLICT);
      }
      throw err;
    }

    const updated = await orderRepository.findById(id);
    if (!updated) {
      return ServiceResponse.failure("Order not found", null, StatusCodes.NOT_FOUND);
    }

    if (
      newStatus === ORDER_STATUS.PAYMENT_CONFIRMED ||
      newStatus === ORDER_STATUS.SHIPPING ||
      newStatus === ORDER_STATUS.CANCELLED
    ) {
      notifyOrderStatusByEmail(updated, newStatus);
    }

    return ServiceResponse.success("Order status updated", orderToApiDetail(updated), StatusCodes.OK);
  },

  /**
   * Public: checks normalized phone has at least one order before client sends Firebase SMS OTP.
   * Optional Redis IP rate limit (separate key from verify-phone-auth).
   */
  checkPhoneAllowedTrackOrder: async (phoneRaw: string, clientIp: string) => {
    const redis = getRedis();
    const rateKey = generateIPKeyForCheckPhone(clientIp);

    // rate limit the request by IP
    if (redis) {
      try {
        const rl = await consumeOtpRequestSlot(redis, rateKey);
        if (!rl.allowed) {
          otpVerificationLogger.warn(
            { clientIp, requestCount: rl.count },
            "Order-track check-phone rate limit (per IP)",
          );
          return ServiceResponse.failure(
            OTP_MESSAGES.RATE_LIMIT,
            { requestCount: rl.count },
            StatusCodes.TOO_MANY_REQUESTS,
          );
        }
      } catch (err) {
        otpVerificationLogger.error({ err }, "Redis rate limit error (check-phone)");
        return ServiceResponse.failure(
          "Order tracking is temporarily unavailable.",
          null,
          StatusCodes.SERVICE_UNAVAILABLE,
        );
      }
    }

    // check phone number is valid
    const normalized = normalizeVietnamPhone(phoneRaw);
    if (!normalized.ok) {
      return ServiceResponse.failure(normalized.message, null, StatusCodes.BAD_REQUEST);
    }

    // check if the phone number has at least one order
    const hasOrder = await orderRepository.existsForTrackByPhone(normalized.phone.matchVariants);
    if (!hasOrder) {
      return ServiceResponse.failure(OTP_MESSAGES.NO_ORDER_FOR_PHONE, null, StatusCodes.NOT_FOUND);
    }

    return ServiceResponse.success("OK", { eligible: true }, StatusCodes.OK);
  },

  /**
   * Verifies a Firebase Phone Auth ID token, then returns orders for that phone number.
   * With bypassAuth + phone (only when dev/bypass is enabled server-side), skips Firebase and loads by phone.
   * SMS is sent by the Firebase client SDK; optional Redis IP rate limit on this endpoint.
   */
  verifyPhoneAndGetOrders: async (
    input: { idToken?: string; phone?: string; bypassAuth?: boolean },
    clientIp: string,
  ) => {
    const redis = getRedis();
    const rateKey = generateIPKeyForOtpRequest(clientIp);
    let rateConsumed = false;

    // rate limit the request by IP
    if (redis) {
      try {
        const rl = await consumeOtpRequestSlot(redis, rateKey);
        if (!rl.allowed) {
          otpVerificationLogger.warn(
            { clientIp, requestCount: rl.count },
            "Order-track phone auth rate limit (per IP)",
          );
          return ServiceResponse.failure(
            OTP_MESSAGES.RATE_LIMIT,
            { requestCount: rl.count },
            StatusCodes.TOO_MANY_REQUESTS,
          );
        }
        rateConsumed = true;
      } catch (err) {
        otpVerificationLogger.error({ err }, "Redis rate limit error");
        return ServiceResponse.failure(
          "Order tracking is temporarily unavailable.",
          null,
          StatusCodes.SERVICE_UNAVAILABLE,
        );
      }
    }

    if (input.bypassAuth === true) {
      if (!orderTrackBypassAuthAllowed()) {
        return ServiceResponse.failure(
          "Order-track bypass is not enabled on this server.",
          null,
          StatusCodes.FORBIDDEN,
        );
      }
      const normalized = normalizeVietnamPhone(input.phone ?? "");
      if (!normalized.ok) {
        return ServiceResponse.failure(normalized.message, null, StatusCodes.BAD_REQUEST);
      }
      return loadTrackOrdersForPhone(normalized.phone.matchVariants);
    }

    const idToken = input.idToken;
    if (!idToken) {
      return ServiceResponse.failure(FIREBASE_TOKEN_INVALID, null, StatusCodes.UNAUTHORIZED);
    }

    // verify id token from request through Firebase Admin
    let uidPhone: string;
    try {
      const decoded = await getFirebaseAuth().verifyIdToken(idToken, true);
      uidPhone = decoded.phone_number ?? "";
    } catch (err) {
      otpVerificationLogger.warn({ err }, "Firebase ID token verification failed");
      if (redis && rateConsumed) {
        await redis.decr(rateKey).catch(() => undefined);
      }
      return ServiceResponse.failure(FIREBASE_TOKEN_INVALID, null, StatusCodes.UNAUTHORIZED);
    }

    // check if the phone number is valid
    if (!uidPhone) {
      if (redis && rateConsumed) {
        await redis.decr(rateKey).catch(() => undefined);
      }
      return ServiceResponse.failure("This account is not linked to a phone number.", null, StatusCodes.BAD_REQUEST);
    }

    const normalized = normalizeVietnamPhone(uidPhone);
    if (!normalized.ok) {
      return ServiceResponse.failure(normalized.message, null, StatusCodes.BAD_REQUEST);
    }
    const { phone } = normalized;

    return loadTrackOrdersForPhone(phone.matchVariants);
  },

  /**
   * Public: if email has orders, store OTP in Redis and send email. Requires Redis + mail (or dev log fallback).
   */
  requestOrderTrackEmailOtp: async (emailRaw: string, clientIp: string) => {
    const redis = getRedis();
    if (!redis) {
      return ServiceResponse.failure(
        "Order tracking is temporarily unavailable.",
        null,
        StatusCodes.SERVICE_UNAVAILABLE,
      );
    }

    const rateKey = generateIPKeyForTrackEmailRequest(clientIp);
    try {
      const rl = await consumeOtpRequestSlot(redis, rateKey);
      if (!rl.allowed) {
        otpVerificationLogger.warn(
          { clientIp, requestCount: rl.count },
          "Order-track request-email-otp rate limit (per IP)",
        );
        return ServiceResponse.failure(
          OTP_MESSAGES.RATE_LIMIT,
          { requestCount: rl.count },
          StatusCodes.TOO_MANY_REQUESTS,
        );
      }
    } catch (err) {
      otpVerificationLogger.error({ err }, "Redis rate limit error (request-email-otp)");
      return ServiceResponse.failure(
        "Order tracking is temporarily unavailable.",
        null,
        StatusCodes.SERVICE_UNAVAILABLE,
      );
    }

    const email = emailRaw.trim().toLowerCase();
    const hasOrder = await orderRepository.existsForTrackByEmail(email);
    if (!hasOrder) {
      return ServiceResponse.failure(OTP_MESSAGES.NO_ORDER_FOR_EMAIL, null, StatusCodes.NOT_FOUND);
    }

    const otp = generateOrderTrackSixDigitOtp();
    const otpHash = await bcrypt.hash(otp, ORDER_TRACK_EMAIL_OTP_SALT_ROUNDS);
    const sessionId = randomUUID();
    const ttl = Math.max(60, env.REGISTRATION_OTP_TTL_SEC || 300);
    const maxAttempts = Math.max(1, env.REGISTRATION_OTP_MAX_VERIFY_ATTEMPTS || 5);

    const record: OrderTrackEmailSessionRecord = {
      email,
      otpHash,
      verifyAttemptsLeft: maxAttempts,
    };

    try {
      await redis.setex(orderTrackEmailSessionKey(sessionId), ttl, JSON.stringify(record));
    } catch (err) {
      otpVerificationLogger.error({ err }, "Redis setex error (order-track email session)");
      return ServiceResponse.failure(
        "Order tracking is temporarily unavailable.",
        null,
        StatusCodes.SERVICE_UNAVAILABLE,
      );
    }

    let delivered = false;
    if (emailService.isConfigured()) {
      delivered = await emailService.sendOrderTrackEmailOtp(email, otp);
    } else if (env.NODE_ENV === "development") {
      otpVerificationLogger.warn({ email, otp, sessionId }, "Order-track email OTP (dev: SMTP not configured)");
      delivered = true;
    }

    if (!delivered) {
      await redis.del(orderTrackEmailSessionKey(sessionId)).catch(() => undefined);
      return ServiceResponse.failure(
        "Unable to send verification email. Please try again later or contact support.",
        null,
        StatusCodes.SERVICE_UNAVAILABLE,
      );
    }

    return ServiceResponse.success(
      OTP_MESSAGES.ORDER_TRACK_EMAIL_CODE_SENT,
      { orderTrackEmailSessionId: sessionId },
      StatusCodes.OK,
    );
  },

  /**
   * Public: verify email OTP session and return orders. Max wrong attempts deletes session and returns lockout.
   */
  verifyOrderTrackEmailOtp: async (input: { orderTrackEmailSessionId: string; otp: string }) => {
    const redis = getRedis();
    if (!redis) {
      return ServiceResponse.failure(
        "Order tracking is temporarily unavailable.",
        null,
        StatusCodes.SERVICE_UNAVAILABLE,
      );
    }

    const key = orderTrackEmailSessionKey(input.orderTrackEmailSessionId);

    try {
      const raw = await redis.get(key);
      if (!raw) {
        return ServiceResponse.failure(
          OTP_MESSAGES.OTP_SESSION_EXPIRED_OR_MISSING,
          null,
          StatusCodes.GONE,
        );
      }

      let session: OrderTrackEmailSessionRecord;
      try {
        session = JSON.parse(raw) as OrderTrackEmailSessionRecord;
      } catch {
        await redis.del(key);
        return ServiceResponse.failure(
          OTP_MESSAGES.OTP_SESSION_EXPIRED_OR_MISSING,
          null,
          StatusCodes.GONE,
        );
      }

      const otpOk = await bcrypt.compare(input.otp.trim(), session.otpHash);
      if (!otpOk) {
        session.verifyAttemptsLeft -= 1;
        const ttl = await redis.ttl(key);
        if (session.verifyAttemptsLeft <= 0 || ttl <= 0) {
          await redis.del(key);
          return ServiceResponse.failure(
            OTP_MESSAGES.ORDER_TRACK_EMAIL_OTP_LOCKED,
            null,
            StatusCodes.FORBIDDEN,
          );
        }
        await redis.setex(key, ttl, JSON.stringify(session));
        return ServiceResponse.failure(
          OTP_MESSAGES.VERIFY_FAILED,
          { attemptsRemaining: session.verifyAttemptsLeft },
          StatusCodes.BAD_REQUEST,
        );
      }

      await redis.del(key);
      return loadTrackOrdersForEmail(session.email);
    } catch (err) {
      otpVerificationLogger.error({ err }, "verifyOrderTrackEmailOtp error");
      return ServiceResponse.failure(
        "Unable to verify the code. Please try again later.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  },
};
