-- Reconcile the legacy free-text auction analysis table with the structured
-- financial analysis model currently read by Prisma.
ALTER TABLE "auction_analyses" ADD COLUMN IF NOT EXISTS "totalCost" DECIMAL(14,2);
ALTER TABLE "auction_analyses" ADD COLUMN IF NOT EXISTS "marketValue" DECIMAL(14,2);
ALTER TABLE "auction_analyses" ADD COLUMN IF NOT EXISTS "potentialProfit" DECIMAL(14,2);
ALTER TABLE "auction_analyses" ADD COLUMN IF NOT EXISTS "roiPercent" DOUBLE PRECISION;
ALTER TABLE "auction_analyses" ADD COLUMN IF NOT EXISTS "paybackMonths" INTEGER;
ALTER TABLE "auction_analyses" ADD COLUMN IF NOT EXISTS "bidValue" DECIMAL(14,2);
ALTER TABLE "auction_analyses" ADD COLUMN IF NOT EXISTS "itbiValue" DECIMAL(12,2);
ALTER TABLE "auction_analyses" ADD COLUMN IF NOT EXISTS "registryValue" DECIMAL(12,2);
ALTER TABLE "auction_analyses" ADD COLUMN IF NOT EXISTS "lawyerValue" DECIMAL(12,2);
ALTER TABLE "auction_analyses" ADD COLUMN IF NOT EXISTS "reformValue" DECIMAL(12,2);
ALTER TABLE "auction_analyses" ADD COLUMN IF NOT EXISTS "evictionValue" DECIMAL(12,2);
ALTER TABLE "auction_analyses" ADD COLUMN IF NOT EXISTS "otherCosts" DECIMAL(12,2);
ALTER TABLE "auction_analyses" ADD COLUMN IF NOT EXISTS "riskLevel" TEXT;
ALTER TABLE "auction_analyses" ADD COLUMN IF NOT EXISTS "recommendation" TEXT;
ALTER TABLE "auction_analyses" ADD COLUMN IF NOT EXISTS "aiModel" TEXT;

UPDATE "auction_analyses"
SET "roiPercent" = "roi"
WHERE "roiPercent" IS NULL AND "roi" IS NOT NULL;

UPDATE "auction_analyses"
SET "recommendation" = "analysis"
WHERE "recommendation" IS NULL AND "analysis" IS NOT NULL;

ALTER TABLE "auction_analyses" ALTER COLUMN "analysis" DROP NOT NULL;
