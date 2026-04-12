-- CreateTable: Webhook event idempotency table
-- Prevents double-processing when payment providers re-deliver events.
-- The UNIQUE constraint on event_key is the atomicity guarantee.

CREATE TABLE "webhook_processed_events" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_processed_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique constraint for idempotency (core guarantee)
CREATE UNIQUE INDEX "webhook_processed_events_eventKey_key" ON "webhook_processed_events"("eventKey");

-- CreateIndex: operational queries
CREATE INDEX "webhook_processed_events_provider_eventType_idx" ON "webhook_processed_events"("provider", "eventType");
CREATE INDEX "webhook_processed_events_processedAt_idx" ON "webhook_processed_events"("processedAt");
