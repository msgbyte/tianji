ALTER TABLE "WorkspaceAuditLog" DROP CONSTRAINT "WorkspaceAuditLog_workspaceId_fkey";

ALTER TABLE "WorkspaceAuditLog" ALTER COLUMN "workspaceId" DROP NOT NULL;

ALTER TABLE "WorkspaceAuditLog" ADD CONSTRAINT "WorkspaceAuditLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
