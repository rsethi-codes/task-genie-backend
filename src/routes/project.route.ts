import { Router } from "express";
import { projectController } from "../controllers/project.controller";
import { authenticate } from "../middlewares/auth-middleware";

const router = Router();

router.post("/", authenticate as any, projectController.createProject);
router.post("/:id/members", authenticate as any, projectController.addMember);
router.post("/:id/tasks", authenticate as any, projectController.addTask);
router.get("/:id/tasks", authenticate as any, projectController.getTasks);

export const projectRoutes = router;
