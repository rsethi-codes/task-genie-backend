import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth-middleware";
import { reminderService } from "../services/reminder.service";
import { z } from "zod";
import { Channel } from "@prisma/client";

const reminderSchema = z.object({
    triggerAt: z.string().datetime(),
    channel: z.nativeEnum(Channel).optional(),
    message: z.string().optional(),
});

export class ReminderController {
    async createReminder(req: AuthenticatedRequest, res: Response) {
        try {
            const validated = reminderSchema.parse(req.body);
            const reminder = await reminderService.createReminder(req.user!.id, req.params.taskId, validated);
            res.status(201).json(reminder);
        } catch (error: any) {
            if (error.name === "ZodError") return res.status(400).json({ error: error.errors });
            res.status(500).json({ error: error.message });
        }
    }

    async getUpcoming(req: AuthenticatedRequest, res: Response) {
        try {
            const reminders = await reminderService.getUpcomingReminders(req.user!.id);
            res.json(reminders);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async markDelivered(req: AuthenticatedRequest, res: Response) {
        try {
            const reminder = await reminderService.markDelivered(req.user!.id, req.params.id);
            res.json(reminder);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}

export const reminderController = new ReminderController();
