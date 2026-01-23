import { subtaskRepository } from "../repositories/subtask.repository";
import { auditLogRepository } from "../repositories/audit-log.repository";
import { taskRepository } from "../repositories/task.repository";
import { intelligenceService } from "./intelligence.service";
import { prisma } from "../config/db";

export class SubtaskService {
    async createSubtask(userId: string, taskId: string, data: any) {
        const task = await taskRepository.findById(taskId, userId);
        if (!task) throw new Error("Task not found or unauthorized");

        const subtask = await subtaskRepository.create({
            ...data,
            parentTaskId: taskId,
            userId,
            order: data.order ?? (task.subtaskCount + 1),
        });

        await auditLogRepository.create({
            entityType: "subtask",
            entityId: subtask.id,
            action: "created",
            performedBy: userId,
            meta: { taskId } as any
        });

        // Track refinement
        await this.trackRefinement(userId, taskId);

        return subtask;
    }

    async getSubtasks(userId: string, taskId: string) {
        const task = await taskRepository.findById(taskId, userId);
        if (!task) throw new Error("Task not found or unauthorized");

        return subtaskRepository.findByTaskId(taskId);
    }

    async updateSubtask(userId: string, subtaskId: string, data: any) {
        const subtask = await subtaskRepository.findById(subtaskId);
        if (!subtask || subtask.userId !== userId) throw new Error("Subtask not found or unauthorized");

        const before = { ...subtask };
        const updated = await subtaskRepository.update(subtaskId, data);

        await auditLogRepository.create({
            entityType: "subtask",
            entityId: subtaskId,
            action: "updated",
            performedBy: userId,
            before: before as any,
            after: updated as any,
        });

        // Track refinement
        await this.trackRefinement(userId, subtask.parentTaskId);

        return updated;
    }

    async deleteSubtask(userId: string, subtaskId: string) {
        const subtask = await subtaskRepository.findById(subtaskId);
        if (!subtask || subtask.userId !== userId) throw new Error("Subtask not found or unauthorized");

        await subtaskRepository.delete(subtaskId);

        await auditLogRepository.create({
            entityType: "subtask",
            entityId: subtaskId,
            action: "deleted",
            performedBy: userId,
            before: subtask as any,
        });

        // Track refinement
        await this.trackRefinement(userId, subtask.parentTaskId);
    }


    // ========================================================================
    // EXECUTION TRACKING (Attempt Management)
    // ========================================================================

    async startSubtask(userId: string, subtaskId: string) {
        // 1. Verify ownership
        const subtask = await subtaskRepository.findById(subtaskId);
        if (!subtask || subtask.userId !== userId) throw new Error("Subtask not found or unauthorized");

        // 2. Create new attempt
        const count = await prisma.subtaskAttempt.count({ where: { subtaskId } });

        const attempt = await prisma.subtaskAttempt.create({
            data: {
                subtaskId,
                userId,
                attemptNumber: count + 1,
                outcome: 'interrupted', // Default until completed/paused properly
                startedAt: new Date(),
            }
        });

        // 3. Update Status
        await subtaskRepository.update(subtaskId, { status: 'in_progress' });

        return attempt;
    }

    async pauseSubtask(userId: string, subtaskId: string, notes?: string) {
        // Find latest active attempt
        const lastAttempt = await prisma.subtaskAttempt.findFirst({
            where: { subtaskId, userId },
            orderBy: { attemptNumber: 'desc' }
        });

        if (lastAttempt && !lastAttempt.endedAt) {
            const now = new Date();
            const duration = Math.round((now.getTime() - lastAttempt.startedAt.getTime()) / 60000); // Minutes

            await prisma.subtaskAttempt.update({
                where: { id: lastAttempt.id },
                data: {
                    endedAt: now,
                    duration: duration > 0 ? duration : 1,
                    outcome: 'paused',
                    notes
                }
            });
        }
    }

    async completeSubtask(userId: string, subtaskId: string, notes?: string) {
        // Pause the current attempt first to close it
        await this.pauseSubtask(userId, subtaskId, notes);

        // Find that just-paused attempt and mark it completed
        const lastAttempt = await prisma.subtaskAttempt.findFirst({
            where: { subtaskId, userId },
            orderBy: { attemptNumber: 'desc' }
        });

        if (lastAttempt) {
            await prisma.subtaskAttempt.update({
                where: { id: lastAttempt.id },
                data: { outcome: 'completed' }
            });
        }

        // Update Subtask Status
        await subtaskRepository.update(subtaskId, {
            status: 'completed',
            completedAt: new Date()
        });
    }

    private async trackRefinement(userId: string, taskId: string) {
        try {
            const allSubtasks = await subtaskRepository.findByTaskId(taskId);
            await intelligenceService.captureRefinementSignal(userId, taskId, allSubtasks);
        } catch (e) {
            console.error("Failed to track refinement", e);
        }
    }
}

export const subtaskService = new SubtaskService();
