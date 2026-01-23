import { Router } from "express";
import { subtaskController } from "../controllers/subtask.controller";
import { authenticate } from "../middlewares/auth-middleware";

const router = Router();

// Subtask CRUD
router.post("/", authenticate as any, subtaskController.createSubtask);
router.get("/", authenticate as any, subtaskController.getSubtasks);
router.patch("/:id", authenticate as any, subtaskController.updateSubtask);
router.delete("/:id", authenticate as any, subtaskController.deleteSubtask);

// Execution Tracking
router.post("/:id/start", authenticate as any, subtaskController.startSubtask);
router.post("/:id/pause", authenticate as any, subtaskController.pauseSubtask);
router.post("/:id/complete", authenticate as any, subtaskController.completeSubtask);

export const subtaskRoutes = router;
