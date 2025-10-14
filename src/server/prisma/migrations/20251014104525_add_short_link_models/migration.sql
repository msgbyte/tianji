-- CreateTable
CREATE TABLE "ShortLink" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "originalUrl" VARCHAR(2000) NOT NULL,
    "title" VARCHAR(200),
    "description" VARCHAR(500),
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "ShortLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShortLinkAccess" (
    "id" VARCHAR(30) NOT NULL,
    "shortLinkId" VARCHAR(30) NOT NULL,
    "ip" VARCHAR(45),
    "country" CHAR(2),
    "subdivision1" VARCHAR(20),
    "subdivision2" VARCHAR(50),
    "city" VARCHAR(50),
    "longitude" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "accuracyRadius" INTEGER,
    "browser" VARCHAR(20),
    "os" VARCHAR(20),
    "device" VARCHAR(20),
    "language" VARCHAR(35),
    "referrer" VARCHAR(500),
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortLinkAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortLink_code_key" ON "ShortLink"("code");

-- CreateIndex
CREATE INDEX "ShortLink_workspaceId_idx" ON "ShortLink"("workspaceId");

-- CreateIndex
CREATE INDEX "ShortLink_code_idx" ON "ShortLink"("code");

-- CreateIndex
CREATE INDEX "ShortLink_enabled_idx" ON "ShortLink"("enabled");

-- CreateIndex
CREATE INDEX "ShortLinkAccess_shortLinkId_idx" ON "ShortLinkAccess"("shortLinkId");

-- CreateIndex
CREATE INDEX "ShortLinkAccess_createdAt_idx" ON "ShortLinkAccess"("createdAt");

-- CreateIndex
CREATE INDEX "ShortLinkAccess_shortLinkId_createdAt_idx" ON "ShortLinkAccess"("shortLinkId", "createdAt");

-- AddForeignKey
ALTER TABLE "ShortLink" ADD CONSTRAINT "ShortLink_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShortLinkAccess" ADD CONSTRAINT "ShortLinkAccess_shortLinkId_fkey" FOREIGN KEY ("shortLinkId") REFERENCES "ShortLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
