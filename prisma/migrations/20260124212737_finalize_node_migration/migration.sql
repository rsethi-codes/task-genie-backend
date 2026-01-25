/*
  Warnings:

  - You are about to drop the column `taskId` on the `Comment` table. All the data in the column will be lost.
  - The primary key for the `ProjectTask` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `taskId` on the `ProjectTask` table. All the data in the column will be lost.
  - You are about to drop the column `taskId` on the `RefinementSession` table. All the data in the column will be lost.
  - You are about to drop the column `taskId` on the `TaskEvent` table. All the data in the column will be lost.
  - You are about to drop the column `taskId` on the `TaskFeedback` table. All the data in the column will be lost.
  - The primary key for the `TaskShare` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `taskId` on the `TaskShare` table. All the data in the column will be lost.
  - You are about to drop the `Subtask` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubtaskAttempt` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Task` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `nodeId` on table `Comment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nodeId` on table `ProjectTask` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nodeId` on table `RefinementSession` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nodeId` on table `TaskEvent` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nodeId` on table `TaskFeedback` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nodeId` on table `TaskShare` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "taskId",
ALTER COLUMN "nodeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ProjectTask" DROP CONSTRAINT "ProjectTask_pkey",
DROP COLUMN "taskId",
ALTER COLUMN "nodeId" SET NOT NULL,
ADD CONSTRAINT "ProjectTask_pkey" PRIMARY KEY ("projectId", "nodeId");

-- AlterTable
ALTER TABLE "RefinementSession" DROP COLUMN "taskId",
ALTER COLUMN "nodeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "TaskEvent" DROP COLUMN "taskId",
ALTER COLUMN "nodeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "TaskFeedback" DROP COLUMN "taskId",
ALTER COLUMN "nodeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "TaskShare" DROP CONSTRAINT "TaskShare_pkey",
DROP COLUMN "taskId",
ALTER COLUMN "nodeId" SET NOT NULL,
ADD CONSTRAINT "TaskShare_pkey" PRIMARY KEY ("nodeId", "userId");

-- DropTable
DROP TABLE "Subtask";

-- DropTable
DROP TABLE "SubtaskAttempt";

-- DropTable
DROP TABLE "Task";

-- DropEnum
DROP TYPE "SubtaskStatus";

-- DropEnum
DROP TYPE "TaskStatus";
