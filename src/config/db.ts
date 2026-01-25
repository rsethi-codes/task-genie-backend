import { createPrismaClientWithLogging } from "../lib/database-logger.js";
import { PrismaClient } from "@prisma/client";
import { logger } from "../lib/logger.js";

/**
 * Create Prisma client with enhanced logging
 */
const createPrismaClient = createPrismaClientWithLogging;

/**
 * Prisma singleton
 * Prevents exhausting DB connections during hot reloads
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

/**
 * Cache Prisma client in development
 */
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export const verifyDatabaseConnection = async () => {
  await prisma.$connect();
};

/**
 * Graceful shutdown handling
 * Ensures DB connections are closed cleanly
 */
const shutdown = async (signal: string) => {
  try {
    logger.info("database.disconnect.initiated", {
      msg: `🔌 Prisma disconnecting (${signal})`,
      system: {
        signal,
        component: "database",
      },
    });
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    logger.error("database.disconnect.failed", {
      msg: "❌ Prisma disconnect failed",
      error: err,
      system: {
        component: "database",
      },
    });
    process.exit(1);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("beforeExit", () => shutdown("beforeExit"));
