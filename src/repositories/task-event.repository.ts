import { prisma } from "../config/db.js";
import { TaskEvent, Prisma, TaskEventType, EventSource } from "@prisma/client";

export class TaskEventRepository {
    async create(data: Prisma.TaskEventUncheckedCreateInput): Promise<TaskEvent> {
        return prisma.taskEvent.create({
            data,
        });
    }

    async findByNodeId(nodeId: string): Promise<TaskEvent[]> {
        return prisma.taskEvent.findMany({
            where: { nodeId },
            orderBy: { createdAt: "desc" },
        });
    }

    async findByUserId(userId: string): Promise<TaskEvent[]> {
        return prisma.taskEvent.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
    }
}

export const taskEventRepository = new TaskEventRepository();
export { TaskEventType, EventSource };
