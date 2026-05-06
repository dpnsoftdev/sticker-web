import type Redis from "ioredis";

import { env } from "@/common/utils/envConfig";

/**
 * Atomically increment per-IP OTP request counter, set TTL on first use,
 * and roll back increment if limit exceeded. Prevents races from concurrent requests.
 *
 * Returns: { allowed: false, count } when at/over limit after rollback (count === max).
 * Returns: { allowed: true, count } when request is allowed (1..max).
 *
 * @param ttl    - Rolling window in seconds. Defaults to ORDER_TRACK_OTP_RATE_LIMIT_WINDOW_SEC env var.
 * @param limit  - Max requests per window. Defaults to ORDER_TRACK_OTP_MAX_REQUESTS env var.
 */
const LUA_SCRIPT_OTP_REQUEST_SLOT = `
local key = KEYS[1]
local ttl = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local count = redis.call('INCR', key)
if count == 1 then
  redis.call('EXPIRE', key, ttl)
end
if count > limit then
  redis.call('DECR', key)
  return {0, count - 1}
end
return {1, count}
`;

export type RateLimitResult = { allowed: true; count: number } | { allowed: false; count: number };

export type ConsumeOtpSlotOptions = {
  /** Rolling window TTL in seconds. Falls back to ORDER_TRACK_OTP_RATE_LIMIT_WINDOW_SEC (default: 86400). */
  ttl?: number;
  /** Max requests allowed per window. Falls back to ORDER_TRACK_OTP_MAX_REQUESTS (default: 10). */
  limit?: number;
};

export async function consumeOtpRequestSlot(
  redis: Redis,
  redisKey: string,
  options?: ConsumeOtpSlotOptions,
): Promise<RateLimitResult> {
  const ttl = options?.ttl ?? env.ORDER_TRACK_OTP_RATE_LIMIT_WINDOW_SEC ?? 86400;
  const limit = options?.limit ?? env.ORDER_TRACK_OTP_MAX_REQUESTS ?? 10;

  const raw = (await redis.eval(LUA_SCRIPT_OTP_REQUEST_SLOT, 1, redisKey, String(ttl), String(limit))) as [
    number,
    number,
  ];
  const flag = raw[0];
  const count = raw[1];
  if (flag === 1) {
    return { allowed: true, count };
  }
  return { allowed: false, count };
}

export function generateIPKeyForOtpRequest(clientIp: string): string {
  return `order-track:otp-req:ip:${clientIp}`;
}

/** Pre-check (phone has orders?) before Firebase SMS — separate bucket from token verify. */
export function generateIPKeyForCheckPhone(clientIp: string): string {
  return `order-track:check-phone:ip:${clientIp}`;
}

/** Request email OTP for order track (check + send) — per IP. */
export function generateIPKeyForTrackEmailRequest(clientIp: string): string {
  return `order-track:request-email-otp:ip:${clientIp}`;
}

/** Verify email OTP for order track — per IP. */
export function generateIPKeyForTrackEmailVerify(clientIp: string): string {
  return `order-track:verify-email-otp:ip:${clientIp}`;
}

/** Per-IP bucket for POST /auth/register/start (same limits as ORDER_TRACK_OTP_*). */
export function generateIPKeyForRegistrationStart(clientIp: string): string {
  return `auth:register-user:ip:${clientIp}`;
}
