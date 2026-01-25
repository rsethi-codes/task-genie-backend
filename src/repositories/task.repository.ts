import { prisma } from "../config/db.js";
import { TaskNode, Prisma, NodeType, NodeStatus } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export class TaskRepository {
    async create(data: Prisma.TaskNodeUncheckedCreateInput): Promise<TaskNode> {
        const input = data as any;

        // Ensure ID is generated for self-reference
        const id = input.id || uuidv4();
        input.id = id;

        // Ensure order is set
        if (input.order === undefined || input.order === null) {
            const lastNode = await (prisma as any).taskNode.findFirst({
                where: { userId: input.userId, parentId: input.parentId || null, deletedAt: null },
                orderBy: { order: "desc" },
                select: { order: true }
            });
            input.order = lastNode ? lastNode.order + 1 : 0;
        }

        // For ROOT nodes, rootTaskId IS the same as id.
        if (input.nodeType === NodeType.ROOT || input.nodeType === "ROOT") {
            input.rootTaskId = id;
        }

        if (input.idempotencyKey) {
            const node = await (prisma as any).taskNode.upsert({
                where: {
                    userId_idempotencyKey: {
                        userId: input.userId,
                        idempotencyKey: input.idempotencyKey,
                    },
                },
                update: {}, // No-op if it exists
                create: input,
            });

            return node;
        }

        const node = await (prisma as any).taskNode.create({
            data: input,
        });

        return node;
    }

    async findMany(userId: string, filters: any): Promise<TaskNode[]> {
        const { status, type, parentId, rootTaskId, search, includeDeleted } = filters;

        const where: Prisma.TaskNodeWhereInput = {
            userId,
            deletedAt: includeDeleted ? undefined : null,
        };

        if (status) where.status = status as NodeStatus;
        if (type) where.nodeType = type as NodeType;

        // If neither parentId nor rootTaskId is specified, default to top-level tasks ONLY
        if (parentId !== undefined) {
            where.parentId = parentId === "null" ? null : parentId;
        } else if (!rootTaskId) {
            where.parentId = null;
        }

        if (rootTaskId) where.rootTaskId = rootTaskId;

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        return (prisma as any).taskNode.findMany({
            where,
            orderBy: [{ nodeType: 'asc' }, { order: 'asc' }, { createdAt: "desc" }],
            include: {
                children: {
                    where: { deletedAt: null },
                    orderBy: { order: 'asc' }
                }
            }
        });
    }

    async findById(id: string, userId: string): Promise<TaskNode | null> {
        return (prisma as any).taskNode.findFirst({
            where: { id, userId },
            include: {
                children: {
                    where: { deletedAt: null },
                    orderBy: { order: 'asc' },
                    include: {
                        children: {
                            where: { deletedAt: null },
                            orderBy: { order: 'asc' },
                            include: {
                                children: {
                                    where: { deletedAt: null },
                                    orderBy: { order: 'asc' }
                                }
                            }
                        }
                    }
                },
                projects: true,
                shares: true,
                events: {
                    take: 10,
                    orderBy: { createdAt: 'desc' }
                }
            },
        });
    }

    async update(id: string, userId: string, data: Prisma.TaskNodeUncheckedUpdateInput): Promise<TaskNode> {
        // Only update if it belongs to the user
        const node = await (prisma as any).taskNode.findFirst({ where: { id, userId } });
        if (!node) throw new Error("Node not found or unauthorized");

        return (prisma as any).taskNode.update({
            where: { id },
            data: data as any,
        });
    }

    async softDelete(id: string, userId: string): Promise<TaskNode> {
        const node = await (prisma as any).taskNode.findFirst({ where: { id, userId } });
        if (!node) throw new Error("Node not found or unauthorized");

        // Recursively soft delete children? 
        // For now, just mark the node. The UI should filter out children of deleted nodes.
        return (prisma as any).taskNode.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async restore(id: string, userId: string): Promise<TaskNode> {
        const node = await (prisma as any).taskNode.findFirst({ where: { id, userId } });
        if (!node) throw new Error("Node not found or unauthorized");

        return (prisma as any).taskNode.update({
            where: { id },
            data: { deletedAt: null },
        });
    }

    async getRootNodes(userId: string): Promise<TaskNode[]> {
        return (prisma as any).taskNode.findMany({
            where: { userId, parentId: null, deletedAt: null },
            orderBy: { createdAt: 'desc' }
        });
    }

    async reorder(id: string, parentId: string | null, userId: string, newOrder: number): Promise<TaskNode[]> {
        const nodes = await prisma.taskNode.findMany({
            where: { parentId, userId, deletedAt: null },
            orderBy: { order: 'asc' }
        });

        const activeNodes = nodes.filter((n: TaskNode) => n.id !== id);
        const nodeToMove = nodes.find((n: TaskNode) => n.id === id);
        if (nodeToMove) {
            activeNodes.splice(newOrder, 0, nodeToMove);
        }

        const updates = activeNodes.map((node: TaskNode, index: number) => {
            return (prisma as any).taskNode.update({
                where: { id: node.id },
                data: { order: index }
            });
        });

        await prisma.$transaction(updates);
        return activeNodes;
    }
}

export const taskRepository = new TaskRepository();
