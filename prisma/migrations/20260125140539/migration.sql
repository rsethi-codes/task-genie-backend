/*
  Warnings:

  - The values [COMPLETED] on the enum `AIGenerationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AIGenerationStatus_new" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');
ALTER TABLE "public"."TaskNode" ALTER COLUMN "aiGenerationStatus" DROP DEFAULT;
ALTER TABLE "TaskNode" ALTER COLUMN "aiGenerationStatus" TYPE "AIGenerationStatus_new" USING ("aiGenerationStatus"::text::"AIGenerationStatus_new");
ALTER TYPE "AIGenerationStatus" RENAME TO "AIGenerationStatus_old";
ALTER TYPE "AIGenerationStatus_new" RENAME TO "AIGenerationStatus";
DROP TYPE "public"."AIGenerationStatus_old";
ALTER TABLE "TaskNode" ALTER COLUMN "aiGenerationStatus" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "TaskNode" ADD COLUMN     "actualDuration" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "focusRequired" "FocusLevel",
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastStartedAt" TIMESTAMP(3),
ADD COLUMN     "locationName" TEXT,
ADD COLUMN     "locationType" TEXT,
ADD COLUMN     "preferredTimeOfDay" "TimeOfDay"[],
ADD COLUMN     "priority" "Priority" DEFAULT 'MEDIUM',
ADD COLUMN     "requiresInternet" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresTools" TEXT[],
ADD COLUMN     "startDate" TIMESTAMP(3);
