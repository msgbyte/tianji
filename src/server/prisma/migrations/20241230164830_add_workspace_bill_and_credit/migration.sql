-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "credit" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "WorkspaceBill" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "WorkspaceBill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceBill_workspaceId_key" ON "WorkspaceBill"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceBill_type_idx" ON "WorkspaceBill"("type");

-- AddForeignKey
ALTER TABLE "WorkspaceBill" ADD CONSTRAINT "WorkspaceBill_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
