-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "legacyId" TEXT,
    "contractId" TEXT,
    "legacyContractCode" TEXT,
    "legacyTenantCode" TEXT,
    "cedente" TEXT,
    "numBoleto" TEXT,
    "banco" TEXT,
    "carteira" TEXT,
    "codigoBarras" TEXT,
    "linhaDigitavel" TEXT,
    "nossoNumero" TEXT,
    "issueDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "amount" DECIMAL(12,2),
    "mensagem" TEXT,
    "instrucoes" TEXT,
    "asaasId" TEXT,
    "asaasStatus" TEXT,
    "asaasBankSlipUrl" TEXT,
    "asaasPixCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoices_companyId_idx" ON "invoices"("companyId");

-- CreateIndex
CREATE INDEX "invoices_contractId_idx" ON "invoices"("contractId");

-- CreateIndex
CREATE INDEX "invoices_dueDate_idx" ON "invoices"("dueDate");

-- CreateIndex
CREATE INDEX "invoices_asaasId_idx" ON "invoices"("asaasId");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
