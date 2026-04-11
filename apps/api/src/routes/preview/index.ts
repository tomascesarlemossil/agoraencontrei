/**
 * Preview Engine Routes — Motor de conversão comercial instantânea
 *
 * GET  /api/v1/preview/:siteName — Gera preview com sessão persistente (72h)
 * GET  /api/v1/preview/session/:token — Resolve preview por token
 * GET  /api/v1/preview/themes — Lista temas disponíveis
 */

import type { FastifyInstance } from 'fastify'
import { generateBranding, getAvailableThemes } from '../../services/preview-branding.service.js'
import { createPreviewSession, resolvePreviewSession, isPreviewExpired } from '../../services/preview-token.service.js'
import { updateFunnelStage } from '../../services/lead-ingestion.service.js'
import { emitAutomation } from '../../services/automation.emitter.js'

const MOCK_PROPERTIES = [
  { title: 'Casa 3 quartos - Jd. Petráglia', price: 'R$ 650.000', type: 'HOUSE', bedrooms: 3, area: 180 },
  { title: 'Apartamento 2 quartos - Centro', price: 'R$ 320.000', type: 'APARTMENT', bedrooms: 2, area: 75 },
  { title: 'Terreno 250m² - Damha III', price: 'R$ 180.000', type: 'LAND', bedrooms: 0, area: 250 },
  { title: 'Sobrado 4 quartos - City Petrópolis', price: 'R$ 980.000', type: 'HOUSE', bedrooms: 4, area: 240 },
  { title: 'Sala Comercial 50m² - Centro', price: 'R$ 450.000', type: 'COMMERCIAL', bedrooms: 0, area: 50 },
  { title: 'Casa 2 quartos - Jd. Consolação', price: 'R$ 290.000', type: 'HOUSE', bedrooms: 2, area: 120 },
]

const FEATURES = {
  corretor: [
    'Portal imobiliário completo',
    'Atendimento IA 24h (Tomás)',
    'CRM integrado',
    'Leads direto no WhatsApp',
    'Anúncio em portais',
    'Tour Virtual',
    'Fotos com IA',
    'SEO automático',
  ],
  imobiliaria: [
    'Portal imobiliário multi-corretor',
    'IA Tomás para atendimento 24h',
    'CRM com pipeline completo',
    'Leads automáticos via WhatsApp',
    'Publicação em 10+ portais',
    'Tour Virtual integrado',
    'Gestão financeira (Lemosbank)',
    'Relatórios de performance',
    'Automações de follow-up',
  ],
  loteadora: [
    'Portal exclusivo do empreendimento',
    'IA de atendimento personalizada',
    'Mapa interativo de lotes',
    'Tabela de preços dinâmica',
    'Leads qualificados por IA',
    'Tour Virtual 360°',
    'Dashboard de vendas em tempo real',
    'Integração com financiamento',
  ],
  construtora: [
    'Portal premium por empreendimento',
    'IA de vendas 24h (Tomás)',
    'Galeria de imóveis com filtros',
    'Simulador de financiamento',
    'Pipeline de vendas integrado',
    'Tour Virtual e fotos IA',
    'Relatórios para investidores',
    'CRM multi-equipe',
  ],
}

export default async function previewRoutes(app: FastifyInstance) {
  const prisma = app.prisma as any

  // ── GET /themes — Lista temas disponíveis ─────────────────────────────────
  app.get('/themes', {
    config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
  }, async (_req, reply) => {
    return reply.send({ data: getAvailableThemes() })
  })

  // ── GET /session/:token — Resolve preview por token ───────────────────────
  app.get('/session/:token', {
    config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
  }, async (req, reply) => {
    const { token } = req.params as { token: string }

    const session = await prisma.previewSession.findFirst({
      where: { previewToken: token },
    }).catch(() => null)

    if (!session) {
      return reply.status(404).send({ error: 'Preview não encontrado', expired: false })
    }

    if (isPreviewExpired(session.expiresAt)) {
      return reply.send({
        error: 'Preview expirado',
        expired: true,
        data: { siteName: session.siteName, companyName: session.companyName },
      })
    }

    // Increment view count
    await prisma.previewSession.update({
      where: { id: session.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {})

    // ── Track preview_clicked in SalesFunnel ────────────────────────────
    try {
      const funnelEntry = await prisma.salesFunnel.findFirst({
        where: {
          previewSiteName: session.siteName,
          stage: 'preview_sent',
        },
        orderBy: { createdAt: 'desc' },
      })

      if (funnelEntry) {
        await updateFunnelStage(prisma, funnelEntry.id, 'preview_clicked')

        emitAutomation({
          companyId: 'platform',
          event: 'preview_clicked',
          data: {
            funnelId: funnelEntry.id,
            siteName: session.siteName,
            leadName: funnelEntry.name,
            leadPhone: funnelEntry.phone || '',
          },
        })
      }
    } catch {
      // Non-blocking
    }

    return reply.send({ data: session })
  })

  // ── GET /:siteName — Gera preview do site ─────────────────────────────────
  app.get('/:siteName', {
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
  }, async (req, reply) => {
    const { siteName } = req.params as { siteName: string }
    const query = req.query as {
      theme?: string; segment?: string; tone?: string; city?: string; companyName?: string
    }

    const slug = siteName.toLowerCase().replace(/[^a-z0-9-]/g, '-')

    // Check for existing non-expired session
    const existingSession = await resolvePreviewSession(prisma, slug)

    // Generate branding
    const name = query.companyName || decodeURIComponent(siteName)
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())

    const branding = generateBranding({
      companyName: name,
      theme: query.theme || existingSession?.theme,
      segment: query.segment || existingSession?.segment || 'corretor',
      tone: query.tone,
    })

    // Create or reuse session
    let session = existingSession
    if (!session) {
      session = await createPreviewSession(prisma, {
        siteName: slug,
        companyName: name,
        theme: branding.theme.key,
        slogan: branding.slogan,
        segment: branding.segment,
        city: query.city,
      }).catch(() => null)
    }

    const segment = branding.segment as keyof typeof FEATURES
    const features = FEATURES[segment] || FEATURES.corretor

    // Select mock properties (shuffle a subset)
    const shuffled = [...MOCK_PROPERTIES].sort(() => Math.random() - 0.5)
    const mockProperties = shuffled.slice(0, 4)

    const preview = {
      name,
      slogan: branding.slogan,
      subdomain: slug,
      theme: branding.theme,
      segment: branding.segment,
      tone: branding.tone,
      logoUrl: null,
      faviconUrl: null,
      features,
      mockProperties,
      previewToken: session?.previewToken || null,
      expiresAt: session?.expiresAt || null,
      viewCount: session?.viewCount || 0,
      isPreview: true,
      createdAt: new Date().toISOString(),
    }

    // ── Track preview_clicked in SalesFunnel ──────────────────────────────
    try {
      const funnelEntry = await prisma.salesFunnel.findFirst({
        where: {
          previewSiteName: slug,
          stage: 'preview_sent',
        },
        orderBy: { createdAt: 'desc' },
      })

      if (funnelEntry) {
        await updateFunnelStage(prisma, funnelEntry.id, 'preview_clicked')

        emitAutomation({
          companyId: 'platform',
          event: 'preview_clicked',
          data: {
            funnelId: funnelEntry.id,
            siteName: slug,
            leadName: funnelEntry.name,
            leadPhone: funnelEntry.phone || '',
          },
        })
      }
    } catch {
      // Non-blocking — preview still works even if funnel tracking fails
    }

    // Audit
    await prisma.auditLog.create({
      data: {
        companyId: 'platform',
        action: 'preview.generated',
        resource: 'preview',
        resourceId: slug,
        payload: { name, theme: branding.theme.key, segment: branding.segment },
      },
    }).catch(() => {})

    return reply.send({ data: preview })
  })
}
