import { prisma } from "../config/db.js";
import { TaskShare, Prisma } from "@prisma/client";

export class TaskShareRepository {
    async create(data: Prisma.TaskShareUncheckedCreateInput): Promise<TaskShare> {
        return prisma.taskShare.create({ data });
    }

    async update(nodeId: string, userId: string, data: Prisma.TaskShareUncheckedUpdateInput): Promise<TaskShare> {
        return prisma.taskShare.update({
            where: {
                nodeId_userId: { nodeId, userId }
            },
            data
        });
    }

    async delete(nodeId: string, userId: string): Promise<TaskShare> {
        return prisma.taskShare.delete({
            where: {
                nodeId_userId: { nodeId, userId }
            }
        });
    }

    async find(nodeId: string, userId: string): Promise<TaskShare | null> {
        return prisma.taskShare.findUnique({
            where: {
                nodeId_userId: { nodeId, userId }
            }
        });
    }
}

export const taskShareRepository = new TaskShareRepository();
