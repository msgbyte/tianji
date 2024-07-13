/*
  Warnings:

  - The `notifyFrequency` column on the `FeedChannel` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "FeedChannelNotifyFrequency" AS ENUM ('event', 'day', 'week', 'month');

-- AlterTable
ALTER TABLE "FeedChannel" DROP COLUMN "notifyFrequency",
ADD COLUMN     "notifyFrequency" "FeedChannelNotifyFrequency" NOT NULL DEFAULT 'day';
