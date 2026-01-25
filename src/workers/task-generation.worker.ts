import { Worker } from 'bullmq';
import { connection } from '../config/queue.js';
import { intelligenceService } from '../services/intelligence.service.js';
import { prisma } from '../config/db.js';
import { emitTaskUpdate } from '../config/socket.js';

interface TaskGenerationJob {
  userId: string;
  taskId: string;
}

console.log("[WORKER] Subtask worker started");

const taskGenerationWorker = new Worker<TaskGenerationJob>(
  'task-generation-queue',
  async (job) => {
    const { userId, taskId } = job.data;
    console.log("[WORKER] Processing job", {
      jobId: job.id,
      taskId: taskId
    });

    await (prisma as any).taskNode.update({
      where: { id: taskId, userId },
      data: { aiGenerationStatus: 'PROCESSING' },
    });

    try {
      console.log("[WORKER] Generating subtasks");
      // For now, this triggers ROOT -> PHASE or similar expansion
      const generatedNodes = await intelligenceService.generateNodes(userId, taskId);

      console.log("[WORKER] Subtasks generated", generatedNodes.length);

      // Verify persistence immediately
      const count = await (prisma as any).taskNode.count({
        where: { parentId: taskId, userId }
      });
      console.log("[DB] Subtasks persisted", count);

      await (prisma as any).taskNode.update({
        where: { id: taskId, userId },
        data: { aiGenerationStatus: 'READY' },
      });
      console.log("[TASK] Status updated → READY", taskId);

      // Notify Client via Socket.io
      emitTaskUpdate(taskId, { taskId, status: 'READY' });
      console.log("[EVENT] task:status-updated emitted", taskId);

    } catch (error: any) {
      console.error(`[Worker] Failed to generate nodes for Node ID: ${taskId}:`, error);

      await (prisma as any).taskNode.update({
        where: { id: taskId, userId },
        data: { aiGenerationStatus: 'FAILED' },
      });
      console.log("[TASK] Status updated → FAILED", taskId);

      // Notify Client via Socket.io
      emitTaskUpdate(taskId, { taskId, status: 'FAILED', error: error.message });
      console.log("[EVENT] task:status-updated emitted", taskId);

      throw error;
    }
  },
  {
    connection,
    lockDuration: 60000, // 1 minute lock to prevent overlap on slow AI calls
  }
);

export { taskGenerationWorker };