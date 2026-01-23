import { prisma } from "../config/db";
import { TaskShare, Prisma } from "@prisma/client";

export class TaskShareRepository {
    async create(data: Prisma.TaskShareUncheckedCreateInput): Promise<TaskShare> {
        return prisma.taskShare.create({ data });
    }

    async update(taskId: string, userId: string, data: Prisma.TaskShareUncheckedUpdateInput): Promise<TaskShare> {
        return prisma.taskShare.update({
            where: {
                taskId_userId: { taskId, userId }
            },
            data
        });
    }

    async delete(taskId: string, userId: string): Promise<TaskShare> {
        return prisma.taskShare.delete({
            where: {
                taskId_userId: { taskId, userId }
            }
        });
    }

    async find(taskId: string, userId: string): Promise<TaskShare | null> {
        return prisma.taskShare.findUnique({
            where: {
                taskId_userId: { taskId, userId }
            }
        });
    }
}

export const taskShareRepository = new TaskShareRepository();
