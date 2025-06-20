-- AlterTable
ALTER TABLE "Survey" ADD COLUMN     "recentSuggestionCategory" TEXT[] DEFAULT ARRAY[]::TEXT[];
