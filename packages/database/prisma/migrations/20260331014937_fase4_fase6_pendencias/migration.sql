/*
  Warnings:

  - Added the required column `updatedAt` to the `financial_forecasts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "financial_forecasts" ADD COLUMN     "clienteNome" TEXT,
ADD COLUMN     "endereco" TEXT,
ADD COLUMN     "forecastStatus" TEXT NOT NULL DEFAULT 'PREVISTO',
ADD COLUMN     "numeroBoleto" TEXT,
ADD COLUMN     "parcela" TEXT,
ADD COLUMN     "proprietarioNome" TEXT,
ADD COLUMN     "taxaAdm" DECIMAL(12,2),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "valorAluguel" DECIMAL(12,2),
ADD COLUMN     "valorIptu" DECIMAL(12,2),
ADD COLUMN     "valorRepasse" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "visual_ai_jobs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "inputUrl" TEXT NOT NULL,
    "outputUrl" TEXT,
    "style" TEXT,
    "errorMsg" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visual_ai_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_campaigns" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "segmento" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "agendadoPara" TIMESTAMP(3),
    "totalEnviados" INTEGER NOT NULL DEFAULT 0,
    "totalAbertos" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visual_ai_jobs_companyId_idx" ON "visual_ai_jobs"("companyId");

-- CreateIndex
CREATE INDEX "visual_ai_jobs_propertyId_idx" ON "visual_ai_jobs"("propertyId");

-- CreateIndex
CREATE INDEX "visual_ai_jobs_status_idx" ON "visual_ai_jobs"("status");

-- CreateIndex
CREATE INDEX "marketing_campaigns_companyId_idx" ON "marketing_campaigns"("companyId");

-- CreateIndex
CREATE INDEX "marketing_campaigns_status_idx" ON "marketing_campaigns"("status");

-- AddForeignKey
ALTER TABLE "visual_ai_jobs" ADD CONSTRAINT "visual_ai_jobs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visual_ai_jobs" ADD CONSTRAINT "visual_ai_jobs_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visual_ai_jobs" ADD CONSTRAINT "visual_ai_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
