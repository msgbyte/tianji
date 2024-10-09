-- CreateTable
CREATE TABLE "LemonSqueezySubscription" (
    "subscriptionId" TEXT NOT NULL,
    "workspaceId" VARCHAR(30) NOT NULL,
    "storeId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "cardBrand" TEXT NOT NULL,
    "cardLastFour" TEXT NOT NULL,
    "renewsAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "LemonSqueezySubscription_pkey" PRIMARY KEY ("subscriptionId")
);

-- CreateTable
CREATE TABLE "LemonSqueezyWebhookEvent" (
    "id" VARCHAR(30) NOT NULL,
    "eventName" TEXT NOT NULL,
    "payload" JSON NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LemonSqueezyWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LemonSqueezySubscription_subscriptionId_key" ON "LemonSqueezySubscription"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "LemonSqueezySubscription_workspaceId_key" ON "LemonSqueezySubscription"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "LemonSqueezyWebhookEvent_id_key" ON "LemonSqueezyWebhookEvent"("id");
