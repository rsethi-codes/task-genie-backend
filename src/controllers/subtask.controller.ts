import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth-middleware";
import { subtaskService } from "../services/subtask.service";
import { createSubtaskSchema, updateSubtaskSchema } from "../schemas/subtask.schema";

export class SubtaskController {
    async createSubtask(req: AuthenticatedRequest, res: Response) {
        try {
            const validated = createSubtaskSchema.parse(req.body);
            const subtask = await subtaskService.createSubtask(req.user!.id, req.params.taskId, validated);
            res.status(201).json(subtask);
        } catch (error: any) {
            if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
            res.status(500).json({ error: error.message });
        }
    }

    async getSubtasks(req: AuthenticatedRequest, res: Response) {
        try {
            const subtasks = await subtaskService.getSubtasks(req.user!.id, req.params.taskId);
            res.json(subtasks);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateSubtask(req: AuthenticatedRequest, res: Response) {
        try {
            const validated = updateSubtaskSchema.parse(req.body);
            const subtask = await subtaskService.updateSubtask(req.user!.id, req.params.id, validated);
            res.json(subtask);
        } catch (error: any) {
            if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
            res.status(500).json({ error: error.message });
        }
    }

    async deleteSubtask(req: AuthenticatedRequest, res: Response) {
        try {
            await subtaskService.deleteSubtask(req.user!.id, req.params.id);
            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async startSubtask(req: AuthenticatedRequest, res: Response) {
        try {
            const attempt = await subtaskService.startSubtask(req.user!.id, req.params.id);
            res.status(201).json(attempt);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async pauseSubtask(req: AuthenticatedRequest, res: Response) {
        try {
            await subtaskService.pauseSubtask(req.user!.id, req.params.id, req.body.notes);
            res.status(200).send();
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async completeSubtask(req: AuthenticatedRequest, res: Response) {
        try {
            await subtaskService.completeSubtask(req.user!.id, req.params.id, req.body.notes);
            res.status(200).send();
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const subtaskController = new SubtaskController();
