import dotenv from "dotenv";
import { cleanEnv, host, num, port, str } from "envalid";

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
  // Legacy database configuration (kept for backward compatibility if needed)
  DB_HOST: str({
    default: "localhost",
  }),
  DB_PORT: num({
    default: 5432,
  }),
  DB_NAME: str({
    default: "postgres",
  }),
  DB_USER: str({
    default: "postgres",
  }),
  DB_PASSWORD: str({
    default: "postgres",
  }),
});
