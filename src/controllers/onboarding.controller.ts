import { Response } from "express";
import { z } from "zod";
import { AuthenticatedRequest } from "../middlewares/auth-middleware";
import { onboardingService } from "../services/onboarding.service";

const engagementSignalsSchema = z.object({
  responseTimeMs: z.number(),
  editCount: z.number(),
  hesitationCount: z.number(),
  answerLength: z.number(),
  skipEvents: z.number(),
  timeSpentInSessionMs: z.number(),
  dropOffRisk: z.number(),
});

const personaSchema = z.object({
  version: z.number(),
  timestamp: z.string(),
  traits: z.record(z.string(), z.any()),
  confidence: z.number(),
});

const onboardingContextSchema = z.object({
  userId: z.string(),
  currentPersona: personaSchema,
  previousAnswers: z.record(z.string(), z.any()),
  engagementHistory: z.array(engagementSignalsSchema),
  category: z.string().optional(),
});

export class OnboardingController {
  async next(req: AuthenticatedRequest, res: Response) {
    try {
      const context = onboardingContextSchema.parse(req.body);
      const decision = await onboardingService.getNextDecision(req.user!.id, context);
      res.json(decision);
    } catch (error: any) {
      if (error?.name === "ZodError") {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  }
}

export const onboardingController = new OnboardingController();
