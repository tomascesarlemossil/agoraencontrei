-- Reconcile the legacy auction_bids table with the historical archive model.
-- Production already had auction_bids, so CREATE TABLE IF NOT EXISTS could not
-- add the fields introduced by the archive feature.
ALTER TABLE "auction_bids" ADD COLUMN IF NOT EXISTS "round" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "auction_bids" ADD COLUMN IF NOT EXISTS "bidValue" DECIMAL(14,2);
ALTER TABLE "auction_bids" ADD COLUMN IF NOT EXISTS "bidderName" TEXT;
ALTER TABLE "auction_bids" ADD COLUMN IF NOT EXISTS "bidderCpf" TEXT;
ALTER TABLE "auction_bids" ADD COLUMN IF NOT EXISTS "bidDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "auction_bids" ADD COLUMN IF NOT EXISTS "isWinning" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "auction_bids" ADD COLUMN IF NOT EXISTS "metadata" JSONB NOT NULL DEFAULT '{}';

UPDATE "auction_bids"
SET "bidValue" = "amount"
WHERE "bidValue" IS NULL AND "amount" IS NOT NULL;

ALTER TABLE "auction_bids" ALTER COLUMN "bidValue" SET NOT NULL;
ALTER TABLE "auction_bids" ALTER COLUMN "amount" DROP NOT NULL;

-- Records automatically classified as SUSPENDED merely because they vanished
-- from a feed have an unknown outcome, not a confirmed suspension.
UPDATE "auctions"
SET "status" = 'CLOSED'
WHERE "status" = 'SUSPENDED' AND "disappearedAt" IS NOT NULL;
