import { Prisma } from "@prisma/client";
import type { ErrorRequestHandler, RequestHandler } from "express";
import { StatusCodes, getReasonPhrase } from "http-status-codes";

export class AppError extends Error {
  statusCode: number;
  expose: boolean; // whether message is safe to show to client

  constructor(message: string, statusCode = StatusCodes.INTERNAL_SERVER_ERROR, expose?: boolean) {
    super(message);
    this.statusCode = statusCode;
    this.expose = expose ?? statusCode < 500; // show message for 4xx by default
  }
}

const unexpectedRequest: RequestHandler = (_req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: "Route not found",
  });
};

const addErrorToRequestLog: ErrorRequestHandler = (err, _req, res, next) => {
  res.locals.err = err;
  next(err);
};

const mapError = (err: unknown): { message: string; statusCode: number } => {
  // Explicitly safe errors
  if (err instanceof AppError) {
    return { message: err.message, statusCode: err.statusCode };
  }

  // Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Unique constraint
    if (err.code === "P2002") {
      // meta.target is usually an array of field names, e.g. ['slug']
      const target = (err.meta as any)?.target;
      const fields = Array.isArray(target) ? target.join(", ") : String(target ?? "");
      return {
        message: fields ? `Duplicate value for: ${fields}.` : "Duplicate value.",
        statusCode: StatusCodes.CONFLICT, // 409
        // meta: { prismaCode: err.code, target },
      };
    }

    // Record not found (common)
    if (err.code === "P2025") {
      return {
        message: "Resource not found.",
        statusCode: StatusCodes.NOT_FOUND,
        // meta: { prismaCode: err.code },
      };
    }

    // Fallback for other known Prisma errors
    return {
      message: "Database request failed.",
      statusCode: StatusCodes.BAD_REQUEST,
      // meta: { prismaCode: err.code },
    };
  }

  // Known error types by name
  if (err instanceof Error) {
    // Zod validation
    if (err.name === "ZodError") {
      return {
        message: "Invalid request data.",
        statusCode: StatusCodes.BAD_REQUEST,
      };
    }

    // Resource not found
    if (err.name === "NotFoundError") {
      return {
        message: err.message || "Resource not found.",
        statusCode: StatusCodes.NOT_FOUND,
      };
    }
  }

  // Default fallback
  return {
    message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
  };
};

const errorResponder: ErrorRequestHandler = (err, req, res, _next) => {
  const { message, statusCode } = mapError(err);

  // const isProd = process.env.NODE_ENV === "production";
  const error = err instanceof Error ? err : new Error(String(err));

  // Server-side log details
  console.error("Request error:", {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message: error.message,
    name: error.name,
    stack: error.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
    // optional: include stack only in dev
    // ...(isProd ? {} : { stack: err?.stack }),
  });
};

export default () => [unexpectedRequest, addErrorToRequestLog, errorResponder];
