-- CreateTable
CREATE TABLE "AIGatewayQuotaAlert" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "gatewayId" VARCHAR(30) NOT NULL,
    "dailyQuota" DECIMAL(30,13) NOT NULL DEFAULT 0.0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "notificationId" VARCHAR(30),
    "lastAlertSentAt" TIMESTAMPTZ(6),
    "alertLevel80Sent" BOOLEAN NOT NULL DEFAULT false,
    "alertLevel100Sent" BOOLEAN NOT NULL DEFAULT false,
    "alertLevel150Sent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "AIGatewayQuotaAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIGatewayQuotaAlert_workspaceId_idx" ON "AIGatewayQuotaAlert"("workspaceId");

-- CreateIndex
CREATE INDEX "AIGatewayQuotaAlert_gatewayId_idx" ON "AIGatewayQuotaAlert"("gatewayId");

-- CreateIndex
CREATE INDEX "AIGatewayQuotaAlert_enabled_idx" ON "AIGatewayQuotaAlert"("enabled");

-- CreateIndex
CREATE UNIQUE INDEX "AIGatewayQuotaAlert_workspaceId_gatewayId_key" ON "AIGatewayQuotaAlert"("workspaceId", "gatewayId");

-- AddForeignKey
ALTER TABLE "AIGateway" ADD CONSTRAINT "AIGateway_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGatewayQuotaAlert" ADD CONSTRAINT "AIGatewayQuotaAlert_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGatewayQuotaAlert" ADD CONSTRAINT "AIGatewayQuotaAlert_gatewayId_fkey" FOREIGN KEY ("gatewayId") REFERENCES "AIGateway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIGatewayQuotaAlert" ADD CONSTRAINT "AIGatewayQuotaAlert_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
