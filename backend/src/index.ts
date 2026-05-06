import "@/common/utils/zodExtension"; // Must be imported first to extend Zod

import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";

import { openAPIRouter } from "@/api-docs/openAPIRouter";
import { apiRouter } from "@/api";

import errorHandler from "@/common/middleware/errorHandler";
import rateLimiter from "@/common/middleware/rateLimiter";
import requestLogger from "@/common/middleware/requestLogger";
import { closePrisma, testConnection } from "@/common/databases/postgres/client";
import { closeRedis } from "@/common/lib/redis-client";
import { env } from "@/common/utils/envConfig";
import { startAllCronJobs } from "@/cron-jobs";

export const logger = pino({ name: "server start" });
export const app: Express = express();

// Set the application to trust the reverse proxy
app.set("trust proxy", true);

// Middlewares – allow larger payloads for order creation with base64 bill images
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const allowedOrigins = [
  env.CORS_ORIGIN,
  "https://sticker-admin-fe.vercel.app",
  "https://sticker-client-fe.vercel.app",
  "https://dango-sticker.vercel.app",
  "https://dango-dashboard.vercel.app",
];

function isLocalhost(origin: string) {
  try {
    const { hostname } = new URL(origin);
    // Accept: localhost, 127.0.0.1, ::1 (IPv6 localhost), any port
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || (typeof origin === "string" && isLocalhost(origin))) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(helmet());
app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes
app.use(apiRouter);

// Swagger UI
app.use(openAPIRouter);

// Error handlers wrapper around all routes
app.use(errorHandler());

let cronJobTimers: NodeJS.Timeout[] = [];

// Start server
const server = app.listen(env.PORT, async () => {
  const { NODE_ENV, HOST, PORT } = env;
  logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`);

  // Test database connection
  await testConnection();

  cronJobTimers = startAllCronJobs();
  logger.info({ jobs: cronJobTimers.length }, "cron job schedulers started");
});

// Graceful shutdown
const onCloseSignal = async () => {
  logger.info("sigint received, shutting down");
  for (const t of cronJobTimers) {
    clearInterval(t);
  }
  cronJobTimers = [];
  server.close(async () => {
    logger.info("server closed");
    await closeRedis();
    await closePrisma();
    process.exit();
  });
  setTimeout(() => process.exit(1), 10000).unref(); // Force shutdown after 10s
};

process.on("SIGINT", onCloseSignal); // listen for sigint
process.on("SIGTERM", onCloseSignal); // listen for sigterm
