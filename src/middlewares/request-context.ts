import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { logger, LogContext } from "../lib/logger.js";

export interface RequestWithContext extends Request {
  correlationId: string;
  logger: ReturnType<typeof logger.child>;
  userId?: string;
}

/**
 * Enhanced request context middleware with correlation IDs and logger propagation
 */
export const requestContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Generate or extract correlation ID
  const correlationId = (req.headers["x-correlation-id"] as string) || uuidv4();
  
  // Attach correlation ID to request and response
  (req as RequestWithContext).correlationId = correlationId;
  res.setHeader("x-correlation-id", correlationId);
  
  // Extract user ID from Clerk auth if available
  const userId = (req as any).auth?.userId;
  if (userId) {
    (req as RequestWithContext).userId = userId;
  }
  
  // Create a child logger with request context
  const requestLogger = logger.child({
    correlationId,
    ...(userId && { userId }),
  });
  
  (req as RequestWithContext).logger = requestLogger;
  
  // Log request start
  requestLogger.debug({
    event: "http.request.started",
    msg: "Request started",
    http: {
      method: req.method,
      path: req.path,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    },
  });
  
  next();
};

/**
 * Utility to get logger from request context
 */
export const getLoggerFromRequest = (req: Request): ReturnType<typeof logger.child> => {
  return (req as RequestWithContext).logger || logger.child({
    correlationId: (req as RequestWithContext).correlationId,
  });
};

/**
 * Utility to get correlation ID from request
 */
export const getCorrelationId = (req: Request): string => {
  return (req as RequestWithContext).correlationId || "unknown";
};

/**
 * Utility to get user ID from request
 */
export const getUserId = (req: Request): string | undefined => {
  return (req as RequestWithContext).userId;
};
