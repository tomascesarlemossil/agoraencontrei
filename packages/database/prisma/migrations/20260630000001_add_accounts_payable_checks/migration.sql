-- Contas a pagar + cheques (financeiro interno da imobiliária).
-- Equivalente Uniloc: cadespe (despesas) e cp_cheqs (cheques).
--
-- NOTE: produção não roda `prisma migrate deploy` automaticamente — aplicar
-- este script manualmente no banco Neon. Idempotente (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS "accounts_payable" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "legacyId" TEXT,
    "description" TEXT NOT NULL,
    "payeeName" TEXT NOT NULL,
    "payeeId" TEXT,
    "category" TEXT,
    "documentNumber" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "paymentDoc" TEXT,
    "paymentMethod" TEXT,
    "contractId" TEXT,
    "propertyId" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_payable_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "accounts_payable_companyId_idx" ON "accounts_payable"("companyId");
CREATE INDEX IF NOT EXISTS "accounts_payable_status_idx" ON "accounts_payable"("status");
CREATE INDEX IF NOT EXISTS "accounts_payable_dueDate_idx" ON "accounts_payable"("dueDate");

CREATE TABLE IF NOT EXISTS "bank_checks" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "legacyId" TEXT,
    "checkNumber" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "bankCode" TEXT,
    "payeeName" TEXT,
    "category" TEXT,
    "issueDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "clearedAt" TIMESTAMP(3),
    "accountPayableId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_checks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "bank_checks_companyId_idx" ON "bank_checks"("companyId");
CREATE INDEX IF NOT EXISTS "bank_checks_status_idx" ON "bank_checks"("status");
CREATE INDEX IF NOT EXISTS "bank_checks_dueDate_idx" ON "bank_checks"("dueDate");
CREATE INDEX IF NOT EXISTS "bank_checks_accountPayableId_idx" ON "bank_checks"("accountPayableId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'bank_checks_accountPayableId_fkey'
  ) THEN
    ALTER TABLE "bank_checks"
      ADD CONSTRAINT "bank_checks_accountPayableId_fkey"
      FOREIGN KEY ("accountPayableId") REFERENCES "accounts_payable"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
