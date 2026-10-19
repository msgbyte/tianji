-- AlterEnum
ALTER TYPE "WorkspaceAuditLogType" ADD VALUE 'SharedModule';

-- CreateTable
CREATE TABLE "SharedModule" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "ownerId" VARCHAR(30),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "importAlias" VARCHAR(255) NOT NULL,
    "latestRevision" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SharedModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SharedModuleRevision" (
    "id" VARCHAR(30) NOT NULL,
    "moduleId" VARCHAR(30) NOT NULL,
    "operatorId" VARCHAR(30),
    "revision" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "compiledCode" TEXT NOT NULL,
    "declarationCode" TEXT NOT NULL,
    "exportsMetadata" JSONB NOT NULL DEFAULT '[]',
    "compilerVersion" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedModuleRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunctionWorkerModuleBinding" (
    "id" VARCHAR(30) NOT NULL,
    "workerId" VARCHAR(30) NOT NULL,
    "moduleId" VARCHAR(30) NOT NULL,
    "moduleRevisionId" VARCHAR(30) NOT NULL,
    "importAlias" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "FunctionWorkerModuleBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FunctionWorkerRevisionModuleBinding" (
    "id" VARCHAR(30) NOT NULL,
    "workerRevisionId" VARCHAR(30) NOT NULL,
    "moduleId" VARCHAR(30) NOT NULL,
    "moduleRevisionId" VARCHAR(30) NOT NULL,
    "importAlias" VARCHAR(255) NOT NULL,

    CONSTRAINT "FunctionWorkerRevisionModuleBinding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedModule_workspaceId_importAlias_key" ON "SharedModule"("workspaceId", "importAlias");
CREATE INDEX "SharedModule_workspaceId_archivedAt_idx" ON "SharedModule"("workspaceId", "archivedAt");
CREATE INDEX "SharedModule_ownerId_idx" ON "SharedModule"("ownerId");
CREATE UNIQUE INDEX "SharedModuleRevision_moduleId_revision_key" ON "SharedModuleRevision"("moduleId", "revision");
CREATE INDEX "SharedModuleRevision_moduleId_createdAt_idx" ON "SharedModuleRevision"("moduleId", "createdAt");
CREATE INDEX "SharedModuleRevision_operatorId_idx" ON "SharedModuleRevision"("operatorId");
CREATE UNIQUE INDEX "FunctionWorkerModuleBinding_workerId_importAlias_key" ON "FunctionWorkerModuleBinding"("workerId", "importAlias");
CREATE UNIQUE INDEX "FunctionWorkerModuleBinding_workerId_moduleId_key" ON "FunctionWorkerModuleBinding"("workerId", "moduleId");
CREATE INDEX "FunctionWorkerModuleBinding_moduleId_idx" ON "FunctionWorkerModuleBinding"("moduleId");
CREATE INDEX "FunctionWorkerModuleBinding_moduleRevisionId_idx" ON "FunctionWorkerModuleBinding"("moduleRevisionId");
CREATE UNIQUE INDEX "FunctionWorkerRevisionModuleBinding_workerRevisionId_importAlias_key" ON "FunctionWorkerRevisionModuleBinding"("workerRevisionId", "importAlias");
CREATE INDEX "FunctionWorkerRevisionModuleBinding_moduleId_idx" ON "FunctionWorkerRevisionModuleBinding"("moduleId");
CREATE INDEX "FunctionWorkerRevisionModuleBinding_moduleRevisionId_idx" ON "FunctionWorkerRevisionModuleBinding"("moduleRevisionId");

-- AddForeignKey
ALTER TABLE "SharedModule" ADD CONSTRAINT "SharedModule_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SharedModule" ADD CONSTRAINT "SharedModule_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SharedModuleRevision" ADD CONSTRAINT "SharedModuleRevision_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "SharedModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SharedModuleRevision" ADD CONSTRAINT "SharedModuleRevision_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FunctionWorkerModuleBinding" ADD CONSTRAINT "FunctionWorkerModuleBinding_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "FunctionWorker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FunctionWorkerModuleBinding" ADD CONSTRAINT "FunctionWorkerModuleBinding_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "SharedModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FunctionWorkerModuleBinding" ADD CONSTRAINT "FunctionWorkerModuleBinding_moduleRevisionId_fkey" FOREIGN KEY ("moduleRevisionId") REFERENCES "SharedModuleRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FunctionWorkerRevisionModuleBinding" ADD CONSTRAINT "FunctionWorkerRevisionModuleBinding_workerRevisionId_fkey" FOREIGN KEY ("workerRevisionId") REFERENCES "FunctionWorkerRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FunctionWorkerRevisionModuleBinding" ADD CONSTRAINT "FunctionWorkerRevisionModuleBinding_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "SharedModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FunctionWorkerRevisionModuleBinding" ADD CONSTRAINT "FunctionWorkerRevisionModuleBinding_moduleRevisionId_fkey" FOREIGN KEY ("moduleRevisionId") REFERENCES "SharedModuleRevision"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
