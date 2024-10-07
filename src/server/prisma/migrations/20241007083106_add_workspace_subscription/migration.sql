-- CreateEnum
CREATE TYPE "WorkspaceSubscriptionTier" AS ENUM ('FREE', 'PRO', 'TEAM', 'UNLIMITED');

-- CreateTable
CREATE TABLE "WorkspaceSubscription" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "tier" "WorkspaceSubscriptionTier" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "WorkspaceSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceSubscription_workspaceId_key" ON "WorkspaceSubscription"("workspaceId");

-- AddForeignKey
ALTER TABLE "WorkspaceSubscription" ADD CONSTRAINT "WorkspaceSubscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Set admin workspace to UNLIMITED
INSERT INTO "WorkspaceSubscription" ("id", "workspaceId", "tier", "createdAt", "updatedAt") VALUES ('cm1yqv4xd002154qnfhzg9i5d', 'clnzoxcy10001vy2ohi4obbi0', 'UNLIMITED', '2024-10-07 08:22:45.169+00', '2024-10-07 08:22:45.169+00');
