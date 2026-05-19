-- Webhooks de saída da Open API
CREATE TABLE "outgoing_webhooks" (
    "id"          TEXT NOT NULL,
    "companyId"   TEXT NOT NULL,
    "url"         TEXT NOT NULL,
    "secret"      TEXT NOT NULL,
    "events"      TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "lastFiredAt" TIMESTAMP(3),
    "failCount"   INTEGER NOT NULL DEFAULT 0,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outgoing_webhooks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "outgoing_webhooks_companyId_idx" ON "outgoing_webhooks"("companyId");
