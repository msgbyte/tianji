-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_currentWorkspaceId_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "currentWorkspaceId" DROP NOT NULL;
