-- AlterTable
ALTER TABLE "FunctionWorker" ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "FunctionWorkerRevision" (
    "id" VARCHAR(30) NOT NULL,
    "workerId" VARCHAR(30) NOT NULL,
    "revision" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FunctionWorkerRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FunctionWorkerRevision_workerId_createdAt_idx" ON "FunctionWorkerRevision"("workerId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FunctionWorkerRevision_workerId_revision_key" ON "FunctionWorkerRevision"("workerId", "revision");

-- AddForeignKey
ALTER TABLE "FunctionWorkerRevision" ADD CONSTRAINT "FunctionWorkerRevision_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "FunctionWorker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
