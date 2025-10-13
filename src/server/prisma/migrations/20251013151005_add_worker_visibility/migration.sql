-- CreateEnum
CREATE TYPE "FunctionWorkerVisibility" AS ENUM ('Public', 'Private');

-- AlterTable
ALTER TABLE "FunctionWorker" ADD COLUMN     "visibility" "FunctionWorkerVisibility" NOT NULL DEFAULT 'Public';
