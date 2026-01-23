import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth-middleware";
import { questionnaireService } from "../services/questionnaire.service";
import { z } from "zod";
import { QuestionType } from "@prisma/client";

const questionnaireSchema = z.object({
    category: z.string(),
    question: z.string(),
    type: z.nativeEnum(QuestionType),
    options: z.array(z.string()).optional(),
    aiHint: z.string().optional(),
    aiImportance: z.number().min(0).max(1).optional(),
    isActive: z.boolean().optional(),
    order: z.number().int().optional(),
});

export class QuestionnaireController {
    async getQuestionnaires(req: Request, res: Response) {
        try {
            const filters = {
                category: req.query.category as string,
                isActive: req.query.isActive === 'false' ? false : true
            };
            const data = await questionnaireService.getQuestionnaires(filters);
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async createQuestionnaire(req: AuthenticatedRequest, res: Response) {
        try {
            // Check for ADMIN role
            if (!req.user?.roles.includes("ADMIN")) {
                return res.status(403).json({ error: "Admin only" });
            }
            const validated = questionnaireSchema.parse(req.body);
            const data = await questionnaireService.createQuestionnaire(req.user!.id, validated);
            res.status(201).json(data);
        } catch (error: any) {
            if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
            res.status(500).json({ error: error.message });
        }
    }

    async updateQuestionnaire(req: AuthenticatedRequest, res: Response) {
        try {
            if (!req.user?.roles.includes("ADMIN")) {
                return res.status(403).json({ error: "Admin only" });
            }
            const validated = questionnaireSchema.partial().parse(req.body);
            const data = await questionnaireService.updateQuestionnaire(req.user!.id, req.params.id, validated);
            res.json(data);
        } catch (error: any) {
            if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
            res.status(500).json({ error: error.message });
        }
    }
}

export const questionnaireController = new QuestionnaireController();
