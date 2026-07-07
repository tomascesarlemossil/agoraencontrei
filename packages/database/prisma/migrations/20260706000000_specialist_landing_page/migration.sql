-- "Divulgue seu Negócio": campos da landing page editável do especialista/parceiro.
ALTER TABLE "specialists" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "specialists" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "specialists" ADD COLUMN IF NOT EXISTS "businessType" TEXT;
ALTER TABLE "specialists" ADD COLUMN IF NOT EXISTS "landingPage" JSONB;
ALTER TABLE "specialists" ADD COLUMN IF NOT EXISTS "adPlan" TEXT;
