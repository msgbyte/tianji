-- CreateTable
CREATE TABLE "ApplicationStoreInfoHistory" (
    "id" VARCHAR(30) NOT NULL,
    "applicationId" VARCHAR(30) NOT NULL,
    "storeType" VARCHAR(30) NOT NULL,
    "storeId" VARCHAR(100) NOT NULL,
    "appId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
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

    CONSTRAINT "ApplicationStoreInfoHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationStoreInfoHistory_applicationId_storeType_created_idx" ON "ApplicationStoreInfoHistory"("applicationId", "storeType", "createdAt");

-- AddForeignKey
ALTER TABLE "ApplicationStoreInfoHistory" ADD CONSTRAINT "ApplicationStoreInfoHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
