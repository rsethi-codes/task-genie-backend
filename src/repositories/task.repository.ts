import { prisma } from "../config/db";
import { Task, Prisma } from "@prisma/client";

export class TaskRepository {
    async create(data: Prisma.TaskUncheckedCreateInput): Promise<Task> {
        if (data.idempotencyKey) {
            return prisma.task.upsert({
                where: {
                    userId_idempotencyKey: {
                        userId: data.userId,
                        idempotencyKey: data.idempotencyKey,
                    },
                },
                update: {}, // No-op if it exists
                create: data,
            });
        }
        return prisma.task.create({
            data,
        });
    }

    async findMany(userId: string, filters: any): Promise<Task[]> {
        const { status, priority, category, tags, search, from, to, includeDeleted } = filters;

        const where: Prisma.TaskWhereInput = {
            userId,
            deletedAt: includeDeleted ? undefined : null,
        };

        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (category) where.category = category;
        if (tags) {
            const tagList = tags.split(",");
            where.tags = { hasEvery: tagList };
        }
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (from || to) {
            where.dueDate = {
                gte: from ? new Date(from) : undefined,
                lte: to ? new Date(to) : undefined,
            };
        }

        return prisma.task.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });
    }

    async findById(id: string, userId: string): Promise<Task | null> {
        return prisma.task.findFirst({
            where: { id, userId },
            include: {
                subtasks: {
                    orderBy: { order: 'asc' }
                },
                projects: true,
                shares: true,
            },
        });
    }

    async update(id: string, userId: string, data: Prisma.TaskUncheckedUpdateInput): Promise<Task> {
        // Only update if it belongs to the user
        const task = await prisma.task.findFirst({ where: { id, userId } });
        if (!task) throw new Error("Task not found or unauthorized");

        return prisma.task.update({
            where: { id },
            data,
        });
    }

    async softDelete(id: string, userId: string): Promise<Task> {
        const task = await prisma.task.findFirst({ where: { id, userId } });
        if (!task) throw new Error("Task not found or unauthorized");

        return prisma.task.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async restore(id: string, userId: string): Promise<Task> {
        const task = await prisma.task.findFirst({ where: { id, userId } });
        if (!task) throw new Error("Task not found or unauthorized");

        return prisma.task.update({
            where: { id },
            data: { deletedAt: null },
        });
    }
}

export const taskRepository = new TaskRepository();
