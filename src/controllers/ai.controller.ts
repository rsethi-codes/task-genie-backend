import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth-middleware";
import { aiService } from "../services/ai.service";
import { startSessionSchema, addMessageSchema, completeSessionSchema } from "../schemas/ai.schema";

export class AIController {
    async startSession(req: AuthenticatedRequest, res: Response) {
        try {
            const validated = startSessionSchema.parse(req.body);
            const taskId = req.params.taskId || null;
            const session = await aiService.startSession(req.user!.id, taskId, validated);
            res.status(201).json(session);
        } catch (error: any) {
            if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
            res.status(500).json({ error: error.message });
        }
    }

    async addMessage(req: AuthenticatedRequest, res: Response) {
        try {
            const validated = addMessageSchema.parse(req.body);
            const response = await aiService.addMessage(req.user!.id, req.params.id, validated);
            res.status(201).json(response);
        } catch (error: any) {
            if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
            res.status(500).json({ error: error.message });
        }
    }

    async completeSession(req: AuthenticatedRequest, res: Response) {
        try {
            const validated = completeSessionSchema.parse(req.body);
            const session = await aiService.completeSession(req.user!.id, req.params.id, validated);
            res.json(session);
        } catch (error: any) {
            if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
            res.status(500).json({ error: error.message });
        }
    }

    async getSession(req: AuthenticatedRequest, res: Response) {
        try {
            const session = await aiService.getSession(req.user!.id, req.params.id);
            res.json(session);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const aiController = new AIController();
