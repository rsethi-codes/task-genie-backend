import { Router } from "express";
import { taskController } from "../controllers/task.controller";
import { aiController } from "../controllers/ai.controller";
import { taskShareController } from "../controllers/task-share.controller";
import { reminderController } from "../controllers/reminder.controller";
import { commentController } from "../controllers/comment.controller";
import { authenticate } from "../middlewares/auth-middleware";

const router = Router();

router.post("/", authenticate as any, taskController.createTask);
router.post("/enrich", authenticate as any, taskController.enrichTask);
router.post("/classify", authenticate as any, taskController.classifyTask);
router.get("/", authenticate as any, taskController.getTasks);
router.get("/:id", authenticate as any, taskController.getTask);
router.patch("/:id", authenticate as any, taskController.updateTask);
router.delete("/:id", authenticate as any, taskController.deleteTask);
router.post("/:id/restore", authenticate as any, taskController.restoreTask);
router.post("/:id/generate-subtasks", authenticate as any, taskController.generateSubtasks);
router.post("/:id/generate-nodes", authenticate as any, taskController.generateNodes);
router.post("/:id/expand", authenticate as any, taskController.expandNode);
router.post("/:id/refine", authenticate as any, taskController.refineTask);
router.post("/reorder", authenticate as any, taskController.reorderTasks);
router.get("/coach/today", authenticate as any, taskController.getTodaysFocus);

// Questionnaire
router.get("/:id/questionnaire", authenticate as any, taskController.getQuestionnaire);
router.post("/:id/questionnaire/:sessionId/answer", authenticate as any, taskController.submitAnswer);

// AI
router.post("/:taskId/ai/start-session", authenticate as any, aiController.startSession);

// Sharing
router.post("/:id/share", authenticate as any, taskShareController.shareTask);
router.patch("/:id/share/:userId", authenticate as any, taskShareController.updateShare);
router.delete("/:id/share/:userId", authenticate as any, taskShareController.revokeShare);

// Reminders
router.post("/:taskId/reminders", authenticate as any, reminderController.createReminder);

// Comments
router.post("/:taskId/comments", authenticate as any, commentController.addComment);
router.get("/:taskId/comments", authenticate as any, commentController.getComments);

export const taskRoutes = router;
