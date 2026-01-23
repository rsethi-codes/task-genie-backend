/*
  Warnings:

  - You are about to drop the column `promptTemplateId` on the `AIModelConfig` table. All the data in the column will be lost.
  - The `vector` column on the `Embedding` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `meta` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `messages` on the `QuestionSession` table. All the data in the column will be lost.
  - The `status` column on the `QuestionSession` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `followUps` on the `Questionnaire` table. All the data in the column will be lost.
  - The `type` column on the `Questionnaire` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `attempts` on the `Subtask` table. All the data in the column will be lost.
  - You are about to drop the column `context` on the `Subtask` table. All the data in the column will be lost.
  - The `status` column on the `Subtask` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `analytics` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `context` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `progress` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `recurrence` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `meta` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `preferences` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[clerkId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `AIModelConfig` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `AIModelConfig` required. This step will fail if there are existing NULL values in that column.
  - Made the column `provider` on table `AIModelConfig` required. This step will fail if there are existing NULL values in that column.
  - Made the column `modelId` on table `AIModelConfig` required. This step will fail if there are existing NULL values in that column.
  - Made the column `temperature` on table `AIModelConfig` required. This step will fail if there are existing NULL values in that column.
  - Made the column `maxTokens` on table `AIModelConfig` required. This step will fail if there are existing NULL values in that column.
  - Made the column `entityType` on table `AuditLog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `entityId` on table `AuditLog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `action` on table `AuditLog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `performedBy` on table `AuditLog` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ownerId` on table `Embedding` required. This step will fail if there are existing NULL values in that column.
  - Made the column `modelVersion` on table `Embedding` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dimensions` on table `Embedding` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `Questionnaire` table without a default value. This is not possible if the table is not empty.
  - Made the column `category` on table `Questionnaire` required. This step will fail if there are existing NULL values in that column.
  - Made the column `question` on table `Questionnaire` required. This step will fail if there are existing NULL values in that column.
  - Made the column `order` on table `Subtask` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `clerkId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "SubtaskStatus" AS ENUM ('pending', 'in_progress', 'completed', 'skipped', 'blocked', 'failed');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('text', 'single_choice', 'multiple_choice', 'number', 'date', 'time', 'duration', 'scale', 'boolean');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('open', 'completed', 'abandoned', 'interrupted');

-- CreateEnum
CREATE TYPE "AttemptOutcome" AS ENUM ('completed', 'paused', 'abandoned', 'failed', 'interrupted');

-- CreateEnum
CREATE TYPE "EnergyLevel" AS ENUM ('very_low', 'low', 'medium', 'high', 'very_high');

-- CreateEnum
CREATE TYPE "FocusLevel" AS ENUM ('minimal', 'light', 'moderate', 'deep', 'intense');

-- CreateEnum
CREATE TYPE "TimeOfDay" AS ENUM ('early_morning', 'morning', 'afternoon', 'evening', 'night', 'late_night');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE 'DEFERRED';

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_performedBy_fkey";

-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_taskId_fkey";

-- DropForeignKey
ALTER TABLE "Embedding" DROP CONSTRAINT "Embedding_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectMember" DROP CONSTRAINT "ProjectMember_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectTask" DROP CONSTRAINT "ProjectTask_projectId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectTask" DROP CONSTRAINT "ProjectTask_taskId_fkey";

-- DropForeignKey
ALTER TABLE "Reminder" DROP CONSTRAINT "Reminder_taskId_fkey";

-- DropForeignKey
ALTER TABLE "Subtask" DROP CONSTRAINT "Subtask_parentTaskId_fkey";

-- DropForeignKey
ALTER TABLE "TaskShare" DROP CONSTRAINT "TaskShare_taskId_fkey";

-- DropIndex
DROP INDEX "AuditLog_createdAt_idx";

-- DropIndex
DROP INDEX "Project_ownerId_idx";

-- DropIndex
DROP INDEX "QuestionSession_createdAt_idx";

-- DropIndex
DROP INDEX "User_displayName_idx";

-- AlterTable
ALTER TABLE "AIModelConfig" DROP COLUMN "promptTemplateId",
ADD COLUMN     "frequencyPenalty" DOUBLE PRECISION,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isGlobal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "presencePenalty" DOUBLE PRECISION,
ADD COLUMN     "promptTemplate" TEXT,
ADD COLUMN     "purpose" TEXT,
ADD COLUMN     "systemPrompt" TEXT,
ADD COLUMN     "topP" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "provider" SET NOT NULL,
ALTER COLUMN "modelId" SET NOT NULL,
ALTER COLUMN "temperature" SET NOT NULL,
ALTER COLUMN "maxTokens" SET NOT NULL,
ALTER COLUMN "maxTokens" SET DEFAULT 1000;

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "userAgent" TEXT,
ALTER COLUMN "entityType" SET NOT NULL,
ALTER COLUMN "entityId" SET NOT NULL,
ALTER COLUMN "action" SET NOT NULL,
ALTER COLUMN "performedBy" SET NOT NULL;

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEdited" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Embedding" ADD COLUMN     "content" TEXT,
ALTER COLUMN "ownerId" SET NOT NULL,
DROP COLUMN "vector",
ADD COLUMN     "vector" vector(1536),
ALTER COLUMN "modelVersion" SET NOT NULL,
ALTER COLUMN "modelVersion" SET DEFAULT 'text-embedding-ada-002',
ALTER COLUMN "dimensions" SET NOT NULL,
ALTER COLUMN "dimensions" SET DEFAULT 1536;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "meta",
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProjectMember" ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'member';

-- AlterTable
ALTER TABLE "ProjectTask" ADD COLUMN     "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "QuestionSession" DROP COLUMN "messages",
ADD COLUMN     "answeredQuestions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "avgResponseTime" DOUBLE PRECISION,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "decisionConfidence" DOUBLE PRECISION,
ADD COLUMN     "hesitationCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "revisedAnswers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "skippedQuestions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalQuestions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalSessionTime" INTEGER,
DROP COLUMN "status",
ADD COLUMN     "status" "SessionStatus" NOT NULL DEFAULT 'open';

-- AlterTable
ALTER TABLE "Questionnaire" DROP COLUMN "followUps",
ADD COLUMN     "aiImportance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "conditionalOn" UUID,
ADD COLUMN     "conditionalValue" JSONB,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "order" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "category" SET NOT NULL,
ALTER COLUMN "question" SET NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "QuestionType" NOT NULL DEFAULT 'text';

-- AlterTable
ALTER TABLE "Reminder" ADD COLUMN     "failedAt" TIMESTAMP(3),
ADD COLUMN     "message" TEXT,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Subtask" DROP COLUMN "attempts",
DROP COLUMN "context",
ADD COLUMN     "aiConfidence" DOUBLE PRECISION,
ADD COLUMN     "blockedBy" UUID[],
ADD COLUMN     "energyRequired" "EnergyLevel",
ADD COLUMN     "focusRequired" "FocusLevel",
ADD COLUMN     "isBlocking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "locationName" TEXT,
ADD COLUMN     "requiresTools" TEXT[],
DROP COLUMN "status",
ADD COLUMN     "status" "SubtaskStatus" NOT NULL DEFAULT 'pending',
ALTER COLUMN "order" SET NOT NULL,
ALTER COLUMN "notes" DROP NOT NULL,
ALTER COLUMN "notes" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "analytics",
DROP COLUMN "context",
DROP COLUMN "location",
DROP COLUMN "progress",
DROP COLUMN "recurrence",
ADD COLUMN     "basedOnPatternId" UUID,
ADD COLUMN     "completedSubtasks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "energyRequired" "EnergyLevel",
ADD COLUMN     "focusRequired" "FocusLevel",
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "locationName" TEXT,
ADD COLUMN     "locationType" TEXT,
ADD COLUMN     "preferredTimeOfDay" "TimeOfDay"[],
ADD COLUMN     "progressPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "recurrenceEnd" TIMESTAMP(3),
ADD COLUMN     "recurrenceRule" TEXT,
ADD COLUMN     "requiresInternet" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresTools" TEXT[],
ADD COLUMN     "similarityScore" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "TaskShare" ADD COLUMN     "sharedBy" UUID;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "meta",
DROP COLUMN "preferences",
ADD COLUMN     "clerkId" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "defaultPriority" "Priority" NOT NULL DEFAULT 'medium',
    "defaultDuration" INTEGER,
    "workStartTime" TEXT,
    "workEndTime" TEXT,
    "preferredWorkDays" "DayOfWeek"[],
    "breakDuration" INTEGER,
    "customPreferences" JSONB,
    "integrations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehaviorPattern" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "patternType" TEXT NOT NULL,
    "context" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "lastObserved" TIMESTAMP(3) NOT NULL,
    "peakEnergyTime" "TimeOfDay",
    "lowEnergyTime" "TimeOfDay",
    "avgEnergyLevel" DOUBLE PRECISION,
    "peakFocusTime" "TimeOfDay",
    "avgFocusDuration" INTEGER,
    "bestFocusDays" "DayOfWeek"[],
    "avgTasksPerDay" DOUBLE PRECISION,
    "avgCompletionRate" DOUBLE PRECISION,
    "procrastinationTendency" DOUBLE PRECISION,
    "planningToExecution" INTEGER,
    "estimationAccuracy" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BehaviorPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulePreference" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "blockType" TEXT NOT NULL,
    "energyLevel" "EnergyLevel",
    "focusLevel" "FocusLevel",
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchedulePreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAnalytics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "taskId" UUID NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completionRate" DOUBLE PRECISION,
    "onTimeCompletion" BOOLEAN,
    "daysToComplete" INTEGER,
    "daysOverdue" INTEGER,
    "estimatedDuration" INTEGER,
    "actualDuration" INTEGER,
    "estimationAccuracy" DOUBLE PRECISION,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "abandonmentCount" INTEGER NOT NULL DEFAULT 0,
    "pauseCount" INTEGER NOT NULL DEFAULT 0,
    "aiComplexityScore" DOUBLE PRECISION,
    "aiConfidence" DOUBLE PRECISION,
    "userSatisfaction" INTEGER,

    CONSTRAINT "TaskAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskPattern" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "keywords" TEXT[],
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "avgDuration" INTEGER,
    "avgSubtaskCount" INTEGER,
    "successRate" DOUBLE PRECISION,
    "bestTimeOfDay" "TimeOfDay",
    "bestDayOfWeek" "DayOfWeek"[],
    "requiredEnergy" "EnergyLevel",
    "requiredFocus" "FocusLevel",
    "suggestedSubtasks" JSONB[],
    "suggestedSchedule" JSONB,
    "confidence" DOUBLE PRECISION NOT NULL,
    "lastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceTaskId" UUID,

    CONSTRAINT "TaskPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubtaskAttempt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subtaskId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "outcome" "AttemptOutcome" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "pauseDuration" INTEGER,
    "energyLevel" "EnergyLevel",
    "focusLevel" "FocusLevel",
    "location" TEXT,
    "timeOfDay" "TimeOfDay",
    "dayOfWeek" "DayOfWeek",
    "distractionCount" INTEGER NOT NULL DEFAULT 0,
    "toolsSwitched" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubtaskAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionResponse" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "questionId" UUID,
    "questionText" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL,
    "answer" JSONB NOT NULL,
    "answerText" TEXT,
    "confidence" INTEGER,
    "responseTime" INTEGER NOT NULL,
    "hesitated" BOOLEAN NOT NULL DEFAULT false,
    "revised" BOOLEAN NOT NULL DEFAULT false,
    "revisionCount" INTEGER NOT NULL DEFAULT 0,
    "thoughtTime" INTEGER,
    "answeredAt" TIMESTAMP(3) NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "QuestionResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskDependency" (
    "taskId" UUID NOT NULL,
    "dependsOnId" UUID NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("taskId","dependsOnId")
);

-- CreateTable
CREATE TABLE "AIDecision" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL,
    "decisionType" TEXT NOT NULL,
    "reasoning" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "accepted" BOOLEAN,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskFeedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "taskId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "whatWorked" TEXT,
    "whatDidnt" TEXT,
    "wouldChange" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationWebhook" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "service" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "IntegrationWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefinementSession" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "taskId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "originalPlan" JSONB,
    "finalPlan" JSONB,
    "comparisonStats" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RefinementSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefinementMessage" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sessionId" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefinementMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "BehaviorPattern_userId_patternType_idx" ON "BehaviorPattern"("userId", "patternType");

-- CreateIndex
CREATE INDEX "BehaviorPattern_confidence_idx" ON "BehaviorPattern"("confidence" DESC);

-- CreateIndex
CREATE INDEX "SchedulePreference_userId_dayOfWeek_idx" ON "SchedulePreference"("userId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "SchedulePreference_userId_blockType_idx" ON "SchedulePreference"("userId", "blockType");

-- CreateIndex
CREATE INDEX "TaskAnalytics_taskId_recordedAt_idx" ON "TaskAnalytics"("taskId", "recordedAt" DESC);

-- CreateIndex
CREATE INDEX "TaskAnalytics_recordedAt_idx" ON "TaskAnalytics"("recordedAt");

-- CreateIndex
CREATE INDEX "TaskPattern_userId_category_idx" ON "TaskPattern"("userId", "category");

-- CreateIndex
CREATE INDEX "TaskPattern_userId_confidence_idx" ON "TaskPattern"("userId", "confidence" DESC);

-- CreateIndex
CREATE INDEX "SubtaskAttempt_subtaskId_attemptNumber_idx" ON "SubtaskAttempt"("subtaskId", "attemptNumber");

-- CreateIndex
CREATE INDEX "SubtaskAttempt_userId_startedAt_idx" ON "SubtaskAttempt"("userId", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "SubtaskAttempt_outcome_idx" ON "SubtaskAttempt"("outcome");

-- CreateIndex
CREATE INDEX "QuestionResponse_sessionId_order_idx" ON "QuestionResponse"("sessionId", "order");

-- CreateIndex
CREATE INDEX "QuestionResponse_userId_answeredAt_idx" ON "QuestionResponse"("userId", "answeredAt" DESC);

-- CreateIndex
CREATE INDEX "QuestionResponse_hesitated_idx" ON "QuestionResponse"("hesitated");

-- CreateIndex
CREATE UNIQUE INDEX "TaskFeedback_taskId_userId_key" ON "TaskFeedback"("taskId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RefinementSession_taskId_key" ON "RefinementSession"("taskId");

-- CreateIndex
CREATE INDEX "AIModelConfig_isGlobal_isActive_idx" ON "AIModelConfig"("isGlobal", "isActive");

-- CreateIndex
CREATE INDEX "AIModelConfig_ownerId_idx" ON "AIModelConfig"("ownerId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_performedBy_createdAt_idx" ON "AuditLog"("performedBy", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "Embedding_docId_idx" ON "Embedding"("docId");

-- CreateIndex
CREATE INDEX "Project_ownerId_isArchived_idx" ON "Project"("ownerId", "isArchived");

-- CreateIndex
CREATE INDEX "ProjectMember_userId_idx" ON "ProjectMember"("userId");

-- CreateIndex
CREATE INDEX "ProjectTask_projectId_idx" ON "ProjectTask"("projectId");

-- CreateIndex
CREATE INDEX "QuestionSession_userId_createdAt_idx" ON "QuestionSession"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "QuestionSession_status_idx" ON "QuestionSession"("status");

-- CreateIndex
CREATE INDEX "Questionnaire_category_order_idx" ON "Questionnaire"("category", "order");

-- CreateIndex
CREATE INDEX "Questionnaire_isActive_idx" ON "Questionnaire"("isActive");

-- CreateIndex
CREATE INDEX "Reminder_delivered_triggerAt_idx" ON "Reminder"("delivered", "triggerAt");

-- CreateIndex
CREATE INDEX "Subtask_userId_status_idx" ON "Subtask"("userId", "status");

-- CreateIndex
CREATE INDEX "Subtask_scheduledStart_idx" ON "Subtask"("scheduledStart");

-- CreateIndex
CREATE INDEX "Tag_ownerId_usageCount_idx" ON "Tag"("ownerId", "usageCount" DESC);

-- CreateIndex
CREATE INDEX "Task_userId_category_idx" ON "Task"("userId", "category");

-- CreateIndex
CREATE INDEX "Task_isRecurring_idx" ON "Task"("isRecurring");

-- CreateIndex
CREATE INDEX "TaskShare_userId_idx" ON "TaskShare"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehaviorPattern" ADD CONSTRAINT "BehaviorPattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulePreference" ADD CONSTRAINT "SchedulePreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_basedOnPatternId_fkey" FOREIGN KEY ("basedOnPatternId") REFERENCES "TaskPattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAnalytics" ADD CONSTRAINT "TaskAnalytics_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskPattern" ADD CONSTRAINT "TaskPattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskPattern" ADD CONSTRAINT "TaskPattern_sourceTaskId_fkey" FOREIGN KEY ("sourceTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtask" ADD CONSTRAINT "Subtask_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubtaskAttempt" ADD CONSTRAINT "SubtaskAttempt_subtaskId_fkey" FOREIGN KEY ("subtaskId") REFERENCES "Subtask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubtaskAttempt" ADD CONSTRAINT "SubtaskAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSession" ADD CONSTRAINT "QuestionSession_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionResponse" ADD CONSTRAINT "QuestionResponse_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "QuestionSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionResponse" ADD CONSTRAINT "QuestionResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTask" ADD CONSTRAINT "ProjectTask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskShare" ADD CONSTRAINT "TaskShare_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFeedback" ADD CONSTRAINT "TaskFeedback_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFeedback" ADD CONSTRAINT "TaskFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationWebhook" ADD CONSTRAINT "IntegrationWebhook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefinementSession" ADD CONSTRAINT "RefinementSession_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefinementSession" ADD CONSTRAINT "RefinementSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefinementMessage" ADD CONSTRAINT "RefinementMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "RefinementSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
