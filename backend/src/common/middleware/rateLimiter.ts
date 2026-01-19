import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import type { Request } from "express";

import { env } from "@/common/utils/envConfig";

const rateLimiter = rateLimit({
  legacyHeaders: true,
  limit: env.COMMON_RATE_LIMIT_MAX_REQUESTS,
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  windowMs: env.COMMON_RATE_LIMIT_WINDOW_MS,
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip ?? "unknown"),
});

export default rateLimiter;
