-- AlterTable
ALTER TABLE "AIGateway" ADD COLUMN     "modelApiKey" TEXT;

-- AlterTable
ALTER TABLE "AIGatewayLogs" ADD COLUMN     "userId" VARCHAR(30);
