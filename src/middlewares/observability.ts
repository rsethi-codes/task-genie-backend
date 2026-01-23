import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

export interface RequestWithContext extends Request {
    correlationId: string;
}

/**
 * Middleware to inject correlation IDs for end-to-end tracing
 */
export const correlationMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const correlationId = (req.headers["x-correlation-id"] as string) || uuidv4();
    (req as any).correlationId = correlationId;
    res.setHeader("x-correlation-id", correlationId);
    next();
};

/**
 * Structured logger utility
 */
export const logger = {
    info: (message: string, context?: any) => {
        console.log(JSON.stringify({ level: "INFO", timestamp: new Date().toISOString(), message, ...context }));
    },
    warn: (message: string, context?: any) => {
        console.warn(JSON.stringify({ level: "WARN", timestamp: new Date().toISOString(), message, ...context }));
    },
    error: (message: string, context?: any) => {
        console.error(JSON.stringify({ level: "ERROR", timestamp: new Date().toISOString(), message, ...context }));
    },
    debug: (message: string, context?: any) => {
        if (process.env.NODE_ENV === "development") {
            console.log(JSON.stringify({ level: "DEBUG", timestamp: new Date().toISOString(), message, ...context }));
        }
    }
};
