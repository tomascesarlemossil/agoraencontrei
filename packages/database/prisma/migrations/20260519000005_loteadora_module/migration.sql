-- Módulo Loteadora — loteamentos, lotes e reservas
CREATE TYPE "LoteStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'NEGOTIATING', 'SOLD', 'BLOCKED');

CREATE TABLE "loteamentos" (
    "id"             TEXT NOT NULL,
    "companyId"      TEXT NOT NULL,
    "name"           TEXT NOT NULL,
    "slug"           TEXT NOT NULL,
    "description"    TEXT,
    "city"           TEXT,
    "state"          TEXT,
    "coverImage"     TEXT,
    "status"         TEXT NOT NULL DEFAULT 'selling',
    "infrastructure" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loteamentos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lotes" (
    "id"           TEXT NOT NULL,
    "loteamentoId" TEXT NOT NULL,
    "quadra"       TEXT,
    "numero"       TEXT NOT NULL,
    "area"         DOUBLE PRECISION,
    "frente"       DOUBLE PRECISION,
    "fundo"        DOUBLE PRECISION,
    "price"        DECIMAL(12,2),
    "status"       "LoteStatus" NOT NULL DEFAULT 'AVAILABLE',
    "mapColumn"    INTEGER,
    "mapRow"       INTEGER,
    "description"  TEXT,
    "sunPosition"  TEXT,
    "notes"        TEXT,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lote_reservas" (
    "id"        TEXT NOT NULL,
    "loteId"    TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "phone"     TEXT,
    "status"    TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lote_reservas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "loteamentos_companyId_slug_key" ON "loteamentos"("companyId", "slug");
CREATE INDEX "loteamentos_companyId_idx" ON "loteamentos"("companyId");
CREATE INDEX "lotes_loteamentoId_idx" ON "lotes"("loteamentoId");
CREATE INDEX "lotes_loteamentoId_status_idx" ON "lotes"("loteamentoId", "status");
CREATE INDEX "lote_reservas_loteId_idx" ON "lote_reservas"("loteId");
CREATE INDEX "lote_reservas_status_expiresAt_idx" ON "lote_reservas"("status", "expiresAt");

ALTER TABLE "lotes" ADD CONSTRAINT "lotes_loteamentoId_fkey"
    FOREIGN KEY ("loteamentoId") REFERENCES "loteamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lote_reservas" ADD CONSTRAINT "lote_reservas_loteId_fkey"
    FOREIGN KEY ("loteId") REFERENCES "lotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
