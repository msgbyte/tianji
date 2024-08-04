-- AlterTable
ALTER TABLE "WorkspaceDailyUsage" ADD COLUMN     "feedEventCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "surveyCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "websiteAcceptedCount" SET DEFAULT 0,
ALTER COLUMN "websiteEventCount" SET DEFAULT 0,
ALTER COLUMN "monitorExecutionCount" SET DEFAULT 0;
