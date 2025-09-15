-- CreateTable
CREATE TABLE "WorkspaceConfig" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "value" JSON NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "WorkspaceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkspaceConfig_workspaceId_idx" ON "WorkspaceConfig"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceConfig_workspaceId_key_key" ON "WorkspaceConfig"("workspaceId", "key");

-- AddForeignKey
ALTER TABLE "WorkspaceConfig" ADD CONSTRAINT "WorkspaceConfig_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
