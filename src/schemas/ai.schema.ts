import { z } from "zod";
import { QuestionType } from "@prisma/client";

export const startSessionSchema = z.object({
    ephemeral: z.boolean().optional(),
    modelConfigId: z.string().uuid().optional(),
});

export const addMessageSchema = z.object({
    questionText: z.string(),
    questionType: z.nativeEnum(QuestionType),
    answer: z.any(),
    answerText: z.string().optional(),
    confidence: z.number().min(1).max(5).optional(),
    responseTime: z.number().int(),
    hesitated: z.boolean().optional(),
    revised: z.boolean().optional(),
    revisionCount: z.number().int().optional(),
    thoughtTime: z.number().int().optional(),
});

export const completeSessionSchema = z.object({
    decision: z.record(z.string(), z.any()),
    decisionConfidence: z.number().min(0).max(1),
    subtasks: z.array(z.any()).optional(), // Optional subtasks to create
});
