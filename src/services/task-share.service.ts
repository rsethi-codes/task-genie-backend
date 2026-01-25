import { taskShareRepository } from "../repositories/task-share.repository.js";
import { taskRepository } from "../repositories/task.repository.js";
import { auditLogRepository } from "../repositories/audit-log.repository.js";

export class TaskShareService {
    async shareTask(ownerId: string, nodeId: string, targetUserId: string, permission: string) {
        const node = await taskRepository.findById(nodeId, ownerId);
        if (!node) throw new Error("Node not found or unauthorized");

        const share = await taskShareRepository.create({
            nodeId,
            userId: targetUserId,
            permission,
            sharedBy: ownerId
        });

        await auditLogRepository.create({
            entityType: "task_share",
            entityId: nodeId,
            action: "shared",
            performedBy: ownerId,
            meta: { targetUserId, permission } as any
        });

        return share;
    }

    async updateShare(ownerId: string, nodeId: string, targetUserId: string, permission: string) {
        const node = await taskRepository.findById(nodeId, ownerId);
        if (!node) throw new Error("Node not found or unauthorized");

        const share = await taskShareRepository.update(nodeId, targetUserId, { permission });

        await auditLogRepository.create({
            entityType: "task_share",
            entityId: nodeId,
            action: "share_updated",
            performedBy: ownerId,
            meta: { targetUserId, permission } as any
        });

        return share;
    }

    async revokeShare(ownerId: string, nodeId: string, targetUserId: string) {
        const node = await taskRepository.findById(nodeId, ownerId);
        if (!node) throw new Error("Node not found or unauthorized");

        await taskShareRepository.delete(nodeId, targetUserId);

        await auditLogRepository.create({
            entityType: "task_share",
            entityId: nodeId,
            action: "share_revoked",
            performedBy: ownerId,
            meta: { targetUserId } as any
        });
    }
}

export const taskShareService = new TaskShareService();
