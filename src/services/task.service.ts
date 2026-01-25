import { taskRepository } from "../repositories/task.repository.js";
import { taskEventRepository, TaskEventType, EventSource } from "../repositories/task-event.repository.js";
import { CreateTaskInput, UpdateTaskInput } from "../schemas/task.schema.js";
import { TaskNode, NodeStatus, NodeType } from "@prisma/client";
import { taskGenerationQueue } from "../config/queue.js";
import { logger } from "../lib/logger.js";

const ALLOWED_TRANSITIONS: Record<NodeStatus, NodeStatus[]> = {
  [NodeStatus.DRAFT]: [NodeStatus.ACTIVE, NodeStatus.ARCHIVED],
  [NodeStatus.ACTIVE]: [NodeStatus.COMPLETED, NodeStatus.BLOCKED, NodeStatus.ARCHIVED],
  [NodeStatus.BLOCKED]: [NodeStatus.ACTIVE, NodeStatus.ARCHIVED],
  [NodeStatus.COMPLETED]: [NodeStatus.ACTIVE, NodeStatus.ARCHIVED],
  [NodeStatus.ARCHIVED]: [NodeStatus.ACTIVE],
};

export class TaskService {
  async createTask(userId: string, data: CreateTaskInput, correlationId?: string) {
    // Default nodeType to ROOT for user-created tasks if no parentId
    const nodeType = data.parentId ? (data.nodeType || NodeType.ACTION) : NodeType.ROOT;

    const node = await taskRepository.create({
      ...data,
      userId,
      nodeType,
      aiMetadata: data.aiMetadata as any,
    } as any);

    await taskEventRepository.create({
      nodeId: node.id,
      userId,
      eventType: TaskEventType.CREATED,
      source: data.aiMetadata ? EventSource.AI_AGENT : EventSource.UI,
      after: node as any,
      correlationId,
    } as any);

    // If it's a ROOT node, trigger initial expansion/breakdown
    // Allow AI-enriched tasks to still generate subtasks
    if (node.nodeType === NodeType.ROOT && !data.parentId) {
      console.log("[QUEUE] Subtask job added", { taskId: node.id });
      await taskGenerationQueue.add('generateNodes', {
        userId,
        taskId: node.id,
        correlationId
      }, {
        removeOnComplete: true,
      });
    }

    return node;
  }

  async getTasks(userId: string, filters: any) {
    return taskRepository.findMany(userId, filters);
  }

  async getTaskById(taskId: string, userId: string) {
    return taskRepository.findById(taskId, userId);
  }

  async updateTask(nodeId: string, userId: string, data: UpdateTaskInput, correlationId?: string) {
    const before = await taskRepository.findById(nodeId, userId);
    if (!before) throw new Error("Node not found");

    // Enforce State Machine for executable nodes
    if (before.isCompletable && data.status && data.status !== before.status) {
      const allowed = ALLOWED_TRANSITIONS[before.status as NodeStatus] || [];
      if (!allowed.includes(data.status as NodeStatus)) {
        throw new Error(`Invalid state transition: ${before.status} -> ${data.status}`);
      }
    }

    const updated = await taskRepository.update(nodeId, userId, {
      ...data,
      aiMetadata: data.aiMetadata as any,
    } as any);

    // Hierarchical Status Propagation
    // If an ACTION or DAILY task changes status, sync the parent (PHASE or ROOT)
    if (data.status && data.status !== before.status && updated.parentId) {
      await this.propagateStatusUp(updated.parentId, userId);
    }

    // Multi-event logging
    const eventType = data.status && data.status !== before.status
      ? TaskEventType.STATUS_CHANGE
      : TaskEventType.CONTENT_EDIT;

    await taskEventRepository.create({
      nodeId,
      userId,
      eventType,
      source: EventSource.UI,
      before: before as any,
      after: updated as any,
      correlationId,
    } as any);

    return updated;
  }

  /**
   * Recursively updates parent status based on children completion
   */
  private async propagateStatusUp(parentId: string, userId: string) {
    const parent = await taskRepository.findById(parentId, userId);
    if (!parent) return;

    const children = parent.children || [];
    if (children.length === 0) return;

    // A parent is completed if all its completable children are completed
    const allCompleted = children
      .filter((c: TaskNode) => c.nodeType !== 'GUIDANCE')
      .every((c: TaskNode) => c.status === NodeStatus.COMPLETED);

    const newStatus = allCompleted ? NodeStatus.COMPLETED : NodeStatus.ACTIVE;

    if (parent.status !== newStatus) {
      await taskRepository.update(parent.id, userId, { status: newStatus });

      // Keep propagating up
      if (parent.parentId) {
        await this.propagateStatusUp(parent.parentId, userId);
      }
    }
  }

  async deleteTask(nodeId: string, userId: string, correlationId?: string) {
    const before = await taskRepository.findById(nodeId, userId);
    if (!before) throw new Error("Node not found");

    const node = await taskRepository.softDelete(nodeId, userId);

    await taskEventRepository.create({
      nodeId,
      userId,
      eventType: TaskEventType.DELETED,
      source: EventSource.UI,
      before: before as any,
      correlationId,
    } as any);

    return node;
  }

  async restoreTask(nodeId: string, userId: string, correlationId?: string) {
    const node = await taskRepository.restore(nodeId, userId);

    await taskEventRepository.create({
      nodeId,
      userId,
      eventType: TaskEventType.RESTORED,
      source: EventSource.UI,
      after: node as any,
      correlationId,
    } as any);

    return node;
  }

  async computeProgress(nodeId: string, userId: string): Promise<number> {
    const node = await taskRepository.findById(nodeId, userId);
    if (!node || node.nodeType === NodeType.GUIDANCE) return 0;

    if (node.nodeType === NodeType.ACTION) {
      return node.status === NodeStatus.COMPLETED ? 100 : 0;
    }

    const children = await taskRepository.findMany(userId, { parentId: nodeId });
    const completableChildren = children.filter(c => c.isCompletable && c.nodeType !== NodeType.GUIDANCE);

    if (completableChildren.length === 0) return 0;

    const completedWeight = completableChildren.reduce((acc, c) => {
      return acc + (c.status === NodeStatus.COMPLETED ? 1 : 0);
    }, 0);

    return Math.round((completedWeight / completableChildren.length) * 100);
  }
}

export const taskService = new TaskService();
