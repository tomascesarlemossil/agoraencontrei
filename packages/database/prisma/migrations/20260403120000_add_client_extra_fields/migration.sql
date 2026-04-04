-- AlterTable: adicionar campos extras ao modelo Client
ALTER TABLE "clients"
  ADD COLUMN IF NOT EXISTS "maritalStatus"    TEXT,
  ADD COLUMN IF NOT EXISTS "nationality"      TEXT,
  ADD COLUMN IF NOT EXISTS "spouseName"       TEXT,
  ADD COLUMN IF NOT EXISTS "spouseDocument"   TEXT,
  ADD COLUMN IF NOT EXISTS "spouseProfession" TEXT,
  ADD COLUMN IF NOT EXISTS "income"           DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "spouseIncome"     DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "bankName"         TEXT,
  ADD COLUMN IF NOT EXISTS "bankBranch"       TEXT,
  ADD COLUMN IF NOT EXISTS "bankAccount"      TEXT,
  ADD COLUMN IF NOT EXISTS "bankAccountType"  TEXT,
  ADD COLUMN IF NOT EXISTS "pixKey"           TEXT,
  ADD COLUMN IF NOT EXISTS "observations"     TEXT,
  ADD COLUMN IF NOT EXISTS "isArchived"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "archivedAt"       TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "archivedReason"   TEXT;

-- Index para busca de clientes arquivados
CREATE INDEX IF NOT EXISTS "clients_isArchived_idx" ON "clients"("isArchived");
