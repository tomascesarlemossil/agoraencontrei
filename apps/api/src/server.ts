import 'dotenv/config'
import Fastify from 'fastify'
import { ZodError } from 'zod'
import { env, logEnvWarnings } from './utils/env.js'
import { initSentry, captureError } from './utils/sentry.js'
import { seedIbgeFrancaTerritory } from './services/ibge-territorial-seed.service.js'

// ── v2026.04.01 ────────────────────────────────────────────────────────────
// ── Plugins ────────────────────────────────────────────────────────────────
import corsPlugin from './plugins/cors.js'
import helmetPlugin from './plugins/helmet.js'
import jwtPlugin from './plugins/jwt.js'
import prismaPlugin from './plugins/prisma.js'
import rateLimitPlugin from './plugins/rate-limit.js'
import swaggerPlugin from './plugins/swagger.js'
import redisPlugin from './plugins/redis.js'
import automationPlugin from './plugins/automation.js'
import multipart from '@fastify/multipart'
import compress from '@fastify/compress'

// ── Routes ─────────────────────────────────────────────────────────────────
import healthRoutes from './routes/health.js'
import authRoutes from './routes/auth/index.js'
import firstAccessRoutes from './routes/auth/first-access.js'
import usersRoutes from './routes/users/index.js'
import propertiesRoutes from './routes/properties/index.js'
import leadsRoutes from './routes/leads/index.js'
import contactsRoutes from './routes/contacts/index.js'
import dealsRoutes from './routes/deals/index.js'
import activitiesRoutes from './routes/activities/index.js'
import reportsRoutes from './routes/reports/index.js'
import portalsRoutes from './routes/portals/index.js'
import whatsappRoutes from './routes/whatsapp/index.js'
import inboxRoutes from './routes/inbox/index.js'
import agentsRoutes from './routes/agents/index.js'
import uploadRoutes from './routes/upload/index.js'
import automationsRoutes from './routes/automations/index.js'
import eventsRoutes from './routes/events/index.js'
import publicRoutes from './routes/public/index.js'
import financeRoutes from './routes/finance/index.js'
import invoiceRoutes from './routes/finance/invoices.js'
import batchSettleRoutes from './routes/finance/batch-settle.js'
import fiscalRoutes from './routes/fiscal/index.js'
import corretorRoutes from './routes/users/corretor.js'
import aiVisualRoutes from './routes/ai-visual/index.js'
import renovacoesRoutes from './routes/crm/renovacoes.js'
import campanhasRoutes from './routes/marketing/campanhas.js'
import financingsRoutes from './routes/financings/index.js'
import blogRoutes from './routes/blog/index.js'
import cepRoutes from './routes/cep/index.js'
import socialRoutes from './routes/social/index.js'
import documentsRoutes from './routes/documents/index.js'
import portalClientRoutes from './routes/portal/index.js'
import auditLogsRoutes from './routes/audit-logs/index.js'
import photoEditorRoutes from './routes/photo-editor/index.js'
import videoEditorRoutes from './routes/video-editor/index.js'
import systemConfigRoutes from './routes/system-config/index.js'
import legalRoutes from './routes/legal/index.js'
import financeAutomationRoutes from './routes/finance/automation.js'
import alertsRoutes from './routes/alerts/index.js'
import auctionsRoutes from './routes/auctions/index.js'
import auctionsArchiveRoutes from './routes/auctions-archive/index.js'
import specialistsRoutes from './routes/specialists/index.js'
import { specialistPaymentRoutes } from './routes/specialists/payments.js'
import { ScraperScheduler } from './services/scrapers/scheduler.js'
import { AuctionMonitorService } from './services/auction-monitor.service.js'
import { PredatoryProtocol } from './services/predatory/protocol.js'
import { bootstrapDefaultPlans } from './services/bootstrap-plans.js'
import { AutoHealingService } from './services/auto-healing.service.js'
// Manus auctionsRoute desativada — conflita com publicRoutes no mesmo prefix
// import { auctionsRoute } from './routes/public/auctions.js'
import { freeListingRoutes } from './routes/public/free-listing.js'
import { partnerRegisterRoute } from './routes/public/partner-register.js'
import { partnerAnalyticsRoute } from './routes/public/partner-analytics.js'
import { territoryRoute } from './routes/public/territory.js'
import { valuationRoutes } from './routes/public/valuation.js'
import { publicPhotoEditorRoutes } from './routes/public/photo-editor.js'
import seoProgramaticoRoutes from './routes/seo-programatico/index.js'
import financialAnalysisRoutes from './routes/financial/index.js'
import seoIndexingRoutes from './routes/seo/indexing.js'
import aiMarketingRoutes from './routes/ai-marketing/index.js'
import leadScoringRoutes from './routes/lead-scoring/index.js'
import maintenanceRoutes from './routes/maintenance/index.js'
import ownerDashboardRoutes from './routes/owner-dashboard/index.js'
import billingAutomationRoutes from './routes/billing/index.js'
import saasBillingRoutes from './routes/billing/saas-checkout.js'
import saasWebhookRoutes from './routes/billing/saas-webhook.js'
import asaasWebhookRoutes from './routes/finance/webhook.js'
import tenantRoutes from './routes/tenants/index.js'
import repasseRoutes from './routes/repasse/index.js'
import payablesRoutes from './routes/payables/index.js'
import rescissionRoutes from './routes/rescission/index.js'
import agreementsRoutes from './routes/agreements/index.js'
import noticesRoutes from './routes/notices/index.js'
import reconciliationRoutes from './routes/reconciliation/index.js'
import permissionsRoutes from './routes/permissions/index.js'
import iptuRoutes from './routes/iptu/index.js'
import signatureRoutes from './routes/signatures/index.js'
import auctionAIRoutes from './routes/auction-ai/index.js'
import importRoutes from './routes/import/index.js'
import masterRoutes from './routes/master/index.js'
import { publicCatalogRoutes } from './routes/master/admin-config.js'
import streetviewRoutes from './routes/streetview/index.js'
import tomasRoutes from './routes/tomas/index.js'
import notificationsRoutes from './routes/notifications/index.js'
import integrationsRoutes from './routes/integrations/index.js'
import exchangeRoutes from './routes/exchange/index.js'
import loteadoraRoutes from './routes/loteadora/index.js'
import apiKeysRoutes from './routes/api-keys/index.js'
import publicApiRoutes from './routes/public-api/index.js'
import outgoingWebhooksRoutes from './routes/outgoing-webhooks/index.js'
import marketRoutes from './routes/market/index.js'
import systemEventsRoutes from './routes/system-events/index.js'
import visitsRoutes from './routes/visits/index.js'
import proposalsRoutes from './routes/proposals/index.js'
import hunterRoutes from './routes/hunter/index.js'
import affiliateRoutes from './routes/affiliates/index.js'
import saasFinanceRoutes from './routes/saas-finance/index.js'
import previewRoutes from './routes/preview/index.js'
import outboundRoutes from './routes/outbound/index.js'
import waCampaignsRoutes from './routes/wa-campaigns/index.js'

import { sensitiveSerializer } from './utils/log-sanitizer.js'
import { safeStringEqual } from './utils/crypto-safe.js'

// ── Body limits ───────────────────────────────────────────────────────────
// JSON / url-encoded bodies stay small (protects every route from DoS
// amplification via huge request bodies). Large file uploads have their own
// multipart limit, set on the @fastify/multipart plugin below.
const JSON_BODY_LIMIT = 2 * 1024 * 1024             // 2 MB
const MULTIPART_FILE_LIMIT = 50 * 1024 * 1024       // 50 MB per file

const app = Fastify({
  bodyLimit: JSON_BODY_LIMIT,
  logger: {
    level: env.LOG_LEVEL,
    serializers: sensitiveSerializer as any,
    ...(env.NODE_ENV === 'development' && {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard' },
      },
    }),
  },
  trustProxy: true,
  ajv: {
    customOptions: {
      removeAdditional: 'all',
      coerceTypes: 'array',
      useDefaults: true,
    },
  },
})

async function runMigrations(prisma: any) {
  // ── Platform super-admin enforcement ────────────────────────────────────
  // Garante que O ÚNICO super-admin da PLATAFORMA AgoraEncontrei tenha o papel
  // correto no boot (sem reset de senha em código).
  //
  // IMPORTANTE: `tomascesarlemossilva@gmail.com` foi REMOVIDO desta lista de
  // propósito — esse e-mail passou a ser ADMIN da empresa Imobiliária Lemos
  // (parceiro), não super-admin da plataforma. Reintroduzi-lo aqui reverteria,
  // a cada deploy/restart, a separação plataforma × parceiro. O papel do gmail
  // é definido pelo script scripts/provision-imobiliaria-lemos.ts.
  try {
    for (const email of ['tomas@agoraencontrei.com.br']) {
      await prisma.$executeRawUnsafe(
        `UPDATE users SET role = 'SUPER_ADMIN', status = 'ACTIVE', "emailVerifiedAt" = COALESCE("emailVerifiedAt", NOW()) WHERE email = $1 AND role != 'SUPER_ADMIN'`,
        email
      ).catch(() => {})
    }
  } catch { /* skip silently */ }

  const columns = [
    ['pricePromo',               'DECIMAL(12,2)'],
    ['pricePerM2',               'DECIMAL(10,2)'],
    ['allowExchange',            'BOOLEAN NOT NULL DEFAULT false'],
    ['valueUnderConsultation',   'BOOLEAN NOT NULL DEFAULT false'],
    ['currentState',             'TEXT'],
    ['occupation',               'TEXT'],
    ['standard',                 'TEXT'],
    ['auxReference',             'TEXT'],
    ['commercialNeighborhood',   'TEXT'],
    ['region',                   'TEXT'],
    ['referencePoint',           'TEXT'],
    ['closedCondo',              'BOOLEAN NOT NULL DEFAULT false'],
    ['adminCompany',             'TEXT'],
    ['constructionCompany',      'TEXT'],
    ['signOnSite',               'BOOLEAN NOT NULL DEFAULT false'],
    ['suitesWithCloset',         'INTEGER NOT NULL DEFAULT 0'],
    ['demiSuites',               'INTEGER NOT NULL DEFAULT 0'],
    ['rooms',                    'INTEGER NOT NULL DEFAULT 0'],
    ['livingRooms',              'INTEGER NOT NULL DEFAULT 0'],
    ['diningRooms',              'INTEGER NOT NULL DEFAULT 0'],
    ['tvRooms',                  'INTEGER NOT NULL DEFAULT 0'],
    ['garagesCovered',           'INTEGER NOT NULL DEFAULT 0'],
    ['garagesOpen',              'INTEGER NOT NULL DEFAULT 0'],
    ['elevators',                'INTEGER NOT NULL DEFAULT 0'],
    ['commonArea',               'DOUBLE PRECISION'],
    ['ceilingHeight',            'DOUBLE PRECISION'],
    ['landDimensions',           'TEXT'],
    ['landFace',                 'TEXT'],
    ['sunExposure',              'TEXT'],
    ['position',                 'TEXT'],
    ['descriptionInternal',      'TEXT'],
    ['cib',                      'TEXT'],
    ['iptuRegistration',         'TEXT'],
    ['cartorioMatricula',        'TEXT'],
    ['electricityInfo',          'TEXT'],
    ['waterInfo',                'TEXT'],
    ['documentationPending',     'BOOLEAN NOT NULL DEFAULT false'],
    ['documentationNotes',       'TEXT'],
    ['isReserved',               'BOOLEAN NOT NULL DEFAULT false'],
    ['authorizedPublish',        'BOOLEAN NOT NULL DEFAULT false'],
    ['captorName',               'TEXT'],
    ['captorCommissionPct',      'DOUBLE PRECISION'],
    ['exclusivityContract',      'BOOLEAN NOT NULL DEFAULT false'],
    ['commercialConditions',     'TEXT'],
    ['yearLastReformed',         'INTEGER'],
    ['keyLocation',              'TEXT'],
    ['totalFloors',              'INTEGER'],
    ['showExactLocation',        'BOOLEAN NOT NULL DEFAULT false'],
    ['streetViewUrl',            'TEXT'],
  ]

  // ── Auction tables migration ─────────────────────────────────────────────
  const auctionMigrations = [
    `CREATE TABLE IF NOT EXISTS auctions (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "companyId" TEXT REFERENCES companies(id),
      "externalId" TEXT,
      source TEXT NOT NULL DEFAULT 'LEILOEIRO',
      "sourceUrl" TEXT,
      "auctioneerName" TEXT,
      status TEXT NOT NULL DEFAULT 'UPCOMING',
      modality TEXT NOT NULL DEFAULT 'ONLINE',
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      "propertyType" TEXT NOT NULL DEFAULT 'HOUSE',
      category TEXT NOT NULL DEFAULT 'RESIDENTIAL',
      street TEXT, number TEXT, complement TEXT, neighborhood TEXT,
      city TEXT, state TEXT, "zipCode" TEXT,
      latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
      "totalArea" DOUBLE PRECISION, "builtArea" DOUBLE PRECISION, "landArea" DOUBLE PRECISION,
      bedrooms INTEGER NOT NULL DEFAULT 0, bathrooms INTEGER NOT NULL DEFAULT 0, "parkingSpaces" INTEGER NOT NULL DEFAULT 0,
      "appraisalValue" DECIMAL(14,2), "minimumBid" DECIMAL(14,2),
      "firstRoundBid" DECIMAL(14,2), "secondRoundBid" DECIMAL(14,2),
      "currentBid" DECIMAL(14,2), "soldValue" DECIMAL(14,2),
      "discountPercent" DOUBLE PRECISION,
      "firstRoundDate" TIMESTAMPTZ, "secondRoundDate" TIMESTAMPTZ,
      "auctionDate" TIMESTAMPTZ, "auctionEndDate" TIMESTAMPTZ, "visitDate" TIMESTAMPTZ,
      "processNumber" TEXT, court TEXT, occupation TEXT,
      "hasDebts" BOOLEAN, "debtDetails" TEXT, "editalUrl" TEXT,
      "bankName" TEXT, "financingAvailable" BOOLEAN NOT NULL DEFAULT false, "fgtsAllowed" BOOLEAN NOT NULL DEFAULT false,
      "coverImage" TEXT, images TEXT[] NOT NULL DEFAULT '{}',
      "opportunityScore" INTEGER, "estimatedROI" DOUBLE PRECISION,
      "marketPriceEstimate" DECIMAL(14,2), "pricePerM2" DECIMAL(10,2),
      tags TEXT[] NOT NULL DEFAULT '{}', metadata JSONB NOT NULL DEFAULT '{}',
      "lastScrapedAt" TIMESTAMPTZ, "scrapedHash" TEXT, "isVerified" BOOLEAN NOT NULL DEFAULT false,
      views INTEGER NOT NULL DEFAULT 0, favorites INTEGER NOT NULL DEFAULT 0, "alertsSent" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS scraper_runs (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      source TEXT NOT NULL,
      "sourceUrl" TEXT,
      status TEXT NOT NULL DEFAULT 'RUNNING',
      "startedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "finishedAt" TIMESTAMPTZ,
      "itemsFound" INTEGER NOT NULL DEFAULT 0,
      "itemsCreated" INTEGER NOT NULL DEFAULT 0,
      "itemsUpdated" INTEGER NOT NULL DEFAULT 0,
      "itemsRemoved" INTEGER NOT NULL DEFAULT 0,
      "errorMessage" TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'
    )`,
    `CREATE INDEX IF NOT EXISTS auctions_source_idx ON auctions(source)`,
    `CREATE INDEX IF NOT EXISTS auctions_status_idx ON auctions(status)`,
    `CREATE INDEX IF NOT EXISTS auctions_city_state_idx ON auctions(city, state)`,
    `CREATE INDEX IF NOT EXISTS auctions_discount_idx ON auctions("discountPercent")`,
    `CREATE INDEX IF NOT EXISTS auctions_created_idx ON auctions("createdAt" DESC)`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "streetViewUrl" TEXT`,
    // ── Agente de captura de imagem (origin: 20260715140000_auction_image_capture)
    //    Sem estes ALTERs o findUnique do Prisma seleciona colunas inexistentes e
    //    TODA página de leilão responde 500 (P2022). Idempotente.
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "imageSource" TEXT`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "imageCapturedAt" TIMESTAMPTZ`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "imageCaptureAttempts" INTEGER NOT NULL DEFAULT 0`,
    // ── Reconciliação: colunas presentes no schema Prisma mas ausentes do
    //    CREATE TABLE acima. O scraper já escreve algumas destas (registryNumber,
    //    registryOffice, debtorName, documentsUrls, features) — sem estes ALTERs
    //    uma base recriada do zero quebraria a ingestão. Idempotente.
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "auctioneerUrl" TEXT`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "auctioneerCnpj" TEXT`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "auctioneerJucesp" TEXT`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "itbiEstimate" DECIMAL(12,2)`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "registryEstimate" DECIMAL(12,2)`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "lawyerEstimate" DECIMAL(12,2)`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "evictionEstimate" DECIMAL(12,2)`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS judge TEXT`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "registryNumber" TEXT`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "registryOffice" TEXT`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "debtorName" TEXT`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "creditorName" TEXT`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS restrictions TEXT`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "bankBranch" TEXT`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "documentsUrls" TEXT[] NOT NULL DEFAULT '{}'`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS features TEXT[] NOT NULL DEFAULT '{}'`,
    // ── Ciclo de vida / arquivo histórico ────────────────────────────────────
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "firstSeenAt" TIMESTAMPTZ`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMPTZ`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "disappearedAt" TIMESTAMPTZ`,
    `CREATE INDEX IF NOT EXISTS auctions_disappeared_idx ON auctions("disappearedAt")`,
    // ── Desfecho do leilão (arrematado por quanto / deserto) ──────────────────
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "soldDate" TIMESTAMPTZ`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "outcomeCapturedAt" TIMESTAMPTZ`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "outcomeAttempts" INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "detailEnrichedAt" TIMESTAMPTZ`,
    // Reconcilia auction_bids legado (amount/status/createdAt) com o modelo
    // histórico atual. A tabela já existia em produção, então CREATE IF NOT
    // EXISTS não adicionava as colunas novas e quebrava o detalhe com P2022.
    `ALTER TABLE auction_bids ADD COLUMN IF NOT EXISTS round INTEGER NOT NULL DEFAULT 1`,
    `ALTER TABLE auction_bids ADD COLUMN IF NOT EXISTS "bidValue" DECIMAL(14,2)`,
    `ALTER TABLE auction_bids ADD COLUMN IF NOT EXISTS "bidderName" TEXT`,
    `ALTER TABLE auction_bids ADD COLUMN IF NOT EXISTS "bidderCpf" TEXT`,
    `ALTER TABLE auction_bids ADD COLUMN IF NOT EXISTS "bidDate" TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
    `ALTER TABLE auction_bids ADD COLUMN IF NOT EXISTS "isWinning" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE auction_bids ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'`,
    `UPDATE auction_bids SET "bidValue" = amount WHERE "bidValue" IS NULL AND amount IS NOT NULL`,
    `ALTER TABLE auction_bids ALTER COLUMN "bidValue" SET NOT NULL`,
    `ALTER TABLE auction_bids ALTER COLUMN amount DROP NOT NULL`,
    // Reconcilia auction_analyses legado (analysis/roi/risks) com o modelo
    // financeiro atual usado no include da página de detalhe.
    `ALTER TABLE auction_analyses ADD COLUMN IF NOT EXISTS "totalCost" DECIMAL(14,2)`,
    `ALTER TABLE auction_analyses ADD COLUMN IF NOT EXISTS "marketValue" DECIMAL(14,2)`,
    `ALTER TABLE auction_analyses ADD COLUMN IF NOT EXISTS "potentialProfit" DECIMAL(14,2)`,
    `ALTER TABLE auction_analyses ADD COLUMN IF NOT EXISTS "roiPercent" DOUBLE PRECISION`,
    `ALTER TABLE auction_analyses ADD COLUMN IF NOT EXISTS "paybackMonths" INTEGER`,
    `ALTER TABLE auction_analyses ADD COLUMN IF NOT EXISTS "bidValue" DECIMAL(14,2)`,
    `ALTER TABLE auction_analyses ADD COLUMN IF NOT EXISTS "itbiValue" DECIMAL(12,2)`,
    `ALTER TABLE auction_analyses ADD COLUMN IF NOT EXISTS "registryValue" DECIMAL(12,2)`,
    `ALTER TABLE auction_analyses ADD COLUMN IF NOT EXISTS "lawyerValue" DECIMAL(12,2)`,
    `ALTER TABLE auction_analyses ADD COLUMN IF NOT EXISTS "reformValue" DECIMAL(12,2)`,
    `ALTER TABLE auction_analyses ADD COLUMN IF NOT EXISTS "evictionValue" DECIMAL(12,2)`,
    `ALTER TABLE auction_analyses ADD COLUMN IF NOT EXISTS "otherCosts" DECIMAL(12,2)`,
    `ALTER TABLE auction_analyses ADD COLUMN IF NOT EXISTS "riskLevel" TEXT`,
    `ALTER TABLE auction_analyses ADD COLUMN IF NOT EXISTS recommendation TEXT`,
    `ALTER TABLE auction_analyses ADD COLUMN IF NOT EXISTS "aiModel" TEXT`,
    `UPDATE auction_analyses SET "roiPercent" = roi WHERE "roiPercent" IS NULL AND roi IS NOT NULL`,
    `UPDATE auction_analyses SET recommendation = analysis WHERE recommendation IS NULL AND analysis IS NOT NULL`,
    `ALTER TABLE auction_analyses ALTER COLUMN analysis DROP NOT NULL`,
    // Corrige a classificação histórica criada pelo monitor antigo: sumir da
    // fonte significa deslistado/encerrado, não suspensão comprovada.
    `UPDATE auctions SET status = 'CLOSED' WHERE status = 'SUSPENDED' AND "disappearedAt" IS NOT NULL`,
    // Versões antigas do monitor gravaram SUSPENDED antes de disappearedAt
    // existir. Para fontes bancárias, esses registros significam apenas que o
    // item não foi reencontrado; reclassificamos como encerrado sem desfecho.
    `UPDATE auctions SET status = 'CLOSED' WHERE status = 'SUSPENDED' AND source IN ('CAIXA','BANCO_DO_BRASIL','BRADESCO','SANTANDER','ITAU') AND "outcomeCapturedAt" IS NULL`,
    // ── Snapshots temporais (histórico imutável de cada mudança observada) ────
    `CREATE TABLE IF NOT EXISTS auction_snapshots (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "auctionId" TEXT NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
      "capturedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "scrapedHash" TEXT,
      status TEXT,
      "appraisalValue" DECIMAL(14,2),
      "minimumBid" DECIMAL(14,2),
      "currentBid" DECIMAL(14,2),
      "soldValue" DECIMAL(14,2),
      "discountPercent" DOUBLE PRECISION,
      raw JSONB NOT NULL DEFAULT '{}'
    )`,
    `CREATE INDEX IF NOT EXISTS auction_snapshots_auction_idx ON auction_snapshots("auctionId", "capturedAt")`,
    // ── Documentos arquivados (edital, matrícula, laudo, ata) → S3 ────────────
    `CREATE TABLE IF NOT EXISTS auction_documents (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "auctionId" TEXT NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'OUTRO',
      "sourceUrl" TEXT NOT NULL,
      "s3Key" TEXT, "s3Url" TEXT,
      sha256 TEXT NOT NULL,
      "sizeBytes" INTEGER,
      "mimeType" TEXT,
      "extractedText" TEXT,
      status TEXT NOT NULL DEFAULT 'ARCHIVED',
      "capturedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS auction_documents_auction_sha_key ON auction_documents("auctionId", sha256)`,
    `CREATE INDEX IF NOT EXISTS auction_documents_auction_idx ON auction_documents("auctionId")`,
    `CREATE INDEX IF NOT EXISTS auction_documents_type_idx ON auction_documents(type)`,
    // ── Identidade canônica do imóvel (agrupa leilões do mesmo imóvel no tempo) ─
    `CREATE TABLE IF NOT EXISTS auction_property_identities (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "registryKey" TEXT UNIQUE,
      "addressKey" TEXT UNIQUE,
      city TEXT, state TEXT, neighborhood TEXT,
      "auctionCount" INTEGER NOT NULL DEFAULT 0,
      "firstAuctionAt" TIMESTAMPTZ,
      "lastAuctionAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS auction_identities_city_idx ON auction_property_identities(city, state)`,
    `ALTER TABLE auctions ADD COLUMN IF NOT EXISTS "identityId" TEXT`,
    `CREATE INDEX IF NOT EXISTS auctions_identity_idx ON auctions("identityId")`,
    `CREATE INDEX IF NOT EXISTS scraper_runs_source_idx ON scraper_runs(source)`,
    `CREATE INDEX IF NOT EXISTS scraper_runs_started_idx ON scraper_runs("startedAt")`,
  ]

  // ── Specialists migration ────────────────────────────────────────────────
  const specialistsMigrations = [
    `CREATE TABLE IF NOT EXISTS specialists (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT, whatsapp TEXT,
      category TEXT NOT NULL DEFAULT 'OUTRO',
      bio TEXT, city TEXT NOT NULL DEFAULT 'Franca', state TEXT NOT NULL DEFAULT 'SP',
      crea TEXT, instagram TEXT, website TEXT, "photoUrl" TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      tags TEXT[] NOT NULL DEFAULT '{}',
      "logoUrl" TEXT,
      address TEXT,
      "businessType" TEXT,
      "landingPage" JSONB,
      "adPlan" TEXT,
      "welcomeEmailSentAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS buildings (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      city TEXT NOT NULL DEFAULT 'Franca', state TEXT NOT NULL DEFAULT 'SP',
      neighborhood TEXT, address TEXT, floors INTEGER, units INTEGER, "yearBuilt" INTEGER,
      description TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS specialist_buildings (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "specialistId" TEXT NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
      "buildingId" TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
      "projectType" TEXT, year INTEGER,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE("specialistId", "buildingId")
    )`,
    `CREATE INDEX IF NOT EXISTS specialists_status_idx ON specialists(status)`,
    // Campos do produto "Divulgue seu Negocio" (landing page editavel).
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "logoUrl" TEXT`,
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS address TEXT`,
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "businessType" TEXT`,
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "landingPage" JSONB`,
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "adPlan" TEXT`,
    // Campos de pagamento (idempotentes)
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS cpfcnpj TEXT`,
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'START'`,
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "planStatus" TEXT DEFAULT 'FREE'`,
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "planActivatedAt" TIMESTAMP`,
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "planExpiresAt" TIMESTAMP`,
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "featuredUntil" TIMESTAMP`,
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "featuredWeight" INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "asaasCustomerId" TEXT`,
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "asaasSubscriptionId" TEXT`,
    // Magic-link de acesso ao painel do especialista (login sem senha).
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "accessToken" TEXT`,
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "accessTokenSentAt" TIMESTAMP`,
    `CREATE UNIQUE INDEX IF NOT EXISTS specialists_access_token_key ON specialists("accessToken")`,
    `CREATE INDEX IF NOT EXISTS specialists_plan_idx ON specialists(plan)`,
    `CREATE INDEX IF NOT EXISTS specialists_featured_idx ON specialists("isFeatured", "featuredUntil", "featuredWeight")`,
    `CREATE INDEX IF NOT EXISTS specialists_category_idx ON specialists(category)`,
    `CREATE INDEX IF NOT EXISTS buildings_city_idx ON buildings(city, state)`,
  ]
  for (const sql of specialistsMigrations) {
    try { await prisma.$executeRawUnsafe(sql) } catch { /* already exists */ }
  }

  // ── Tomás: coluna do cérebro na memória (separa marketplace × parceiro) ──
  // Aditiva e idempotente — segura em produção (não reescreve dados).
  const tomasMigrations = [
    `ALTER TABLE tomas_chats ADD COLUMN IF NOT EXISTS "brain" TEXT`,
    `CREATE INDEX IF NOT EXISTS tomas_chats_brain_idx ON tomas_chats(brain)`,
    // Consentimento de transferência de lead marketplace → parceiro (Fase 4).
    `CREATE TABLE IF NOT EXISTS lead_transfer_consents (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "chatId" TEXT,
      "visitorId" TEXT,
      "leadId" TEXT,
      "fromBrain" TEXT NOT NULL DEFAULT 'marketplace',
      "toCompanyId" TEXT NOT NULL,
      "toCompanyName" TEXT,
      purpose TEXT NOT NULL,
      channel TEXT NOT NULL,
      "dataShared" JSONB NOT NULL DEFAULT '{}',
      "consentText" TEXT NOT NULL,
      "consentVersion" TEXT NOT NULL,
      source TEXT,
      granted BOOLEAN NOT NULL DEFAULT true,
      "grantedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "revokedAt" TIMESTAMP,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS lead_transfer_consents_company_idx ON lead_transfer_consents("toCompanyId")`,
    `CREATE INDEX IF NOT EXISTS lead_transfer_consents_visitor_idx ON lead_transfer_consents("visitorId")`,
    `CREATE INDEX IF NOT EXISTS lead_transfer_consents_chat_idx ON lead_transfer_consents("chatId")`,
    `CREATE INDEX IF NOT EXISTS lead_transfer_consents_lead_idx ON lead_transfer_consents("leadId")`,
  ]
  for (const sql of tomasMigrations) {
    try { await prisma.$executeRawUnsafe(sql) } catch { /* already exists */ }
  }

  for (const sql of auctionMigrations) {
    try {
      await prisma.$executeRawUnsafe(sql)
    } catch { /* already exists */ }
  }

  // ── Partners & Territory tables (used by partner-analytics, territory routes) ──
  const partnerMigrations = [
    `CREATE TABLE IF NOT EXISTS partners (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      specialty TEXT,
      company TEXT,
      creci TEXT,
      bio TEXT,
      plan TEXT NOT NULL DEFAULT 'FREE',
      "isFounder" BOOLEAN NOT NULL DEFAULT false,
      "planPrice" DECIMAL(10,2),
      condos TEXT[] NOT NULL DEFAULT '{}',
      active BOOLEAN NOT NULL DEFAULT true,
      city TEXT NOT NULL DEFAULT 'Franca',
      state TEXT NOT NULL DEFAULT 'SP',
      "whatsappClicks" INTEGER NOT NULL DEFAULT 0,
      "profileViews" INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS partner_analytics (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "partnerId" TEXT NOT NULL,
      event TEXT NOT NULL,
      "condoName" TEXT,
      "condoSlug" TEXT,
      "auctionId" TEXT,
      "propertyId" TEXT,
      "visitorIp" TEXT,
      "visitorUserAgent" TEXT,
      referrer TEXT,
      "pageUrl" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS partner_leads (
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
    )`,
    `CREATE TABLE IF NOT EXISTS territory_claims (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "partnerId" TEXT NOT NULL,
      "partnerName" TEXT,
      "partnerPlan" TEXT,
      "territoryType" TEXT NOT NULL DEFAULT 'BUILDING',
      neighborhood TEXT,
      "buildingName" TEXT,
      "buildingSlug" TEXT,
      city TEXT NOT NULL DEFAULT 'Franca',
      state TEXT NOT NULL DEFAULT 'SP',
      "priorityScore" INTEGER NOT NULL DEFAULT 10,
      "isExclusive" BOOLEAN NOT NULL DEFAULT false,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      "claimedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS territory_waitlist (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      specialty TEXT,
      neighborhood TEXT,
      "buildingName" TEXT,
      "buildingSlug" TEXT,
      city TEXT NOT NULL DEFAULT 'Franca',
      state TEXT NOT NULL DEFAULT 'SP',
      message TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS partner_analytics_partner_idx ON partner_analytics("partnerId")`,
    `CREATE INDEX IF NOT EXISTS partner_analytics_created_idx ON partner_analytics("createdAt")`,
    `CREATE INDEX IF NOT EXISTS partner_leads_partner_idx ON partner_leads("partnerId", "createdAt" DESC)`,
    `CREATE INDEX IF NOT EXISTS partner_leads_score_idx ON partner_leads(score DESC)`,
    `CREATE INDEX IF NOT EXISTS territory_claims_partner_idx ON territory_claims("partnerId")`,
    `CREATE INDEX IF NOT EXISTS territory_claims_slug_idx ON territory_claims("buildingSlug")`,
  ]
  for (const sql of partnerMigrations) {
    try { await prisma.$executeRawUnsafe(sql) } catch { /* already exists */ }
  }

  // ── Valuation requests (CPF-based limit: 1 free, R$200 after) ──────────
  const valuationMigrations = [
    `CREATE TABLE IF NOT EXISTS valuation_requests (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      cpf TEXT NOT NULL,
      name TEXT,
      email TEXT,
      phone TEXT,
      "propertyCity" TEXT,
      "propertyType" TEXT,
      "asaasChargeId" TEXT,
      "asaasPaymentUrl" TEXT,
      "paymentStatus" TEXT NOT NULL DEFAULT 'FREE',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS valuation_cpf_idx ON valuation_requests(cpf)`,
  ]
  for (const sql of valuationMigrations) {
    try { await prisma.$executeRawUnsafe(sql) } catch { /* already exists */ }
  }

  // ── AI Marketing, Lead Scoring, Billing Automation tables ──────────────
  const nexusImobiMigrations = [
    `CREATE TABLE IF NOT EXISTS lead_interactions (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "leadId" TEXT,
      "contactId" TEXT,
      "sessionId" TEXT,
      "eventType" TEXT NOT NULL,
      "propertyId" TEXT,
      metadata JSONB NOT NULL DEFAULT '{}',
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS lead_interactions_lead_idx ON lead_interactions("leadId")`,
    `CREATE INDEX IF NOT EXISTS lead_interactions_session_idx ON lead_interactions("sessionId")`,
    `CREATE INDEX IF NOT EXISTS lead_interactions_event_idx ON lead_interactions("eventType")`,
    `CREATE INDEX IF NOT EXISTS lead_interactions_created_idx ON lead_interactions("createdAt")`,

    `CREATE TABLE IF NOT EXISTS billing_rules (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "companyId" TEXT NOT NULL,
      name TEXT NOT NULL,
      "daysOffset" INTEGER NOT NULL,
      channel TEXT NOT NULL DEFAULT 'whatsapp',
      "templateKey" TEXT NOT NULL,
      message TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "isAutomated" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS billing_rules_company_idx ON billing_rules("companyId")`,

    `CREATE TABLE IF NOT EXISTS billing_notifications (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "companyId" TEXT NOT NULL,
      "rentalId" TEXT NOT NULL,
      "contractId" TEXT,
      "ruleId" TEXT,
      channel TEXT NOT NULL,
      "templateKey" TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SENT',
      message TEXT,
      "errorMsg" TEXT,
      "sentAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS billing_notifications_company_idx ON billing_notifications("companyId")`,
    `CREATE INDEX IF NOT EXISTS billing_notifications_rental_idx ON billing_notifications("rentalId")`,

    `CREATE TABLE IF NOT EXISTS owner_repasses (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "companyId" TEXT NOT NULL,
      "contractId" TEXT NOT NULL,
      "landlordId" TEXT NOT NULL,
      "rentalId" TEXT,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      "grossValue" DECIMAL(12,2) NOT NULL,
      "commissionValue" DECIMAL(12,2) NOT NULL,
      "adminFeeValue" DECIMAL(12,2),
      "netValue" DECIMAL(12,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      "paidAt" TIMESTAMPTZ,
      "paymentMethod" TEXT,
      "paymentRef" TEXT,
      notes TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS owner_repasses_company_idx ON owner_repasses("companyId")`,
    `CREATE INDEX IF NOT EXISTS owner_repasses_landlord_idx ON owner_repasses("landlordId")`,
    `CREATE INDEX IF NOT EXISTS owner_repasses_status_idx ON owner_repasses(status)`,

    `CREATE TABLE IF NOT EXISTS property_valuations (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "propertyId" TEXT NOT NULL,
      "valuatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      value DECIMAL(14,2) NOT NULL,
      source TEXT NOT NULL DEFAULT 'ai',
      "pricePerM2" DECIMAL(10,2),
      methodology TEXT,
      notes TEXT,
      metadata JSONB NOT NULL DEFAULT '{}'
    )`,
    `CREATE INDEX IF NOT EXISTS property_valuations_property_idx ON property_valuations("propertyId")`,

    `CREATE TABLE IF NOT EXISTS social_posts (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "companyId" TEXT NOT NULL,
      "propertyId" TEXT,
      platform TEXT NOT NULL,
      caption TEXT NOT NULL,
      hashtags TEXT,
      "imageUrls" TEXT[] NOT NULL DEFAULT '{}',
      "postId" TEXT,
      "postUrl" TEXT,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      "scheduledAt" TIMESTAMPTZ,
      "publishedAt" TIMESTAMPTZ,
      "errorMsg" TEXT,
      metadata JSONB NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS social_posts_company_idx ON social_posts("companyId")`,
    `CREATE INDEX IF NOT EXISTS social_posts_property_idx ON social_posts("propertyId")`,
    `CREATE INDEX IF NOT EXISTS social_posts_status_idx ON social_posts(status)`,
  ]
  for (const sql of nexusImobiMigrations) {
    try { await prisma.$executeRawUnsafe(sql) } catch { /* already exists */ }
  }

  // ── SaaS Multi-tenant tables ──────────────────────────────────────────────
  const saasMigrations = [
    `CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "ownerId" TEXT,
      "companyId" TEXT NOT NULL REFERENCES companies(id),
      name TEXT NOT NULL,
      subdomain TEXT UNIQUE NOT NULL,
      "customDomain" TEXT UNIQUE,
      "domainType" TEXT NOT NULL DEFAULT 'subdomain',
      "layoutType" TEXT NOT NULL DEFAULT 'clean',
      "primaryColor" TEXT DEFAULT '#3b82f6',
      "logoUrl" TEXT,
      "faviconUrl" TEXT,
      plan TEXT NOT NULL DEFAULT 'LITE',
      "planStatus" TEXT NOT NULL DEFAULT 'TRIAL',
      "planPrice" DECIMAL(10,2) NOT NULL DEFAULT 450.00,
      "splitPercent" DECIMAL(5,2) NOT NULL DEFAULT 2.00,
      "repasseDelayDays" INTEGER NOT NULL DEFAULT 7,
      "repasseFixedDay" INTEGER,
      "asaasApiKey" TEXT,
      "asaasWalletId" TEXT,
      "asaasSubscriptionId" TEXT,
      "vercelDomainId" TEXT,
      settings JSONB NOT NULL DEFAULT '{}',
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "trialEndsAt" TIMESTAMPTZ,
      "activatedAt" TIMESTAMPTZ,
      "suspendedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS tenants_owner_idx ON tenants("ownerId")`,
    `CREATE INDEX IF NOT EXISTS tenants_company_idx ON tenants("companyId")`,
    `CREATE INDEX IF NOT EXISTS tenants_plan_status_idx ON tenants("planStatus")`,

    `CREATE TABLE IF NOT EXISTS saas_commission_logs (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "tenantId" TEXT NOT NULL REFERENCES tenants(id),
      "transactionId" TEXT,
      "originalValue" DECIMAL(14,2) NOT NULL,
      "splitPercent" DECIMAL(5,2) NOT NULL,
      "commissionValue" DECIMAL(14,2) NOT NULL,
      "tenantNetValue" DECIMAL(14,2) NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      "processedAt" TIMESTAMPTZ,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS saas_commission_tenant_idx ON saas_commission_logs("tenantId")`,
    `CREATE INDEX IF NOT EXISTS saas_commission_status_idx ON saas_commission_logs(status)`,

    `CREATE TABLE IF NOT EXISTS scheduled_repasses (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "tenantId" TEXT REFERENCES tenants(id),
      "companyId" TEXT NOT NULL,
      "contractId" TEXT,
      "rentalId" TEXT,
      "landlordId" TEXT NOT NULL,
      "grossValue" DECIMAL(14,2) NOT NULL,
      "commissionValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
      "netValue" DECIMAL(14,2) NOT NULL,
      "scheduledDate" TIMESTAMPTZ NOT NULL,
      status TEXT NOT NULL DEFAULT 'SCHEDULED',
      "processedAt" TIMESTAMPTZ,
      "failureReason" TEXT,
      "asaasTransferId" TEXT,
      metadata JSONB NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS scheduled_repasses_tenant_idx ON scheduled_repasses("tenantId")`,
    `CREATE INDEX IF NOT EXISTS scheduled_repasses_status_idx ON scheduled_repasses(status)`,
    `CREATE INDEX IF NOT EXISTS scheduled_repasses_date_idx ON scheduled_repasses("scheduledDate")`,

    `CREATE TABLE IF NOT EXISTS digital_signatures (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "companyId" TEXT NOT NULL,
      "tenantId" TEXT REFERENCES tenants(id),
      "contractId" TEXT,
      "externalId" TEXT,
      provider TEXT NOT NULL DEFAULT 'clicksign',
      "documentUrl" TEXT,
      "envelopeUrl" TEXT,
      signers JSONB NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'PENDING',
      "signedAt" TIMESTAMPTZ,
      "expiredAt" TIMESTAMPTZ,
      metadata JSONB NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS digital_signatures_company_idx ON digital_signatures("companyId")`,
    `CREATE INDEX IF NOT EXISTS digital_signatures_contract_idx ON digital_signatures("contractId")`,
    `CREATE INDEX IF NOT EXISTS digital_signatures_status_idx ON digital_signatures(status)`,

    `CREATE TABLE IF NOT EXISTS auction_ai_analyses (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "auctionId" TEXT NOT NULL REFERENCES auctions(id),
      "editalUrl" TEXT,
      "totalDebts" DECIMAL(14,2),
      "iptuDebt" DECIMAL(14,2),
      "condoDebt" DECIMAL(14,2),
      "otherDebts" DECIMAL(14,2),
      "occupationStatus" TEXT,
      "occupationRisk" TEXT,
      "estimatedReformCost" DECIMAL(14,2),
      "estimatedITBI" DECIMAL(14,2),
      "estimatedCartorio" DECIMAL(14,2),
      "totalInvestment" DECIMAL(14,2),
      "estimatedMarketValue" DECIMAL(14,2),
      "estimatedROI" DOUBLE PRECISION,
      "paybackMonths" INTEGER,
      "monthlyYield" DOUBLE PRECISION,
      "riskLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
      "aiSummary" TEXT,
      "rawAnalysis" JSONB NOT NULL DEFAULT '{}',
      "analyzedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS auction_ai_auction_idx ON auction_ai_analyses("auctionId")`,
    `CREATE INDEX IF NOT EXISTS auction_ai_risk_idx ON auction_ai_analyses("riskLevel")`,

    // Add-ons de tenant (checkout de módulos avulsos / quota stacking).
    // Antes só existia via `prisma migrate deploy`, que travava o boot; criada
    // aqui de forma idempotente para o schema ficar completo sem migrate.
    `CREATE TABLE IF NOT EXISTS tenant_addons (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "tenantId" TEXT NOT NULL,
      kind TEXT NOT NULL,
      "packageSlug" TEXT NOT NULL,
      label TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      "billingType" TEXT NOT NULL DEFAULT 'recurring',
      status TEXT NOT NULL DEFAULT 'pending_payment',
      "asaasChargeId" TEXT,
      "activatedAt" TIMESTAMPTZ,
      "expiresAt" TIMESTAMPTZ,
      "cancelledAt" TIMESTAMPTZ,
      metadata JSONB NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS tenant_addons_tenant_status_idx ON tenant_addons("tenantId", status)`,
    `CREATE INDEX IF NOT EXISTS tenant_addons_asaas_charge_idx ON tenant_addons("asaasChargeId")`,

    // Agendamento de visitas (público). A tabela existe em produção mas foi
    // criada por um `db push` antigo, sem as colunas adicionadas depois (mode,
    // status, updatedAt...), então o INSERT falhava (500 "Erro ao agendar").
    // CREATE é no-op se já existe; os ADD COLUMN IF NOT EXISTS corrigem o drift.
    `CREATE TABLE IF NOT EXISTS property_visits (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "companyId" TEXT NOT NULL,
      "propertyId" TEXT NOT NULL,
      "brokerId" TEXT,
      "visitorName" TEXT NOT NULL,
      "visitorEmail" TEXT,
      "visitorPhone" TEXT NOT NULL,
      "scheduledAt" TIMESTAMPTZ NOT NULL,
      mode TEXT NOT NULL DEFAULT 'in_person',
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      rating INTEGER,
      feedback TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `ALTER TABLE property_visits ADD COLUMN IF NOT EXISTS "brokerId" TEXT`,
    `ALTER TABLE property_visits ADD COLUMN IF NOT EXISTS "visitorEmail" TEXT`,
    `ALTER TABLE property_visits ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'in_person'`,
    `ALTER TABLE property_visits ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'`,
    `ALTER TABLE property_visits ADD COLUMN IF NOT EXISTS notes TEXT`,
    `ALTER TABLE property_visits ADD COLUMN IF NOT EXISTS rating INTEGER`,
    `ALTER TABLE property_visits ADD COLUMN IF NOT EXISTS feedback TEXT`,
    `ALTER TABLE property_visits ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
    `ALTER TABLE property_visits ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
    `CREATE INDEX IF NOT EXISTS property_visits_company_scheduled_idx ON property_visits("companyId", "scheduledAt")`,
    `CREATE INDEX IF NOT EXISTS property_visits_property_idx ON property_visits("propertyId")`,
    `CREATE INDEX IF NOT EXISTS property_visits_status_idx ON property_visits(status)`,
  ]
  for (const sql of saasMigrations) {
    try { await prisma.$executeRawUnsafe(sql) } catch { /* already exists */ }
  }

  // ── Recent migrations not yet in runMigrations (20260519* + 20260630*) ──────
  const recentMigrations = [
    // ── Enums (guarded; plain CREATE TYPE is not idempotent) ──────────────────
    // origin: 20260519000005_loteadora_module
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LoteStatus') THEN
         CREATE TYPE "LoteStatus" AS ENUM ('AVAILABLE','RESERVED','NEGOTIATING','SOLD','BLOCKED');
       END IF;
     END $$`,
    // origin: 20260612230000_add_imobiliaria_loteadora_specialist_category
    `ALTER TYPE "SpecialistCategory" ADD VALUE IF NOT EXISTS 'IMOBILIARIA'`,
    `ALTER TYPE "SpecialistCategory" ADD VALUE IF NOT EXISTS 'LOTEADORA'`,

    // ── notifications ── origin: 20260519000000_add_notifications ─────────────
    `CREATE TABLE IF NOT EXISTS "notifications" (
       "id" TEXT PRIMARY KEY,
       "companyId" TEXT NOT NULL,
       "userId" TEXT,
       "type" TEXT NOT NULL,
       "title" TEXT NOT NULL,
       "body" TEXT NOT NULL,
       "payload" JSONB NOT NULL DEFAULT '{}',
       "read" BOOLEAN NOT NULL DEFAULT false,
       "readAt" TIMESTAMPTZ,
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE INDEX IF NOT EXISTS "notifications_companyId_read_createdAt_idx" ON "notifications"("companyId","read","createdAt")`,
    `CREATE INDEX IF NOT EXISTS "notifications_userId_read_idx" ON "notifications"("userId","read")`,

    // ── property_alerts (ALTER) ── origin: 20260519000001_property_alert_match ─
    `ALTER TABLE "property_alerts" ADD COLUMN IF NOT EXISTS "name" TEXT`,
    `ALTER TABLE "property_alerts" ADD COLUMN IF NOT EXISTS "phone" TEXT`,
    `ALTER TABLE "property_alerts" ADD COLUMN IF NOT EXISTS "companyId" TEXT`,
    `ALTER TABLE "property_alerts" ADD COLUMN IF NOT EXISTS "neighborhood" TEXT`,
    `ALTER TABLE "property_alerts" ADD COLUMN IF NOT EXISTS "lastMatchedAt" TIMESTAMPTZ`,
    `CREATE INDEX IF NOT EXISTS "property_alerts_companyId_idx" ON "property_alerts"("companyId")`,

    // ── integration_credentials ── origin: 20260519000002 ─────────────────────
    `CREATE TABLE IF NOT EXISTS "integration_credentials" (
       "id" TEXT PRIMARY KEY,
       "companyId" TEXT NOT NULL,
       "provider" TEXT NOT NULL,
       "credentials" JSONB NOT NULL DEFAULT '{}',
       "isActive" BOOLEAN NOT NULL DEFAULT true,
       "testStatus" TEXT,
       "lastTestedAt" TIMESTAMPTZ,
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "integration_credentials_companyId_provider_key" ON "integration_credentials"("companyId","provider")`,
    `CREATE INDEX IF NOT EXISTS "integration_credentials_companyId_idx" ON "integration_credentials"("companyId")`,

    // ── deals (ALTER) ── origin: 20260519000003_deal_esteira_metadata ─────────
    `ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "metadata" JSONB NOT NULL DEFAULT '{}'`,

    // ── exchange_offers ── origin: 20260519000004_exchange_offers ─────────────
    `CREATE TABLE IF NOT EXISTS "exchange_offers" (
       "id" TEXT PRIMARY KEY,
       "companyId" TEXT,
       "name" TEXT NOT NULL,
       "email" TEXT NOT NULL,
       "phone" TEXT,
       "offerType" TEXT NOT NULL,
       "offerDescription" TEXT NOT NULL,
       "offerValue" DECIMAL(12,2),
       "wantedType" TEXT,
       "wantedCity" TEXT,
       "wantedMaxValue" DECIMAL(12,2),
       "status" TEXT NOT NULL DEFAULT 'active',
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE INDEX IF NOT EXISTS "exchange_offers_status_idx" ON "exchange_offers"("status")`,
    `CREATE INDEX IF NOT EXISTS "exchange_offers_companyId_idx" ON "exchange_offers"("companyId")`,

    // ── loteamentos / lotes / lote_reservas ── origin: 20260519000005 ─────────
    `CREATE TABLE IF NOT EXISTS "loteamentos" (
       "id" TEXT PRIMARY KEY,
       "companyId" TEXT NOT NULL,
       "name" TEXT NOT NULL,
       "slug" TEXT NOT NULL,
       "description" TEXT,
       "city" TEXT,
       "state" TEXT,
       "coverImage" TEXT,
       "status" TEXT NOT NULL DEFAULT 'selling',
       "infrastructure" TEXT[] DEFAULT ARRAY[]::TEXT[],
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE TABLE IF NOT EXISTS "lotes" (
       "id" TEXT PRIMARY KEY,
       "loteamentoId" TEXT NOT NULL,
       "quadra" TEXT,
       "numero" TEXT NOT NULL,
       "area" DOUBLE PRECISION,
       "frente" DOUBLE PRECISION,
       "fundo" DOUBLE PRECISION,
       "price" DECIMAL(12,2),
       "status" "LoteStatus" NOT NULL DEFAULT 'AVAILABLE',
       "mapColumn" INTEGER,
       "mapRow" INTEGER,
       "description" TEXT,
       "sunPosition" TEXT,
       "notes" TEXT,
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE TABLE IF NOT EXISTS "lote_reservas" (
       "id" TEXT PRIMARY KEY,
       "loteId" TEXT NOT NULL,
       "name" TEXT NOT NULL,
       "email" TEXT NOT NULL,
       "phone" TEXT,
       "status" TEXT NOT NULL DEFAULT 'pending',
       "expiresAt" TIMESTAMPTZ NOT NULL,
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "loteamentos_companyId_slug_key" ON "loteamentos"("companyId","slug")`,
    `CREATE INDEX IF NOT EXISTS "loteamentos_companyId_idx" ON "loteamentos"("companyId")`,
    `CREATE INDEX IF NOT EXISTS "lotes_loteamentoId_idx" ON "lotes"("loteamentoId")`,
    `CREATE INDEX IF NOT EXISTS "lotes_loteamentoId_status_idx" ON "lotes"("loteamentoId","status")`,
    `CREATE INDEX IF NOT EXISTS "lote_reservas_loteId_idx" ON "lote_reservas"("loteId")`,
    `CREATE INDEX IF NOT EXISTS "lote_reservas_status_expiresAt_idx" ON "lote_reservas"("status","expiresAt")`,
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'lotes_loteamentoId_fkey') THEN
         ALTER TABLE "lotes" ADD CONSTRAINT "lotes_loteamentoId_fkey"
           FOREIGN KEY ("loteamentoId") REFERENCES "loteamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
       END IF;
     END $$`,
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'lote_reservas_loteId_fkey') THEN
         ALTER TABLE "lote_reservas" ADD CONSTRAINT "lote_reservas_loteId_fkey"
           FOREIGN KEY ("loteId") REFERENCES "lotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
       END IF;
     END $$`,

    // ── deal_payments ── origin: 20260519000006_deal_payments ─────────────────
    `CREATE TABLE IF NOT EXISTS "deal_payments" (
       "id" TEXT PRIMARY KEY,
       "dealId" TEXT NOT NULL,
       "companyId" TEXT NOT NULL,
       "type" TEXT NOT NULL DEFAULT 'signal',
       "amount" DECIMAL(14,2) NOT NULL,
       "billingType" TEXT NOT NULL DEFAULT 'UNDEFINED',
       "status" TEXT NOT NULL DEFAULT 'pending',
       "asaasChargeId" TEXT,
       "invoiceUrl" TEXT,
       "pixPayload" TEXT,
       "dueDate" TIMESTAMPTZ,
       "paidAt" TIMESTAMPTZ,
       "metadata" JSONB NOT NULL DEFAULT '{}',
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "deal_payments_asaasChargeId_key" ON "deal_payments"("asaasChargeId")`,
    `CREATE INDEX IF NOT EXISTS "deal_payments_dealId_idx" ON "deal_payments"("dealId")`,

    // ── notarial_processes ── origin: 20260519000007_notarial_process ─────────
    `CREATE TABLE IF NOT EXISTS "notarial_processes" (
       "id" TEXT PRIMARY KEY,
       "dealId" TEXT NOT NULL,
       "companyId" TEXT NOT NULL,
       "actType" TEXT NOT NULL DEFAULT 'ESCRITURA_COMPRA_VENDA',
       "notaryOffice" TEXT,
       "registryOffice" TEXT,
       "status" TEXT NOT NULL DEFAULT 'preparing',
       "deedFileUrl" TEXT,
       "registryProtocol" TEXT,
       "checklist" JSONB NOT NULL DEFAULT '{}',
       "notes" TEXT,
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "notarial_processes_dealId_key" ON "notarial_processes"("dealId")`,
    `CREATE INDEX IF NOT EXISTS "notarial_processes_companyId_idx" ON "notarial_processes"("companyId")`,

    // ── property_dossiers ── origin: 20260519000008_property_dossier ──────────
    `CREATE TABLE IF NOT EXISTS "property_dossiers" (
       "id" TEXT PRIMARY KEY,
       "propertyId" TEXT NOT NULL,
       "companyId" TEXT NOT NULL,
       "riskLevel" TEXT NOT NULL DEFAULT 'gray',
       "checklist" JSONB NOT NULL DEFAULT '{}',
       "notes" TEXT,
       "aiSummary" TEXT,
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "property_dossiers_propertyId_key" ON "property_dossiers"("propertyId")`,
    `CREATE INDEX IF NOT EXISTS "property_dossiers_companyId_idx" ON "property_dossiers"("companyId")`,

    // ── kyc_checks ── origin: 20260519000009_kyc_checks ───────────────────────
    `CREATE TABLE IF NOT EXISTS "kyc_checks" (
       "id" TEXT PRIMARY KEY,
       "dealId" TEXT NOT NULL,
       "companyId" TEXT NOT NULL,
       "subjectName" TEXT NOT NULL,
       "subjectRole" TEXT NOT NULL DEFAULT 'buyer',
       "cpfCnpj" TEXT,
       "status" TEXT NOT NULL DEFAULT 'pending',
       "riskLevel" TEXT NOT NULL DEFAULT 'medium',
       "checklist" JSONB NOT NULL DEFAULT '{}',
       "notes" TEXT,
       "provider" TEXT,
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE INDEX IF NOT EXISTS "kyc_checks_dealId_idx" ON "kyc_checks"("dealId")`,
    `CREATE INDEX IF NOT EXISTS "kyc_checks_companyId_idx" ON "kyc_checks"("companyId")`,

    // ── outgoing_webhooks ── origin: 20260519000010_outgoing_webhooks ─────────
    `CREATE TABLE IF NOT EXISTS "outgoing_webhooks" (
       "id" TEXT PRIMARY KEY,
       "companyId" TEXT NOT NULL,
       "url" TEXT NOT NULL,
       "secret" TEXT NOT NULL,
       "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
       "isActive" BOOLEAN NOT NULL DEFAULT true,
       "lastFiredAt" TIMESTAMPTZ,
       "failCount" INTEGER NOT NULL DEFAULT 0,
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE INDEX IF NOT EXISTS "outgoing_webhooks_companyId_idx" ON "outgoing_webhooks"("companyId")`,

    // ── system_events ── origin: 20260519000011_system_events ─────────────────
    `CREATE TABLE IF NOT EXISTS "system_events" (
       "id" TEXT PRIMARY KEY,
       "companyId" TEXT,
       "eventType" TEXT NOT NULL,
       "source" TEXT,
       "entityType" TEXT,
       "entityId" TEXT,
       "payload" JSONB NOT NULL DEFAULT '{}',
       "processed" BOOLEAN NOT NULL DEFAULT false,
       "errorMessage" TEXT,
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE INDEX IF NOT EXISTS "system_events_companyId_eventType_idx" ON "system_events"("companyId","eventType")`,
    `CREATE INDEX IF NOT EXISTS "system_events_createdAt_idx" ON "system_events"("createdAt")`,
    `CREATE INDEX IF NOT EXISTS "system_events_processed_idx" ON "system_events"("processed")`,

    // ── repasse_beneficiaries ── origin: 20260630000000 ───────────────────────
    `CREATE TABLE IF NOT EXISTS "repasse_beneficiaries" (
       "id" TEXT PRIMARY KEY,
       "companyId" TEXT NOT NULL,
       "contractId" TEXT NOT NULL,
       "clientId" TEXT,
       "name" TEXT NOT NULL,
       "percentage" DECIMAL(5,2) NOT NULL,
       "role" TEXT NOT NULL DEFAULT 'OWNER',
       "bankName" TEXT,
       "bankAgency" TEXT,
       "bankAccount" TEXT,
       "pixKey" TEXT,
       "isActive" BOOLEAN NOT NULL DEFAULT true,
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE INDEX IF NOT EXISTS "repasse_beneficiaries_companyId_idx" ON "repasse_beneficiaries"("companyId")`,
    `CREATE INDEX IF NOT EXISTS "repasse_beneficiaries_contractId_idx" ON "repasse_beneficiaries"("contractId")`,
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'repasse_beneficiaries_contractId_fkey') THEN
         ALTER TABLE "repasse_beneficiaries" ADD CONSTRAINT "repasse_beneficiaries_contractId_fkey"
           FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
       END IF;
     END $$`,

    // ── accounts_payable + bank_checks ── origin: 20260630000001 ──────────────
    `CREATE TABLE IF NOT EXISTS "accounts_payable" (
       "id" TEXT PRIMARY KEY,
       "companyId" TEXT NOT NULL,
       "legacyId" TEXT,
       "description" TEXT NOT NULL,
       "payeeName" TEXT NOT NULL,
       "payeeId" TEXT,
       "category" TEXT,
       "documentNumber" TEXT,
       "amount" DECIMAL(12,2) NOT NULL,
       "dueDate" TIMESTAMPTZ NOT NULL,
       "status" TEXT NOT NULL DEFAULT 'PENDING',
       "paidAt" TIMESTAMPTZ,
       "paymentDoc" TEXT,
       "paymentMethod" TEXT,
       "contractId" TEXT,
       "propertyId" TEXT,
       "notes" TEXT,
       "createdBy" TEXT,
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE INDEX IF NOT EXISTS "accounts_payable_companyId_idx" ON "accounts_payable"("companyId")`,
    `CREATE INDEX IF NOT EXISTS "accounts_payable_status_idx" ON "accounts_payable"("status")`,
    `CREATE INDEX IF NOT EXISTS "accounts_payable_dueDate_idx" ON "accounts_payable"("dueDate")`,
    `CREATE TABLE IF NOT EXISTS "bank_checks" (
       "id" TEXT PRIMARY KEY,
       "companyId" TEXT NOT NULL,
       "legacyId" TEXT,
       "checkNumber" TEXT NOT NULL,
       "amount" DECIMAL(12,2) NOT NULL,
       "bankCode" TEXT,
       "payeeName" TEXT,
       "category" TEXT,
       "issueDate" TIMESTAMPTZ,
       "dueDate" TIMESTAMPTZ,
       "status" TEXT NOT NULL DEFAULT 'PENDING',
       "clearedAt" TIMESTAMPTZ,
       "accountPayableId" TEXT,
       "notes" TEXT,
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE INDEX IF NOT EXISTS "bank_checks_companyId_idx" ON "bank_checks"("companyId")`,
    `CREATE INDEX IF NOT EXISTS "bank_checks_status_idx" ON "bank_checks"("status")`,
    `CREATE INDEX IF NOT EXISTS "bank_checks_dueDate_idx" ON "bank_checks"("dueDate")`,
    `CREATE INDEX IF NOT EXISTS "bank_checks_accountPayableId_idx" ON "bank_checks"("accountPayableId")`,
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'bank_checks_accountPayableId_fkey') THEN
         ALTER TABLE "bank_checks" ADD CONSTRAINT "bank_checks_accountPayableId_fkey"
           FOREIGN KEY ("accountPayableId") REFERENCES "accounts_payable"("id") ON DELETE SET NULL ON UPDATE CASCADE;
       END IF;
     END $$`,

    // ── rescissions ── origin: 20260630000002_add_rescissions ─────────────────
    `CREATE TABLE IF NOT EXISTS "rescissions" (
       "id" TEXT PRIMARY KEY,
       "companyId" TEXT NOT NULL,
       "contractId" TEXT NOT NULL,
       "legacyId" TEXT,
       "exitDate" TIMESTAMPTZ NOT NULL,
       "proRataRent" DECIMAL(12,2) NOT NULL DEFAULT 0,
       "proRataIptu" DECIMAL(12,2) NOT NULL DEFAULT 0,
       "penaltyValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
       "outstandingValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
       "bonusValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
       "depositRefund" DECIMAL(12,2) NOT NULL DEFAULT 0,
       "totalDebits" DECIMAL(12,2) NOT NULL DEFAULT 0,
       "totalCredits" DECIMAL(12,2) NOT NULL DEFAULT 0,
       "netResult" DECIMAL(12,2) NOT NULL DEFAULT 0,
       "settlement" TEXT NOT NULL DEFAULT 'SETTLED',
       "status" TEXT NOT NULL DEFAULT 'DRAFT',
       "items" JSONB NOT NULL DEFAULT '[]',
       "notes" TEXT,
       "createdBy" TEXT,
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE INDEX IF NOT EXISTS "rescissions_companyId_idx" ON "rescissions"("companyId")`,
    `CREATE INDEX IF NOT EXISTS "rescissions_contractId_idx" ON "rescissions"("contractId")`,
    `CREATE INDEX IF NOT EXISTS "rescissions_status_idx" ON "rescissions"("status")`,

    // ── agreements + agreement_installments ── origin: 20260630000003 ─────────
    `CREATE TABLE IF NOT EXISTS "agreements" (
       "id" TEXT PRIMARY KEY,
       "companyId" TEXT NOT NULL,
       "contractId" TEXT,
       "legacyId" TEXT,
       "tenantName" TEXT,
       "originalDebt" DECIMAL(12,2) NOT NULL,
       "discountValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
       "agreedValue" DECIMAL(12,2) NOT NULL,
       "installments" INTEGER NOT NULL,
       "firstDueDate" TIMESTAMPTZ NOT NULL,
       "status" TEXT NOT NULL DEFAULT 'ACTIVE',
       "notes" TEXT,
       "createdBy" TEXT,
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE INDEX IF NOT EXISTS "agreements_companyId_idx" ON "agreements"("companyId")`,
    `CREATE INDEX IF NOT EXISTS "agreements_contractId_idx" ON "agreements"("contractId")`,
    `CREATE INDEX IF NOT EXISTS "agreements_status_idx" ON "agreements"("status")`,
    `CREATE TABLE IF NOT EXISTS "agreement_installments" (
       "id" TEXT PRIMARY KEY,
       "agreementId" TEXT NOT NULL,
       "number" INTEGER NOT NULL,
       "dueDate" TIMESTAMPTZ NOT NULL,
       "amount" DECIMAL(12,2) NOT NULL,
       "status" TEXT NOT NULL DEFAULT 'PENDING',
       "paidAt" TIMESTAMPTZ,
       "paidAmount" DECIMAL(12,2),
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "agreement_installments_agreementId_number_key" ON "agreement_installments"("agreementId","number")`,
    `CREATE INDEX IF NOT EXISTS "agreement_installments_agreementId_idx" ON "agreement_installments"("agreementId")`,
    `CREATE INDEX IF NOT EXISTS "agreement_installments_status_idx" ON "agreement_installments"("status")`,
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'agreement_installments_agreementId_fkey') THEN
         ALTER TABLE "agreement_installments" ADD CONSTRAINT "agreement_installments_agreementId_fkey"
           FOREIGN KEY ("agreementId") REFERENCES "agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
       END IF;
     END $$`,

    // ── formal_notices / bank_reconciliations / bank_statement_entries / user_module_permissions ──
    // origin: 20260630000004_add_notices_reconciliation_permissions
    `CREATE TABLE IF NOT EXISTS "formal_notices" (
       "id" TEXT PRIMARY KEY,
       "companyId" TEXT NOT NULL,
       "contractId" TEXT,
       "legacyId" TEXT,
       "recipient" TEXT NOT NULL DEFAULT 'TENANT',
       "recipientName" TEXT,
       "type" TEXT NOT NULL,
       "subject" TEXT NOT NULL,
       "body" TEXT,
       "status" TEXT NOT NULL DEFAULT 'OPEN',
       "noticeDate" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "resolvedAt" TIMESTAMPTZ,
       "operator" TEXT,
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE INDEX IF NOT EXISTS "formal_notices_companyId_idx" ON "formal_notices"("companyId")`,
    `CREATE INDEX IF NOT EXISTS "formal_notices_contractId_idx" ON "formal_notices"("contractId")`,
    `CREATE INDEX IF NOT EXISTS "formal_notices_status_idx" ON "formal_notices"("status")`,
    `CREATE TABLE IF NOT EXISTS "bank_reconciliations" (
       "id" TEXT PRIMARY KEY,
       "companyId" TEXT NOT NULL,
       "source" TEXT NOT NULL DEFAULT 'CSV',
       "reference" TEXT,
       "bankCode" TEXT,
       "importedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "totalEntries" INTEGER NOT NULL DEFAULT 0,
       "matchedCount" INTEGER NOT NULL DEFAULT 0,
       "unmatchedCount" INTEGER NOT NULL DEFAULT 0,
       "status" TEXT NOT NULL DEFAULT 'IMPORTED',
       "createdBy" TEXT,
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE INDEX IF NOT EXISTS "bank_reconciliations_companyId_idx" ON "bank_reconciliations"("companyId")`,
    `CREATE INDEX IF NOT EXISTS "bank_reconciliations_status_idx" ON "bank_reconciliations"("status")`,
    `CREATE TABLE IF NOT EXISTS "bank_statement_entries" (
       "id" TEXT PRIMARY KEY,
       "reconciliationId" TEXT NOT NULL,
       "companyId" TEXT NOT NULL,
       "entryDate" TIMESTAMPTZ NOT NULL,
       "amount" DECIMAL(12,2) NOT NULL,
       "direction" TEXT NOT NULL DEFAULT 'CREDIT',
       "description" TEXT,
       "nossoNumero" TEXT,
       "documentNumber" TEXT,
       "occurrenceCode" TEXT,
       "matchStatus" TEXT NOT NULL DEFAULT 'UNMATCHED',
       "matchedRentalId" TEXT,
       "matchedInvoiceId" TEXT,
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE INDEX IF NOT EXISTS "bank_statement_entries_reconciliationId_idx" ON "bank_statement_entries"("reconciliationId")`,
    `CREATE INDEX IF NOT EXISTS "bank_statement_entries_companyId_idx" ON "bank_statement_entries"("companyId")`,
    `CREATE INDEX IF NOT EXISTS "bank_statement_entries_matchStatus_idx" ON "bank_statement_entries"("matchStatus")`,
    `CREATE INDEX IF NOT EXISTS "bank_statement_entries_nossoNumero_idx" ON "bank_statement_entries"("nossoNumero")`,
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'bank_statement_entries_reconciliationId_fkey') THEN
         ALTER TABLE "bank_statement_entries" ADD CONSTRAINT "bank_statement_entries_reconciliationId_fkey"
           FOREIGN KEY ("reconciliationId") REFERENCES "bank_reconciliations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
       END IF;
     END $$`,
    `CREATE TABLE IF NOT EXISTS "user_module_permissions" (
       "id" TEXT PRIMARY KEY,
       "companyId" TEXT NOT NULL,
       "userId" TEXT NOT NULL,
       "module" TEXT NOT NULL,
       "canView" BOOLEAN NOT NULL DEFAULT true,
       "canEdit" BOOLEAN NOT NULL DEFAULT false,
       "canDelete" BOOLEAN NOT NULL DEFAULT false,
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "user_module_permissions_userId_module_key" ON "user_module_permissions"("userId","module")`,
    `CREATE INDEX IF NOT EXISTS "user_module_permissions_companyId_idx" ON "user_module_permissions"("companyId")`,
    `CREATE INDEX IF NOT EXISTS "user_module_permissions_userId_idx" ON "user_module_permissions"("userId")`,

    // ── iptu_carnes + iptu_installments ── origin: 20260630000005 ─────────────
    `CREATE TABLE IF NOT EXISTS "iptu_carnes" (
       "id" TEXT PRIMARY KEY,
       "companyId" TEXT NOT NULL,
       "propertyId" TEXT,
       "contractId" TEXT,
       "legacyId" TEXT,
       "year" INTEGER NOT NULL,
       "iptuCode" TEXT,
       "totalAmount" DECIMAL(12,2) NOT NULL,
       "installments" INTEGER NOT NULL,
       "chargeToTenant" BOOLEAN NOT NULL DEFAULT true,
       "status" TEXT NOT NULL DEFAULT 'OPEN',
       "notes" TEXT,
       "createdBy" TEXT,
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE INDEX IF NOT EXISTS "iptu_carnes_companyId_idx" ON "iptu_carnes"("companyId")`,
    `CREATE INDEX IF NOT EXISTS "iptu_carnes_propertyId_idx" ON "iptu_carnes"("propertyId")`,
    `CREATE INDEX IF NOT EXISTS "iptu_carnes_year_idx" ON "iptu_carnes"("year")`,
    `CREATE TABLE IF NOT EXISTS "iptu_installments" (
       "id" TEXT PRIMARY KEY,
       "carneId" TEXT NOT NULL,
       "number" INTEGER NOT NULL,
       "dueDate" TIMESTAMPTZ NOT NULL,
       "amount" DECIMAL(12,2) NOT NULL,
       "status" TEXT NOT NULL DEFAULT 'PENDING',
       "paidAt" TIMESTAMPTZ,
       "rentalId" TEXT,
       "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
       "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
     )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "iptu_installments_carneId_number_key" ON "iptu_installments"("carneId","number")`,
    `CREATE INDEX IF NOT EXISTS "iptu_installments_carneId_idx" ON "iptu_installments"("carneId")`,
    `CREATE INDEX IF NOT EXISTS "iptu_installments_status_idx" ON "iptu_installments"("status")`,
    `DO $$ BEGIN
       IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'iptu_installments_carneId_fkey') THEN
         ALTER TABLE "iptu_installments" ADD CONSTRAINT "iptu_installments_carneId_fkey"
           FOREIGN KEY ("carneId") REFERENCES "iptu_carnes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
       END IF;
     END $$`,

    // ── users.cpf ── login white-label por telefone/CPF/e-mail ────────────────
    // CPF permite ao parceiro logar pelo documento; único (NULLs coexistem no
    // Postgres). Índice único idempotente.
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "cpf" TEXT`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "users_cpf_key" ON "users"("cpf")`,

    // ── Auth hardening ────────────────────────────────────────────────────────
    // tokenVersion: invalidação imediata de access tokens (suspend/role/senha).
    // Índice de family: reuse-detection/logout fazem deleteMany por family.
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0`,
    `CREATE INDEX IF NOT EXISTS "refresh_tokens_family_idx" ON "refresh_tokens"("family")`,
  ]
  for (const sql of recentMigrations) {
    try { await prisma.$executeRawUnsafe(sql) } catch { /* already exists */ }
  }

  // ── Inteligência imobiliária: fontes, histórico e deduplicação ───────────
  // Produção é mantida por migrações idempotentes no boot (ver Dockerfile).
  const intelligenceMigrations = [
    `CREATE TABLE IF NOT EXISTS "intelligence_data_sources" (
      "id" TEXT PRIMARY KEY, "slug" TEXT NOT NULL, "name" TEXT NOT NULL,
      "kind" TEXT NOT NULL, "accessMethod" TEXT NOT NULL, "baseUrl" TEXT,
      "termsUrl" TEXT, "storageAllowed" BOOLEAN NOT NULL DEFAULT false,
      "republicationAllowed" BOOLEAN NOT NULL DEFAULT false,
      "attributionRequired" BOOLEAN NOT NULL DEFAULT false, "retentionDays" INTEGER,
      "rateLimitPerMinute" INTEGER, "reliabilityScore" INTEGER NOT NULL DEFAULT 50,
      "legalStatus" TEXT NOT NULL DEFAULT 'PENDING', "legalReviewedAt" TIMESTAMPTZ,
      "isActive" BOOLEAN NOT NULL DEFAULT false, "metadata" JSONB NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "intelligence_data_sources_slug_key" ON "intelligence_data_sources"("slug")`,
    `CREATE INDEX IF NOT EXISTS "intelligence_data_sources_kind_isActive_idx" ON "intelligence_data_sources"("kind","isActive")`,
    `CREATE INDEX IF NOT EXISTS "intelligence_data_sources_legalStatus_idx" ON "intelligence_data_sources"("legalStatus")`,
    `CREATE TABLE IF NOT EXISTS "territorial_cities" (
      "id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "stateCode" TEXT NOT NULL,
      "ibgeCode" TEXT, "slug" TEXT NOT NULL, "sourceId" TEXT,
      "confidence" INTEGER NOT NULL DEFAULT 50, "isActive" BOOLEAN NOT NULL DEFAULT true,
      "metadata" JSONB NOT NULL DEFAULT '{}', "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "territorial_cities_ibgeCode_key" ON "territorial_cities"("ibgeCode")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "territorial_cities_stateCode_slug_key" ON "territorial_cities"("stateCode","slug")`,
    `CREATE INDEX IF NOT EXISTS "territorial_cities_name_stateCode_idx" ON "territorial_cities"("name","stateCode")`,
    `CREATE TABLE IF NOT EXISTS "territorial_neighborhoods" (
      "id" TEXT PRIMARY KEY, "cityId" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL,
      "kind" TEXT NOT NULL DEFAULT 'OFFICIAL', "sourceId" TEXT, "confidence" INTEGER NOT NULL DEFAULT 50,
      "boundary" JSONB, "metadata" JSONB NOT NULL DEFAULT '{}', "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "territorial_neighborhoods_cityId_slug_key" ON "territorial_neighborhoods"("cityId","slug")`,
    `CREATE INDEX IF NOT EXISTS "territorial_neighborhoods_cityId_name_idx" ON "territorial_neighborhoods"("cityId","name")`,
    `CREATE TABLE IF NOT EXISTS "territorial_neighborhood_aliases" (
      "id" TEXT PRIMARY KEY, "neighborhoodId" TEXT NOT NULL, "name" TEXT NOT NULL,
      "normalizedName" TEXT NOT NULL, "sourceId" TEXT, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "territorial_neighborhood_aliases_neighborhoodId_normalizedName_key" ON "territorial_neighborhood_aliases"("neighborhoodId","normalizedName")`,
    `CREATE INDEX IF NOT EXISTS "territorial_neighborhood_aliases_normalizedName_idx" ON "territorial_neighborhood_aliases"("normalizedName")`,
    `CREATE TABLE IF NOT EXISTS "territorial_streets" (
      "id" TEXT PRIMARY KEY, "cityId" TEXT NOT NULL, "neighborhoodId" TEXT,
      "name" TEXT NOT NULL, "normalizedName" TEXT NOT NULL, "streetType" TEXT,
      "postalCode" TEXT, "sourceId" TEXT, "confidence" INTEGER NOT NULL DEFAULT 50,
      "metadata" JSONB NOT NULL DEFAULT '{}', "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "territorial_streets_cityId_normalizedName_neighborhoodId_key" ON "territorial_streets"("cityId","normalizedName","neighborhoodId")`,
    `CREATE INDEX IF NOT EXISTS "territorial_streets_cityId_normalizedName_idx" ON "territorial_streets"("cityId","normalizedName")`,
    `CREATE INDEX IF NOT EXISTS "territorial_streets_postalCode_idx" ON "territorial_streets"("postalCode")`,
    `CREATE TABLE IF NOT EXISTS "territorial_street_neighborhoods" (
      "id" TEXT PRIMARY KEY, "streetId" TEXT NOT NULL, "neighborhoodId" TEXT NOT NULL,
      "sourceId" TEXT, "confidence" INTEGER NOT NULL DEFAULT 50,
      "evidenceCount" INTEGER NOT NULL DEFAULT 1, "metadata" JSONB NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "territorial_street_neighborhoods_streetId_neighborhoodId_key" ON "territorial_street_neighborhoods"("streetId","neighborhoodId")`,
    `CREATE INDEX IF NOT EXISTS "territorial_street_neighborhoods_neighborhoodId_idx" ON "territorial_street_neighborhoods"("neighborhoodId")`,
    `ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "territorialCityId" TEXT`,
    `ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "territorialNeighborhoodId" TEXT`,
    `ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "territorialStreetId" TEXT`,
    `CREATE INDEX IF NOT EXISTS "properties_territorialCityId_idx" ON "properties"("territorialCityId")`,
    `CREATE INDEX IF NOT EXISTS "properties_territorialNeighborhoodId_idx" ON "properties"("territorialNeighborhoodId")`,
    `CREATE INDEX IF NOT EXISTS "properties_territorialStreetId_idx" ON "properties"("territorialStreetId")`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'territorial_neighborhoods_cityId_fkey') THEN
        ALTER TABLE "territorial_neighborhoods" ADD CONSTRAINT "territorial_neighborhoods_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "territorial_cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'territorial_neighborhood_aliases_neighborhoodId_fkey') THEN
        ALTER TABLE "territorial_neighborhood_aliases" ADD CONSTRAINT "territorial_neighborhood_aliases_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "territorial_neighborhoods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'territorial_streets_cityId_fkey') THEN
        ALTER TABLE "territorial_streets" ADD CONSTRAINT "territorial_streets_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "territorial_cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'territorial_streets_neighborhoodId_fkey') THEN
        ALTER TABLE "territorial_streets" ADD CONSTRAINT "territorial_streets_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "territorial_neighborhoods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'territorial_street_neighborhoods_streetId_fkey') THEN
        ALTER TABLE "territorial_street_neighborhoods" ADD CONSTRAINT "territorial_street_neighborhoods_streetId_fkey" FOREIGN KEY ("streetId") REFERENCES "territorial_streets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'territorial_street_neighborhoods_neighborhoodId_fkey') THEN
        ALTER TABLE "territorial_street_neighborhoods" ADD CONSTRAINT "territorial_street_neighborhoods_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "territorial_neighborhoods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'properties_territorialCityId_fkey') THEN
        ALTER TABLE "properties" ADD CONSTRAINT "properties_territorialCityId_fkey" FOREIGN KEY ("territorialCityId") REFERENCES "territorial_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'properties_territorialNeighborhoodId_fkey') THEN
        ALTER TABLE "properties" ADD CONSTRAINT "properties_territorialNeighborhoodId_fkey" FOREIGN KEY ("territorialNeighborhoodId") REFERENCES "territorial_neighborhoods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'properties_territorialStreetId_fkey') THEN
        ALTER TABLE "properties" ADD CONSTRAINT "properties_territorialStreetId_fkey" FOREIGN KEY ("territorialStreetId") REFERENCES "territorial_streets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$`,
    `CREATE TABLE IF NOT EXISTS "property_listing_snapshots" (
      "id" TEXT PRIMARY KEY, "propertyId" TEXT NOT NULL, "sourceId" TEXT,
      "externalListingId" TEXT, "sourceUrl" TEXT, "capturedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "listingStatus" TEXT NOT NULL DEFAULT 'ACTIVE', "askingPrice" DECIMAL(14,2),
      "rentPrice" DECIMAL(14,2), "condoFee" DECIMAL(12,2), "propertyTax" DECIMAL(12,2),
      "builtArea" DOUBLE PRECISION, "landArea" DOUBLE PRECISION, "bedrooms" INTEGER,
      "parkingSpaces" INTEGER, "addressFingerprint" TEXT, "contentFingerprint" TEXT NOT NULL,
      "dataCompleteness" INTEGER NOT NULL DEFAULT 0, "sourceReliability" INTEGER NOT NULL DEFAULT 50,
      "rawData" JSONB NOT NULL DEFAULT '{}', "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "property_listing_snapshots_propertyId_contentFingerprint_key" ON "property_listing_snapshots"("propertyId","contentFingerprint")`,
    `CREATE INDEX IF NOT EXISTS "property_listing_snapshots_propertyId_capturedAt_idx" ON "property_listing_snapshots"("propertyId","capturedAt")`,
    `CREATE INDEX IF NOT EXISTS "property_listing_snapshots_sourceId_externalListingId_idx" ON "property_listing_snapshots"("sourceId","externalListingId")`,
    `CREATE INDEX IF NOT EXISTS "property_listing_snapshots_addressFingerprint_idx" ON "property_listing_snapshots"("addressFingerprint")`,
    `CREATE INDEX IF NOT EXISTS "property_listing_snapshots_listingStatus_capturedAt_idx" ON "property_listing_snapshots"("listingStatus","capturedAt")`,
    `CREATE TABLE IF NOT EXISTS "property_duplicate_candidates" (
      "id" TEXT PRIMARY KEY, "propertyId" TEXT NOT NULL, "candidatePropertyId" TEXT NOT NULL,
      "score" INTEGER NOT NULL, "reasons" JSONB NOT NULL DEFAULT '[]', "status" TEXT NOT NULL DEFAULT 'PENDING',
      "reviewedById" TEXT, "reviewedAt" TIMESTAMPTZ, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "property_duplicate_candidates_propertyId_candidatePropertyId_key" ON "property_duplicate_candidates"("propertyId","candidatePropertyId")`,
    `CREATE INDEX IF NOT EXISTS "property_duplicate_candidates_propertyId_status_idx" ON "property_duplicate_candidates"("propertyId","status")`,
    `CREATE INDEX IF NOT EXISTS "property_duplicate_candidates_candidatePropertyId_status_idx" ON "property_duplicate_candidates"("candidatePropertyId","status")`,
    `CREATE INDEX IF NOT EXISTS "property_duplicate_candidates_score_status_idx" ON "property_duplicate_candidates"("score","status")`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'property_listing_snapshots_sourceId_fkey') THEN
        ALTER TABLE "property_listing_snapshots" ADD CONSTRAINT "property_listing_snapshots_sourceId_fkey"
          FOREIGN KEY ("sourceId") REFERENCES "intelligence_data_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      END IF;
    END $$`,
    `INSERT INTO "intelligence_data_sources" (
      "id","slug","name","kind","accessMethod","storageAllowed","republicationAllowed",
      "reliabilityScore","legalStatus","legalReviewedAt","isActive","metadata","createdAt","updatedAt"
    ) VALUES (
      'source_agoraencontrei_internal','agoraencontrei-internal','Base própria AgoraEncontrei',
      'INTERNAL','INTERNAL',true,true,90,'APPROVED',NOW(),true,
      '{"scope":"Dados próprios e autorizados de imóveis publicados"}',NOW(),NOW()
    ) ON CONFLICT ("slug") DO NOTHING`,
    `INSERT INTO "intelligence_data_sources" (
      "id","slug","name","kind","accessMethod","baseUrl","termsUrl","storageAllowed",
      "republicationAllowed","attributionRequired","reliabilityScore","legalStatus","legalReviewedAt",
      "isActive","metadata","createdAt","updatedAt"
    ) VALUES (
      'source_ibge_faces_2022','ibge-faces-logradouros-2022','IBGE — Base de Faces de Logradouros 2022',
      'OFFICIAL','OPEN_DATA','https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais/28971-base-de-faces-de-logradouros-do-brasil.html',
      'https://www.ibge.gov.br/acesso-informacao/acoes-e-programas/termos-de-uso.html',true,true,true,95,
      'APPROVED',NOW(),true,
      '{"scope":"Nomes e tipos de logradouros públicos; município de Franca 3516200","referenceDate":"2022","attribution":"Fonte: IBGE, Base de Faces de Logradouros 2022"}',
      NOW(),NOW()
    ) ON CONFLICT ("slug") DO UPDATE SET "metadata" = EXCLUDED."metadata", "updatedAt" = NOW()`,
    `INSERT INTO "intelligence_data_sources" (
      "id","slug","name","kind","accessMethod","storageAllowed","republicationAllowed",
      "attributionRequired","reliabilityScore","legalStatus","legalReviewedAt","isActive","metadata","createdAt","updatedAt"
    ) VALUES (
      'source_internal_property_neighborhoods','internal-property-neighborhoods',
      'Cadastro interno de imóveis — bairros declarados','INTERNAL','INTERNAL',true,false,false,55,
      'APPROVED',NOW(),true,
      '{"scope":"Nomes de bairros declarados nos imóveis e relações observadas com logradouros","classification":"operational","warning":"Não representa delimitação oficial de bairro"}',
      NOW(),NOW()
    ) ON CONFLICT ("slug") DO UPDATE SET "metadata" = EXCLUDED."metadata", "updatedAt" = NOW()`,
  ]
  for (const sql of intelligenceMigrations) {
    try { await prisma.$executeRawUnsafe(sql) } catch { /* idempotente / próxima inicialização tenta novamente */ }
  }

  for (const [col, type] of columns) {
    try {
      await prisma.$executeRawUnsafe(
        `ALTER TABLE properties ADD COLUMN IF NOT EXISTS "${col}" ${type}`
      )
    } catch { /* column already exists or unsupported */ }
  }

  // ── Ensure all active properties are visible on map/listings ──────────
  try {
    const result = await prisma.$executeRawUnsafe(
      `UPDATE properties SET "authorizedPublish" = true, "showExactLocation" = true WHERE status = 'ACTIVE' AND "authorizedPublish" = false`
    )
    // Clear Redis cache so updated properties appear immediately
    if (app.redis && typeof result === 'number' && result > 0) {
      try {
        const keys = await app.redis.keys('pub:*')
        if (keys.length > 0) await app.redis.del(...keys)
        app.log.info(`[boot] Cleared ${keys.length} cached entries after property visibility update`)
      } catch {}
    }
  } catch { /* column may not exist yet */ }
}

async function ensureOperationalNeighborhoodSchema(prisma: any) {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "territorial_street_neighborhoods" (
    "id" TEXT PRIMARY KEY, "streetId" TEXT NOT NULL, "neighborhoodId" TEXT NOT NULL,
    "sourceId" TEXT, "confidence" INTEGER NOT NULL DEFAULT 50,
    "evidenceCount" INTEGER NOT NULL DEFAULT 1, "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "territorial_street_neighborhoods_streetId_neighborhoodId_key" ON "territorial_street_neighborhoods"("streetId","neighborhoodId")`)
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "territorial_street_neighborhoods_neighborhoodId_idx" ON "territorial_street_neighborhoods"("neighborhoodId")`)
  await prisma.$executeRawUnsafe(`INSERT INTO "intelligence_data_sources" (
    "id","slug","name","kind","accessMethod","storageAllowed","republicationAllowed",
    "attributionRequired","reliabilityScore","legalStatus","legalReviewedAt","isActive","metadata","createdAt","updatedAt"
  ) VALUES (
    'source_internal_property_neighborhoods','internal-property-neighborhoods',
    'Cadastro interno de imóveis — bairros declarados','INTERNAL','INTERNAL',true,false,false,55,
    'APPROVED',NOW(),true,
    '{"scope":"Nomes de bairros declarados nos imóveis e relações observadas com logradouros","classification":"operational","warning":"Não representa delimitação oficial de bairro"}',
    NOW(),NOW()
  ) ON CONFLICT ("slug") DO UPDATE SET "metadata" = EXCLUDED."metadata", "updatedAt" = NOW()`)
}

async function bootstrap() {
  // Monitoramento de erros — no-op se SENTRY_DSN ausente ou @sentry/node não instalado.
  await initSentry(app)

  // ── Core Plugins ────────────────────────────────────────────────────────
  await app.register(corsPlugin)
  await app.register(helmetPlugin)
  await app.register(rateLimitPlugin)
  await app.register(jwtPlugin)
  await app.register(prismaPlugin)
  {
    const migP = runMigrations(app.prisma)
    const timeoutP = new Promise((_, reject) => setTimeout(() => reject(new Error('Migrations timeout (20s)')), 20000))
    await Promise.race([migP, timeoutP]).catch(e => app.log.warn('Migration warning:', e.message))
    migP.catch(() => {})
  }
  // Dependência crítica da rota pública: precisa existir antes de o servidor aceitar tráfego.
  await ensureOperationalNeighborhoodSchema(app.prisma)
  seedIbgeFrancaTerritory(app.prisma)
    .then(result => app.log.info({ territorialSeed: result }, 'IBGE Franca territorial seed completed'))
    .catch(error => app.log.warn({ error: error?.message || String(error) }, 'IBGE Franca territorial seed deferred'))
  await app.register(redisPlugin)
  await app.register(automationPlugin)
  // File uploads: bound per-file size so a malicious client cannot exhaust
  // memory/disk on the API box. Routes that legitimately need bigger files
  // should upload directly to S3 via pre-signed URLs.
  await app.register(multipart, { limits: { fileSize: MULTIPART_FILE_LIMIT } })
  // Compressão gzip/brotli automática para todas as respostas
  await app.register(compress, {
    global: true,
    encodings: ['br', 'gzip', 'deflate'],
    threshold: 1024, // Só comprimir respostas > 1KB
  })

  // ── Swagger (development only) ──────────────────────────────────────────
  if (env.NODE_ENV !== 'production') {
    await app.register(swaggerPlugin)
  }

  // ── Routes ──────────────────────────────────────────────────────────────
  await app.register(healthRoutes, { prefix: '/health' })
  await app.register(authRoutes,   { prefix: '/api/v1/auth' })
  await app.register(firstAccessRoutes, { prefix: '/api/v1/auth' })
  await app.register(usersRoutes,  { prefix: '/api/v1/users' })
  await app.register(propertiesRoutes, { prefix: '/api/v1/properties' })
  await app.register(leadsRoutes,  { prefix: '/api/v1/leads' })
  await app.register(contactsRoutes,  { prefix: '/api/v1/contacts' })
  await app.register(dealsRoutes,     { prefix: '/api/v1/deals' })
  await app.register(activitiesRoutes, { prefix: '/api/v1/activities' })
  await app.register(reportsRoutes,   { prefix: '/api/v1/reports' })
  await app.register(portalsRoutes,   { prefix: '/api/v1/portals' })
  await app.register(whatsappRoutes,  { prefix: '/api/v1/whatsapp' })
  await app.register(inboxRoutes,     { prefix: '/api/v1/inbox' })
  // GET /api/v1/agents/status — público, sem autenticação
  // Registrado no escopo raiz para não herdar o addHook('preHandler') do agentsRoutes
  app.get('/api/v1/agents/status', { schema: { tags: ['agents'] } }, async (_req, reply) => {
    return reply.send({
      configured: !!env.ANTHROPIC_API_KEY,
      model: env.ANTHROPIC_API_KEY ? 'claude-3-5-sonnet-20241022' : null,
      message: env.ANTHROPIC_API_KEY
        ? 'Agentes de IA ativos e prontos.'
        : 'ANTHROPIC_API_KEY não configurada. Acesse Railway → Settings → Variables para ativar.',
    })
  })

  // POST /api/v1/admin/reset-role — emergency privilege escalation endpoint.
  //
  // This is a deliberately privileged maintenance endpoint. It is gated by a
  // dedicated secret (ADMIN_RESET_TOKEN) — NOT JWT_SECRET, which would turn
  // JWT_SECRET into a shared admin password. The endpoint is disabled unless
  // ADMIN_RESET_TOKEN is explicitly configured (deny-by-default), and uses a
  // constant-time comparison so attackers cannot learn the secret via timing.
  app.post('/api/v1/admin/reset-role', {
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
  }, async (req, reply) => {
    const resetToken = process.env.ADMIN_RESET_TOKEN
    if (!resetToken || resetToken.length < 32) {
      return reply.status(404).send({ error: 'NOT_FOUND' })
    }
    const body = req.body as any
    const provided = typeof body?.secret === 'string' ? body.secret : ''
    if (!safeStringEqual(provided, resetToken)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }
    const email = typeof body?.email === 'string' ? body.email : ''
    const role = typeof body?.role === 'string' ? body.role : 'SUPER_ADMIN'
    if (!email) {
      return reply.status(400).send({ error: 'EMAIL_REQUIRED' })
    }
    try {
      const user = await app.prisma.user.findUnique({ where: { email } })
      if (!user) return reply.status(404).send({ error: 'USER_NOT_FOUND' })
      await app.prisma.user.update({
        where: { email },
        data: { role: role as any, status: 'ACTIVE', emailVerifiedAt: new Date() },
      })
      app.log.warn(`[admin.reset-role] ${email} promoted to ${role} via maintenance endpoint`)
      return reply.send({ ok: true, email, role, previousRole: user.role })
    } catch (err: any) {
      app.log.error({ err }, '[admin.reset-role] failed')
      return reply.status(500).send({ error: 'INTERNAL_ERROR' })
    }
  })
  await app.register(agentsRoutes,    { prefix: '/api/v1/agents' })
  await app.register(uploadRoutes,      { prefix: '/api/v1/upload' })
  await app.register(automationsRoutes, { prefix: '/api/v1/automations' })
  await app.register(eventsRoutes,      { prefix: '/api/v1/events' })
  await app.register(publicRoutes,      { prefix: '/api/v1/public' })
  await app.register(financeRoutes,     { prefix: '/api/v1/finance' })
  await app.register(invoiceRoutes,     { prefix: '/api/v1/finance/invoices' })
  await app.register(batchSettleRoutes, { prefix: '/api/v1/finance' })
  await app.register(fiscalRoutes,      { prefix: '/api/v1/fiscal' })
  await app.register(corretorRoutes,    { prefix: '/api/v1/corretor' })
  await app.register(aiVisualRoutes,    { prefix: '/api/v1/ai-visual' })
  await app.register(renovacoesRoutes,  { prefix: '/api/v1/crm/renovacoes' })
  await app.register(campanhasRoutes,    { prefix: '/api/v1/marketing/campanhas' })
  await app.register(financingsRoutes,   { prefix: '/api/v1/financings' })
  await app.register(blogRoutes,         { prefix: '/api/v1/blog' })
  await app.register(cepRoutes,          { prefix: '/api/v1/cep' })
  await app.register(socialRoutes,       { prefix: '/api/v1/social' })
  await app.register(documentsRoutes,    { prefix: '/api/v1/documents' })
  await app.register(portalClientRoutes, { prefix: '/api/v1/portal' })
  await app.register(auditLogsRoutes,    { prefix: '/api/v1/audit-logs' })
  await app.register(photoEditorRoutes,  { prefix: '/api/v1/photo-editor' })
  await app.register(videoEditorRoutes,  { prefix: '/api/v1/video-editor' })
  await app.register(systemConfigRoutes, { prefix: '/api/v1/system-config' })
  await app.register(legalRoutes,        { prefix: '/api/v1/legal' })
  await app.register(financeAutomationRoutes, { prefix: '/api/v1/finance/automation' })
  await app.register(alertsRoutes,            { prefix: '/api/v1/public/alerts' })
  await app.register(auctionsRoutes,          { prefix: '/api/v1/auctions' })
  await app.register(auctionsArchiveRoutes,   { prefix: '/api/v1/auctions' })
  // auctionsRoute desativada (FST_ERR_DUPLICATED_ROUTE com publicRoutes)
  // Leilões disponíveis em /api/v1/auctions (Claude) e /api/v1/public/auctions via publicRoutes
  await app.register(freeListingRoutes,        { prefix: '/api/v1/public' })
  await app.register(partnerRegisterRoute,     { prefix: '/api/v1/public' })
  await app.register(partnerAnalyticsRoute,    { prefix: '/api/v1/public' })
  await app.register(territoryRoute,           { prefix: '/api/v1/public' })
  await app.register(valuationRoutes,          { prefix: '/api/v1/public' })
  await app.register(publicPhotoEditorRoutes,  { prefix: '/api/v1/public' })
  await app.register(specialistsRoutes,        { prefix: '/api/v1/specialists' })
  await app.register(specialistPaymentRoutes,  { prefix: '/api/v1/specialists/payments' })
  await app.register(seoProgramaticoRoutes,    { prefix: '/api/v1/seo' })
  await app.register(financialAnalysisRoutes,  { prefix: '/api/v1/financial' })
  await app.register(seoIndexingRoutes,         { prefix: '/api/v1/seo/indexing' })
  await app.register(aiMarketingRoutes,        { prefix: '/api/v1/ai-marketing' })
  await app.register(leadScoringRoutes,        { prefix: '/api/v1/lead-scoring' })
  await app.register(maintenanceRoutes,        { prefix: '/api/v1/maintenance' })
  await app.register(ownerDashboardRoutes,     { prefix: '/api/v1/owner-dashboard' })
  await app.register(billingAutomationRoutes,  { prefix: '/api/v1/billing' })
  await app.register(saasBillingRoutes,        { prefix: '/api/v1/billing/saas' })
  await app.register(saasWebhookRoutes,        { prefix: '/api/v1/webhooks' })
  await app.register(asaasWebhookRoutes,       { prefix: '/api/v1/finance/webhook' })
  await app.register(tenantRoutes,             { prefix: '/api/v1/tenants' })
  await app.register(repasseRoutes,            { prefix: '/api/v1/repasse' })
  await app.register(payablesRoutes,           { prefix: '/api/v1/payables' })
  await app.register(rescissionRoutes,         { prefix: '/api/v1/rescission' })
  await app.register(agreementsRoutes,         { prefix: '/api/v1/agreements' })
  await app.register(noticesRoutes,            { prefix: '/api/v1/notices' })
  await app.register(reconciliationRoutes,     { prefix: '/api/v1/reconciliation' })
  await app.register(permissionsRoutes,        { prefix: '/api/v1/permissions' })
  await app.register(iptuRoutes,               { prefix: '/api/v1/iptu' })
  await app.register(signatureRoutes,          { prefix: '/api/v1/signatures' })
  await app.register(auctionAIRoutes,          { prefix: '/api/v1/auction-ai' })
  await app.register(importRoutes,             { prefix: '/api/v1/import' })
  await app.register(masterRoutes,             { prefix: '/api/v1/master' })
  await app.register(publicCatalogRoutes,      { prefix: '/api/v1/public' })
  await app.register(streetviewRoutes,         { prefix: '/api/v1/streetview' })
  await app.register(tomasRoutes,             { prefix: '/api/v1/tomas' })
  await app.register(notificationsRoutes,    { prefix: '/api/v1/notifications' })
  await app.register(integrationsRoutes,     { prefix: '/api/v1/integrations' })
  await app.register(exchangeRoutes,         { prefix: '/api/v1/public/exchange' })
  await app.register(loteadoraRoutes,        { prefix: '/api/v1/loteadora' })
  await app.register(apiKeysRoutes,          { prefix: '/api/v1/api-keys' })
  await app.register(outgoingWebhooksRoutes, { prefix: '/api/v1/webhooks' })
  await app.register(marketRoutes,           { prefix: '/api/v1/market' })
  await app.register(systemEventsRoutes,     { prefix: '/api/v1/system-events' })
  await app.register(visitsRoutes,           { prefix: '/api/v1/visits' })
  await app.register(proposalsRoutes,        { prefix: '/api/v1/proposals' })
  await app.register(publicApiRoutes,        { prefix: '/public-api' })
  await app.register(hunterRoutes,           { prefix: '/api/v1/hunter' })
  await app.register(affiliateRoutes,        { prefix: '/api/v1/affiliates' })
  await app.register(saasFinanceRoutes,      { prefix: '/api/v1/saas-finance' })
  await app.register(previewRoutes,          { prefix: '/api/v1/preview' })
  await app.register(outboundRoutes,         { prefix: '/api/v1/outbound' })
  await app.register(waCampaignsRoutes,      { prefix: '/api/v1/wa-campaigns' })

  // ── Re-ativar leilões bancários fechados erroneamente pelo cleanup ────
  try {
    const reactivated = await app.prisma.auction.updateMany({
      where: {
        status: 'CLOSED',
        source: { in: ['CAIXA', 'BANCO_DO_BRASIL', 'BRADESCO', 'SANTANDER', 'ITAU'] },
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
      data: { status: 'OPEN' },
    })
    if (reactivated.count > 0) {
      app.log.info(`[boot] Reativados ${reactivated.count} leilões bancários que estavam CLOSED`)
    }
  } catch (e: any) { app.log.warn('Auction reactivation skip:', e.message) }

  // ── Bootstrap idempotente de planos + nichos ───────────────────────────
  // Sem isto o checkout falhava com PLAN_NOT_FOUND porque a tabela vinha
  // vazia em produção. Roda em todo boot, só insere o que falta.
  try {
    await bootstrapDefaultPlans(app.prisma)
  } catch (e: any) {
    app.log.warn('bootstrapDefaultPlans skip:', e.message)
  }

  // ── Scraper Scheduler (robôs 24/7 de leilões) ─────────────────────────
  if (env.NODE_ENV === 'production') {
    try {
      const scheduler = new ScraperScheduler(app.prisma)
      scheduler.start()
      app.addHook('onClose', () => scheduler.stop())
    } catch (e: any) { app.log.warn('ScraperScheduler init skip:', e.message) }

    // Monitor de Lances 24/7 (resiliente — não impede boot)
    try {
      const monitor = new AuctionMonitorService(app.prisma)
      monitor.start()
      app.addHook('onClose', () => monitor.stop())
    } catch (e: any) { app.log.warn('AuctionMonitor init skip:', e.message) }

    // Protocolo Predatório (resiliente)
    try {
      const predatory = new PredatoryProtocol(app.prisma)
      predatory.start()
      app.addHook('onClose', () => predatory.stop())
    } catch (e: any) { app.log.warn('PredatoryProtocol init skip:', e.message) }

    // Auto-Healing — monitora erros 500 e problemas de pagamento
    try {
      const autoHealing = new AutoHealingService()
      autoHealing.start()
      app.addHook('onClose', () => autoHealing.stop())
    } catch (e: any) { app.log.warn('AutoHealing init skip:', e.message) }
  }

  // ── 404 Handler ─────────────────────────────────────────────────────────
  app.setNotFoundHandler((_req, reply) => {
    reply.status(404).send({ error: 'NOT_FOUND', message: 'Route not found' })
  })

  // ── Error Handler ────────────────────────────────────────────────────────
  app.setErrorHandler((err: unknown, _req, reply) => {
    const error = err as any
    // Zod validation errors → 400
    if (error instanceof ZodError || error?.name === 'ZodError' || error?.issues != null) {
      return reply.status(400).send({
        error: 'VALIDATION_ERROR',
        message: error.message,
      })
    }
    const statusCode = error?.statusCode ?? 500
    if (statusCode >= 500) captureError(error)
    app.log.error(error)
    reply.status(statusCode).send({
      error: error?.code ?? 'INTERNAL_ERROR',
      message: env.NODE_ENV === 'production' && statusCode === 500
        ? 'Internal server error'
        : error?.message || 'Unknown error',
    })
  })

  const address = await app.listen({ port: env.PORT, host: '0.0.0.0' })
  app.log.info(`🚀 AgoraEncontrei API running at ${address}`)
  app.log.info(`📚 Swagger docs: ${address}/docs`)
  logEnvWarnings({ warn: (msg) => app.log.warn(msg) })
}

// ── Keep-Alive: evitar hibernação no Railway ──────────────────────────────
// Faz um ping interno a cada 4 minutos para manter o servidor ativo
if (process.env.NODE_ENV === 'production') {
  const KEEP_ALIVE_INTERVAL = 4 * 60 * 1000 // 4 minutos
  const selfUrl = `http://0.0.0.0:${process.env.PORT ?? 3100}/health`
  setInterval(async () => {
    try {
      const http = await import('http')
      http.get(selfUrl, (res) => {
        res.resume() // consume response
      }).on('error', () => {}) // silenciar erros
    } catch {}
  }, KEEP_ALIVE_INTERVAL)
}

// Prevent unhandled rejections from crashing the process
process.on('unhandledRejection', (err: any) => {
  console.error('[UnhandledRejection]', err?.message || err)
})

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'] as const
for (const signal of signals) {
  process.on(signal, async () => {
    await app.close()
    process.exit(0)
  })
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err)
  process.exit(1)
})

export default app
