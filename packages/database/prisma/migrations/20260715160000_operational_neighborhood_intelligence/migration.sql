CREATE TABLE IF NOT EXISTS "territorial_street_neighborhoods" (
  "id" TEXT NOT NULL,
  "streetId" TEXT NOT NULL,
  "neighborhoodId" TEXT NOT NULL,
  "sourceId" TEXT,
  "confidence" INTEGER NOT NULL DEFAULT 50,
  "evidenceCount" INTEGER NOT NULL DEFAULT 1,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "territorial_street_neighborhoods_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "territorial_street_neighborhoods_streetId_fkey" FOREIGN KEY ("streetId") REFERENCES "territorial_streets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "territorial_street_neighborhoods_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "territorial_neighborhoods"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "territorial_street_neighborhoods_streetId_neighborhoodId_key" ON "territorial_street_neighborhoods"("streetId", "neighborhoodId");
CREATE INDEX IF NOT EXISTS "territorial_street_neighborhoods_neighborhoodId_idx" ON "territorial_street_neighborhoods"("neighborhoodId");

INSERT INTO "intelligence_data_sources" (
  "id", "slug", "name", "kind", "accessMethod", "storageAllowed", "republicationAllowed",
  "attributionRequired", "reliabilityScore", "legalStatus", "legalReviewedAt", "isActive", "metadata", "createdAt", "updatedAt"
) VALUES (
  'source_internal_property_neighborhoods', 'internal-property-neighborhoods',
  'Cadastro interno de imóveis — bairros declarados', 'INTERNAL', 'INTERNAL', true, false,
  false, 55, 'APPROVED', CURRENT_TIMESTAMP, true,
  '{"scope":"Nomes de bairros declarados nos imóveis e relações observadas com logradouros","classification":"operational","warning":"Não representa delimitação oficial de bairro"}',
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
) ON CONFLICT ("slug") DO UPDATE SET "metadata" = EXCLUDED."metadata", "updatedAt" = CURRENT_TIMESTAMP;
