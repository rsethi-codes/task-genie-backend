import { reminderRepository } from "../repositories/reminder.repository";
import { taskRepository } from "../repositories/task.repository";

export class ReminderService {
    async createReminder(userId: string, taskId: string, data: any) {
        const task = await taskRepository.findById(taskId, userId);
        if (!task) throw new Error("Task not found or unauthorized");

        return reminderRepository.create({
            ...data,
            taskId,
            userId,
            triggerAt: new Date(data.triggerAt)
        });
    }

    async getUpcomingReminders(userId: string) {
        return reminderRepository.findUpcoming(userId);
    }

    async markDelivered(userId: string, reminderId: string) {
        const reminder = await reminderRepository.findById(reminderId);
        if (!reminder || reminder.userId !== userId) throw new Error("Reminder not found or unauthorized");

        return reminderRepository.markDelivered(reminderId);
    }
}

export const reminderService = new ReminderService();
