-- AlterTable
ALTER TABLE "TelemetrySession" ADD COLUMN     "accuracyRadius" INTEGER,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "WebsiteSession" ADD COLUMN     "accuracyRadius" INTEGER,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;
