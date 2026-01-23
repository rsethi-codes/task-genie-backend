import { prisma } from "../config/db";
import { Subtask, Prisma } from "@prisma/client";

export class SubtaskRepository {
    async create(data: Prisma.SubtaskUncheckedCreateInput): Promise<Subtask> {
        return prisma.$transaction(async (tx) => {
            const subtask = await tx.subtask.create({ data });
            await this.syncParentTaskProgress(subtask.parentTaskId, tx);
            return subtask;
        });
    }

    async findByTaskId(taskId: string): Promise<Subtask[]> {
        return prisma.subtask.findMany({
            where: { parentTaskId: taskId },
            orderBy: { order: "asc" },
        });
    }

    async findById(id: string): Promise<Subtask | null> {
        return prisma.subtask.findUnique({
            where: { id },
            include: { parentTask: true }
        });
    }

    async update(id: string, data: Prisma.SubtaskUncheckedUpdateInput): Promise<Subtask> {
        return prisma.$transaction(async (tx) => {
            const updated = await tx.subtask.update({
                where: { id },
                data,
            });

            // If status changed, we need to re-sync progress
            if (data.status) {
                await this.syncParentTaskProgress(updated.parentTaskId, tx);
            }

            return updated;
        });
    }

    async delete(id: string): Promise<Subtask> {
        return prisma.$transaction(async (tx) => {
            const subtask = await tx.subtask.delete({ where: { id } });
            await this.syncParentTaskProgress(subtask.parentTaskId, tx);
            return subtask;
        });
    }

    /**
     * Centralized logic to keep Task progress in sync with Subtasks
     */
    private async syncParentTaskProgress(taskId: string, tx: Prisma.TransactionClient) {
        const subtasks = await tx.subtask.findMany({
            where: { parentTaskId: taskId }
        });

        const total = subtasks.length;
        const completed = subtasks.filter(s => s.status === 'completed').length;
        const progress = total > 0 ? (completed / total) * 100 : 0;

        await tx.task.update({
            where: { id: taskId },
            data: {
                subtaskCount: total,
                completedSubtasks: completed,
                progressPercent: progress,
                hasSubtasks: total > 0
            }
        });
    }
}

export const subtaskRepository = new SubtaskRepository();
