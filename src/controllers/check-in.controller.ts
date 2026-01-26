
import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middlewares/auth-middleware";
import { checkInService } from "../services/check-in.service";

// Zod schemas for validation
const startSessionSchema = z.object({});

const processInputSchema = z.object({
    sessionId: z.string().uuid(),
    energy: z.number().min(1).max(5),
    moods: z.array(z.string()),
    reflection: z.string().optional()
});

const followUpSchema = z.object({
    sessionId: z.string().uuid(),
    answer: z.string()
});

export class CheckInController {

    async start(req: AuthenticatedRequest, res: Response) {
        try {
            const sessionId = await checkInService.startSession(req.user!.id);
            res.json({ sessionId });
        } catch (error: any) {
            res.status(500).json({ error: error.message || "Internal Server Error" });
        }
    }

    async process(req: AuthenticatedRequest, res: Response) {
        try {
            const body = processInputSchema.parse(req.body);
            const result = await checkInService.processInput(req.user!.id, body.sessionId, {
                energy: body.energy,
                moods: body.moods,
                reflection: body.reflection
            });
            res.json(result);
        } catch (error: any) {
            if (error?.name === "ZodError") {
                return res.status(400).json({ error: error.errors });
            }
            res.status(500).json({ error: error.message || "Internal Server Error" });
        }
    }

    async reply(req: AuthenticatedRequest, res: Response) {
        try {
            const body = followUpSchema.parse(req.body);
            const result = await checkInService.processFollowUp(req.user!.id, body.sessionId, body.answer);
            res.json(result);
        } catch (error: any) {
            if (error?.name === "ZodError") {
                return res.status(400).json({ error: error.errors });
            }
            res.status(500).json({ error: error.message || "Internal Server Error" });
        }
    }
}

export const checkInController = new CheckInController();
