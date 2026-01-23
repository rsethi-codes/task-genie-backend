import { z } from "zod";
import { SubtaskStatus, EnergyLevel, FocusLevel } from "@prisma/client";

export const createSubtaskSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.nativeEnum(SubtaskStatus).optional(),
    order: z.number().int().optional(),
    dueDate: z.string().datetime().optional(),
    estimatedDuration: z.number().int().positive().optional(),
    energyRequired: z.nativeEnum(EnergyLevel).optional(),
    focusRequired: z.nativeEnum(FocusLevel).optional(),
    locationName: z.string().optional(),
    requiresTools: z.array(z.string()).optional(),
    blockedBy: z.array(z.string().uuid()).optional(),
    isBlocking: z.boolean().optional(),
    aiGenerated: z.boolean().optional(),
});

export const updateSubtaskSchema = createSubtaskSchema.partial();
