// Load environment variables first (before Prisma Client initialization)
import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";

import { logger } from "@/index";

// Create a single Prisma Client instance
// In development, the instance is preserved across hot-reloads
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT NOW()`;
    logger.info(`Database connection successful via Prisma`);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Database connection failed: ${errorMessage}`);
    return false;
  }
};

// Close Prisma connection
export const closePrisma = async (): Promise<void> => {
  await prisma.$disconnect();
  logger.info("Prisma client disconnected");
};

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
};
