/**
 * Preview Mode Routes — Site temporário para demonstração de vendas
 *
 * GET /api/v1/preview/:siteName — Gera preview JSON sem persistência
 */

import type { FastifyInstance } from 'fastify'

const THEMES: Record<string, { name: string; primaryColor: string; style: string }> = {
  urban_tech: {
    name: 'Urban Tech',
    primaryColor: '#d4a853',
    style: 'Moderno e tecnológico',
  },
  luxury_gold: {
    name: 'Luxury Gold',
    primaryColor: '#c9a84c',
    style: 'Luxuoso e elegante',
  },
  clean: {
    name: 'Clean',
    primaryColor: '#3b82f6',
    style: 'Limpo e profissional',
  },
}

function generateSlogan(name: string): string {
  const slogans = [
    `${name} — Seu imóvel ideal está aqui`,
    `${name} — Encontre o lar dos seus sonhos`,
    `${name} — Referência em imóveis`,
    `${name} — Tecnologia e tradição no mercado imobiliário`,
    `${name} — Seu parceiro imobiliário de confiança`,
  ]
  return slogans[Math.floor(Math.random() * slogans.length)]
}

export default async function previewRoutes(app: FastifyInstance) {
  // ── GET /:siteName — Gera preview do site ──────────────────────────────────
  app.get('/:siteName', async (req, reply) => {
    const { siteName } = req.params as { siteName: string }
    const query = req.query as { theme?: string }

    const name = decodeURIComponent(siteName)
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())

    const themeKey = query.theme && THEMES[query.theme] ? query.theme : 'urban_tech'
    const theme = THEMES[themeKey]

    const preview = {
      name,
      slogan: generateSlogan(name),
      subdomain: siteName.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      theme: {
        key: themeKey,
        ...theme,
      },
      logoUrl: null,
      faviconUrl: null,
      features: [
        'Portal imobiliário completo',
        'Atendimento IA 24h (Tomás)',
        'CRM integrado',
        'Leads direto no WhatsApp',
        'Anúncio em portais',
        'Tour Virtual',
      ],
      mockProperties: [
        { title: 'Casa 3 quartos - Jd. Petráglia', price: 'R$ 650.000', type: 'HOUSE', bedrooms: 3 },
        { title: 'Apartamento 2 quartos - Centro', price: 'R$ 320.000', type: 'APARTMENT', bedrooms: 2 },
        { title: 'Terreno 250m² - Damha III', price: 'R$ 180.000', type: 'LAND', bedrooms: 0 },
      ],
      isPreview: true,
      createdAt: new Date().toISOString(),
    }

    // Audit
    await (app.prisma as any).auditLog.create({
      data: {
        companyId: 'platform',
        action: 'preview.generated',
        resource: 'preview',
        resourceId: siteName,
        payload: { name, theme: themeKey },
      },
    }).catch(() => {})

    return reply.send({ data: preview })
  })
}
