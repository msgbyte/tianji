-- CreateEnum
CREATE TYPE "FunctionWorkerEnvironmentVariableType" AS ENUM ('Text', 'Secret');

-- CreateTable
CREATE TABLE "FunctionWorkerEnvironmentVariable" (
    "id" VARCHAR(30) NOT NULL,
    "workerId" VARCHAR(30) NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "type" "FunctionWorkerEnvironmentVariableType" NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FunctionWorkerEnvironmentVariable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FunctionWorkerEnvironmentVariable_workerId_key_key" ON "FunctionWorkerEnvironmentVariable"("workerId", "key");

-- CreateIndex
CREATE INDEX "FunctionWorkerEnvironmentVariable_workerId_idx" ON "FunctionWorkerEnvironmentVariable"("workerId");

-- AddForeignKey
ALTER TABLE "FunctionWorkerEnvironmentVariable" ADD CONSTRAINT "FunctionWorkerEnvironmentVariable_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "FunctionWorker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
