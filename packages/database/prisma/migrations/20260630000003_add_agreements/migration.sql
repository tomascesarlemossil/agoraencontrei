-- Acordos / renegociação de dívida (equivalente Uniloc acordos).
--
-- NOTE: produção não roda `prisma migrate deploy` automaticamente — aplicar
-- este script manualmente no banco Neon. Idempotente (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS "agreements" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contractId" TEXT,
    "legacyId" TEXT,
    "tenantName" TEXT,
    "originalDebt" DECIMAL(12,2) NOT NULL,
    "discountValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "agreedValue" DECIMAL(12,2) NOT NULL,
    "installments" INTEGER NOT NULL,
    "firstDueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agreements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "agreements_companyId_idx" ON "agreements"("companyId");
CREATE INDEX IF NOT EXISTS "agreements_contractId_idx" ON "agreements"("contractId");
CREATE INDEX IF NOT EXISTS "agreements_status_idx" ON "agreements"("status");

CREATE TABLE IF NOT EXISTS "agreement_installments" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "paidAmount" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agreement_installments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "agreement_installments_agreementId_number_key" ON "agreement_installments"("agreementId", "number");
CREATE INDEX IF NOT EXISTS "agreement_installments_agreementId_idx" ON "agreement_installments"("agreementId");
CREATE INDEX IF NOT EXISTS "agreement_installments_status_idx" ON "agreement_installments"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'agreement_installments_agreementId_fkey'
  ) THEN
    ALTER TABLE "agreement_installments"
      ADD CONSTRAINT "agreement_installments_agreementId_fkey"
      FOREIGN KEY ("agreementId") REFERENCES "agreements"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
