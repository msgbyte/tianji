-- CreateEnum
CREATE TYPE "ShortLinkType" AS ENUM ('Builtin', 'Manual');

-- AlterTable
ALTER TABLE "ShortLink" ADD COLUMN     "type" "ShortLinkType" NOT NULL DEFAULT 'Manual';
