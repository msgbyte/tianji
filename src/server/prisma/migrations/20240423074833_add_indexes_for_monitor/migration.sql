-- CreateIndex
CREATE INDEX "MonitorData_monitorId_createdAt_idx" ON "MonitorData"("monitorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MonitorData_monitorId_createdAt_value_idx" ON "MonitorData"("monitorId", "createdAt", "value");

-- CreateIndex
CREATE INDEX "MonitorEvent_monitorId_idx" ON "MonitorEvent"("monitorId");
