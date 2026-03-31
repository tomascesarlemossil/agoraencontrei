-- CreateEnum
CREATE TYPE "ClientRole" AS ENUM ('TENANT', 'LANDLORD', 'GUARANTOR', 'BENEFICIARY', 'SECONDARY');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'FINISHED', 'CANCELED');

-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('PENDING', 'PAID', 'LATE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "legacyId" TEXT,
    "name" TEXT NOT NULL,
    "document" TEXT,
    "rg" TEXT,
    "profession" TEXT,
    "birthDate" TIMESTAMP(3),
    "email" TEXT,
    "phone" TEXT,
    "phoneMobile" TEXT,
    "phoneWork" TEXT,
    "address" TEXT,
    "addressComplement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "roles" "ClientRole"[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "legacyId" TEXT,
    "legacyPropertyCode" TEXT,
    "propertyAddress" TEXT,
    "iptuCode" TEXT,
    "landlordId" TEXT,
    "tenantId" TEXT,
    "guarantorId" TEXT,
    "landlordName" TEXT,
    "tenantName" TEXT,
    "startDate" TIMESTAMP(3),
    "duration" INTEGER,
    "rentValue" DECIMAL(12,2),
    "initialValue" DECIMAL(12,2),
    "commission" DECIMAL(5,2),
    "tenantDueDay" INTEGER,
    "landlordDueDay" INTEGER,
    "penalty" DECIMAL(5,2),
    "adjustmentBase" DECIMAL(5,2),
    "adjustmentIndex" TEXT,
    "adjustmentPercent" DECIMAL(5,2),
    "rescissionDate" TIMESTAMP(3),
    "unit" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rentals" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "legacyId" TEXT,
    "contractId" TEXT,
    "dueDate" TIMESTAMP(3),
    "rentAmount" DECIMAL(12,2),
    "condoAmount" DECIMAL(12,2),
    "waterAmount" DECIMAL(12,2),
    "electricAmount" DECIMAL(12,2),
    "taxAmount" DECIMAL(12,2),
    "penaltyAmount" DECIMAL(12,2),
    "totalAmount" DECIMAL(12,2),
    "paidAmount" DECIMAL(12,2),
    "paymentDate" TIMESTAMP(3),
    "status" "RentalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "legacyId" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "contractId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_forecasts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "legacyId" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "fee" DECIMAL(12,2),
    "tenantName" TEXT,
    "tenantId" TEXT,
    "propertyAddress" TEXT,
    "landlordName" TEXT,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'forecast',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_forecasts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clients_companyId_idx" ON "clients"("companyId");

-- CreateIndex
CREATE INDEX "clients_name_idx" ON "clients"("name");

-- CreateIndex
CREATE INDEX "clients_document_idx" ON "clients"("document");

-- CreateIndex
CREATE UNIQUE INDEX "clients_companyId_document_key" ON "clients"("companyId", "document");

-- CreateIndex
CREATE INDEX "contracts_companyId_idx" ON "contracts"("companyId");

-- CreateIndex
CREATE INDEX "contracts_tenantId_idx" ON "contracts"("tenantId");

-- CreateIndex
CREATE INDEX "contracts_landlordId_idx" ON "contracts"("landlordId");

-- CreateIndex
CREATE INDEX "contracts_status_idx" ON "contracts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "contracts_companyId_legacyId_key" ON "contracts"("companyId", "legacyId");

-- CreateIndex
CREATE INDEX "rentals_companyId_idx" ON "rentals"("companyId");

-- CreateIndex
CREATE INDEX "rentals_contractId_idx" ON "rentals"("contractId");

-- CreateIndex
CREATE INDEX "rentals_status_idx" ON "rentals"("status");

-- CreateIndex
CREATE INDEX "rentals_dueDate_idx" ON "rentals"("dueDate");

-- CreateIndex
CREATE INDEX "transactions_companyId_idx" ON "transactions"("companyId");

-- CreateIndex
CREATE INDEX "transactions_transactionDate_idx" ON "transactions"("transactionDate");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "financial_forecasts_companyId_idx" ON "financial_forecasts"("companyId");

-- CreateIndex
CREATE INDEX "financial_forecasts_year_month_idx" ON "financial_forecasts"("year", "month");

-- CreateIndex
CREATE INDEX "financial_forecasts_dueDate_idx" ON "financial_forecasts"("dueDate");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_guarantorId_fkey" FOREIGN KEY ("guarantorId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_forecasts" ADD CONSTRAINT "financial_forecasts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_forecasts" ADD CONSTRAINT "financial_forecasts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
