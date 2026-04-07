-- Migration: add_missing_fields_and_models
-- Adds: PropertyAlert, ContractHistory, FiscalNote.asaasNfe*, Rental.bankFeeAmount/adminFeeAmount/iptuParcela, Contract.adjustmentMonth

-- ── Rental: campos extras de cobrança ────────────────────────────────────────
ALTER TABLE "rentals"
  ADD COLUMN IF NOT EXISTS "bankFeeAmount"  DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "adminFeeAmount" DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS "iptuParcela"    TEXT;

-- ── Contract: mês de reajuste ─────────────────────────────────────────────────
ALTER TABLE "contracts"
  ADD COLUMN IF NOT EXISTS "adjustmentMonth" INTEGER;

-- ── FiscalNote: integração Asaas NFS-e ───────────────────────────────────────
ALTER TABLE "fiscal_notes"
  ADD COLUMN IF NOT EXISTS "asaasNfeId"     TEXT,
  ADD COLUMN IF NOT EXISTS "asaasNfeStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "asaasNfePdfUrl" TEXT;

-- ── PropertyAlert: alertas de imóveis ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "property_alerts" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email"     TEXT NOT NULL,
  "city"      TEXT,
  "type"      TEXT,
  "purpose"   TEXT,
  "minPrice"  DECIMAL(12,2),
  "maxPrice"  DECIMAL(12,2),
  "bedrooms"  INTEGER,
  "token"     TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  "active"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "property_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "property_alerts_email_idx" ON "property_alerts"("email");
CREATE INDEX IF NOT EXISTS "property_alerts_city_idx"  ON "property_alerts"("city");

-- ── ContractHistory: histórico de contratos ───────────────────────────────────
CREATE TABLE IF NOT EXISTS "contract_history" (
  "id"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "companyId"   TEXT NOT NULL,
  "contractId"  TEXT NOT NULL,
  "action"      TEXT NOT NULL,
  "description" TEXT,
  "field"       TEXT,
  "oldValue"    TEXT,
  "newValue"    TEXT,
  "userId"      TEXT,
  "userName"    TEXT,
  "metadata"    JSONB NOT NULL DEFAULT '{}',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contract_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "contract_history_contractId_fkey" FOREIGN KEY ("contractId")
    REFERENCES "contracts"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "contract_history_contractId_idx" ON "contract_history"("contractId");
CREATE INDEX IF NOT EXISTS "contract_history_companyId_idx"  ON "contract_history"("companyId");
