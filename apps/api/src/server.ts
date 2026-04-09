import 'dotenv/config'
import Fastify from 'fastify'
import { ZodError } from 'zod'
import { env, logEnvWarnings } from './utils/env.js'

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
import fiscalRoutes from './routes/fiscal/index.js'
import corretorRoutes from './routes/users/corretor.js'
import aiVisualRoutes from './routes/ai-visual/index.js'
import renovacoesRoutes from './routes/crm/renovacoes.js'
import campanhasRoutes from './routes/marketing/campanhas.js'
import financingsRoutes from './routes/financings/index.js'
import blogRoutes from './routes/blog/index.js'
import socialRoutes from './routes/social/index.js'
import documentsRoutes from './routes/documents/index.js'
import portalClientRoutes from './routes/portal/index.js'
import auditLogsRoutes from './routes/audit-logs/index.js'
import photoEditorRoutes from './routes/photo-editor/index.js'
import systemConfigRoutes from './routes/system-config/index.js'
import legalRoutes from './routes/legal/index.js'
import financeAutomationRoutes from './routes/finance/automation.js'
import alertsRoutes from './routes/alerts/index.js'
import auctionsRoutes from './routes/auctions/index.js'
import specialistsRoutes from './routes/specialists/index.js'
import { specialistPaymentRoutes } from './routes/specialists/payments.js'
import { ScraperScheduler } from './services/scrapers/scheduler.js'
import { AuctionMonitorService } from './services/auction-monitor.service.js'
import { PredatoryProtocol } from './services/predatory/protocol.js'
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

const app = Fastify({
  // No body size limit — accept any file size
  bodyLimit: 1073741824, // 1GB — aceita qualquer arquivo
  logger: {
    level: env.LOG_LEVEL,
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
  // ── Admin role enforcement ──────────────────────────────────────────────
  // Ensures admin users have correct role on boot (no password reset in code)
  try {
    for (const email of ['tomas@agoraencontrei.com.br', 'tomascesarlemossilva@gmail.com']) {
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
    // Campos de pagamento (idempotentes)
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS cpfcnpj TEXT`,
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'START'`,
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "planStatus" TEXT DEFAULT 'FREE'`,
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "planActivatedAt" TIMESTAMP`,
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "planExpiresAt" TIMESTAMP`,
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "asaasCustomerId" TEXT`,
    `ALTER TABLE specialists ADD COLUMN IF NOT EXISTS "asaasSubscriptionId" TEXT`,
    `CREATE INDEX IF NOT EXISTS specialists_plan_idx ON specialists(plan)`,
    `CREATE INDEX IF NOT EXISTS specialists_category_idx ON specialists(category)`,
    `CREATE INDEX IF NOT EXISTS buildings_city_idx ON buildings(city, state)`,
  ]
  for (const sql of specialistsMigrations) {
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

async function bootstrap() {
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
  await app.register(redisPlugin)
  await app.register(automationPlugin)
  // No file size limit — accept any file type and size
  await app.register(multipart, { limits: { fileSize: Infinity } })
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

  // POST /api/v1/admin/reset-role — Reset user role (protegido por JWT_SECRET)
  app.post('/api/v1/admin/reset-role', async (req, reply) => {
    const body = req.body as any
    const secret = body?.secret
    if (secret !== env.JWT_SECRET) {
      return reply.status(403).send({ error: 'Forbidden' })
    }
    const email = body?.email || 'tomas@agoraencontrei.com.br'
    const role = body?.role || 'SUPER_ADMIN'
    try {
      const user = await app.prisma.user.findUnique({ where: { email } })
      if (!user) {
        // List all users
        const all = await app.prisma.user.findMany({ select: { email: true, name: true, role: true, status: true }, take: 20 })
        return reply.status(404).send({ error: 'User not found', users: all })
      }
      await app.prisma.user.update({
        where: { email },
        data: { role: role as any, status: 'ACTIVE', emailVerifiedAt: new Date() },
      })
      return reply.send({ ok: true, message: `${user.name} atualizado para ${role} + ACTIVE`, previousRole: user.role })
    } catch (err: any) {
      return reply.status(500).send({ error: err.message })
    }
  })
  await app.register(agentsRoutes,    { prefix: '/api/v1/agents' })
  await app.register(uploadRoutes,      { prefix: '/api/v1/upload' })
  await app.register(automationsRoutes, { prefix: '/api/v1/automations' })
  await app.register(eventsRoutes,      { prefix: '/api/v1/events' })
  await app.register(publicRoutes,      { prefix: '/api/v1/public' })
  await app.register(financeRoutes,     { prefix: '/api/v1/finance' })
  await app.register(invoiceRoutes,     { prefix: '/api/v1/finance/invoices' })
  await app.register(fiscalRoutes,      { prefix: '/api/v1/fiscal' })
  await app.register(corretorRoutes,    { prefix: '/api/v1/corretor' })
  await app.register(aiVisualRoutes,    { prefix: '/api/v1/ai-visual' })
  await app.register(renovacoesRoutes,  { prefix: '/api/v1/crm/renovacoes' })
  await app.register(campanhasRoutes,    { prefix: '/api/v1/marketing/campanhas' })
  await app.register(financingsRoutes,   { prefix: '/api/v1/financings' })
  await app.register(blogRoutes,         { prefix: '/api/v1/blog' })
  await app.register(socialRoutes,       { prefix: '/api/v1/social' })
  await app.register(documentsRoutes,    { prefix: '/api/v1/documents' })
  await app.register(portalClientRoutes, { prefix: '/api/v1/portal' })
  await app.register(auditLogsRoutes,    { prefix: '/api/v1/audit-logs' })
  await app.register(photoEditorRoutes,  { prefix: '/api/v1/photo-editor' })
  await app.register(systemConfigRoutes, { prefix: '/api/v1/system-config' })
  await app.register(legalRoutes,        { prefix: '/api/v1/legal' })
  await app.register(financeAutomationRoutes, { prefix: '/api/v1/finance/automation' })
  await app.register(alertsRoutes,            { prefix: '/api/v1/public/alerts' })
  await app.register(auctionsRoutes,          { prefix: '/api/v1/auctions' })
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
    app.log.error(error)
    const statusCode = error?.statusCode ?? 500
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
