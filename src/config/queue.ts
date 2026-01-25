import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { env } from './env';

const connection = new IORedis(env.db.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const taskGenerationQueue = new Queue('task-generation-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000, // 1 second
    },
    removeOnComplete: {
      age: 5 * 60 * 1000, // keep up to 5 minutes
      count: 500,
    },
    removeOnFail: {
      age: 10 * 60 * 1000, // keep up to 10 minutes
      count: 1000,
    },
  },
});

export { connection };
