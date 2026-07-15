-- Registro imutável da análise no momento do encerramento do leilão (Desconto
-- Real, Nota AE, comparáveis). Aplicado em produção pelo runMigrations() em
-- runtime; a migration Prisma é para bases recriadas do zero. Idempotente.
ALTER TABLE "auctions" ADD COLUMN IF NOT EXISTS "analysisSnapshot" JSONB;
ALTER TABLE "auctions" ADD COLUMN IF NOT EXISTS "analysisSnapshotAt" TIMESTAMP(3);
