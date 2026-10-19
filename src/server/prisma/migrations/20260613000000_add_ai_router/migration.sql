CREATE TYPE "AIRouterLogsStatus" AS ENUM ('Success', 'Failed', 'Partial');

CREATE TABLE "AIRouter" (
  "id" VARCHAR(30) NOT NULL,
  "workspaceId" VARCHAR(30) NOT NULL,
  "name" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "AIRouter_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIRouterTier" (
  "id" VARCHAR(30) NOT NULL,
  "workspaceId" VARCHAR(30) NOT NULL,
  "routerId" VARCHAR(30) NOT NULL,
  "order" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "AIRouterTier_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIRouterNode" (
  "id" VARCHAR(30) NOT NULL,
  "workspaceId" VARCHAR(30) NOT NULL,
  "routerId" VARCHAR(30) NOT NULL,
  "tierId" VARCHAR(30) NOT NULL,
  "gatewayId" VARCHAR(30) NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'openai',
  "order" INTEGER NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "weight" INTEGER NOT NULL DEFAULT 100,
  "modelOverride" TEXT,
  "timeoutMs" INTEGER NOT NULL DEFAULT 30000,
  "retryableStatusCodes" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "AIRouterNode_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIRouterLogs" (
  "id" VARCHAR(30) NOT NULL,
  "workspaceId" VARCHAR(30) NOT NULL,
  "routerId" VARCHAR(30) NOT NULL,
  "protocol" TEXT NOT NULL,
  "status" "AIRouterLogsStatus" NOT NULL,
  "finalGatewayId" VARCHAR(30),
  "finalGatewayLogId" VARCHAR(30),
  "attemptGatewayIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "attemptGatewayLogIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "attemptErrors" JSONB,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "duration" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AIRouterLogs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AIRouter_workspaceId_idx" ON "AIRouter"("workspaceId");
CREATE INDEX "AIRouter_enabled_idx" ON "AIRouter"("enabled");
CREATE UNIQUE INDEX "AIRouter_workspaceId_id_key" ON "AIRouter"("workspaceId", "id");
CREATE INDEX "AIRouterTier_workspaceId_idx" ON "AIRouterTier"("workspaceId");
CREATE INDEX "AIRouterTier_routerId_idx" ON "AIRouterTier"("routerId");
CREATE UNIQUE INDEX "AIRouterTier_workspaceId_id_key" ON "AIRouterTier"("workspaceId", "id");
CREATE UNIQUE INDEX "AIRouterTier_workspaceId_routerId_id_key" ON "AIRouterTier"("workspaceId", "routerId", "id");
CREATE UNIQUE INDEX "AIRouterTier_routerId_order_key" ON "AIRouterTier"("routerId", "order");
CREATE UNIQUE INDEX "AIRouterNode_routerId_tierId_order_key" ON "AIRouterNode"("routerId", "tierId", "order");
CREATE INDEX "AIRouterNode_workspaceId_idx" ON "AIRouterNode"("workspaceId");
CREATE INDEX "AIRouterNode_routerId_idx" ON "AIRouterNode"("routerId");
CREATE INDEX "AIRouterNode_tierId_idx" ON "AIRouterNode"("tierId");
CREATE INDEX "AIRouterNode_gatewayId_idx" ON "AIRouterNode"("gatewayId");
CREATE INDEX "AIRouterNode_enabled_idx" ON "AIRouterNode"("enabled");
CREATE INDEX "AIRouterLogs_workspaceId_idx" ON "AIRouterLogs"("workspaceId");
CREATE INDEX "AIRouterLogs_routerId_idx" ON "AIRouterLogs"("routerId");
CREATE INDEX "AIRouterLogs_protocol_idx" ON "AIRouterLogs"("protocol");
CREATE INDEX "AIRouterLogs_status_idx" ON "AIRouterLogs"("status");
CREATE INDEX "AIRouterLogs_createdAt_idx" ON "AIRouterLogs"("createdAt");
CREATE INDEX "AIRouterLogs_workspaceId_createdAt_idx" ON "AIRouterLogs"("workspaceId", "createdAt");
CREATE INDEX "AIRouterLogs_routerId_createdAt_idx" ON "AIRouterLogs"("routerId", "createdAt");

ALTER TABLE "AIRouter" ADD CONSTRAINT "AIRouter_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AIRouterNode" ADD CONSTRAINT "AIRouterNode_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AIRouterNode" ADD CONSTRAINT "AIRouterNode_workspaceId_routerId_fkey"
  FOREIGN KEY ("workspaceId", "routerId") REFERENCES "AIRouter"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AIRouterTier" ADD CONSTRAINT "AIRouterTier_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AIRouterTier" ADD CONSTRAINT "AIRouterTier_workspaceId_routerId_fkey"
  FOREIGN KEY ("workspaceId", "routerId") REFERENCES "AIRouter"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AIRouterNode" ADD CONSTRAINT "AIRouterNode_workspaceId_routerId_tierId_fkey"
  FOREIGN KEY ("workspaceId", "routerId", "tierId") REFERENCES "AIRouterTier"("workspaceId", "routerId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AIRouterNode" ADD CONSTRAINT "AIRouterNode_gatewayId_fkey"
  FOREIGN KEY ("gatewayId") REFERENCES "AIGateway"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

ALTER TABLE "AIRouterLogs" ADD CONSTRAINT "AIRouterLogs_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AIRouterLogs" ADD CONSTRAINT "AIRouterLogs_workspaceId_routerId_fkey"
  FOREIGN KEY ("workspaceId", "routerId") REFERENCES "AIRouter"("workspaceId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
