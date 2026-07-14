CREATE TABLE "intelligence_data_sources" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "accessMethod" TEXT NOT NULL,
  "baseUrl" TEXT,
  "termsUrl" TEXT,
  "storageAllowed" BOOLEAN NOT NULL DEFAULT false,
  "republicationAllowed" BOOLEAN NOT NULL DEFAULT false,
  "attributionRequired" BOOLEAN NOT NULL DEFAULT false,
  "retentionDays" INTEGER,
  "rateLimitPerMinute" INTEGER,
  "reliabilityScore" INTEGER NOT NULL DEFAULT 50,
  "legalStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "legalReviewedAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "intelligence_data_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "property_listing_snapshots" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "sourceId" TEXT,
  "externalListingId" TEXT,
  "sourceUrl" TEXT,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "listingStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
  "askingPrice" DECIMAL(14,2),
  "rentPrice" DECIMAL(14,2),
  "condoFee" DECIMAL(12,2),
  "propertyTax" DECIMAL(12,2),
  "builtArea" DOUBLE PRECISION,
  "landArea" DOUBLE PRECISION,
  "bedrooms" INTEGER,
  "parkingSpaces" INTEGER,
  "addressFingerprint" TEXT,
  "contentFingerprint" TEXT NOT NULL,
  "dataCompleteness" INTEGER NOT NULL DEFAULT 0,
  "sourceReliability" INTEGER NOT NULL DEFAULT 50,
  "rawData" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "property_listing_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "property_duplicate_candidates" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "candidatePropertyId" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "reasons" JSONB NOT NULL DEFAULT '[]',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "property_duplicate_candidates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "intelligence_data_sources_slug_key" ON "intelligence_data_sources"("slug");
CREATE INDEX "intelligence_data_sources_kind_isActive_idx" ON "intelligence_data_sources"("kind", "isActive");
CREATE INDEX "intelligence_data_sources_legalStatus_idx" ON "intelligence_data_sources"("legalStatus");
CREATE UNIQUE INDEX "property_listing_snapshots_propertyId_contentFingerprint_key" ON "property_listing_snapshots"("propertyId", "contentFingerprint");
CREATE INDEX "property_listing_snapshots_propertyId_capturedAt_idx" ON "property_listing_snapshots"("propertyId", "capturedAt");
CREATE INDEX "property_listing_snapshots_sourceId_externalListingId_idx" ON "property_listing_snapshots"("sourceId", "externalListingId");
CREATE INDEX "property_listing_snapshots_addressFingerprint_idx" ON "property_listing_snapshots"("addressFingerprint");
CREATE INDEX "property_listing_snapshots_listingStatus_capturedAt_idx" ON "property_listing_snapshots"("listingStatus", "capturedAt");
CREATE UNIQUE INDEX "property_duplicate_candidates_propertyId_candidatePropertyId_key" ON "property_duplicate_candidates"("propertyId", "candidatePropertyId");
CREATE INDEX "property_duplicate_candidates_propertyId_status_idx" ON "property_duplicate_candidates"("propertyId", "status");
CREATE INDEX "property_duplicate_candidates_candidatePropertyId_status_idx" ON "property_duplicate_candidates"("candidatePropertyId", "status");
CREATE INDEX "property_duplicate_candidates_score_status_idx" ON "property_duplicate_candidates"("score", "status");

ALTER TABLE "property_listing_snapshots"
  ADD CONSTRAINT "property_listing_snapshots_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "intelligence_data_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "intelligence_data_sources" (
  "id", "slug", "name", "kind", "accessMethod", "storageAllowed",
  "republicationAllowed", "reliabilityScore", "legalStatus", "legalReviewedAt",
  "isActive", "metadata", "createdAt", "updatedAt"
) VALUES (
  'source_agoraencontrei_internal', 'agoraencontrei-internal', 'Base própria AgoraEncontrei',
  'INTERNAL', 'INTERNAL', true, true, 90, 'APPROVED', CURRENT_TIMESTAMP,
  true, '{"scope":"Dados próprios e autorizados de imóveis publicados"}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);
