import { Router } from "express";
import { reminderController } from "../controllers/reminder.controller";
import { authenticate } from "../middlewares/auth-middleware";

const router = Router();

router.get("/upcoming", authenticate as any, reminderController.getUpcoming);
router.patch("/:id/delivered", authenticate as any, reminderController.markDelivered);

export const reminderRoutes = router;
