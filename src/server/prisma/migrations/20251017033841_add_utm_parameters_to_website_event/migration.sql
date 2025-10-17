-- AlterTable
ALTER TABLE "WebsiteEvent" ADD COLUMN     "utmCampaign" VARCHAR(100),
ADD COLUMN     "utmContent" VARCHAR(100),
ADD COLUMN     "utmMedium" VARCHAR(100),
ADD COLUMN     "utmSource" VARCHAR(100),
ADD COLUMN     "utmTerm" VARCHAR(100);

-- CreateIndex
CREATE INDEX "WebsiteEvent_websiteId_createdAt_utmSource_idx" ON "WebsiteEvent"("websiteId", "createdAt", "utmSource");

-- CreateIndex
CREATE INDEX "WebsiteEvent_websiteId_createdAt_utmMedium_idx" ON "WebsiteEvent"("websiteId", "createdAt", "utmMedium");

-- CreateIndex
CREATE INDEX "WebsiteEvent_websiteId_createdAt_utmCampaign_idx" ON "WebsiteEvent"("websiteId", "createdAt", "utmCampaign");
