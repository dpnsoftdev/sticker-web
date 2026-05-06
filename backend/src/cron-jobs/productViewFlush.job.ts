import pino from "pino";

import { prisma } from "@/common/databases/postgres/client";
import { getRedis } from "@/common/lib/redis-client";
import { env } from "@/common/utils/envConfig";
import { parseProductIdFromViewsKey } from "@/api/product/productViewService";

const log = pino({ name: "product-view-flush" });

const FLUSH_LOCK_KEY = "product-view-flush:lock";
const SCAN_MATCH = "product:*:views";

export type FlushStats = {
  keysScanned: number;
  rowsUpdated: number;
  keysDeleted: number;
  errors: number;
  skipped: boolean;
};

/**
 * Flushes buffered view counts from Redis into `products.view_count`.
 * Uses SCAN (not KEYS), a short distributed lock to reduce double-flush races, applies DB increments
 * then DECRBY by the flushed amount (so concurrent INCR during flush are preserved), and removes
 * the key when empty or when the product row is missing.
 */
export async function flushProductViewBufferOnce(): Promise<FlushStats> {
  const redis = getRedis();
  const stats: FlushStats = {
    keysScanned: 0,
    rowsUpdated: 0,
    keysDeleted: 0,
    errors: 0,
    skipped: false,
  };

  if (!redis) {
    stats.skipped = true;
    return stats;
  }

  const gotLock = await redis.set(FLUSH_LOCK_KEY, "1", "EX", env.PRODUCT_VIEW_FLUSH_LOCK_TTL_SEC, "NX");
  if (gotLock !== "OK") {
    stats.skipped = true;
    return stats;
  }

  try {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", SCAN_MATCH, "COUNT", 200);
      cursor = nextCursor;
      if (keys.length === 0) {
        continue;
      }

      stats.keysScanned += keys.length;

      const pipe = redis.pipeline();
      for (const k of keys) {
        pipe.get(k);
      }
      const execResult = await pipe.exec();

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const tuple = execResult?.[i];
        const err = tuple?.[0];
        const rawVal = tuple?.[1];
        if (err) {
          log.warn({ err, key }, "pipeline GET failed");
          stats.errors += 1;
          continue;
        }

        const count = rawVal != null ? Number.parseInt(String(rawVal), 10) : Number.NaN;
        if (!Number.isFinite(count) || count <= 0) {
          try {
            await redis.del(key);
            stats.keysDeleted += 1;
          } catch (delErr) {
            log.warn({ delErr, key }, "failed to delete empty/invalid counter key");
            stats.errors += 1;
          }
          continue;
        }

        const productId = parseProductIdFromViewsKey(key);
        if (!productId) {
          try {
            await redis.del(key);
            stats.keysDeleted += 1;
          } catch (delErr) {
            log.warn({ delErr, key }, "failed to delete malformed counter key");
            stats.errors += 1;
          }
          continue;
        }

        try {
          const result = await prisma.product.updateMany({
            where: { id: productId },
            data: { viewCount: { increment: count } },
          });
          if (result.count > 0) {
            stats.rowsUpdated += result.count;
            const remaining = await redis.decrby(key, count);
            if (remaining <= 0) {
              await redis.del(key);
            }
            stats.keysDeleted += 1;
          } else {
            await redis.del(key);
            stats.keysDeleted += 1;
          }
        } catch (dbErr) {
          log.error({ dbErr, key, productId, count }, "DB update failed; will retry key on next run");
          stats.errors += 1;
        }
      }
    } while (cursor !== "0");

    return stats;
  } finally {
    await redis.del(FLUSH_LOCK_KEY).catch(() => {});
  }
}

/** Starts the periodic flush; returns `null` when Redis URL is unset. */
export function startProductViewFlushScheduler(): NodeJS.Timeout | null {
  if (!env.REDIS_URL?.trim()) {
    log.warn("PRODUCT_VIEW flush scheduler not started (REDIS_URL empty)");
    return null;
  }

  const ms = env.PRODUCT_VIEW_FLUSH_INTERVAL_MS;
  const id = setInterval(() => {
    flushProductViewBufferOnce()
      .then((s) => {
        if (!s.skipped && (s.keysScanned > 0 || s.errors > 0)) {
          log.info(s, "product view flush tick");
        }
      })
      .catch((err) => log.error({ err }, "product view flush tick failed"));
  }, ms);

  if (typeof id.unref === "function") {
    id.unref();
  }
  return id;
}
