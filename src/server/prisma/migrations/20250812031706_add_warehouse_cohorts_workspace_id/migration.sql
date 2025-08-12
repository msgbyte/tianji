/*
  Warnings:

  - Added the required column `workspaceId` to the `WarehouseCohorts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WarehouseCohorts" ADD COLUMN     "workspaceId" VARCHAR(30) NOT NULL,
ALTER COLUMN "filter" SET DEFAULT '[]';

-- CreateIndex
CREATE INDEX "WarehouseCohorts_workspaceId_idx" ON "WarehouseCohorts"("workspaceId");

-- AddForeignKey
ALTER TABLE "WarehouseCohorts" ADD CONSTRAINT "WarehouseCohorts_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
