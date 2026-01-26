import express from "express";
import cors from "cors";
import { verifyDatabaseConnection } from "./config/db.js";
import { clerkMiddleware } from "@clerk/express";
import { requestContextMiddleware } from "./middlewares/request-context.js";
import { httpLoggerMiddleware, httpErrorLoggerMiddleware } from "./middlewares/http-logger.js";
import { webhookRoutes } from "./routes/webhook.route.js";
import { userRoutes } from "./routes/user.route.js";
import { taskRoutes } from "./routes/task.route.js";
import { aiRoutes } from "./routes/ai.route.js";
import { questionnaireRoutes } from "./routes/questionnaire.route.js";
import { projectRoutes } from "./routes/project.route.js";
import { reminderRoutes } from "./routes/reminder.route.js";
import { commentRoutes } from "./routes/comment.route.js";
import { searchRoutes } from "./routes/search.route.js";
import { auditLogRoutes } from "./routes/audit-log.route.js";
import { onboardingRoutes } from "./routes/onboarding.route.js";
import checkInRoutes from "./routes/check-in.route.js";
import { USER_BASE, TASK_BASE, BASE } from "./constants/routes.constants.js";
import { logger } from "./lib/logger.js";

const app = express();

app.use(cors());
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(requestContextMiddleware);
app.use(clerkMiddleware());
app.use(httpLoggerMiddleware);

// Verify connection to Database
await verifyDatabaseConnection();


// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Main Routes
// Webhook routes MUST come first (before other middleware that might consume body)
app.use(`${BASE}/webhooks`, webhookRoutes);
app.use(USER_BASE, userRoutes);
app.use(TASK_BASE, taskRoutes);
app.use(`${BASE}/ai`, aiRoutes);
app.use(`${BASE}/questionnaires`, questionnaireRoutes);
app.use(`${BASE}/projects`, projectRoutes);
app.use(`${BASE}/reminders`, reminderRoutes);
app.use(`${BASE}/comments`, commentRoutes);
app.use(`${BASE}/search`, searchRoutes);
app.use(`${BASE}/audit-logs`, auditLogRoutes);
app.use(`${BASE}/onboarding`, onboardingRoutes);

app.use(`${BASE}/check-in`, checkInRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use(httpErrorLoggerMiddleware);
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

export default app;
