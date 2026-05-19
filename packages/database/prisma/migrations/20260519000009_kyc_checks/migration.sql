-- KYC — verificações de identidade / antifraude por negociação
CREATE TABLE "kyc_checks" (
    "id"          TEXT NOT NULL,
    "dealId"      TEXT NOT NULL,
    "companyId"   TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "subjectRole" TEXT NOT NULL DEFAULT 'buyer',
    "cpfCnpj"     TEXT,
    "status"      TEXT NOT NULL DEFAULT 'pending',
    "riskLevel"   TEXT NOT NULL DEFAULT 'medium',
    "checklist"   JSONB NOT NULL DEFAULT '{}',
    "notes"       TEXT,
    "provider"    TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_checks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "kyc_checks_dealId_idx" ON "kyc_checks"("dealId");
CREATE INDEX "kyc_checks_companyId_idx" ON "kyc_checks"("companyId");
