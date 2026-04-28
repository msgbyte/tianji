-- AlterTable: Add modelProvider column to AIGatewayLogs
ALTER TABLE "AIGatewayLogs" ADD COLUMN "modelProvider" TEXT NOT NULL DEFAULT '';
