-- CreateTable
CREATE TABLE IF NOT EXISTS "tenant_addons" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "packageSlug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "billingType" TEXT NOT NULL DEFAULT 'recurring',
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "asaasChargeId" TEXT,
    "activatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_addons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tenant_addons_tenantId_status_idx" ON "tenant_addons"("tenantId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "tenant_addons_asaasChargeId_idx" ON "tenant_addons"("asaasChargeId");
