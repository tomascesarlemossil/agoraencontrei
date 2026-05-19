-- Dossiê jurídico do imóvel (Dossiê Seguro)
CREATE TABLE "property_dossiers" (
    "id"         TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "companyId"  TEXT NOT NULL,
    "riskLevel"  TEXT NOT NULL DEFAULT 'gray',
    "checklist"  JSONB NOT NULL DEFAULT '{}',
    "notes"      TEXT,
    "aiSummary"  TEXT,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_dossiers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "property_dossiers_propertyId_key" ON "property_dossiers"("propertyId");
CREATE INDEX "property_dossiers_companyId_idx" ON "property_dossiers"("companyId");
