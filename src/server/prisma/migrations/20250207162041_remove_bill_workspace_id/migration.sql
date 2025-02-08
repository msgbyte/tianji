-- DropForeignKey
ALTER TABLE "WorkspaceBill" DROP CONSTRAINT "WorkspaceBill_workspaceId_fkey";

-- DropIndex
DROP INDEX "WorkspaceBill_workspaceId_key";
