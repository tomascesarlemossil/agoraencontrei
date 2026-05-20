-- Log central de eventos de domínio
CREATE TABLE "system_events" (
    "id"           TEXT NOT NULL,
    "companyId"    TEXT,
    "eventType"    TEXT NOT NULL,
    "source"       TEXT,
    "entityType"   TEXT,
    "entityId"     TEXT,
    "payload"      JSONB NOT NULL DEFAULT '{}',
    "processed"    BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "system_events_companyId_eventType_idx" ON "system_events"("companyId", "eventType");
CREATE INDEX "system_events_createdAt_idx" ON "system_events"("createdAt");
CREATE INDEX "system_events_processed_idx" ON "system_events"("processed");
