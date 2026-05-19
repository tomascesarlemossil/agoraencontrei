-- Processo cartorial assistido (escritura/registro) por negociação
CREATE TABLE "notarial_processes" (
    "id"               TEXT NOT NULL,
    "dealId"           TEXT NOT NULL,
    "companyId"        TEXT NOT NULL,
    "actType"          TEXT NOT NULL DEFAULT 'ESCRITURA_COMPRA_VENDA',
    "notaryOffice"     TEXT,
    "registryOffice"   TEXT,
    "status"           TEXT NOT NULL DEFAULT 'preparing',
    "deedFileUrl"      TEXT,
    "registryProtocol" TEXT,
    "checklist"        JSONB NOT NULL DEFAULT '{}',
    "notes"            TEXT,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"        TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notarial_processes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notarial_processes_dealId_key" ON "notarial_processes"("dealId");
CREATE INDEX "notarial_processes_companyId_idx" ON "notarial_processes"("companyId");
