/*
  Warnings:

  - You are about to drop the column `taskId` on the `Comment` table. All the data in the column will be lost.
  - The primary key for the `ProjectTask` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `taskId` on the `ProjectTask` table. All the data in the column will be lost.
  - You are about to drop the column `taskId` on the `QuestionSession` table. All the data in the column will be lost.
  - You are about to drop the column `taskId` on the `RefinementSession` table. All the data in the column will be lost.
  - You are about to drop the column `taskId` on the `Reminder` table. All the data in the column will be lost.
  - You are about to drop the column `taskId` on the `TaskAnalytics` table. All the data in the column will be lost.
  - The primary key for the `TaskDependency` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `taskId` on the `TaskDependency` table. All the data in the column will be lost.
  - You are about to drop the column `taskId` on the `TaskEvent` table. All the data in the column will be lost.
  - You are about to drop the column `taskId` on the `TaskFeedback` table. All the data in the column will be lost.
  - You are about to drop the column `sourceTaskId` on the `TaskPattern` table. All the data in the column will be lost.
  - The primary key for the `TaskShare` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `taskId` on the `TaskShare` table. All the data in the column will be lost.
  - You are about to drop the `Subtask` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubtaskAttempt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Task` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[nodeId]` on the table `RefinementSession` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nodeId,userId]` on the table `TaskFeedback` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sourceNodeId]` on the table `TaskPattern` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nodeId` to the `Comment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nodeId` to the `ProjectTask` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nodeId` to the `RefinementSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nodeId` to the `TaskAnalytics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nodeId` to the `TaskDependency` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nodeId` to the `TaskEvent` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nodeId` to the `TaskFeedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nodeId` to the `TaskShare` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NodeStatus" AS ENUM ('DRAFT', 'ACTIVE', 'BLOCKED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('ROOT', 'PHASE', 'DAILY', 'ACTION', 'GUIDANCE');

-- CreateEnum
CREATE TYPE "TemporalIntent" AS ENUM ('today', 'daily', 'phase', 'anytime');

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_taskId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectTask" DROP CONSTRAINT "ProjectTask_taskId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionSession" DROP CONSTRAINT "QuestionSession_taskId_fkey";

-- DropForeignKey
ALTER TABLE "RefinementSession" DROP CONSTRAINT "RefinementSession_taskId_fkey";

-- DropForeignKey
ALTER TABLE "Reminder" DROP CONSTRAINT "Reminder_taskId_fkey";

-- DropForeignKey
ALTER TABLE "Subtask" DROP CONSTRAINT "Subtask_parentTaskId_fkey";

-- DropForeignKey
ALTER TABLE "SubtaskAttempt" DROP CONSTRAINT "SubtaskAttempt_subtaskId_fkey";

-- DropForeignKey
ALTER TABLE "SubtaskAttempt" DROP CONSTRAINT "SubtaskAttempt_userId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_basedOnPatternId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_userId_fkey";

-- DropForeignKey
ALTER TABLE "TaskAnalytics" DROP CONSTRAINT "TaskAnalytics_taskId_fkey";

-- DropForeignKey
ALTER TABLE "TaskDependency" DROP CONSTRAINT "TaskDependency_dependsOnId_fkey";

-- DropForeignKey
ALTER TABLE "TaskDependency" DROP CONSTRAINT "TaskDependency_taskId_fkey";

-- DropForeignKey
ALTER TABLE "TaskEvent" DROP CONSTRAINT "TaskEvent_taskId_fkey";

-- DropForeignKey
ALTER TABLE "TaskFeedback" DROP CONSTRAINT "TaskFeedback_taskId_fkey";

-- DropForeignKey
ALTER TABLE "TaskPattern" DROP CONSTRAINT "TaskPattern_sourceTaskId_fkey";

-- DropForeignKey
ALTER TABLE "TaskShare" DROP CONSTRAINT "TaskShare_taskId_fkey";

-- DropIndex
DROP INDEX "Comment_taskId_createdAt_idx";

-- DropIndex
DROP INDEX "RefinementSession_taskId_key";

-- DropIndex
DROP INDEX "TaskAnalytics_taskId_recordedAt_idx";

-- DropIndex
DROP INDEX "TaskEvent_taskId_idx";

-- DropIndex
DROP INDEX "TaskFeedback_taskId_userId_key";

-- ALTER TABLE "Comment" DROP COLUMN "taskId",
ALTER TABLE "Comment" ADD COLUMN     "nodeId" UUID;

-- ALTER TABLE "ProjectTask" DROP CONSTRAINT "ProjectTask_pkey",
-- ALTER TABLE "ProjectTask" DROP COLUMN "taskId",
ALTER TABLE "ProjectTask" ADD COLUMN     "nodeId" UUID;
-- ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_pkey" PRIMARY KEY ("projectId", "nodeId");

-- AlterTable
ALTER TABLE "QuestionSession" DROP COLUMN "taskId",
ADD COLUMN     "nodeId" UUID;

-- ALTER TABLE "RefinementSession" DROP COLUMN "taskId",
ALTER TABLE "RefinementSession" ADD COLUMN     "nodeId" UUID;

-- AlterTable
ALTER TABLE "Reminder" DROP COLUMN "taskId",
ADD COLUMN     "nodeId" UUID;

-- AlterTable
ALTER TABLE "TaskAnalytics" DROP COLUMN "taskId",
ADD COLUMN     "nodeId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "TaskDependency" DROP CONSTRAINT "TaskDependency_pkey",
DROP COLUMN "taskId",
ADD COLUMN     "nodeId" UUID NOT NULL,
ADD CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("nodeId", "dependsOnId");

-- ALTER TABLE "TaskEvent" DROP COLUMN "taskId",
ALTER TABLE "TaskEvent" ADD COLUMN     "nodeId" UUID;

-- ALTER TABLE "TaskFeedback" DROP COLUMN "taskId",
ALTER TABLE "TaskFeedback" ADD COLUMN     "nodeId" UUID;

-- AlterTable
ALTER TABLE "TaskPattern" DROP COLUMN "sourceTaskId",
ADD COLUMN     "sourceNodeId" UUID;

-- ALTER TABLE "TaskShare" DROP CONSTRAINT "TaskShare_pkey",
-- ALTER TABLE "TaskShare" DROP COLUMN "taskId",
ALTER TABLE "TaskShare" ADD COLUMN     "nodeId" UUID;
-- ALTER TABLE "TaskShare" ADD CONSTRAINT "TaskShare_pkey" PRIMARY KEY ("nodeId", "userId");

-- DropTable
-- DROP TABLE "Subtask";

-- DropTable
-- DROP TABLE "SubtaskAttempt";

-- DropTable
-- DROP TABLE "Task";

-- DROP TYPE "SubtaskStatus";
-- DROP TYPE "TaskStatus";

-- CreateTable
CREATE TABLE "TaskNode" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "parentId" UUID,
    "rootTaskId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "nodeType" "NodeType" NOT NULL,
    "status" "NodeStatus" DEFAULT 'DRAFT',
    "order" INTEGER NOT NULL,
    "estimatedDuration" INTEGER,
    "energyRequired" "EnergyLevel",
    "recurrenceRule" TEXT,
    "isCompletable" BOOLEAN NOT NULL DEFAULT true,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "aiMetadata" JSONB,
    "progressMeta" JSONB,
    "temporalIntent" "TemporalIntent" NOT NULL DEFAULT 'anytime',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "idempotencyKey" TEXT,
    "aiGenerationStatus" "AIGenerationStatus" NOT NULL DEFAULT 'PENDING',
    "basedOnPatternId" UUID,

    CONSTRAINT "TaskNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_PatternFromNode" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_PatternFromNode_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "TaskNode_userId_nodeType_idx" ON "TaskNode"("userId", "nodeType");

-- CreateIndex
CREATE INDEX "TaskNode_userId_status_idx" ON "TaskNode"("userId", "status");

-- CreateIndex
CREATE INDEX "TaskNode_rootTaskId_order_idx" ON "TaskNode"("rootTaskId", "order");

-- CreateIndex
CREATE INDEX "TaskNode_parentId_order_idx" ON "TaskNode"("parentId", "order");

-- CreateIndex
CREATE INDEX "TaskNode_temporalIntent_idx" ON "TaskNode"("temporalIntent");

-- CreateIndex
CREATE INDEX "TaskNode_deletedAt_idx" ON "TaskNode"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TaskNode_userId_idempotencyKey_key" ON "TaskNode"("userId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "_PatternFromNode_B_index" ON "_PatternFromNode"("B");

-- CreateIndex
CREATE INDEX "Comment_nodeId_createdAt_idx" ON "Comment"("nodeId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "RefinementSession_nodeId_key" ON "RefinementSession"("nodeId");

-- CreateIndex
CREATE INDEX "TaskAnalytics_nodeId_recordedAt_idx" ON "TaskAnalytics"("nodeId", "recordedAt" DESC);

-- CreateIndex
CREATE INDEX "TaskEvent_nodeId_idx" ON "TaskEvent"("nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskFeedback_nodeId_userId_key" ON "TaskFeedback"("nodeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskPattern_sourceNodeId_key" ON "TaskPattern"("sourceNodeId");

-- AddForeignKey
ALTER TABLE "TaskNode" ADD CONSTRAINT "TaskNode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskNode" ADD CONSTRAINT "TaskNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TaskNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskNode" ADD CONSTRAINT "TaskNode_rootTaskId_fkey" FOREIGN KEY ("rootTaskId") REFERENCES "TaskNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAnalytics" ADD CONSTRAINT "TaskAnalytics_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "TaskNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskPattern" ADD CONSTRAINT "TaskPattern_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "TaskNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSession" ADD CONSTRAINT "QuestionSession_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "TaskNode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_docId_fkey" FOREIGN KEY ("docId") REFERENCES "TaskNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "TaskNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "TaskNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskShare" ADD CONSTRAINT "TaskShare_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "TaskNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "TaskNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskEvent" ADD CONSTRAINT "TaskEvent_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "TaskNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "TaskNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "TaskNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFeedback" ADD CONSTRAINT "TaskFeedback_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "TaskNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefinementSession" ADD CONSTRAINT "RefinementSession_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "TaskNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PatternFromNode" ADD CONSTRAINT "_PatternFromNode_A_fkey" FOREIGN KEY ("A") REFERENCES "TaskNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PatternFromNode" ADD CONSTRAINT "_PatternFromNode_B_fkey" FOREIGN KEY ("B") REFERENCES "TaskPattern"("id") ON DELETE CASCADE ON UPDATE CASCADE;
