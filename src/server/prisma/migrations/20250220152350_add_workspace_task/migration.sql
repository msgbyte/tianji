-- CreateEnum
CREATE TYPE "WorkspaceTaskEnum" AS ENUM ('Pending', 'Success', 'Failed');

-- CreateTable
CREATE TABLE "WorkspaceTask" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "type" TEXT NOT NULL,
    "status" "WorkspaceTaskEnum" NOT NULL,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "WorkspaceTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkspaceTask_workspaceId_type_idx" ON "WorkspaceTask"("workspaceId", "type");
