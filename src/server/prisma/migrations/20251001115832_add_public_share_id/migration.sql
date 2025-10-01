/*
  Warnings:

  - A unique constraint covering the columns `[publicShareId]` on the table `FeedChannel` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "FeedChannel" ADD COLUMN     "publicShareId" VARCHAR(30);

-- CreateIndex
CREATE UNIQUE INDEX "FeedChannel_publicShareId_key" ON "FeedChannel"("publicShareId");
