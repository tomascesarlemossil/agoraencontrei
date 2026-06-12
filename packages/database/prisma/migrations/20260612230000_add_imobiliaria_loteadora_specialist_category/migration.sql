-- Add IMOBILIARIA and LOTEADORA to the SpecialistCategory enum.
--
-- These two "premium" partner categories were offered (and priced) in the
-- public signup UI (/parceiros/cadastro) but were missing from the DB enum,
-- so POST /specialists returned 400 "Dados inválidos" for exactly the
-- flagship paid tier. Adding the values unblocks registration.
--
-- NOTE: production does not run `prisma migrate deploy` automatically, so this
-- statement must also be applied manually to the Neon database before the
-- feature works in production. It is idempotent (IF NOT EXISTS).
ALTER TYPE "SpecialistCategory" ADD VALUE IF NOT EXISTS 'IMOBILIARIA';
ALTER TYPE "SpecialistCategory" ADD VALUE IF NOT EXISTS 'LOTEADORA';
