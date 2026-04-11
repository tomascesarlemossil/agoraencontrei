-- Hunter Mode: Leads de busca difícil
CREATE TABLE "hunter_leads" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "contactId" TEXT,
    "visitorId" TEXT,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'active',
    "priority" TEXT NOT NULL DEFAULT 'URGENTE_HUNTER',
    "source" TEXT NOT NULL DEFAULT 'site_search',
    "notes" TEXT,
    "fulfilledAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hunter_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "hunter_leads_status_idx" ON "hunter_leads"("status");
CREATE INDEX "hunter_leads_priority_idx" ON "hunter_leads"("priority");
CREATE INDEX "hunter_leads_leadId_idx" ON "hunter_leads"("leadId");
CREATE INDEX "hunter_leads_createdAt_idx" ON "hunter_leads"("createdAt");

-- Affiliate Engine
CREATE TABLE "affiliates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "code" TEXT NOT NULL,
    "commissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0.20,
    "level" TEXT NOT NULL DEFAULT 'bronze',
    "totalEarnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "pendingEarnings" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalClients" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "affiliates_email_key" ON "affiliates"("email");
CREATE UNIQUE INDEX "affiliates_code_key" ON "affiliates"("code");
CREATE INDEX "affiliates_code_idx" ON "affiliates"("code");
CREATE INDEX "affiliates_email_idx" ON "affiliates"("email");
CREATE INDEX "affiliates_isActive_idx" ON "affiliates"("isActive");

CREATE TABLE "affiliate_earnings" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "tenantId" TEXT,
    "transactionId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "grossValue" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidAt" TIMESTAMP(3),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_earnings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "affiliate_earnings_affiliateId_idx" ON "affiliate_earnings"("affiliateId");
CREATE INDEX "affiliate_earnings_tenantId_idx" ON "affiliate_earnings"("tenantId");
CREATE INDEX "affiliate_earnings_status_idx" ON "affiliate_earnings"("status");
CREATE INDEX "affiliate_earnings_createdAt_idx" ON "affiliate_earnings"("createdAt");

ALTER TABLE "affiliate_earnings" ADD CONSTRAINT "affiliate_earnings_affiliateId_fkey"
    FOREIGN KEY ("affiliateId") REFERENCES "affiliates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- SaaS Financial Transactions
CREATE TABLE "saas_financial_transactions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "affiliateId" TEXT,
    "asaasId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "amount" DECIMAL(12,2) NOT NULL,
    "netAmount" DECIMAL(12,2),
    "commissionAmount" DECIMAL(12,2),
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "description" TEXT,
    "externalRef" TEXT,
    "billingType" TEXT,
    "pixCode" TEXT,
    "bankSlipUrl" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_financial_transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "saas_financial_transactions_tenantId_idx" ON "saas_financial_transactions"("tenantId");
CREATE INDEX "saas_financial_transactions_affiliateId_idx" ON "saas_financial_transactions"("affiliateId");
CREATE INDEX "saas_financial_transactions_asaasId_idx" ON "saas_financial_transactions"("asaasId");
CREATE INDEX "saas_financial_transactions_status_idx" ON "saas_financial_transactions"("status");
CREATE INDEX "saas_financial_transactions_type_idx" ON "saas_financial_transactions"("type");
CREATE INDEX "saas_financial_transactions_createdAt_idx" ON "saas_financial_transactions"("createdAt");
