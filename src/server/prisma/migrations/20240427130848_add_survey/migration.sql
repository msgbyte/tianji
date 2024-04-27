-- CreateTable
CREATE TABLE "Survey" (
    "id" VARCHAR(30) NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "name" TEXT NOT NULL,
    "payload" JSON NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResult" (
    "id" VARCHAR(30) NOT NULL,
    "surveyId" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" UUID NOT NULL,
    "payload" JSON NOT NULL,
    "browser" VARCHAR(20),
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

    CONSTRAINT "SurveyResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Survey_workspaceId_idx" ON "Survey"("workspaceId");

-- CreateIndex
CREATE INDEX "SurveyResult_surveyId_idx" ON "SurveyResult"("surveyId");

-- CreateIndex
CREATE INDEX "SurveyResult_sessionId_idx" ON "SurveyResult"("sessionId");

-- AddForeignKey
ALTER TABLE "Survey" ADD CONSTRAINT "Survey_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResult" ADD CONSTRAINT "SurveyResult_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
