-- Client/property match engine: richer search profile on property_alerts
ALTER TABLE "property_alerts"
  ADD COLUMN "name"          TEXT,
  ADD COLUMN "phone"         TEXT,
  ADD COLUMN "companyId"     TEXT,
  ADD COLUMN "neighborhood"  TEXT,
  ADD COLUMN "lastMatchedAt" TIMESTAMP(3);

CREATE INDEX "property_alerts_companyId_idx" ON "property_alerts"("companyId");
