/**
 * Release expired stock reservations (cron job).
 * Run periodically (e.g. every 1–5 minutes) to free stock from reservations that passed expiresAt.
 * Idempotent and safe for concurrent runs (uses FOR UPDATE SKIP LOCKED).
 *
 * Usage: pnpm tsx scripts/release-expired-reservations.ts
 */
// Cron (every 2 min): run with your scheduler; e.g. cd /path/to/backend && pnpm tsx scripts/release-expired-reservations.ts
/// <reference types="node" />
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { releaseExpiredReservationsBatch } from "@/api/stock-reservation/stockReservationService";

const BATCH_SIZE = 100;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const startedAt = Date.now();
  let totalReleased = 0;
  let released: number;

  do {
    released = await prisma.$transaction(async (tx) => {
      return releaseExpiredReservationsBatch(tx, new Date(), BATCH_SIZE);
    });

    totalReleased += released;

    if (released > 0) {
      console.log(`[release-expired-reservations] Released ${released} reservations (total: ${totalReleased})`);
    }
  } while (released === BATCH_SIZE);

  const durationMs = Date.now() - startedAt;

  if (totalReleased === 0) {
    console.log(`[release-expired-reservations] No expired reservations to release (${durationMs}ms)`);
  } else {
    console.log(`[release-expired-reservations] Done. Total released: ${totalReleased} (${durationMs}ms)`);
  }
}

main()
  .catch((err) => {
    console.error("[release-expired-reservations] Error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
