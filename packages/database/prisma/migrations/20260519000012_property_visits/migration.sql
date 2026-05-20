-- Agenda de visitas a imóveis (PropertyVisit)
CREATE TABLE "property_visits" (
    "id"           TEXT NOT NULL,
    "companyId"    TEXT NOT NULL,
    "propertyId"   TEXT NOT NULL,
    "brokerId"     TEXT,
    "visitorName"  TEXT NOT NULL,
    "visitorEmail" TEXT,
    "visitorPhone" TEXT NOT NULL,
    "scheduledAt"  TIMESTAMP(3) NOT NULL,
    "mode"         TEXT NOT NULL DEFAULT 'in_person',
    "status"       TEXT NOT NULL DEFAULT 'pending',
    "notes"        TEXT,
    "rating"       INTEGER,
    "feedback"     TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_visits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "property_visits_companyId_scheduledAt_idx" ON "property_visits"("companyId", "scheduledAt");
CREATE INDEX "property_visits_propertyId_idx" ON "property_visits"("propertyId");
CREATE INDEX "property_visits_status_idx" ON "property_visits"("status");
