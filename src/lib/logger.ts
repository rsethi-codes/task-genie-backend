import pino, { Logger as PinoLogger } from "pino";

export interface LogContext {
  correlationId?: string;
  userId?: string;
  service?: string;
  event?: string;
  [key: string]: any;
}

export interface LoggerConfig {
  level: string;
  format: "pretty" | "json";
  service: string;
  environment: string;
  version?: string;
}

class LoggerService {
  private baseLogger: PinoLogger;
  private config: LoggerConfig;

  constructor() {
    this.config = {
      level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
      format: (process.env.LOG_FORMAT as "pretty" | "json") || 
              (process.env.NODE_ENV === "production" ? "json" : "pretty"),
      service: process.env.SERVICE_NAME || "task-genie-api",
      environment: process.env.NODE_ENV || "development",
      version: process.env.APP_VERSION,
    };

    // Create base logger with error handling for transport issues
    try {
      this.baseLogger = pino({
        level: this.config.level,
        formatters: {
          level: (label) => ({ level: label }),
          log: (object) => {
            // Ensure consistent log structure
            const { msg, ...rest } = object;
            return {
              ...rest,
              msg,
              service: this.config.service,
              env: this.config.environment,
              ...(this.config.version && { version: this.config.version }),
            };
          },
        },
        ...(this.config.format === "pretty" && {
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
              messageFormat: "{msg} {correlationId?}[cid={correlationId}] {userId?[user={userId}]}",
            },
          },
        }),
        timestamp: pino.stdTimeFunctions.isoTime,
      });
    } catch (error) {
      // Fallback to simple JSON logging if transport fails
      console.warn("Failed to initialize pretty transport, falling back to JSON:", error);
      this.baseLogger = pino({
        level: this.config.level,
        formatters: {
          level: (label) => ({ level: label }),
          log: (object) => {
            const { msg, ...rest } = object;
            return {
              ...rest,
              msg,
              service: this.config.service,
              env: this.config.environment,
              ...(this.config.version && { version: this.config.version }),
            };
          },
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      });
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): PinoLogger {
    return this.baseLogger.child(context);
  }

  /**
   * Get the base logger instance
   */
  get base(): PinoLogger {
    return this.baseLogger;
  }

  /**
   * Log structured events
   */
  trace(event: string, context?: LogContext): void;
  trace(context: LogContext): void;
  trace(eventOrContext: string | LogContext, context?: LogContext): void {
    const logContext = typeof eventOrContext === "string" 
      ? { event: eventOrContext, ...context }
      : eventOrContext;
    this.baseLogger.trace(logContext);
  }

  debug(event: string, context?: LogContext): void;
  debug(context: LogContext): void;
  debug(eventOrContext: string | LogContext, context?: LogContext): void {
    const logContext = typeof eventOrContext === "string"
      ? { event: eventOrContext, ...context }
      : eventOrContext;
    this.baseLogger.debug(logContext);
  }

  info(event: string, context?: LogContext): void;
  info(context: LogContext): void;
  info(eventOrContext: string | LogContext, context?: LogContext): void {
    const logContext = typeof eventOrContext === "string"
      ? { event: eventOrContext, ...context }
      : eventOrContext;
    this.baseLogger.info(logContext);
  }

  warn(event: string, context?: LogContext): void;
  warn(context: LogContext): void;
  warn(eventOrContext: string | LogContext, context?: LogContext): void {
    const logContext = typeof eventOrContext === "string"
      ? { event: eventOrContext, ...context }
      : eventOrContext;
    this.baseLogger.warn(logContext);
  }

  error(event: string, context?: LogContext): void;
  error(context: LogContext): void;
  error(eventOrContext: string | LogContext, context?: LogContext): void {
    const logContext = typeof eventOrContext === "string"
      ? { event: eventOrContext, ...context }
      : eventOrContext;
    this.baseLogger.error(logContext);
  }

  /**
   * Log HTTP request lifecycle
   */
  logRequest(context: {
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
    correlationId: string;
    userId?: string;
  }): void {
    const { method, path, statusCode, durationMs, correlationId, userId } = context;
    
    if (this.config.format === "pretty") {
      // Pretty format for development
      const statusIcon = statusCode >= 400 ? "✗" : statusCode >= 300 ? "→" : "✓";
      this.info(`http.request.completed`, {
        msg: `${statusIcon} ${method} ${path} ${statusCode} (${durationMs}ms)`,
        correlationId,
        userId,
        http: { method, path, statusCode, durationMs },
      });
    } else {
      // Structured JSON for production
      this.info("http.request.completed", {
        http: { method, path, statusCode, durationMs },
        correlationId,
        userId,
      });
    }
  }

  /**
   * Log AI provider usage
   */
  logAIUsage(context: {
    feature: string;
    provider: string;
    model?: string;
    latencyMs: number;
    success: boolean;
    fallback?: string;
    correlationId: string;
    userId?: string;
    error?: any;
  }): void {
    const { feature, provider, model, latencyMs, success, fallback, correlationId, userId, error } = context;
    
    if (this.config.format === "pretty") {
      const status = success ? "✓" : "✗";
      const fallbackText = fallback ? ` → falling back to ${fallback}` : "";
      const errorText = error ? ` (${error.message || error})` : "";
      
      this.info("ai.provider.usage", {
        msg: `[AI] ${feature} → ${provider}${model ? ` (${model})` : ""} ${latencyMs}ms${fallbackText}${errorText}`,
        correlationId,
        userId,
        ai: { feature, provider, model, latencyMs, success, fallback },
        ...(error && { error }),
      });
    } else {
      this.info("ai.provider.usage", {
        ai: { feature, provider, model, latencyMs, success, fallback },
        correlationId,
        userId,
        ...(error && { error }),
      });
    }
  }

  /**
   * Log database operations
   */
  logDatabase(context: {
    action: string;
    table?: string;
    userId?: string;
    correlationId: string;
    durationMs?: number;
    error?: any;
  }): void {
    const { action, table, userId, correlationId, durationMs, error } = context;
    
    if (this.config.format === "pretty") {
      const durationText = durationMs ? ` (${durationMs}ms)` : "";
      const tableText = table ? ` on ${table}` : "";
      
      if (error) {
        this.error("database.operation.failed", {
          msg: `[DB] ${action}${tableText} failed: ${error.message || error}`,
          correlationId,
          userId,
          database: { action, table, durationMs, error },
        });
      } else {
        this.debug("database.operation.completed", {
          msg: `[DB] ${action}${tableText}${durationText}`,
          correlationId,
          userId,
          database: { action, table, durationMs },
        });
      }
    } else {
      const level = error ? "error" : "debug";
      this[level]("database.operation.completed", {
        database: { action, table, durationMs, error },
        correlationId,
        userId,
        ...(error && { error }),
      });
    }
  }

  /**
   * Log worker/job lifecycle
   */
  logWorker(context: {
    worker: string;
    action: "started" | "claimed" | "completed" | "failed";
    jobId?: string;
    durationMs?: number;
    correlationId: string;
    error?: any;
  }): void {
    const { worker, action, jobId, durationMs, correlationId, error } = context;
    
    if (this.config.format === "pretty") {
      const jobText = jobId ? ` job=${jobId}` : "";
      const durationText = durationMs ? ` (${durationMs}ms)` : "";
      const errorText = error ? `: ${error.message || error}` : "";
      
      const level = action === "failed" ? "error" : "info";
      this[level]("worker.lifecycle", {
        msg: `[WORKER] ${worker} ${action}${jobText}${durationText}${errorText}`,
        correlationId,
        worker: { name: worker, action, jobId, durationMs, error },
        ...(error && { error }),
      });
    } else {
      const level = action === "failed" ? "error" : "info";
      this[level]("worker.lifecycle", {
        worker: { name: worker, action, jobId, durationMs, error },
        correlationId,
        ...(error && { error }),
      });
    }
  }
}

// Singleton instance
export const logger = new LoggerService();

// Export types for use in other modules
export type { PinoLogger as Logger };
