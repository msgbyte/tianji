-- CreateEnum
CREATE TYPE "WorkspaceAuditLogType" AS ENUM ('Monitor', 'Notification');

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "settings" JSONB NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "WorkspaceAuditLog" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "content" TEXT NOT NULL,
    "relatedId" TEXT,
    "relatedType" "WorkspaceAuditLogType",
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkspaceAuditLog_createdAt_idx" ON "WorkspaceAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "WorkspaceAuditLog" ADD CONSTRAINT "WorkspaceAuditLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
