-- CreateEnum
CREATE TYPE "FunctionWorkerExecutionStatus" AS ENUM ('Pending', 'Success', 'Failed');

-- CreateTable
CREATE TABLE "FunctionWorker" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FunctionWorker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunctionWorkerExecution" (
    "id" VARCHAR(30) NOT NULL,
    "workerId" VARCHAR(30) NOT NULL,
    "status" "FunctionWorkerExecutionStatus" NOT NULL,
    "requestPayload" JSON,
    "responsePayload" JSON,
    "error" TEXT,
    "duration" INTEGER,
    "memoryUsed" INTEGER,
    "cpuTime" INTEGER,
    "logs" JSON DEFAULT '[]',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FunctionWorkerExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FunctionWorker_workspaceId_idx" ON "FunctionWorker"("workspaceId");

-- CreateIndex
CREATE INDEX "FunctionWorkerExecution_workerId_idx" ON "FunctionWorkerExecution"("workerId");

-- AddForeignKey
ALTER TABLE "FunctionWorker" ADD CONSTRAINT "FunctionWorker_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FunctionWorkerExecution" ADD CONSTRAINT "FunctionWorkerExecution_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "FunctionWorker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
