import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { env } from './env';

const connection = new IORedis(env.db.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const taskGenerationQueue = new Queue('task-generation-queue', { connection });

export { connection };
