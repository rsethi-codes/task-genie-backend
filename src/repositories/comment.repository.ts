import { prisma } from "../config/db.js";
import { Comment, Prisma } from "@prisma/client";

export class CommentRepository {
    async create(data: Prisma.CommentUncheckedCreateInput): Promise<Comment> {
        return prisma.comment.create({ data });
    }

    async findByNodeId(nodeId: string): Promise<Comment[]> {
        return prisma.comment.findMany({
            where: { nodeId, isDeleted: false },
            include: { author: true },
            orderBy: { createdAt: "desc" }
        });
    }

    async findById(id: string): Promise<Comment | null> {
        return prisma.comment.findUnique({ where: { id } });
    }

    async softDelete(id: string): Promise<Comment> {
        return prisma.comment.update({
            where: { id },
            data: { isDeleted: true }
        });
    }
}

export const commentRepository = new CommentRepository();
