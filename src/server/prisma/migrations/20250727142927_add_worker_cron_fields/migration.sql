-- AlterTable
ALTER TABLE "FunctionWorker" ADD COLUMN     "cronExpression" TEXT,
ADD COLUMN     "enableCron" BOOLEAN NOT NULL DEFAULT false;
