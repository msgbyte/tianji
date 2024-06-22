-- CreateTable
CREATE TABLE "FeedChannel" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FeedChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedEvent" (
    "id" VARCHAR(30) NOT NULL,
    "channelId" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventContent" TEXT NOT NULL,
    "tags" TEXT[],
    "source" TEXT NOT NULL,
    "senderId" TEXT,
    "senderName" TEXT,
    "important" BOOLEAN NOT NULL,

    CONSTRAINT "FeedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedChannel_workspaceId_idx" ON "FeedChannel"("workspaceId");

-- CreateIndex
CREATE INDEX "FeedEvent_channelId_idx" ON "FeedEvent"("channelId");

-- AddForeignKey
ALTER TABLE "FeedChannel" ADD CONSTRAINT "FeedChannel_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedEvent" ADD CONSTRAINT "FeedEvent_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "FeedChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
