-- CreateTable
CREATE TABLE "WarehouseDatabase" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "connectionUri" TEXT NOT NULL,
    "dbDriver" TEXT NOT NULL DEFAULT 'mysql',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "WarehouseDatabase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseDatabaseTable" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "databaseId" VARCHAR(30) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "ddl" TEXT NOT NULL DEFAULT '',
    "prompt" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "WarehouseDatabaseTable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WarehouseDatabase_workspaceId_idx" ON "WarehouseDatabase"("workspaceId");

-- CreateIndex
CREATE INDEX "WarehouseDatabaseTable_workspaceId_idx" ON "WarehouseDatabaseTable"("workspaceId");

-- AddForeignKey
ALTER TABLE "WarehouseDatabase" ADD CONSTRAINT "WarehouseDatabase_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseDatabaseTable" ADD CONSTRAINT "WarehouseDatabaseTable_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseDatabaseTable" ADD CONSTRAINT "WarehouseDatabaseTable_databaseId_fkey" FOREIGN KEY ("databaseId") REFERENCES "WarehouseDatabase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
