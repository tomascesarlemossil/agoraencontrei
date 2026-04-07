-- Migration: add LAWYER role, legalCaseId and ownerId to documents table
-- Date: 2026-04-04

-- 1. Add LAWYER to UserRole enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'LAWYER';

-- 2. Add legalCaseId column to documents
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "legalCaseId" TEXT;
ALTER TABLE "documents" ADD CONSTRAINT "documents_legalCaseId_fkey"
  FOREIGN KEY ("legalCaseId") REFERENCES "legal_cases"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

-- 3. Add ownerId column to documents (proprietário do imóvel)
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "ownerId" TEXT;
ALTER TABLE "documents" ADD CONSTRAINT "documents_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "clients"("id")
  ON DELETE SET NULL ON UPDATE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS "documents_legalCaseId_idx" ON "documents"("legalCaseId");
CREATE INDEX IF NOT EXISTS "documents_ownerId_idx" ON "documents"("ownerId");

-- 5. Backfill: link existing JURIDICO documents to legal cases by clientId
-- (best-effort: link document to the most recent legal case for the same client)
UPDATE "documents" d
SET "legalCaseId" = (
  SELECT lc.id FROM "legal_cases" lc
  WHERE lc."clientId" = d."clientId"
    AND lc."companyId" = d."companyId"
  ORDER BY lc."createdAt" DESC
  LIMIT 1
)
WHERE d.type = 'JURIDICO'
  AND d."legalCaseId" IS NULL
  AND d."clientId" IS NOT NULL;

-- 6. Backfill: link BOLETO/EXTRATO documents to owner (landlord) via contract
UPDATE "documents" d
SET "ownerId" = (
  SELECT c."landlordId" FROM "contracts" c
  WHERE c.id = d."contractId"
    AND c."landlordId" IS NOT NULL
  LIMIT 1
)
WHERE d.type IN ('BOLETO','EXTRATO','FINANCEIRO')
  AND d."ownerId" IS NULL
  AND d."contractId" IS NOT NULL;
