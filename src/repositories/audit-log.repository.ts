import { prisma } from "../config/db";
import { AuditLog, Prisma } from "@prisma/client";

export class AuditLogRepository {
    async create(data: Prisma.AuditLogUncheckedCreateInput): Promise<AuditLog> {
        return prisma.auditLog.create({
            data,
        });
    }

    async findByUserId(userId: string): Promise<AuditLog[]> {
        return prisma.auditLog.findMany({
            where: { performedBy: userId },
            orderBy: { createdAt: "desc" },
        });
    }

    async findByTaskId(taskId: string): Promise<AuditLog[]> {
        return prisma.auditLog.findMany({
            where: {
                entityType: "task",
                entityId: taskId
            },
            orderBy: { createdAt: "desc" },
        });
    }
}

export const auditLogRepository = new AuditLogRepository();
