/*
  Warnings:

  - Made the column `currentWorkspaceId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_currentWorkspaceId_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "currentWorkspaceId" SET NOT NULL;

-- CreateTable
CREATE TABLE "MonitorStatusPage" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "slug" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" VARCHAR(1000) NOT NULL DEFAULT '',
    "monitorList" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MonitorStatusPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MonitorStatusPage_slug_key" ON "MonitorStatusPage"("slug");

-- CreateIndex
CREATE INDEX "MonitorStatusPage_slug_idx" ON "MonitorStatusPage"("slug");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_currentWorkspaceId_fkey" FOREIGN KEY ("currentWorkspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitorStatusPage" ADD CONSTRAINT "MonitorStatusPage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
