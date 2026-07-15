-- Agente de captura de imagem dos leilões: guarda a fachada via Street View e a
-- procedência da coverImage (leiloeiro x Street View x banner padrão), para a
-- página do leilão exibir a foto real e sinalizar a confiabilidade da imagem.
ALTER TABLE "auctions" ADD COLUMN IF NOT EXISTS "streetViewUrl" TEXT;
ALTER TABLE "auctions" ADD COLUMN IF NOT EXISTS "imageSource" TEXT;
ALTER TABLE "auctions" ADD COLUMN IF NOT EXISTS "imageCapturedAt" TIMESTAMP(3);
ALTER TABLE "auctions" ADD COLUMN IF NOT EXISTS "imageCaptureAttempts" INTEGER NOT NULL DEFAULT 0;
