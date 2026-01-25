import { z } from "zod";
import { NodeStatus, Priority, NodeType, TemporalIntent, EnergyLevel, FocusLevel, TimeOfDay } from "@prisma/client";

export const createTaskSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    nodeType: z.nativeEnum(NodeType).default(NodeType.ACTION),
    status: z.nativeEnum(NodeStatus).optional(),
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
    temporalIntent: z.nativeEnum(TemporalIntent).optional(),
    parentId: z.string().uuid().optional().nullable(),
    rootTaskId: z.string().uuid().optional(),
    idempotencyKey: z.string().uuid().optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const taskFilterSchema = z.object({
    status: z.nativeEnum(NodeStatus).optional(),
    priority: z.nativeEnum(Priority).optional(),
    type: z.nativeEnum(NodeType).optional(),
    category: z.string().optional(),
    tags: z.string().optional(), // Comma separated
    search: z.string().optional(),
    parentId: z.string().optional(),
    rootTaskId: z.string().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    isDeleted: z.string().optional(), // "true" or "false"
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
