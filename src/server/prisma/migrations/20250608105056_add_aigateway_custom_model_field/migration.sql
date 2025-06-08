-- AlterTable
ALTER TABLE "AIGateway" ADD COLUMN     "customModelBaseUrl" TEXT,
ADD COLUMN     "customModelInputPrice" DECIMAL(65,30),
ADD COLUMN     "customModelName" TEXT,
ADD COLUMN     "customModelOutputPrice" DECIMAL(65,30);
