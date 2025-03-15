-- CreateTable
CREATE TABLE "Application" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationSession" (
    "id" UUID NOT NULL,
    "applicationId" VARCHAR(30) NOT NULL,
    "os" VARCHAR(20),
    "language" VARCHAR(35),
    "ip" VARCHAR(45),
    "country" CHAR(2),
    "subdivision1" VARCHAR(20),
    "subdivision2" VARCHAR(50),
    "city" VARCHAR(50),
    "longitude" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "accuracyRadius" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationEvent" (
    "id" VARCHAR(30) NOT NULL,
    "applicationId" VARCHAR(30) NOT NULL,
    "sessionId" UUID NOT NULL,
    "eventType" INTEGER NOT NULL DEFAULT 1,
    "eventName" VARCHAR(50),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationEventData" (
    "id" VARCHAR(30) NOT NULL,
    "applicationId" VARCHAR(30) NOT NULL,
    "applicationEventId" VARCHAR(30) NOT NULL,
    "eventKey" VARCHAR(500) NOT NULL,
    "stringValue" VARCHAR(500),
    "numberValue" DECIMAL(19,4),
    "dateValue" TIMESTAMPTZ(6),
    "dataType" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationEventData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationSessionData" (
    "id" VARCHAR(30) NOT NULL,
    "applicationId" VARCHAR(30) NOT NULL,
    "sessionId" UUID NOT NULL,
    "key" VARCHAR(500) NOT NULL,
    "stringValue" VARCHAR(500),
    "numberValue" DECIMAL(19,4),
    "dateValue" TIMESTAMPTZ(6),
    "dataType" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationSessionData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationStoreInfo" (
    "applicationId" VARCHAR(30) NOT NULL,
    "storeType" VARCHAR(30) NOT NULL,
    "storeId" VARCHAR(100) NOT NULL,
    "appId" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" VARCHAR(1000) NOT NULL,
    "releaseNotes" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "downloads" INTEGER,
    "score" DOUBLE PRECISION,
    "ratingCount" INTEGER,
    "reviews" INTEGER,
    "version" TEXT,
    "size" DOUBLE PRECISION,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ApplicationStoreInfo_pkey" PRIMARY KEY ("applicationId","storeType")
);

-- CreateIndex
CREATE UNIQUE INDEX "Application_id_key" ON "Application"("id");

-- CreateIndex
CREATE INDEX "Application_workspaceId_idx" ON "Application"("workspaceId");

-- CreateIndex
CREATE INDEX "Application_createdAt_idx" ON "Application"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationSession_id_key" ON "ApplicationSession"("id");

-- CreateIndex
CREATE INDEX "ApplicationSession_createdAt_idx" ON "ApplicationSession"("createdAt");

-- CreateIndex
CREATE INDEX "ApplicationSession_applicationId_idx" ON "ApplicationSession"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationSession_applicationId_createdAt_idx" ON "ApplicationSession"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "ApplicationSession_applicationId_createdAt_os_idx" ON "ApplicationSession"("applicationId", "createdAt", "os");

-- CreateIndex
CREATE INDEX "ApplicationSession_applicationId_createdAt_language_idx" ON "ApplicationSession"("applicationId", "createdAt", "language");

-- CreateIndex
CREATE INDEX "ApplicationSession_applicationId_createdAt_country_idx" ON "ApplicationSession"("applicationId", "createdAt", "country");

-- CreateIndex
CREATE INDEX "ApplicationSession_applicationId_createdAt_subdivision1_idx" ON "ApplicationSession"("applicationId", "createdAt", "subdivision1");

-- CreateIndex
CREATE INDEX "ApplicationSession_applicationId_createdAt_city_idx" ON "ApplicationSession"("applicationId", "createdAt", "city");

-- CreateIndex
CREATE INDEX "ApplicationEvent_createdAt_idx" ON "ApplicationEvent"("createdAt");

-- CreateIndex
CREATE INDEX "ApplicationEvent_sessionId_idx" ON "ApplicationEvent"("sessionId");

-- CreateIndex
CREATE INDEX "ApplicationEvent_applicationId_idx" ON "ApplicationEvent"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationEvent_applicationId_createdAt_idx" ON "ApplicationEvent"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "ApplicationEvent_applicationId_createdAt_eventName_idx" ON "ApplicationEvent"("applicationId", "createdAt", "eventName");

-- CreateIndex
CREATE INDEX "ApplicationEvent_applicationId_sessionId_createdAt_idx" ON "ApplicationEvent"("applicationId", "sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "ApplicationEventData_createdAt_idx" ON "ApplicationEventData"("createdAt");

-- CreateIndex
CREATE INDEX "ApplicationEventData_applicationId_idx" ON "ApplicationEventData"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationEventData_applicationEventId_idx" ON "ApplicationEventData"("applicationEventId");

-- CreateIndex
CREATE INDEX "ApplicationEventData_applicationId_createdAt_idx" ON "ApplicationEventData"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "ApplicationEventData_applicationId_createdAt_eventKey_idx" ON "ApplicationEventData"("applicationId", "createdAt", "eventKey");

-- CreateIndex
CREATE INDEX "ApplicationSessionData_createdAt_idx" ON "ApplicationSessionData"("createdAt");

-- CreateIndex
CREATE INDEX "ApplicationSessionData_applicationId_idx" ON "ApplicationSessionData"("applicationId");

-- CreateIndex
CREATE INDEX "ApplicationSessionData_sessionId_idx" ON "ApplicationSessionData"("sessionId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationSession" ADD CONSTRAINT "ApplicationSession_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEvent" ADD CONSTRAINT "ApplicationEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ApplicationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEventData" ADD CONSTRAINT "ApplicationEventData_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationEventData" ADD CONSTRAINT "ApplicationEventData_applicationEventId_fkey" FOREIGN KEY ("applicationEventId") REFERENCES "ApplicationEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationSessionData" ADD CONSTRAINT "ApplicationSessionData_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationSessionData" ADD CONSTRAINT "ApplicationSessionData_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ApplicationSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationStoreInfo" ADD CONSTRAINT "ApplicationStoreInfo_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
