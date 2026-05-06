import Redis from "ioredis";
import pino from "pino";

import { env } from "@/common/utils/envConfig";

const log = pino({ name: "redis" });

let client: Redis | null = null;

export function getRedis(): Redis | null {
  if (!env.REDIS_URL?.trim()) {
    return null;
  }
  if (!client) {
    client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      enableReadyCheck: true,
      lazyConnect: false,
    });
    client.on("error", (err) => {
      log.error({ err }, "Redis connection error");
    });
  }
  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit().catch(() => client?.disconnect());
    client = null;
  }
}
