import { commentRepository } from "../repositories/comment.repository";
import { taskRepository } from "../repositories/task.repository";
import { auditLogRepository } from "../repositories/audit-log.repository";

export class CommentService {
    async addComment(userId: string, taskId: string, content: string, mentions: string[] = []) {
        const task = await taskRepository.findById(taskId, userId);
        if (!task) throw new Error("Task not found or unauthorized");

        const comment = await commentRepository.create({
            taskId,
            authorId: userId,
            content,
            mentions,
        });

        await auditLogRepository.create({
            entityType: "comment",
            entityId: comment.id,
            action: "created",
            performedBy: userId,
            meta: { taskId } as any
        });

        return comment;
    }

    async getComments(userId: string, taskId: string) {
        const task = await taskRepository.findById(taskId, userId);
        if (!task) throw new Error("Task not found or unauthorized");

        return commentRepository.findByTaskId(taskId);
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
