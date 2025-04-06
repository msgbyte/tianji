-- CreateEnum
CREATE TYPE "AIGatewayLogsStatus" AS ENUM ('Pending', 'Success', 'Failed');

-- CreateTable
CREATE TABLE "AIGateway" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AIGateway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIGatewayLogs" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "gatewayId" VARCHAR(30) NOT NULL,
    "inputToken" INTEGER NOT NULL DEFAULT 0,
    "outputToken" INTEGER NOT NULL DEFAULT 0,
    "stream" BOOLEAN NOT NULL DEFAULT false,
    "modelName" TEXT NOT NULL,
    "status" "AIGatewayLogsStatus" NOT NULL,
    "duration" INTEGER NOT NULL,
    "ttft" INTEGER NOT NULL DEFAULT -1,
    "requestPayload" JSONB NOT NULL DEFAULT '{}',
    "responsePayload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AIGatewayLogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIGatewayLogs_gatewayId_idx" ON "AIGatewayLogs"("gatewayId");

-- CreateIndex
CREATE INDEX "AIGatewayLogs_createdAt_idx" ON "AIGatewayLogs"("createdAt");

-- AddForeignKey
ALTER TABLE "AIGatewayLogs" ADD CONSTRAINT "AIGatewayLogs_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "AIGateway"("id") ON DELETE CASCADE ON UPDATE CASCADE;
