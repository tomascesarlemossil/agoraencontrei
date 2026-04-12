-- CreateTable
CREATE TABLE "asaas_webhook_events" (
    "id" TEXT NOT NULL,
    "dedupKey" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "paymentId" TEXT,
    "rentalId" TEXT,
    "status" TEXT,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "result" TEXT,
    "errorMessage" TEXT,

    CONSTRAINT "asaas_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asaas_webhook_events_dedupKey_key" ON "asaas_webhook_events"("dedupKey");

-- CreateIndex
CREATE INDEX "asaas_webhook_events_event_idx" ON "asaas_webhook_events"("event");

-- CreateIndex
CREATE INDEX "asaas_webhook_events_paymentId_idx" ON "asaas_webhook_events"("paymentId");

-- CreateIndex
CREATE INDEX "asaas_webhook_events_rentalId_idx" ON "asaas_webhook_events"("rentalId");

-- CreateIndex
CREATE INDEX "asaas_webhook_events_receivedAt_idx" ON "asaas_webhook_events"("receivedAt");
