import { taskGenerationQueue } from '../src/config/queue.js';

async function listJobs() {
    const jobs = await taskGenerationQueue.getJobs(['waiting', 'active', 'completed', 'failed', 'delayed']);
    console.log(`Total jobs in queue: ${jobs.length}`);
    for (const job of jobs) {
        console.log(`Job ID: ${job.id}, Status: ${await job.getState()}, Data: ${JSON.stringify(job.data)}`);
    }
    process.exit(0);
}

listJobs();
