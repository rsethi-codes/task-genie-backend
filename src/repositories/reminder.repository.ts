import { prisma } from "../config/db.js";
import { Reminder, Prisma } from "@prisma/client";

export class ReminderRepository {
    async create(data: Prisma.ReminderUncheckedCreateInput): Promise<Reminder> {
        return prisma.reminder.create({ data });
    }

    async findUpcoming(userId: string): Promise<Reminder[]> {
        return prisma.reminder.findMany({
            where: {
                userId,
                delivered: false,
                triggerAt: {
                    gt: new Date()
                }
            },
            include: { node: true },
            orderBy: { triggerAt: "asc" }
        });
    }

    async markDelivered(id: string): Promise<Reminder> {
        return prisma.reminder.update({
            where: { id },
            data: {
                delivered: true,
                deliveredAt: new Date()
            }
        });
    }

    async findById(id: string): Promise<Reminder | null> {
        return prisma.reminder.findUnique({ where: { id } });
    }
}

export const reminderRepository = new ReminderRepository();
