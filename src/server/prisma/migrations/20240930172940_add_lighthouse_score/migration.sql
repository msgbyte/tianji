-- AlterTable
ALTER TABLE "WebsiteLighthouseReport" ADD COLUMN     "accessibilityScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bestPracticesScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "performanceScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "seoScore" INTEGER NOT NULL DEFAULT 0;
