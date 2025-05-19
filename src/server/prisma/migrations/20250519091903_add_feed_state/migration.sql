-- CreateEnum
CREATE TYPE "FeedStateStatus" AS ENUM ('Ongoing', 'Resolved');

-- CreateTable
CREATE TABLE "FeedState" (
    "id" VARCHAR(30) NOT NULL,
    "channelId" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventContent" TEXT NOT NULL,
    "tags" TEXT[],
    "source" TEXT NOT NULL,
    "senderId" TEXT,
    "senderName" TEXT,
    "url" TEXT,
    "important" BOOLEAN NOT NULL,
    "status" "FeedStateStatus" NOT NULL DEFAULT 'Ongoing',
    "resolvedAt" TIMESTAMP(3),
    "payload" JSON,

    CONSTRAINT "FeedState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeedState_channelId_idx" ON "FeedState"("channelId");

-- CreateIndex
CREATE INDEX "FeedState_status_idx" ON "FeedState"("status");

-- CreateIndex
CREATE UNIQUE INDEX "FeedState_source_eventId_key" ON "FeedState"("source", "eventId");

-- AddForeignKey
ALTER TABLE "FeedState" ADD CONSTRAINT "FeedState_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "FeedChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
