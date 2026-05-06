import { StatusCodes } from "http-status-codes";
import pino from "pino";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { getRedis } from "@/common/lib/redis-client";
import { env } from "@/common/utils/envConfig";

import { prisma } from "@/common/databases/postgres/client";

const log = pino({ name: "product-view" });

/** Redis buffer counter (no TTL). */
export function productViewsCounterKey(productId: string): string {
  return `product:${productId}:views`;
}

/** Dedupe marker when duplicate prevention is enabled (TTL applied at set time). */
export function viewedDedupeKey(userId: string, productId: string): string {
  return `viewed:${userId}:${productId}`;
}

const VIEWS_KEY_RE = /^product:([^:]+):views$/;

export function parseProductIdFromViewsKey(key: string): string | null {
  const m = key.match(VIEWS_KEY_RE);
  return m?.[1] ?? null;
}

async function productExists(productId: string): Promise<boolean> {
  const n = await prisma.product.count({ where: { id: productId } });
  return n > 0;
}

export type RecordProductViewInput = {
  productId: string;
  /** Guest or client-stable id; required for dedupe when no JWT user. */
  viewerId?: string;
  /** Authenticated user id from optional JWT. */
  authUserId?: string;
};

export type RecordProductViewResult = {
  counted: boolean;
};

export const productViewService = {
  recordView: async (input: RecordProductViewInput): Promise<ServiceResponse<RecordProductViewResult>> => {
    const redis = getRedis();
    if (!redis) {
      return ServiceResponse.failure(
        "View tracking unavailable (Redis not configured)",
        { counted: false },
        StatusCodes.SERVICE_UNAVAILABLE,
      );
    }

    const prodExists = await productExists(input.productId);
    if (!prodExists) {
      return ServiceResponse.failure("Product not found", { counted: false }, StatusCodes.NOT_FOUND);
    }

    const isPreventDuplicateView = env.PRODUCT_VIEW_PREVENT_DUPLICATE;

    const userId = input.authUserId ?? input.viewerId?.trim();
    if (isPreventDuplicateView) {
      if (!userId) {
        return ServiceResponse.failure(
          "viewerId is required when duplicate view prevention is enabled (or send a valid Bearer token)",
          { counted: false },
          StatusCodes.BAD_REQUEST,
        );
      }
    }

    try {
      if (isPreventDuplicateView && userId) {
        const dedupeKey = viewedDedupeKey(userId, input.productId);
        const setOk = await redis.set(dedupeKey, "1", "EX", env.PRODUCT_VIEW_DEDUPE_TTL_SEC, "NX");
        if (setOk !== "OK") {
          return ServiceResponse.success("View not counted (duplicate window)", { counted: false }, StatusCodes.OK);
        }
      }

      await redis.incr(productViewsCounterKey(input.productId));
      return ServiceResponse.success("View recorded", { counted: true }, StatusCodes.OK);
    } catch (err) {
      log.error({ err, productId: input.productId }, "recordView failed");
      return ServiceResponse.failure("Failed to record view", { counted: false }, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  },
};
