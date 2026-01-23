import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { TaskStatus } from '@prisma/client';

console.log('TaskStatus enum values:', Object.values(TaskStatus));
process.exit(0);
