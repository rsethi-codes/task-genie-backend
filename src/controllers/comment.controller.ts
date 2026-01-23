import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth-middleware";
import { commentService } from "../services/comment.service";
import { z } from "zod";

const commentSchema = z.object({
    content: z.string().min(1),
    mentions: z.array(z.string().uuid()).optional(),
});

export class CommentController {
    async addComment(req: AuthenticatedRequest, res: Response) {
        try {
            const { content, mentions } = commentSchema.parse(req.body);
            const comment = await commentService.addComment(req.user!.id, req.params.taskId, content, mentions);
            res.status(201).json(comment);
        } catch (error: any) {
            if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
            res.status(500).json({ error: error.message });
        }
    }

    async getComments(req: AuthenticatedRequest, res: Response) {
        try {
            const comments = await commentService.getComments(req.user!.id, req.params.taskId);
            res.json(comments);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async deleteComment(req: AuthenticatedRequest, res: Response) {
        try {
            await commentService.deleteComment(req.user!.id, req.params.id);
            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const commentController = new CommentController();
