-- Esteira de venda: per-stage checklist stored on the deal
ALTER TABLE "deals" ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}';
