import dotenv from "dotenv";
import { bool, cleanEnv, host, num, port, str } from "envalid";

// Load .env file first
dotenv.config();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    default: "development",
    choices: ["development", "production", "test"],
  }),
  HOST: host({
    default: "localhost",
  }),
  PORT: port({
    default: 3000,
  }),
  CORS_ORIGIN: str({
    default: "*",
  }),
  COMMON_RATE_LIMIT_MAX_REQUESTS: num({
    default: 1000,
  }),
  COMMON_RATE_LIMIT_WINDOW_MS: num({
    default: 60000, // 1 minute
  }),
  // Database configuration (for Prisma)
  DATABASE_URL: str({
    default: "postgresql://postgres:postgres@localhost:5432/postgres?schema=public",
  }),
  DATABASE_URL_PROD: str({
    default: "postgresql://postgres:postgres@localhost:5432/postgres?schema=public",
  }),
  // AWS S3 (pre-signed uploads)
  AWS_REGION: str({
    default: "ap-northeast-1",
  }),
  AWS_ACCESS_KEY: str({
    default: "",
    desc: "Leave empty to use default credential chain (e.g. IAM role)",
  }),
  AWS_SECRET_KEY: str({
    default: "",
    desc: "Leave empty to use default credential chain",
  }),
  S3_BUCKET: str({
    default: "",
    desc: "S3 bucket name for asset uploads",
  }),
  S3_PRESIGNED_EXPIRES_IN: num({
    default: 900, // 15 minutes
    desc: "Presigned URL expiration in 15 minutes (max 604800 for 7 days)",
  }),
  AWS_CLOUDFRONT_BASE_URL: str({
    default: "https://d134x0u3ojn1kq.cloudfront.net",
  }),
  AWS_CLOUDFRONT_BASE_URL_DEV: str({
    default: "https://d134x0u3ojn1kq.cloudfront.net",
  }),
  // JWT
  JWT_SECRET: str({
    default: "change-me-in-production",
    desc: "Secret for signing JWT access and refresh tokens",
  }),
  JWT_ACCESS_EXPIRES_IN: str({
    default: "15m",
    desc: "Access token expiry (e.g. 15m, 1h)",
  }),
  JWT_REFRESH_EXPIRES_IN: str({
    default: "7d",
    desc: "Refresh token expiry (e.g. 7d)",
  }),
  // Outbound mail (optional — when SMTP_HOST is empty, notifications are skipped)
  SMTP_HOST: str({
    default: "",
    desc: "SMTP server host; leave empty to disable sending",
  }),
  SMTP_PORT: port({
    default: 587,
  }),
  SMTP_SECURE: bool({
    default: false,
    desc: "Use TLS (e.g. true for port 465)",
  }),
  SMTP_USER: str({
    default: "",
  }),
  SMTP_PASS: str({
    default: "",
  }),
  MAIL_FROM: str({
    default: "",
    desc: "From address (e.g. orders@example.com); required when SMTP_HOST is set",
  }),
  MAIL_FROM_NAME: str({
    default: "Cửa hàng Sticker",
    desc: "Display name for the From header",
  }),
  USE_PRODUCTION_ENV: str({
    default: "",
    desc: "Use production environment",
  }),
  /** Required for order-track OTP rate limiting; leave empty to disable OTP endpoints (503). */
  REDIS_URL: str({
    default: "",
  }),
  /** Max OTP SMS requests per client IP per rolling window (Redis counter). */
  ORDER_TRACK_OTP_MAX_REQUESTS: num({
    default: 10,
  }),
  /** TTL (seconds) for the per-IP OTP request counter key. */
  ORDER_TRACK_OTP_RATE_LIMIT_WINDOW_SEC: num({
    default: 86400, // 24h
  }),
  /** Max wrong OTP verification attempts per phone before lockout (Redis counter). */
  ORDER_TRACK_OTP_MAX_VERIFY_FAILS: num({
    default: 5,
  }),
  /** OTP code validity in Redis (seconds). */
  ORDER_TRACK_OTP_CODE_TTL_SEC: num({
    default: 300, // 5 minutes
  }),
  /** Email registration: pending session + OTP TTL in Redis (seconds). */
  REGISTRATION_OTP_TTL_SEC: num({
    default: 300, // 5 minutes
  }),
  /** Max wrong OTP attempts before the registration session is deleted. */
  REGISTRATION_OTP_MAX_VERIFY_ATTEMPTS: num({
    default: 5,
  }),
  /**
   * Firebase Admin: service account JSON string (order-track phone auth).
   * If empty, uses Application Default Credentials (e.g. GOOGLE_APPLICATION_CREDENTIALS).
   */
  FIREBASE_SERVICE_ACCOUNT_JSON: str({
    default: "",
  }),
  /**
   * When true, POST /orders/track/verify-phone-auth accepts bypassAuth + phone (dev-only flow).
   * Also allowed when NODE_ENV is development without this flag.
   */
  ORDER_TRACK_BYPASS_AUTH: bool({
    default: false,
  }),
  /**
   * Product view counts: buffer in Redis (product:{id}:views), flushed to DB on an interval.
   * When true, duplicate views within PRODUCT_VIEW_DEDUPE_TTL_SEC are ignored (per viewerId / auth user).
   */
  PRODUCT_VIEW_PREVENT_DUPLICATE: bool({
    default: false,
  }),
  /** TTL (seconds) for Redis key viewed:{userId}:{productId} when duplicate prevention is on. */
  PRODUCT_VIEW_DEDUPE_TTL_SEC: num({
    default: 60,
  }),
  /** How often the flush worker runs (ms). */
  PRODUCT_VIEW_FLUSH_INTERVAL_MS: num({
    default: 60_000,
  }),
  /** Distributed lock TTL (seconds) so overlapping flush runs do not double-apply counts. */
  PRODUCT_VIEW_FLUSH_LOCK_TTL_SEC: num({
    default: 120,
  }),
  /** How often to release expired stock reservations (ms). */
  RELEASE_EXPIRED_RESERVATIONS_INTERVAL_MS: num({
    default: 120_000, // 2 minutes
  }),
  /** Batch size per transaction for releaseExpiredReservations job. */
  RELEASE_EXPIRED_RESERVATIONS_BATCH_SIZE: num({
    default: 100,
  }),
  /**
   * When true, new stock reservations are created with expires_at = null (no TTL).
   * Set false to restore timed reservations using RESERVATION_TTL_MINUTES.
   */
  ALLOW_UNLIMITED_RESERVATION: bool({
    default: true,
  }),
});
