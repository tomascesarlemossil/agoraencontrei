-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "AuctionSource" AS ENUM ('CAIXA', 'BANCO_DO_BRASIL', 'BRADESCO', 'ITAU', 'SANTANDER', 'LEILOEIRO', 'JUDICIAL', 'EXTRAJUDICIAL', 'MANUAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "AuctionStatus" AS ENUM ('UPCOMING', 'OPEN', 'FIRST_ROUND', 'SECOND_ROUND', 'SOLD', 'DESERTED', 'SUSPENDED', 'CANCELLED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "AuctionModality" AS ENUM ('ONLINE', 'PRESENTIAL', 'HYBRID', 'DIRECT_SALE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateTable auctions
CREATE TABLE IF NOT EXISTS "auctions" (
    "id"                  TEXT NOT NULL,
    "companyId"           TEXT,
    "externalId"          TEXT,
    "source"              "AuctionSource" NOT NULL DEFAULT 'LEILOEIRO',
    "sourceUrl"           TEXT,
    "auctioneerName"      TEXT,
    "auctioneerUrl"       TEXT,
    "auctioneerCnpj"      TEXT,
    "auctioneerJucesp"    TEXT,
    "status"              "AuctionStatus" NOT NULL DEFAULT 'UPCOMING',
    "modality"            "AuctionModality" NOT NULL DEFAULT 'ONLINE',
    "title"               TEXT NOT NULL,
    "slug"                TEXT NOT NULL,
    "description"         TEXT,
    "propertyType"        "PropertyType" NOT NULL DEFAULT 'HOUSE',
    "category"            "PropertyCategory" NOT NULL DEFAULT 'RESIDENTIAL',
    "street"              TEXT,
    "number"              TEXT,
    "complement"          TEXT,
    "neighborhood"        TEXT,
    "city"                TEXT,
    "state"               TEXT,
    "zipCode"             TEXT,
    "latitude"            DOUBLE PRECISION,
    "longitude"           DOUBLE PRECISION,
    "totalArea"           DOUBLE PRECISION,
    "builtArea"           DOUBLE PRECISION,
    "landArea"            DOUBLE PRECISION,
    "bedrooms"            INTEGER NOT NULL DEFAULT 0,
    "bathrooms"           INTEGER NOT NULL DEFAULT 0,
    "parkingSpaces"       INTEGER NOT NULL DEFAULT 0,
    "appraisalValue"      DECIMAL(14,2),
    "minimumBid"          DECIMAL(14,2),
    "firstRoundBid"       DECIMAL(14,2),
    "secondRoundBid"      DECIMAL(14,2),
    "currentBid"          DECIMAL(14,2),
    "soldValue"           DECIMAL(14,2),
    "discountPercent"     DOUBLE PRECISION,
    "itbiEstimate"        DECIMAL(12,2),
    "registryEstimate"    DECIMAL(12,2),
    "lawyerEstimate"      DECIMAL(12,2),
    "evictionEstimate"    DECIMAL(12,2),
    "firstRoundDate"      TIMESTAMP(3),
    "secondRoundDate"     TIMESTAMP(3),
    "auctionDate"         TIMESTAMP(3),
    "auctionEndDate"      TIMESTAMP(3),
    "visitDate"           TIMESTAMP(3),
    "processNumber"       TEXT,
    "court"               TEXT,
    "judge"               TEXT,
    "registryNumber"      TEXT,
    "registryOffice"      TEXT,
    "debtorName"          TEXT,
    "creditorName"        TEXT,
    "occupation"          TEXT,
    "hasDebts"            BOOLEAN,
    "debtDetails"         TEXT,
    "restrictions"        TEXT,
    "editalUrl"           TEXT,
    "bankName"            TEXT,
    "bankBranch"          TEXT,
    "financingAvailable"  BOOLEAN NOT NULL DEFAULT false,
    "fgtsAllowed"         BOOLEAN NOT NULL DEFAULT false,
    "coverImage"          TEXT,
    "images"              TEXT[] DEFAULT ARRAY[]::TEXT[],
    "documentsUrls"       TEXT[] DEFAULT ARRAY[]::TEXT[],
    "opportunityScore"    INTEGER,
    "estimatedROI"        DOUBLE PRECISION,
    "marketPriceEstimate" DECIMAL(14,2),
    "pricePerM2"          DECIMAL(10,2),
    "features"            TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags"                TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata"            JSONB NOT NULL DEFAULT '{}',
    "lastScrapedAt"       TIMESTAMP(3),
    "scrapedHash"         TEXT,
    "isVerified"          BOOLEAN NOT NULL DEFAULT false,
    "views"               INTEGER NOT NULL DEFAULT 0,
    "favorites"           INTEGER NOT NULL DEFAULT 0,
    "alertsSent"          INTEGER NOT NULL DEFAULT 0,
    "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auctions_pkey" PRIMARY KEY ("id")
);

-- CreateTable auction_bids
CREATE TABLE IF NOT EXISTS "auction_bids" (
    "id"          TEXT NOT NULL,
    "auctionId"   TEXT NOT NULL,
    "userId"      TEXT,
    "amount"      DECIMAL(14,2) NOT NULL,
    "status"      TEXT NOT NULL DEFAULT 'PENDING',
    "notes"       TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auction_bids_pkey" PRIMARY KEY ("id")
);

-- CreateTable auction_alerts
CREATE TABLE IF NOT EXISTS "auction_alerts" (
    "id"              TEXT NOT NULL,
    "userId"          TEXT NOT NULL,
    "auctionId"       TEXT,
    "propertyType"    TEXT,
    "city"            TEXT,
    "state"           TEXT,
    "maxPrice"        DECIMAL(14,2),
    "minDiscount"     DOUBLE PRECISION,
    "minScore"        INTEGER,
    "isActive"        BOOLEAN NOT NULL DEFAULT true,
    "lastNotifiedAt"  TIMESTAMP(3),
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auction_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable auction_analyses
CREATE TABLE IF NOT EXISTS "auction_analyses" (
    "id"          TEXT NOT NULL,
    "auctionId"   TEXT NOT NULL,
    "analysis"    TEXT NOT NULL,
    "score"       INTEGER,
    "roi"         DOUBLE PRECISION,
    "risks"       TEXT[] DEFAULT ARRAY[]::TEXT[],
    "positives"   TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "auction_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable scraper_runs
CREATE TABLE IF NOT EXISTS "scraper_runs" (
    "id"            TEXT NOT NULL,
    "source"        TEXT NOT NULL,
    "sourceUrl"     TEXT,
    "status"        TEXT NOT NULL DEFAULT 'RUNNING',
    "startedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt"    TIMESTAMP(3),
    "itemsFound"    INTEGER NOT NULL DEFAULT 0,
    "itemsCreated"  INTEGER NOT NULL DEFAULT 0,
    "itemsUpdated"  INTEGER NOT NULL DEFAULT 0,
    "itemsRemoved"  INTEGER NOT NULL DEFAULT 0,
    "errorMessage"  TEXT,
    "metadata"      JSONB NOT NULL DEFAULT '{}',
    CONSTRAINT "scraper_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "auctions_slug_key" ON "auctions"("slug");
CREATE INDEX IF NOT EXISTS "auctions_source_idx" ON "auctions"("source");
CREATE INDEX IF NOT EXISTS "auctions_status_idx" ON "auctions"("status");
CREATE INDEX IF NOT EXISTS "auctions_city_state_idx" ON "auctions"("city", "state");
CREATE INDEX IF NOT EXISTS "auctions_propertyType_idx" ON "auctions"("propertyType");
CREATE INDEX IF NOT EXISTS "auctions_auctionDate_idx" ON "auctions"("auctionDate");
CREATE INDEX IF NOT EXISTS "auctions_minimumBid_idx" ON "auctions"("minimumBid");
CREATE INDEX IF NOT EXISTS "auctions_discountPercent_idx" ON "auctions"("discountPercent");
CREATE INDEX IF NOT EXISTS "auctions_opportunityScore_idx" ON "auctions"("opportunityScore");
CREATE INDEX IF NOT EXISTS "auctions_externalId_source_idx" ON "auctions"("externalId", "source");
CREATE INDEX IF NOT EXISTS "auction_bids_auctionId_idx" ON "auction_bids"("auctionId");
CREATE INDEX IF NOT EXISTS "auction_alerts_userId_idx" ON "auction_alerts"("userId");
CREATE INDEX IF NOT EXISTS "auction_analyses_auctionId_idx" ON "auction_analyses"("auctionId");
CREATE INDEX IF NOT EXISTS "scraper_runs_source_idx" ON "scraper_runs"("source");
CREATE INDEX IF NOT EXISTS "scraper_runs_status_idx" ON "scraper_runs"("status");
CREATE INDEX IF NOT EXISTS "scraper_runs_startedAt_idx" ON "scraper_runs"("startedAt");

-- AddForeignKey (only if companies table exists)
DO $$ BEGIN
  ALTER TABLE "auctions" ADD CONSTRAINT "auctions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "auction_bids" ADD CONSTRAINT "auction_bids_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "auction_alerts" ADD CONSTRAINT "auction_alerts_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "auction_analyses" ADD CONSTRAINT "auction_analyses_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "auctions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Mark migration as applied
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
VALUES (
  gen_random_uuid()::text,
  'manual_migration_auctions_tables',
  NOW(),
  '20260406000001_add_auctions_tables',
  NULL, NULL, NOW(), 1
) ON CONFLICT DO NOTHING;
