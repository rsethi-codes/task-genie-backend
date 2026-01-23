import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth-middleware";
import { taskShareService } from "../services/task-share.service";

export class TaskShareController {
    async shareTask(req: AuthenticatedRequest, res: Response) {
        try {
            const { userId, permission } = req.body;
            const share = await taskShareService.shareTask(req.user!.id, req.params.id, userId, permission);
            res.status(201).json(share);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateShare(req: AuthenticatedRequest, res: Response) {
        try {
            const { permission } = req.body;
            const share = await taskShareService.updateShare(req.user!.id, req.params.id, req.params.userId, permission);
            res.json(share);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async revokeShare(req: AuthenticatedRequest, res: Response) {
        try {
            await taskShareService.revokeShare(req.user!.id, req.params.id, req.params.userId);
            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const taskShareController = new TaskShareController();
