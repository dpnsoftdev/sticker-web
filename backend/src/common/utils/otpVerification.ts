import pino from "pino";

export const otpVerificationLogger = pino({ name: "otp-verification" });

/**
 * Normalize Vietnam mobile numbers for Redis keys and DB lookup variants.
 * Accepts: 0xxxxxxxxx (10 digits) or +84xxxxxxxxx / 84xxxxxxxxx (9 digits after country code).
 */

const VN_MOBILE_RE = /^(?:\+?84|0)(3|5|7|8|9)\d{8}$/;

export type NormalizedVietnamPhone = {
  /** Redis key segment: digits only, e.g. 849395939035 */
  redisKeySegment: string;
  /** E.164 for SMS: +849395939035 */
  e164: string;
  /** Common local form: 0395939035 */
  local: string;
  /** Variants to match JSON contact.phone / receiver_phone in DB */
  matchVariants: string[];
};

function digitsOnly(s: string): string {
  return s.replace(/\s+/g, "").replace(/[^\d+]/g, "");
}

export function normalizeVietnamPhone(
  input: string,
): { ok: true; phone: NormalizedVietnamPhone } | { ok: false; message: string } {
  const raw = digitsOnly(input.trim());
  if (!raw) {
    return { ok: false, message: "Phone number is required." };
  }

  let candidate = raw;
  if (candidate.startsWith("+84")) {
    candidate = "0" + candidate.slice(3);
  } else if (candidate.startsWith("84") && candidate.length === 11) {
    candidate = "0" + candidate.slice(2);
  }

  if (!VN_MOBILE_RE.test(candidate)) {
    return {
      ok: false,
      message: "Invalid Vietnam mobile number. Use 0xxxxxxxxx or +84xxxxxxxxx.",
    };
  }

  const national = candidate.slice(1); // 9 digits after leading 0
  const redisKeySegment = `84${national}`;
  const e164 = `+${redisKeySegment}`;
  const local = `0${national}`;
  const matchVariants = Array.from(new Set([local, e164, `+${redisKeySegment}`, redisKeySegment]));

  return {
    ok: true,
    phone: {
      redisKeySegment,
      e164,
      local,
      matchVariants,
    },
  };
}
