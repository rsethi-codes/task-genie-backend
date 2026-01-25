import { PrismaClient } from "@prisma/client";
import { logger } from "./logger.js";

export interface DatabaseLogContext {
  action: string;
  table?: string;
  userId?: string;
  correlationId: string;
  durationMs?: number;
  error?: any;
  query?: string;
  params?: any;
}

/**
 * Enhanced Prisma logging wrapper
 * Replaces raw SQL query spam with structured intent-level logs
 */
export class DatabaseLogger {
  private static instance: DatabaseLogger;
  private logger = logger;

  static getInstance(): DatabaseLogger {
    if (!DatabaseLogger.instance) {
      DatabaseLogger.instance = new DatabaseLogger();
    }
    return DatabaseLogger.instance;
  }

  /**
   * Log database operation with intent-level context
   */
  logOperation(context: DatabaseLogContext): void {
    const { action, table, userId, correlationId, durationMs, error, query, params } = context;

    // Only log raw queries at trace level
    if (process.env.LOG_LEVEL === "trace" && query) {
      this.logger.trace({
        event: "database.query.raw",
        msg: `[DB] Raw query: ${action}`,
        correlationId,
        userId,
        database: {
          action,
          table,
          query,
          params,
          durationMs,
        },
      });
    }

    // Log intent-level operation
    this.logger.logDatabase({
      action,
      table,
      userId,
      correlationId,
      durationMs,
      error,
    });
  }

  /**
   * Wrap Prisma operations with timing and logging
   */
  async withLogging<T>(
    operation: () => Promise<T>,
    context: Omit<DatabaseLogContext, "durationMs" | "error">
  ): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await operation();
      const durationMs = Date.now() - start;
      
      this.logOperation({
        ...context,
        durationMs,
      });
      
      return result;
    } catch (error) {
      const durationMs = Date.now() - start;
      
      this.logOperation({
        ...context,
        durationMs,
        error,
      });
      
      throw error;
    }
  }
}

/**
 * Create Prisma client with enhanced logging
 */
export const createPrismaClientWithLogging = () => {
  const dbLogger = DatabaseLogger.getInstance();

  const client = new PrismaClient({
    log: [
      {
        emit: "event",
        level: "query",
      },
      {
        emit: "event",
        level: "error",
      },
      {
        emit: "event",
        level: "warn",
      },
      {
        emit: "event",
        level: "info",
      },
    ],
  });

  // Type-safe event handlers
  client.$on("query", (e: any) => {
    // Only log raw queries at trace level
    if (process.env.LOG_LEVEL === "trace") {
      dbLogger.logOperation({
        action: "query",
        query: e.query,
        params: e.params,
        durationMs: e.duration,
        correlationId: "system", // System queries don't have request context
      });
    }
  });

  client.$on("error", (e: any) => {
    dbLogger.logOperation({
      action: "error",
      error: e.message,
      correlationId: "system",
    });
  });

  client.$on("warn", (e: any) => {
    // Log warnings as warnings, not as errors
    logger.warn({
      event: "database.warning",
      msg: `[DB] Warning: ${e.message}`,
      correlationId: "system",
      database: {
        action: "warning",
        message: e.message,
      },
    });
  });

  client.$on("info", (e: any) => {
    // Log info messages as debug, not as errors
    logger.debug({
      event: "database.info",
      msg: `[DB] ${e.message}`,
      correlationId: "system",
      database: {
        action: "info",
        message: e.message,
      },
    });
  });

  return client;
};

/**
 * Database operation helpers for common patterns
 */
export const dbOperations = {
  /**
   * Log user fetch/create operation
   */
  userFetchOrCreate: (context: { correlationId: string; userId?: string }) => {
    DatabaseLogger.getInstance().logOperation({
      action: "user.fetchOrCreate",
      table: "users",
      ...context,
    });
  },

  /**
   * Log task creation operation
   */
  taskCreate: (context: { correlationId: string; userId?: string }) => {
    DatabaseLogger.getInstance().logOperation({
      action: "task.create",
      table: "tasks",
      ...context,
    });
  },

  /**
   * Log questionnaire fetch operation
   */
  questionnaireFetch: (context: { correlationId: string; userId?: string }) => {
    DatabaseLogger.getInstance().logOperation({
      action: "questionnaire.fetch",
      table: "questionnaires",
      ...context,
    });
  },

  /**
   * Log AI response storage
   */
  aiResponseStore: (context: { correlationId: string; userId?: string }) => {
    DatabaseLogger.getInstance().logOperation({
      action: "ai.response.store",
      table: "ai_responses",
      ...context,
    });
  },

  /**
   * Log project operations
   */
  projectOperation: (action: string, context: { correlationId: string; userId?: string }) => {
    DatabaseLogger.getInstance().logOperation({
      action: `project.${action}`,
      table: "projects",
      ...context,
    });
  },

  /**
   * Log subtask operations
   */
  subtaskOperation: (action: string, context: { correlationId: string; userId?: string }) => {
    DatabaseLogger.getInstance().logOperation({
      action: `subtask.${action}`,
      table: "subtasks",
      ...context,
    });
  },
};
