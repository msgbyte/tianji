-- AlterTable
ALTER TABLE "FunctionWorker"
ADD COLUMN "creatorId" VARCHAR(30),
ADD COLUMN "ownerId" VARCHAR(30);

ALTER TABLE "FunctionWorkerRevision"
ADD COLUMN "operatorId" VARCHAR(30);

-- CreateIndex
CREATE INDEX "FunctionWorker_creatorId_idx" ON "FunctionWorker"("creatorId");
CREATE INDEX "FunctionWorker_ownerId_idx" ON "FunctionWorker"("ownerId");
CREATE INDEX "FunctionWorkerRevision_operatorId_idx" ON "FunctionWorkerRevision"("operatorId");

-- AddForeignKey
ALTER TABLE "FunctionWorker" ADD CONSTRAINT "FunctionWorker_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FunctionWorker" ADD CONSTRAINT "FunctionWorker_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FunctionWorkerRevision" ADD CONSTRAINT "FunctionWorkerRevision_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
