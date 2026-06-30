-- Acerto de rescisão de contrato (equivalente Uniloc rescisao/resclncs).
--
-- NOTE: produção não roda `prisma migrate deploy` automaticamente — aplicar
-- este script manualmente no banco Neon. Idempotente (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS "rescissions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "legacyId" TEXT,
    "exitDate" TIMESTAMP(3) NOT NULL,
    "proRataRent" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "proRataIptu" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "penaltyValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "outstandingValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bonusValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "depositRefund" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalDebits" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalCredits" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "netResult" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "settlement" TEXT NOT NULL DEFAULT 'SETTLED',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "items" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rescissions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "rescissions_companyId_idx" ON "rescissions"("companyId");
CREATE INDEX IF NOT EXISTS "rescissions_contractId_idx" ON "rescissions"("contractId");
CREATE INDEX IF NOT EXISTS "rescissions_status_idx" ON "rescissions"("status");
