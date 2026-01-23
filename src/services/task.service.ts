import { taskRepository } from "../repositories/task.repository.js";
import { taskEventRepository, TaskEventType, EventSource } from "../repositories/task-event.repository.js";
import { CreateTaskInput, UpdateTaskInput } from "../schemas/task.schema.js";
import { Task, TaskStatus } from "@prisma/client";
import { taskGenerationQueue } from "../config/queue.js";

const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.DRAFT]: [TaskStatus.ACTIVE, TaskStatus.ARCHIVED],
  [TaskStatus.ACTIVE]: [TaskStatus.COMPLETED, TaskStatus.BLOCKED, TaskStatus.ARCHIVED],
  [TaskStatus.BLOCKED]: [TaskStatus.ACTIVE, TaskStatus.ARCHIVED],
  [TaskStatus.COMPLETED]: [TaskStatus.ACTIVE, TaskStatus.ARCHIVED],
  [TaskStatus.ARCHIVED]: [TaskStatus.ACTIVE],
};

export class TaskService {
  async createTask(userId: string, data: CreateTaskInput, correlationId?: string) {
    const task = await taskRepository.create({
      ...data,
      userId,
      aiMetadata: data.aiMetadata as any,
    });

    await taskEventRepository.create({
      taskId: task.id,
      userId,
      eventType: TaskEventType.CREATED,
      source: data.aiMetadata ? EventSource.AI_AGENT : EventSource.UI,
      after: task as any,
      correlationId,
    });

    // Add job to queue for AI subtask generation
    await taskGenerationQueue.add('generateSubtasks', {
      userId,
      taskId: task.id,
      correlationId
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
    });

    return task;
  }

  async getTasks(userId: string, filters: any) {
    return taskRepository.findMany(userId, filters);
  }

  async getTaskById(taskId: string, userId: string) {
    return taskRepository.findById(taskId, userId);
  }

  async updateTask(taskId: string, userId: string, data: UpdateTaskInput, correlationId?: string) {
    const before = await taskRepository.findById(taskId, userId);
    if (!before) throw new Error("Task not found");

    // Enforce State Machine
    if (data.status && data.status !== before.status) {
      const allowed = ALLOWED_TRANSITIONS[before.status] || [];
      if (!allowed.includes(data.status)) {
        throw new Error(`Invalid state transition: ${before.status} -> ${data.status}`);
      }
    }

    const updated = await taskRepository.update(taskId, userId, {
      ...data,
      aiMetadata: data.aiMetadata as any,
    });

    // Multi-event logging
    const eventType = data.status && data.status !== before.status
      ? TaskEventType.STATUS_CHANGE
      : TaskEventType.CONTENT_EDIT;

    await taskEventRepository.create({
      taskId,
      userId,
      eventType,
      source: EventSource.UI, // Default for manual updates
      before: before as any,
      after: updated as any,
      correlationId,
    });

    return updated;
  }

  async deleteTask(taskId: string, userId: string, correlationId?: string) {
    const before = await taskRepository.findById(taskId, userId);
    if (!before) throw new Error("Task not found");

    const task = await taskRepository.softDelete(taskId, userId);

    await taskEventRepository.create({
      taskId,
      userId,
      eventType: TaskEventType.DELETED,
      source: EventSource.UI,
      before: before as any,
      correlationId,
    });

    return task;
  }

  async restoreTask(taskId: string, userId: string, correlationId?: string) {
    const task = await taskRepository.restore(taskId, userId);

    await taskEventRepository.create({
      taskId,
      userId,
      eventType: TaskEventType.RESTORED,
      source: EventSource.UI,
      after: task as any,
      correlationId,
    });

    return task;
  }
}

export const taskService = new TaskService();
