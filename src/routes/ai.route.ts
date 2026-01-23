import { Router } from "express";
import { aiController } from "../controllers/ai.controller";
import { authenticate } from "../middlewares/auth-middleware";

const router = Router();

router.post("/sessions/:id/message", authenticate as any, aiController.addMessage);
router.post("/sessions/:id/complete", authenticate as any, aiController.completeSession);
router.get("/sessions/:id", authenticate as any, aiController.getSession);

export const aiRoutes = router;
