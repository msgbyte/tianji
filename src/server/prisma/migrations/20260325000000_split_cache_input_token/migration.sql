-- AlterTable: Rename cacheInputToken to cacheReadInputToken and add cacheWriteInputToken
ALTER TABLE "AIGatewayLogs" RENAME COLUMN "cacheInputToken" TO "cacheReadInputToken";
ALTER TABLE "AIGatewayLogs" ADD COLUMN "cacheWriteInputToken" INTEGER NOT NULL DEFAULT 0;
