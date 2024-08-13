-- AlterTable
ALTER TABLE "Survey" ADD COLUMN     "feedChannelIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
