-- Carnê de IPTU parcelado (equivalente Uniloc iptu/lanciptu).
-- NOTE: aplicar manualmente no Neon. Idempotente.

CREATE TABLE IF NOT EXISTS "iptu_carnes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "propertyId" TEXT,
    "contractId" TEXT,
    "legacyId" TEXT,
    "year" INTEGER NOT NULL,
    "iptuCode" TEXT,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "installments" INTEGER NOT NULL,
    "chargeToTenant" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "iptu_carnes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "iptu_carnes_companyId_idx" ON "iptu_carnes"("companyId");
CREATE INDEX IF NOT EXISTS "iptu_carnes_propertyId_idx" ON "iptu_carnes"("propertyId");
CREATE INDEX IF NOT EXISTS "iptu_carnes_year_idx" ON "iptu_carnes"("year");

CREATE TABLE IF NOT EXISTS "iptu_installments" (
    "id" TEXT NOT NULL,
    "carneId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "rentalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "iptu_installments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "iptu_installments_carneId_number_key" ON "iptu_installments"("carneId","number");
CREATE INDEX IF NOT EXISTS "iptu_installments_carneId_idx" ON "iptu_installments"("carneId");
CREATE INDEX IF NOT EXISTS "iptu_installments_status_idx" ON "iptu_installments"("status");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'iptu_installments_carneId_fkey') THEN
    ALTER TABLE "iptu_installments" ADD CONSTRAINT "iptu_installments_carneId_fkey"
      FOREIGN KEY ("carneId") REFERENCES "iptu_carnes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
