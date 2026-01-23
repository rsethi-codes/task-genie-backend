import { Worker } from 'bullmq';
import { connection } from '../config/queue';
import { intelligenceService } from '../services/intelligence.service';
import { subtaskRepository } from '../repositories/subtask.repository';
import { taskRepository } from '../repositories/task.repository';

interface TaskGenerationJob {
  userId: string;
  taskId: string;
}

const taskGenerationWorker = new Worker<TaskGenerationJob>(
  'task-generation-queue',
  async (job) => {
    const { userId, taskId } = job.data;
    console.log(`[Worker] Processing task generation for Task ID: ${taskId} by User: ${userId}`);

    try {
      const generatedSubtasks = await intelligenceService.generateSubtasks(userId, taskId);

      const totalSubtasks = generatedSubtasks.length;
      await taskRepository.update(taskId, userId, {
        subtaskCount: totalSubtasks,
        hasSubtasks: totalSubtasks > 0,
        progressPercent: 0,
      } as any);

      console.log(`[Worker] Successfully generated ${generatedSubtasks.length} subtasks for Task ID: ${taskId}`);
    } catch (error) {
      console.error(`[Worker] Failed to generate subtasks for Task ID: ${taskId}:`, error);
      throw error; // Re-throw to trigger BullMQ retry
    }
  },
  {
    connection
  }
);

export { taskGenerationWorker };