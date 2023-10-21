-- CreateTable
CREATE TABLE "User" (
    "id" VARCHAR(30) NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "password" VARCHAR(60) NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),
    "currentWorkspaceId" VARCHAR(30),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "dashboardOrder" TEXT[],
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspacesOnUsers" (
    "userId" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "role" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "WorkspacesOnUsers_pkey" PRIMARY KEY ("userId","workspaceId")
);

-- CreateTable
CREATE TABLE "Website" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "domain" VARCHAR(500),
    "shareId" VARCHAR(50),
    "resetAt" TIMESTAMPTZ(6),
    "monitorId" VARCHAR(30),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Website_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteSession" (
    "id" UUID NOT NULL,
    "websiteId" VARCHAR(30) NOT NULL,
    "hostname" VARCHAR(100),
    "browser" VARCHAR(20),
    "os" VARCHAR(20),
    "device" VARCHAR(20),
    "screen" VARCHAR(11),
    "language" VARCHAR(35),
    "ip" VARCHAR(45),
    "country" CHAR(2),
    "subdivision1" VARCHAR(20),
    "subdivision2" VARCHAR(50),
    "city" VARCHAR(50),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteEvent" (
    "id" VARCHAR(30) NOT NULL,
    "websiteId" VARCHAR(30) NOT NULL,
    "sessionId" UUID NOT NULL,
    "urlPath" VARCHAR(500) NOT NULL,
    "urlQuery" VARCHAR(500),
    "referrerPath" VARCHAR(500),
    "referrerQuery" VARCHAR(500),
    "referrerDomain" VARCHAR(500),
    "pageTitle" VARCHAR(500),
    "eventType" INTEGER NOT NULL DEFAULT 1,
    "eventName" VARCHAR(50),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteEventData" (
    "id" VARCHAR(30) NOT NULL,
    "websiteId" VARCHAR(30) NOT NULL,
    "websiteEventId" VARCHAR(30) NOT NULL,
    "eventKey" VARCHAR(500) NOT NULL,
    "stringValue" VARCHAR(500),
    "numberValue" DECIMAL(19,4),
    "dateValue" TIMESTAMPTZ(6),
    "dataType" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteEventData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteSessionData" (
    "id" VARCHAR(30) NOT NULL,
    "websiteId" VARCHAR(30) NOT NULL,
    "sessionId" UUID NOT NULL,
    "stringValue" VARCHAR(500),
    "numberValue" DECIMAL(19,4),
    "dateValue" TIMESTAMPTZ(6),
    "dataType" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebsiteSessionData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelemetrySession" (
    "id" UUID NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "hostname" VARCHAR(100),
    "browser" VARCHAR(20),
    "os" VARCHAR(20),
    "country" CHAR(2),
    "subdivision1" VARCHAR(20),
    "subdivision2" VARCHAR(50),
    "city" VARCHAR(50),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelemetrySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelemetryEvent" (
    "id" VARCHAR(30) NOT NULL,
    "sessionId" UUID NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "eventName" VARCHAR(100),
    "urlOrigin" VARCHAR(500) NOT NULL,
    "urlPath" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelemetryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "payload" JSON NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Monitor" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "interval" INTEGER NOT NULL DEFAULT 20,
    "payload" JSON NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Monitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitorEvent" (
    "id" VARCHAR(30) NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "monitorId" VARCHAR(30) NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonitorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitorData" (
    "id" VARCHAR(30) NOT NULL,
    "monitorId" VARCHAR(30) NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonitorData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MonitorToNotification" (
    "A" VARCHAR(30) NOT NULL,
    "B" VARCHAR(30) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_id_key" ON "Workspace"("id");

-- CreateIndex
CREATE INDEX "WorkspacesOnUsers_userId_idx" ON "WorkspacesOnUsers"("userId");

-- CreateIndex
CREATE INDEX "WorkspacesOnUsers_workspaceId_idx" ON "WorkspacesOnUsers"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Website_id_key" ON "Website"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Website_shareId_key" ON "Website"("shareId");

-- CreateIndex
CREATE INDEX "Website_workspaceId_idx" ON "Website"("workspaceId");

-- CreateIndex
CREATE INDEX "Website_createdAt_idx" ON "Website"("createdAt");

-- CreateIndex
CREATE INDEX "Website_shareId_idx" ON "Website"("shareId");

-- CreateIndex
CREATE UNIQUE INDEX "WebsiteSession_id_key" ON "WebsiteSession"("id");

-- CreateIndex
CREATE INDEX "WebsiteSession_createdAt_idx" ON "WebsiteSession"("createdAt");

-- CreateIndex
CREATE INDEX "WebsiteSession_websiteId_idx" ON "WebsiteSession"("websiteId");

-- CreateIndex
CREATE INDEX "WebsiteSession_websiteId_createdAt_idx" ON "WebsiteSession"("websiteId", "createdAt");

-- CreateIndex
CREATE INDEX "WebsiteSession_websiteId_createdAt_hostname_idx" ON "WebsiteSession"("websiteId", "createdAt", "hostname");

-- CreateIndex
CREATE INDEX "WebsiteSession_websiteId_createdAt_browser_idx" ON "WebsiteSession"("websiteId", "createdAt", "browser");

-- CreateIndex
CREATE INDEX "WebsiteSession_websiteId_createdAt_os_idx" ON "WebsiteSession"("websiteId", "createdAt", "os");

-- CreateIndex
CREATE INDEX "WebsiteSession_websiteId_createdAt_device_idx" ON "WebsiteSession"("websiteId", "createdAt", "device");

-- CreateIndex
CREATE INDEX "WebsiteSession_websiteId_createdAt_screen_idx" ON "WebsiteSession"("websiteId", "createdAt", "screen");

-- CreateIndex
CREATE INDEX "WebsiteSession_websiteId_createdAt_language_idx" ON "WebsiteSession"("websiteId", "createdAt", "language");

-- CreateIndex
CREATE INDEX "WebsiteSession_websiteId_createdAt_country_idx" ON "WebsiteSession"("websiteId", "createdAt", "country");

-- CreateIndex
CREATE INDEX "WebsiteSession_websiteId_createdAt_subdivision1_idx" ON "WebsiteSession"("websiteId", "createdAt", "subdivision1");

-- CreateIndex
CREATE INDEX "WebsiteSession_websiteId_createdAt_city_idx" ON "WebsiteSession"("websiteId", "createdAt", "city");

-- CreateIndex
CREATE INDEX "WebsiteEvent_createdAt_idx" ON "WebsiteEvent"("createdAt");

-- CreateIndex
CREATE INDEX "WebsiteEvent_sessionId_idx" ON "WebsiteEvent"("sessionId");

-- CreateIndex
CREATE INDEX "WebsiteEvent_websiteId_idx" ON "WebsiteEvent"("websiteId");

-- CreateIndex
CREATE INDEX "WebsiteEvent_websiteId_createdAt_idx" ON "WebsiteEvent"("websiteId", "createdAt");

-- CreateIndex
CREATE INDEX "WebsiteEvent_websiteId_createdAt_urlPath_idx" ON "WebsiteEvent"("websiteId", "createdAt", "urlPath");

-- CreateIndex
CREATE INDEX "WebsiteEvent_websiteId_createdAt_urlQuery_idx" ON "WebsiteEvent"("websiteId", "createdAt", "urlQuery");

-- CreateIndex
CREATE INDEX "WebsiteEvent_websiteId_createdAt_referrerDomain_idx" ON "WebsiteEvent"("websiteId", "createdAt", "referrerDomain");

-- CreateIndex
CREATE INDEX "WebsiteEvent_websiteId_createdAt_pageTitle_idx" ON "WebsiteEvent"("websiteId", "createdAt", "pageTitle");

-- CreateIndex
CREATE INDEX "WebsiteEvent_websiteId_createdAt_eventName_idx" ON "WebsiteEvent"("websiteId", "createdAt", "eventName");

-- CreateIndex
CREATE INDEX "WebsiteEvent_websiteId_sessionId_createdAt_idx" ON "WebsiteEvent"("websiteId", "sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "WebsiteEventData_createdAt_idx" ON "WebsiteEventData"("createdAt");

-- CreateIndex
CREATE INDEX "WebsiteEventData_websiteId_idx" ON "WebsiteEventData"("websiteId");

-- CreateIndex
CREATE INDEX "WebsiteEventData_websiteEventId_idx" ON "WebsiteEventData"("websiteEventId");

-- CreateIndex
CREATE INDEX "WebsiteEventData_websiteId_createdAt_idx" ON "WebsiteEventData"("websiteId", "createdAt");

-- CreateIndex
CREATE INDEX "WebsiteEventData_websiteId_createdAt_eventKey_idx" ON "WebsiteEventData"("websiteId", "createdAt", "eventKey");

-- CreateIndex
CREATE INDEX "WebsiteSessionData_createdAt_idx" ON "WebsiteSessionData"("createdAt");

-- CreateIndex
CREATE INDEX "WebsiteSessionData_websiteId_idx" ON "WebsiteSessionData"("websiteId");

-- CreateIndex
CREATE INDEX "WebsiteSessionData_sessionId_idx" ON "WebsiteSessionData"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "TelemetrySession_id_key" ON "TelemetrySession"("id");

-- CreateIndex
CREATE INDEX "TelemetrySession_createdAt_idx" ON "TelemetrySession"("createdAt");

-- CreateIndex
CREATE INDEX "TelemetrySession_workspaceId_createdAt_idx" ON "TelemetrySession"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "TelemetryEvent_createdAt_idx" ON "TelemetryEvent"("createdAt");

-- CreateIndex
CREATE INDEX "TelemetryEvent_sessionId_idx" ON "TelemetryEvent"("sessionId");

-- CreateIndex
CREATE INDEX "TelemetryEvent_workspaceId_idx" ON "TelemetryEvent"("workspaceId");

-- CreateIndex
CREATE INDEX "TelemetryEvent_workspaceId_createdAt_idx" ON "TelemetryEvent"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_workspaceId_idx" ON "Notification"("workspaceId");

-- CreateIndex
CREATE INDEX "Monitor_workspaceId_idx" ON "Monitor"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "_MonitorToNotification_AB_unique" ON "_MonitorToNotification"("A", "B");

-- CreateIndex
CREATE INDEX "_MonitorToNotification_B_index" ON "_MonitorToNotification"("B");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_currentWorkspaceId_fkey" FOREIGN KEY ("currentWorkspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspacesOnUsers" ADD CONSTRAINT "WorkspacesOnUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspacesOnUsers" ADD CONSTRAINT "WorkspacesOnUsers_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Website" ADD CONSTRAINT "Website_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Website" ADD CONSTRAINT "Website_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteSession" ADD CONSTRAINT "WebsiteSession_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteEvent" ADD CONSTRAINT "WebsiteEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WebsiteSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteEventData" ADD CONSTRAINT "WebsiteEventData_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteEventData" ADD CONSTRAINT "WebsiteEventData_websiteEventId_fkey" FOREIGN KEY ("websiteEventId") REFERENCES "WebsiteEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteSessionData" ADD CONSTRAINT "WebsiteSessionData_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteSessionData" ADD CONSTRAINT "WebsiteSessionData_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WebsiteSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelemetryEvent" ADD CONSTRAINT "TelemetryEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TelemetrySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monitor" ADD CONSTRAINT "Monitor_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitorEvent" ADD CONSTRAINT "MonitorEvent_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitorData" ADD CONSTRAINT "MonitorData_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MonitorToNotification" ADD CONSTRAINT "_MonitorToNotification_A_fkey" FOREIGN KEY ("A") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MonitorToNotification" ADD CONSTRAINT "_MonitorToNotification_B_fkey" FOREIGN KEY ("B") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddSystemUser
INSERT INTO "Workspace" (id, name, "dashboardOrder", "createdAt", "updatedAt") VALUES ('clnzoxcy10001vy2ohi4obbi0', 'admin', null, '2023-10-21 07:00:23.113000 +00:00', '2023-10-21 07:00:23.113000 +00:00');
INSERT INTO "User" (id, username, password, role, "createdAt", "updatedAt", "deletedAt", "currentWorkspaceId") VALUES ('clnzoxcy00000vy2ork8praw0', 'admin', '$2a$10$V384zbubCaykNgBHs5mag.AngiWhAgRR.KLoxal7xh8sfOBwnASN2', 'admin', '2023-10-21 07:00:23.113000 +00:00', '2023-10-21 07:00:23.267000 +00:00', null, 'clnzoxcy10001vy2ohi4obbi0');
INSERT INTO "WorkspacesOnUsers" ("userId", "workspaceId", role, "createdAt", "updatedAt") VALUES ('clnzoxcy00000vy2ork8praw0', 'clnzoxcy10001vy2ohi4obbi0', 'owner', '2023-10-21 07:00:23.113000 +00:00', '2023-10-21 07:00:23.113000 +00:00');
