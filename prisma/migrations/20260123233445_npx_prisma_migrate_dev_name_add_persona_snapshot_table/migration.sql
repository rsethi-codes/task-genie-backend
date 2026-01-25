/*
  Warnings:

  - The values [low,medium,high,urgent] on the enum `Priority` will be removed. If these variants are still used in the database, this will fail.
  - The values [PENDING,IN_PROGRESS,CANCELLED,ON_HOLD,DEFERRED] on the enum `TaskStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[userId,idempotencyKey]` on the table `Task` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AIGenerationStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "TaskEventType" AS ENUM ('CREATED', 'STATUS_CHANGE', 'CONTENT_EDIT', 'AI_SYNC', 'DELETED', 'RESTORED');

-- CreateEnum
CREATE TYPE "EventSource" AS ENUM ('UI', 'AI_AGENT', 'SYSTEM_JOB', 'EXTERNAL_API');

-- AlterEnum
BEGIN;
CREATE TYPE "Priority_new" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
ALTER TABLE "public"."Task" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "public"."UserProfile" ALTER COLUMN "defaultPriority" DROP DEFAULT;
ALTER TABLE "UserProfile" ALTER COLUMN "defaultPriority" TYPE "Priority_new" USING ("defaultPriority"::text::"Priority_new");
ALTER TABLE "Task" ALTER COLUMN "priority" TYPE "Priority_new" USING ("priority"::text::"Priority_new");
ALTER TYPE "Priority" RENAME TO "Priority_old";
ALTER TYPE "Priority_new" RENAME TO "Priority";
DROP TYPE "public"."Priority_old";
ALTER TABLE "Task" ALTER COLUMN "priority" SET DEFAULT 'MEDIUM';
ALTER TABLE "UserProfile" ALTER COLUMN "defaultPriority" SET DEFAULT 'MEDIUM';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TaskStatus_new" AS ENUM ('DRAFT', 'ACTIVE', 'BLOCKED', 'COMPLETED', 'ARCHIVED');
ALTER TABLE "public"."Task" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Task" ALTER COLUMN "status" TYPE "TaskStatus_new" USING ("status"::text::"TaskStatus_new");
ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";
ALTER TYPE "TaskStatus_new" RENAME TO "TaskStatus";
DROP TYPE "public"."TaskStatus_old";
ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "QuestionSession" ADD COLUMN     "exitReason" TEXT,
ADD COLUMN     "initialPersona" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Subtask" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "promptHash" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "aiGenerationStatus" "AIGenerationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "idempotencyKey" TEXT,
ALTER COLUMN "status" SET DEFAULT 'DRAFT',
ALTER COLUMN "priority" SET DEFAULT 'MEDIUM';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentPersonaVersion" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "UserProfile" ALTER COLUMN "defaultPriority" SET DEFAULT 'MEDIUM';

-- CreateTable
CREATE TABLE "PersonaSnapshot" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "traits" JSONB NOT NULL,
    "confidence" JSONB NOT NULL,
    "meta" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonaSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskEvent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "taskId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "eventType" "TaskEventType" NOT NULL,
    "source" "EventSource" NOT NULL DEFAULT 'UI',
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "correlationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PersonaSnapshot_userId_version_idx" ON "PersonaSnapshot"("userId", "version" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "PersonaSnapshot_userId_version_key" ON "PersonaSnapshot"("userId", "version");

-- CreateIndex
CREATE INDEX "TaskEvent_taskId_idx" ON "TaskEvent"("taskId");

-- CreateIndex
CREATE INDEX "TaskEvent_userId_idx" ON "TaskEvent"("userId");

-- CreateIndex
CREATE INDEX "TaskEvent_createdAt_idx" ON "TaskEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Task_userId_idempotencyKey_key" ON "Task"("userId", "idempotencyKey");

-- AddForeignKey
ALTER TABLE "PersonaSnapshot" ADD CONSTRAINT "PersonaSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskEvent" ADD CONSTRAINT "TaskEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
