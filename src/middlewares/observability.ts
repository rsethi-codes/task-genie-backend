// This file is deprecated - use request-context.ts and http-logger.ts instead
// Keeping for backward compatibility during migration

export { requestContextMiddleware as correlationMiddleware } from "./request-context.js";
export { logger } from "../lib/logger.js";
