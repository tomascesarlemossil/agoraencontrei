-- Leads qualificados pelo briefing inteligente dos perfis de parceiros.

CREATE TABLE IF NOT EXISTS "partner_leads" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "partnerId" TEXT NOT NULL,
  "partnerName" TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  city TEXT,
  "projectType" TEXT,
  objective TEXT,
  budget TEXT,
  timeline TEXT,
  property TEXT,
  message TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  "scoreLabel" TEXT NOT NULL DEFAULT 'em_analise',
  "recommendedAction" TEXT,
  summary TEXT,
  "pageUrl" TEXT,
  referrer TEXT,
  "visitorIp" TEXT,
  "visitorUserAgent" TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "partner_leads_partner_idx"
  ON "partner_leads"("partnerId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "partner_leads_score_idx"
  ON "partner_leads"(score DESC);
