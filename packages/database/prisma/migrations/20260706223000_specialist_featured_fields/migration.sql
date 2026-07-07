-- Destaque temporario para especialistas/parceiros.
-- Suporta Fase 4/5: planos de destaque e ranking por validade, sem billing.

ALTER TABLE "specialists"
  ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "featuredUntil" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "featuredWeight" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "specialists_featured_idx"
  ON "specialists"("isFeatured", "featuredUntil", "featuredWeight");
