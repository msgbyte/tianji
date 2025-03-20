-- AlterTable
ALTER TABLE "ApplicationEvent" ADD COLUMN     "screenName" VARCHAR(500),
ADD COLUMN     "screenParams" JSON;

-- CreateIndex
CREATE INDEX "ApplicationEvent_applicationId_createdAt_screenName_idx" ON "ApplicationEvent"("applicationId", "createdAt", "screenName");
