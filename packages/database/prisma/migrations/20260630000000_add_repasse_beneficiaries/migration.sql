-- Rateio de repasse multi-proprietário (equivalente Uniloc: favore/secunlo/favopor/secunda).
--
-- Cria a tabela de beneficiários do repasse de um contrato. Cada linha define
-- um favorecido (proprietário, locador secundário ou terceiro) e o percentual
-- do repasse líquido que ele recebe. Quando um contrato não tem beneficiários,
-- o repasse continua indo 100% para contracts.landlordId (comportamento atual).
--
-- NOTE: produção não roda `prisma migrate deploy` automaticamente — aplicar
-- este script manualmente no banco Neon. Idempotente (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS "repasse_beneficiaries" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "clientId" TEXT,
    "name" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OWNER',
    "bankName" TEXT,
    "bankAgency" TEXT,
    "bankAccount" TEXT,
    "pixKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repasse_beneficiaries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "repasse_beneficiaries_companyId_idx" ON "repasse_beneficiaries"("companyId");
CREATE INDEX IF NOT EXISTS "repasse_beneficiaries_contractId_idx" ON "repasse_beneficiaries"("contractId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'repasse_beneficiaries_contractId_fkey'
  ) THEN
    ALTER TABLE "repasse_beneficiaries"
      ADD CONSTRAINT "repasse_beneficiaries_contractId_fkey"
      FOREIGN KEY ("contractId") REFERENCES "contracts"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
