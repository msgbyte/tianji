-- CreateTable
CREATE TABLE "WorkspaceDailyUsage" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "date" DATE NOT NULL,
    "websiteAcceptedCount" INTEGER NOT NULL,
    "websiteEventCount" INTEGER NOT NULL,
    "monitorExecutionCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceDailyUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceDailyUsage_id_key" ON "WorkspaceDailyUsage"("id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceDailyUsage_workspaceId_date_key" ON "WorkspaceDailyUsage"("workspaceId", "date");

-- AddForeignKey
ALTER TABLE "WorkspaceDailyUsage" ADD CONSTRAINT "WorkspaceDailyUsage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
