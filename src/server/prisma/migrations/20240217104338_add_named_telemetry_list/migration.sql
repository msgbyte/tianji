-- AlterTable
ALTER TABLE "TelemetryEvent" ADD COLUMN     "telemetryId" VARCHAR(30);

-- AlterTable
ALTER TABLE "TelemetrySession" ADD COLUMN     "telemetryId" VARCHAR(30);

-- CreateTable
CREATE TABLE "Telemetry" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Telemetry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Telemetry_id_key" ON "Telemetry"("id");

-- CreateIndex
CREATE INDEX "Telemetry_workspaceId_idx" ON "Telemetry"("workspaceId");

-- CreateIndex
CREATE INDEX "Telemetry_createdAt_idx" ON "Telemetry"("createdAt");

-- AddForeignKey
ALTER TABLE "Telemetry" ADD CONSTRAINT "Telemetry_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelemetrySession" ADD CONSTRAINT "TelemetrySession_telemetryId_fkey" FOREIGN KEY ("telemetryId") REFERENCES "Telemetry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelemetryEvent" ADD CONSTRAINT "TelemetryEvent_telemetryId_fkey" FOREIGN KEY ("telemetryId") REFERENCES "Telemetry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
