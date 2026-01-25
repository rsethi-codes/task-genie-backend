import { commentRepository } from "../repositories/comment.repository.js";
import { taskRepository } from "../repositories/task.repository.js";
import { auditLogRepository } from "../repositories/audit-log.repository.js";

export class CommentService {
    async addComment(userId: string, nodeId: string, content: string, mentions: string[] = []) {
        const node = await taskRepository.findById(nodeId, userId);
        if (!node) throw new Error("Node not found or unauthorized");

        const comment = await commentRepository.create({
            nodeId,
            authorId: userId,
            content,
            mentions,
        });

        await auditLogRepository.create({
            entityType: "comment",
            entityId: comment.id,
            action: "created",
            performedBy: userId,
            meta: { nodeId } as any
        });

        return comment;
    }

    async getComments(userId: string, nodeId: string) {
        const node = await taskRepository.findById(nodeId, userId);
        if (!node) throw new Error("Node not found or unauthorized");

        return commentRepository.findByNodeId(nodeId);
    }

    async deleteComment(userId: string, commentId: string) {
        const comment = await commentRepository.findById(commentId);
        if (!comment || comment.authorId !== userId) throw new Error("Comment not found or unauthorized");

        await commentRepository.softDelete(commentId);

        await auditLogRepository.create({
            entityType: "comment",
            entityId: commentId,
            action: "deleted",
            performedBy: userId,
        });
    }
}

export const commentService = new CommentService();
