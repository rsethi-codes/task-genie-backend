import { Router } from "express";
import { commentController } from "../controllers/comment.controller";
import { authenticate } from "../middlewares/auth-middleware";

const router = Router();

router.delete("/:id", authenticate as any, commentController.deleteComment);

export const commentRoutes = router;
