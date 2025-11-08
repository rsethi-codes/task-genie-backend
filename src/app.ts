import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import { clerkMiddleware } from "@clerk/express";
import { authRoutes } from "./routes/auth.route.js";
import { AUTH_BASE } from "./constants/routes.constants.js";
// import userRoutes from "./routes/userRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// Connect to MongoDB
connectDB();

// Health check
app.get("/health", async (request, response) => {
  response
    .status(200)
    .send({ status: "ok", timestamp: new Date().toISOString() });
});

// Debug middleware to get path info
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.path}`);
  console.log(`📍 Full URL: ${req.originalUrl}`);
  next();
});

// ROUTES
// app.use(USER_BASE, userRoutes);
app.use(AUTH_BASE, authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Global error:", err);
    res.status(err.status || 500).json({
      error: err.message || "Internal Server Error",
    });
  }
);

export default app;
