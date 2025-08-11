-- CreateTable
CREATE TABLE "WarehouseCohorts" (
    "id" VARCHAR(30) NOT NULL,
    "name" TEXT NOT NULL,
    "warehouseApplicationId" TEXT NOT NULL,
    "filter" JSON NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "WarehouseCohorts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WarehouseCohorts_createdAt_idx" ON "WarehouseCohorts"("createdAt");
