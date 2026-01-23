import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth-middleware";

const router = Router();

// Authenticated user routes
router.get("/me", authenticate as any, userController.getMe);
router.patch("/me/preferences", authenticate as any, userController.updatePreferences);
router.get("/me/analytics", authenticate as any, userController.getAnalytics);

// Admin/internal routes
router.get("/clerk/:clerkId", userController.getByClerkId);

export const userRoutes = router;
