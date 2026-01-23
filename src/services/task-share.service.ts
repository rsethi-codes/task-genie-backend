import { taskShareRepository } from "../repositories/task-share.repository";
import { taskRepository } from "../repositories/task.repository";
import { auditLogRepository } from "../repositories/audit-log.repository";

export class TaskShareService {
    async shareTask(ownerId: string, taskId: string, targetUserId: string, permission: string) {
        const task = await taskRepository.findById(taskId, ownerId);
        if (!task) throw new Error("Task not found or unauthorized");

        const share = await taskShareRepository.create({
            taskId,
            userId: targetUserId,
            permission,
            sharedBy: ownerId
        });

        await auditLogRepository.create({
            entityType: "task_share",
            entityId: taskId,
            action: "shared",
            performedBy: ownerId,
            meta: { targetUserId, permission } as any
        });

        return share;
    }

    async updateShare(ownerId: string, taskId: string, targetUserId: string, permission: string) {
        const task = await taskRepository.findById(taskId, ownerId);
        if (!task) throw new Error("Task not found or unauthorized");

        const share = await taskShareRepository.update(taskId, targetUserId, { permission });

        await auditLogRepository.create({
            entityType: "task_share",
            entityId: taskId,
            action: "share_updated",
            performedBy: ownerId,
            meta: { targetUserId, permission } as any
        });

        return share;
    }

    async revokeShare(ownerId: string, taskId: string, targetUserId: string) {
        const task = await taskRepository.findById(taskId, ownerId);
        if (!task) throw new Error("Task not found or unauthorized");

        await taskShareRepository.delete(taskId, targetUserId);

        await auditLogRepository.create({
            entityType: "task_share",
            entityId: taskId,
            action: "share_revoked",
            performedBy: ownerId,
            meta: { targetUserId } as any
        });
    }
}

export const taskShareService = new TaskShareService();
