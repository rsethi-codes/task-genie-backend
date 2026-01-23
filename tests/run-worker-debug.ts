import { taskGenerationWorker } from '../src/workers/task-generation.worker.js';

console.log('👷 Debug Worker starting...');

taskGenerationWorker.on('ready', () => {
    console.log('✅ Worker is READY and listening for jobs.');
});

taskGenerationWorker.on('active', (job) => {
    console.log(`🏃 Job ${job.id} is now ACTIVE`);
});

taskGenerationWorker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} COMPLETED`);
});

taskGenerationWorker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} FAILED:`, err);
});

taskGenerationWorker.on('error', (err) => {
    console.error('❌ Worker encountered an ERROR:', err);
});

// Keep process alive
setInterval(() => { }, 1000);
