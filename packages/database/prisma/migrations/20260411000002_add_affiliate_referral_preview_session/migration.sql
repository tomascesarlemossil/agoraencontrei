-- Affiliate Referral: Rastreio de indicação
CREATE TABLE "affiliate_referrals" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "tenantId" TEXT,
    "leadId" TEXT,
    "referralCode" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'link',
    "status" TEXT NOT NULL DEFAULT 'tracked',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affiliate_referrals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "affiliate_referrals_affiliateId_idx" ON "affiliate_referrals"("affiliateId");
CREATE INDEX "affiliate_referrals_tenantId_idx" ON "affiliate_referrals"("tenantId");
CREATE INDEX "affiliate_referrals_leadId_idx" ON "affiliate_referrals"("leadId");
CREATE INDEX "affiliate_referrals_status_idx" ON "affiliate_referrals"("status");
CREATE INDEX "affiliate_referrals_createdAt_idx" ON "affiliate_referrals"("createdAt");

ALTER TABLE "affiliate_referrals" ADD CONSTRAINT "affiliate_referrals_affiliateId_fkey"
    FOREIGN KEY ("affiliateId") REFERENCES "affiliates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Preview Sessions: Site temporário para demonstração comercial
CREATE TABLE "preview_sessions" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'urban_tech',
    "slogan" TEXT,
    "segment" TEXT NOT NULL DEFAULT 'corretor',
    "city" TEXT,
    "logoUrl" TEXT,
    "previewToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "preview_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "preview_sessions_previewToken_key" ON "preview_sessions"("previewToken");
CREATE INDEX "preview_sessions_siteName_idx" ON "preview_sessions"("siteName");
CREATE INDEX "preview_sessions_previewToken_idx" ON "preview_sessions"("previewToken");
CREATE INDEX "preview_sessions_expiresAt_idx" ON "preview_sessions"("expiresAt");
