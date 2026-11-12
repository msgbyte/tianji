-- CreateTable
CREATE TABLE "ApplicationUser" (
    "applicationId" VARCHAR(30) NOT NULL,
    "userId" VARCHAR(500) NOT NULL,
    "properties" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ApplicationUser_pkey" PRIMARY KEY ("applicationId","userId")
);

-- CreateIndex
CREATE INDEX "ApplicationUser_applicationId_updatedAt_idx" ON "ApplicationUser"("applicationId", "updatedAt");

-- CreateIndex
CREATE INDEX "ApplicationUser_properties_idx" ON "ApplicationUser" USING GIN ("properties" jsonb_path_ops);

-- AddForeignKey
ALTER TABLE "ApplicationUser" ADD CONSTRAINT "ApplicationUser_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
