import { TaskStatus } from '@prisma/client';
import { taskGenerationQueue } from '../src/config/queue.js';
import { prisma } from '../src/config/db.js';

async function verifyBullMQ() {
    console.log('🧪 Starting BullMQ Verification Test...');

    // 1. Find or Create a test user
    let user = await prisma.user.findFirst();
    if (!user) {
        console.log('Creating test user...');
        user = await prisma.user.create({
            data: {
                clerkId: 'test_clerk_123',
                email: 'test@example.com',
                displayName: 'Test User',
                profile: { create: {} }
            }
        });
    }

    // 2. Create a test task
    console.log('Creating test task...');
    const task = await prisma.task.create({
        data: {
            userId: user.id,
            title: 'Verify BullMQ Connection',
            description: 'This task is created to verify that the worker picks up jobs.',
            status: TaskStatus.DRAFT,
        }
    });

    // 3. Add job to queue
    console.log(`Adding job to queue for task: ${task.id}`);
    const job = await taskGenerationQueue.add('generateSubtasks', {
        userId: user.id,
        taskId: task.id
    });

    console.log(`✅ Job added! Job ID: ${job.id}`);
    console.log('Check backend logs for: "[Worker] Processing task generation..."');

    process.exit(0);
}

verifyBullMQ().catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
});
