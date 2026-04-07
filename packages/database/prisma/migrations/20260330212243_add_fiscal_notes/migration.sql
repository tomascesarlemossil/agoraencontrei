-- CreateEnum
CREATE TYPE "FiscalNoteStatus" AS ENUM ('DRAFT', 'ISSUED', 'SENT', 'RECEIVED', 'CANCELLED', 'ERROR');

-- CreateTable
CREATE TABLE "fiscal_notes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "landlordId" TEXT,
    "landlordName" TEXT NOT NULL,
    "landlordCpf" TEXT NOT NULL,
    "landlordEmail" TEXT,
    "landlordPhone" TEXT,
    "landlordAddress" TEXT,
    "propertyId" TEXT,
    "propertyAddress" TEXT,
    "rentalId" TEXT,
    "rentalMonth" INTEGER NOT NULL,
    "rentalYear" INTEGER NOT NULL,
    "rentalValue" DECIMAL(12,2) NOT NULL,
    "serviceFeePercentage" DECIMAL(5,2) NOT NULL,
    "serviceFeeValue" DECIMAL(12,2) NOT NULL,
    "serviceDescription" TEXT NOT NULL DEFAULT 'Prestação de serviços de administração e intermediação imobiliária',
    "invoiceNumber" TEXT,
    "invoiceSeries" TEXT DEFAULT 'UN',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nfeNumber" TEXT,
    "nfeKey" TEXT,
    "nfeXml" TEXT,
    "status" "FiscalNoteStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fiscal_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_note_logs" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "details" JSONB,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiscal_note_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fiscal_notes_companyId_idx" ON "fiscal_notes"("companyId");

-- CreateIndex
CREATE INDEX "fiscal_notes_landlordId_idx" ON "fiscal_notes"("landlordId");

-- CreateIndex
CREATE INDEX "fiscal_notes_status_idx" ON "fiscal_notes"("status");

-- CreateIndex
CREATE INDEX "fiscal_notes_rentalMonth_rentalYear_idx" ON "fiscal_notes"("rentalMonth", "rentalYear");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_notes_rentalId_rentalMonth_rentalYear_key" ON "fiscal_notes"("rentalId", "rentalMonth", "rentalYear");

-- CreateIndex
CREATE INDEX "fiscal_note_logs_noteId_idx" ON "fiscal_note_logs"("noteId");

-- AddForeignKey
ALTER TABLE "fiscal_notes" ADD CONSTRAINT "fiscal_notes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiscal_note_logs" ADD CONSTRAINT "fiscal_note_logs_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "fiscal_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
