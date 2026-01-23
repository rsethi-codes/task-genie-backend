import { z } from "zod";
import { TaskStatus, Priority, EnergyLevel, FocusLevel, TimeOfDay } from "@prisma/client";

export const createTaskSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(Priority).optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    startDate: z.string().datetime().optional().nullable(),
    dueDate: z.string().datetime().optional().nullable(),
    estimatedDuration: z.number().int().positive().optional(),
    locationName: z.string().optional(),
    locationType: z.string().optional(),
    requiresInternet: z.boolean().optional(),
    requiresTools: z.array(z.string()).optional(),
    energyRequired: z.nativeEnum(EnergyLevel).optional(),
    focusRequired: z.nativeEnum(FocusLevel).optional(),
    preferredTimeOfDay: z.array(z.nativeEnum(TimeOfDay)).optional(),
    aiMetadata: z.record(z.string(), z.any()).optional(),
    isRecurring: z.boolean().optional(),
    recurrenceRule: z.string().optional(),
    idempotencyKey: z.string().uuid().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskFilterSchema = z.object({
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(Priority).optional(),
    category: z.string().optional(),
    tags: z.string().optional(), // Comma separated
    search: z.string().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    isDeleted: z.string().optional(), // "true" or "false"
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
