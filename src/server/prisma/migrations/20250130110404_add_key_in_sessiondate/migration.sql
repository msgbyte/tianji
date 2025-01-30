/*
  Warnings:

  - Added the required column `key` to the `WebsiteSessionData` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WebsiteSessionData" ADD COLUMN     "key" VARCHAR(500) NOT NULL;
