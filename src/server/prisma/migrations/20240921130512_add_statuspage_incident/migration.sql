-- CreateTable
CREATE TABLE "StatusPageIncident" (
    "id" VARCHAR(30) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "payload" JSON NOT NULL,

    CONSTRAINT "StatusPageIncident_pkey" PRIMARY KEY ("id")
);
