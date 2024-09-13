-- CreateEnum
CREATE TYPE "WebsiteLighthouseReportStatus" AS ENUM ('Pending', 'Success', 'Failed');

-- CreateTable
CREATE TABLE "WebsiteLighthouseReport" (
    "id" VARCHAR(30) NOT NULL,
    "websiteId" VARCHAR(30),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "url" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "status" "WebsiteLighthouseReportStatus" NOT NULL DEFAULT 'Pending',

    CONSTRAINT "WebsiteLighthouseReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WebsiteLighthouseReport_createdAt_idx" ON "WebsiteLighthouseReport"("createdAt");

-- CreateIndex
CREATE INDEX "WebsiteLighthouseReport_websiteId_idx" ON "WebsiteLighthouseReport"("websiteId");
