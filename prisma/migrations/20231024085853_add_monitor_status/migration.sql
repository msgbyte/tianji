-- CreateTable
CREATE TABLE "MonitorStatus" (
    "monitorId" VARCHAR(30) NOT NULL,
    "statusName" VARCHAR(50) NOT NULL,
    "payload" JSON NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "MonitorStatus_pkey" PRIMARY KEY ("monitorId","statusName")
);

-- AddForeignKey
ALTER TABLE "MonitorStatus" ADD CONSTRAINT "MonitorStatus_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
