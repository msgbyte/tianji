-- AlterTable
ALTER TABLE "FeedChannel" ADD COLUMN     "notifyFrequency" TEXT NOT NULL DEFAULT 'day';

-- CreateTable
CREATE TABLE "_FeedChannelToNotification" (
    "A" VARCHAR(30) NOT NULL,
    "B" VARCHAR(30) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_FeedChannelToNotification_AB_unique" ON "_FeedChannelToNotification"("A", "B");

-- CreateIndex
CREATE INDEX "_FeedChannelToNotification_B_index" ON "_FeedChannelToNotification"("B");

-- AddForeignKey
ALTER TABLE "_FeedChannelToNotification" ADD CONSTRAINT "_FeedChannelToNotification_A_fkey" FOREIGN KEY ("A") REFERENCES "FeedChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FeedChannelToNotification" ADD CONSTRAINT "_FeedChannelToNotification_B_fkey" FOREIGN KEY ("B") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
