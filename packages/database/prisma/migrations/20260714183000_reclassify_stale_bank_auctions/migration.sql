-- Legacy monitor versions used SUSPENDED for bank listings that merely stopped
-- appearing in a feed. Without a source-confirmed outcome, CLOSED is the honest
-- historical classification; a later scraper sighting reopens the listing.
UPDATE "auctions"
SET "status" = 'CLOSED'
WHERE "status" = 'SUSPENDED'
  AND "source" IN ('CAIXA','BANCO_DO_BRASIL','BRADESCO','SANTANDER','ITAU')
  AND "outcomeCapturedAt" IS NULL;
