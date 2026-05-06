-- Video Editor Module — Nível Máximo plan
-- Adds two tables:
--   1. video_editor_jobs   — one row per render job (24h TTL on output)
--   2. video_editor_quotas — daily limit + B-roll credit balance per company

-- ── video_editor_jobs ───────────────────────────────────────────────────────
CREATE TABLE "video_editor_jobs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMsg" TEXT,
    "expiresAt" TIMESTAMP(3),
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "inputClips" JSONB NOT NULL DEFAULT '[]',
    "audioKey" TEXT,
    "audioSource" TEXT,
    "presetId" TEXT,
    "transitionId" TEXT,
    "resolution" TEXT NOT NULL DEFAULT '1080p',
    "outputFormat" TEXT NOT NULL DEFAULT 'mp4',
    "captionsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "captionsLanguage" TEXT DEFAULT 'pt-BR',
    "captionsStyle" JSONB,
    "brollEnabled" BOOLEAN NOT NULL DEFAULT false,
    "brollPrompts" JSONB,
    "config" JSONB NOT NULL DEFAULT '{}',
    "outputKey" TEXT,
    "thumbnailKey" TEXT,
    "durationSec" INTEGER,
    "fileSizeBytes" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_editor_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "video_editor_jobs_companyId_idx" ON "video_editor_jobs"("companyId");
CREATE INDEX "video_editor_jobs_userId_idx"    ON "video_editor_jobs"("userId");
CREATE INDEX "video_editor_jobs_status_idx"   ON "video_editor_jobs"("status");
CREATE INDEX "video_editor_jobs_expiresAt_idx" ON "video_editor_jobs"("expiresAt");

ALTER TABLE "video_editor_jobs" ADD CONSTRAINT "video_editor_jobs_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "video_editor_jobs" ADD CONSTRAINT "video_editor_jobs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── video_editor_quotas ─────────────────────────────────────────────────────
CREATE TABLE "video_editor_quotas" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "dailyLimit" INTEGER NOT NULL DEFAULT 50,
    "dailyUsed" INTEGER NOT NULL DEFAULT 0,
    "dailyResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "brollCredits" INTEGER NOT NULL DEFAULT 0,
    "brollUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_editor_quotas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "video_editor_quotas_companyId_key" ON "video_editor_quotas"("companyId");

ALTER TABLE "video_editor_quotas" ADD CONSTRAINT "video_editor_quotas_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
