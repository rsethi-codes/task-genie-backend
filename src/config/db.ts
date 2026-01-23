import { PrismaClient } from "@prisma/client";

/**
 * Create Prisma client with environment-aware logging
 */
const createPrismaClient = () =>
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

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
    console.log(`🔌 Prisma disconnecting (${signal})`);
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error("❌ Prisma disconnect failed", err);
    process.exit(1);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("beforeExit", () => shutdown("beforeExit"));
