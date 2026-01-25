import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";
import { RequestWithContext, getCorrelationId, getUserId } from "./request-context.js";

/**
 * Structured HTTP request logging middleware
 * Replaces noisy per-middleware logs with clean request lifecycle logging
 */
export const httpLoggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const correlationId = getCorrelationId(req);
  const userId = getUserId(req);

  // Log response completion once per request
  res.on("finish", () => {
    const durationMs = Date.now() - start;
    const { method, path } = req;
    const { statusCode } = res;

    // Use the logger service's structured HTTP logging
    logger.logRequest({
      method,
      path,
      statusCode,
      durationMs,
      correlationId,
      userId,
    });
  });

  next();
};

/**
 * HTTP error logging middleware
 * Logs structured error information for failed requests
 */
export const httpErrorLoggerMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const correlationId = getCorrelationId(req);
  const userId = getUserId(req);
  const requestLogger = logger.child({ correlationId, userId });

  // Log the error with full context
  requestLogger.error({
    event: "http.request.failed",
    msg: `HTTP ${req.method} ${req.path} failed: ${err.message || "Unknown error"}`,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
    },
    http: {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode || 500,
    },
    correlationId,
    userId,
  });

  next(err);
};
