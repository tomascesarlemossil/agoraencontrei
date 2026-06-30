-- Notificações formais + conciliação bancária + permissões por módulo.
-- Equivalente Uniloc: notifics, movbanco/BAIXACNAB, usuarios.U_MODULO*.
--
-- NOTE: produção não roda `prisma migrate deploy` automaticamente — aplicar
-- manualmente no banco Neon. Idempotente (IF NOT EXISTS).

-- Notificações formais/extrajudiciais
CREATE TABLE IF NOT EXISTS "formal_notices" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contractId" TEXT,
    "legacyId" TEXT,
    "recipient" TEXT NOT NULL DEFAULT 'TENANT',
    "recipientName" TEXT,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "noticeDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "operator" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "formal_notices_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "formal_notices_companyId_idx" ON "formal_notices"("companyId");
CREATE INDEX IF NOT EXISTS "formal_notices_contractId_idx" ON "formal_notices"("contractId");
CREATE INDEX IF NOT EXISTS "formal_notices_status_idx" ON "formal_notices"("status");

-- Conciliação bancária: lote
CREATE TABLE IF NOT EXISTS "bank_reconciliations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'CSV',
    "reference" TEXT,
    "bankCode" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalEntries" INTEGER NOT NULL DEFAULT 0,
    "matchedCount" INTEGER NOT NULL DEFAULT 0,
    "unmatchedCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'IMPORTED',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bank_reconciliations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "bank_reconciliations_companyId_idx" ON "bank_reconciliations"("companyId");
CREATE INDEX IF NOT EXISTS "bank_reconciliations_status_idx" ON "bank_reconciliations"("status");

-- Conciliação bancária: movimentos
CREATE TABLE IF NOT EXISTS "bank_statement_entries" (
    "id" TEXT NOT NULL,
    "reconciliationId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'CREDIT',
    "description" TEXT,
    "nossoNumero" TEXT,
    "documentNumber" TEXT,
    "occurrenceCode" TEXT,
    "matchStatus" TEXT NOT NULL DEFAULT 'UNMATCHED',
    "matchedRentalId" TEXT,
    "matchedInvoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bank_statement_entries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "bank_statement_entries_reconciliationId_idx" ON "bank_statement_entries"("reconciliationId");
CREATE INDEX IF NOT EXISTS "bank_statement_entries_companyId_idx" ON "bank_statement_entries"("companyId");
CREATE INDEX IF NOT EXISTS "bank_statement_entries_matchStatus_idx" ON "bank_statement_entries"("matchStatus");
CREATE INDEX IF NOT EXISTS "bank_statement_entries_nossoNumero_idx" ON "bank_statement_entries"("nossoNumero");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'bank_statement_entries_reconciliationId_fkey') THEN
    ALTER TABLE "bank_statement_entries" ADD CONSTRAINT "bank_statement_entries_reconciliationId_fkey"
      FOREIGN KEY ("reconciliationId") REFERENCES "bank_reconciliations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Permissões por módulo
CREATE TABLE IF NOT EXISTS "user_module_permissions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "canView" BOOLEAN NOT NULL DEFAULT true,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_module_permissions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_module_permissions_userId_module_key" ON "user_module_permissions"("userId", "module");
CREATE INDEX IF NOT EXISTS "user_module_permissions_companyId_idx" ON "user_module_permissions"("companyId");
CREATE INDEX IF NOT EXISTS "user_module_permissions_userId_idx" ON "user_module_permissions"("userId");
