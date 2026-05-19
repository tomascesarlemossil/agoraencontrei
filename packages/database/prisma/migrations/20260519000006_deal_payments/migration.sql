-- Pagamentos da negociação (sinal/parcelas via Asaas)
CREATE TABLE "deal_payments" (
    "id"            TEXT NOT NULL,
    "dealId"        TEXT NOT NULL,
    "companyId"     TEXT NOT NULL,
    "type"          TEXT NOT NULL DEFAULT 'signal',
    "amount"        DECIMAL(14,2) NOT NULL,
    "billingType"   TEXT NOT NULL DEFAULT 'UNDEFINED',
    "status"        TEXT NOT NULL DEFAULT 'pending',
    "asaasChargeId" TEXT,
    "invoiceUrl"    TEXT,
    "pixPayload"    TEXT,
    "dueDate"       TIMESTAMP(3),
    "paidAt"        TIMESTAMP(3),
    "metadata"      JSONB NOT NULL DEFAULT '{}',
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "deal_payments_asaasChargeId_key" ON "deal_payments"("asaasChargeId");
CREATE INDEX "deal_payments_dealId_idx" ON "deal_payments"("dealId");
