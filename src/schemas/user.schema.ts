import { z } from "zod";
import { Priority, DayOfWeek } from "@prisma/client";

export const updateUserPreferencesSchema = z.object({
    defaultPriority: z.nativeEnum(Priority).optional(),
    defaultDuration: z.number().int().positive().optional(),
    workStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    workEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    preferredWorkDays: z.array(z.nativeEnum(DayOfWeek)).optional(),
    breakDuration: z.number().int().nonnegative().optional(),
    customPreferences: z.record(z.string(), z.any()).optional(),
});

export type UpdateUserPreferences = z.infer<typeof updateUserPreferencesSchema>;
