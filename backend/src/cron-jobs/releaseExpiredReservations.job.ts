import { fileURLToPath } from "node:url";
import path from "node:path";

import pino from "pino";

import { releaseExpiredReservationsBatch } from "@/api/stock-reservation/stockReservationService";
import { closePrisma, prisma } from "@/common/databases/postgres/client";
import { env } from "@/common/utils/envConfig";

const log = pino({ name: "release-expired-reservations" });

export type ReleaseExpiredReservationsStats = {
  totalReleased: number;
  durationMs: number;
};

/**
 * Release all expired active stock reservations in batches (same logic as the former CLI script).
 * Rows with expires_at IS NULL are never released here (unlimited reservations).
 * Safe for concurrent callers (FOR UPDATE SKIP LOCKED inside the batch).
 */
export async function releaseExpiredReservationsOnce(): Promise<ReleaseExpiredReservationsStats> {
  const startedAt = Date.now();
  let totalReleased = 0;
  const batchSize = env.RELEASE_EXPIRED_RESERVATIONS_BATCH_SIZE;
  let released: number;

  do {
    released = await prisma.$transaction(async (tx) => {
      return releaseExpiredReservationsBatch(tx, new Date(), batchSize);
    });

    totalReleased += released;

    if (released > 0) {
      log.info({ released, totalReleased }, "released batch of expired reservations");
    }
  } while (released === batchSize);

  const durationMs = Date.now() - startedAt;

  if (totalReleased === 0) {
    log.debug({ durationMs }, "no expired reservations to release");
  } else {
    log.info({ totalReleased, durationMs }, "finished releasing expired reservations");
  }

  return { totalReleased, durationMs };
}

/** Periodic release of expired reservations (in-process scheduler). */
export function startReleaseExpiredReservationsScheduler(): NodeJS.Timeout {
  const ms = env.RELEASE_EXPIRED_RESERVATIONS_INTERVAL_MS;
  const id = setInterval(() => {
    releaseExpiredReservationsOnce().catch((err) => log.error({ err }, "release expired reservations tick failed"));
  }, ms);

  if (typeof id.unref === "function") {
    id.unref();
  }
  return id;
}

function isExecutedDirectly(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return path.resolve(fileURLToPath(import.meta.url)) === path.resolve(entry);
  } catch {
    return false;
  }
}

async function runCli(): Promise<void> {
  try {
    const { totalReleased, durationMs } = await releaseExpiredReservationsOnce();
    if (totalReleased === 0) {
      console.log(`[release-expired-reservations] No expired reservations to release (${durationMs}ms)`);
    } else {
      console.log(`[release-expired-reservations] Done. Total released: ${totalReleased} (${durationMs}ms)`);
    }
  } catch (err) {
    console.error("[release-expired-reservations] Error:", err);
    process.exitCode = 1;
  } finally {
    await closePrisma();
  }
}

if (isExecutedDirectly()) {
  void runCli();
}
