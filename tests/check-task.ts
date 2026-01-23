import { prisma } from '../src/config/db.js';

async function checkTask() {
    const task = await prisma.task.findFirst({
        where: { title: 'Verify BullMQ Connection' },
        include: { subtasks: true }
    });
    console.log(JSON.stringify(task, null, 2));
    process.exit(0);
}

checkTask();
