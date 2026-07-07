import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const TrackSchema = z.object({
  partnerId: z.string(),
  event: z.enum(['whatsapp_click', 'phone_click', 'profile_view', 'condo_impression', 'qualified_lead']),
  condoName: z.string().optional(),
  condoSlug: z.string().optional(),
  auctionId: z.string().optional(),
  propertyId: z.string().optional(),
  pageUrl: z.string().optional(),
})

const PartnerLeadSchema = z.object({
  partnerId: z.string().min(1),
  partnerName: z.string().optional(),
  name: z.string().min(2).max(120),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(8).max(40),
  city: z.string().max(120).optional(),
  projectType: z.string().max(80).optional(),
  objective: z.string().max(120).optional(),
  budget: z.string().max(80).optional(),
  timeline: z.string().max(80).optional(),
  property: z.string().max(80).optional(),
  message: z.string().max(1600).optional(),
  pageUrl: z.string().max(800).optional(),
})

function scorePartnerLead(data: z.infer<typeof PartnerLeadSchema>) {
  let score = 20
  const reasons: string[] = []
  if (data.phone.replace(/\D/g, '').length >= 10) { score += 15; reasons.push('telefone valido') }
  if (data.email) { score += 8; reasons.push('email informado') }
  if (data.projectType) { score += 10; reasons.push('tipo de projeto definido') }
  if (data.objective) { score += 10; reasons.push('objetivo claro') }
  if (data.city) { score += 8; reasons.push('cidade informada') }
  if (data.budget && !/nao|sem|indefinido/i.test(data.budget)) { score += 12; reasons.push('orcamento informado') }
  if (data.timeline && /urgente|30|60|agora|imediato/i.test(data.timeline)) { score += 12; reasons.push('prazo com urgencia') }
  else if (data.timeline) { score += 6; reasons.push('prazo informado') }
  if (data.message && data.message.trim().length >= 40) { score += 10; reasons.push('briefing detalhado') }
  score = Math.max(0, Math.min(100, score))

  const scoreLabel = score >= 80 ? 'quente' : score >= 55 ? 'morno' : 'inicial'
  const recommendedAction = score >= 80
    ? 'Responder em ate 15 minutos e propor diagnostico inicial.'
    : score >= 55
      ? 'Confirmar escopo, prazo e faixa de investimento antes do orcamento.'
      : 'Pedir dados complementares para qualificar melhor.'
  const summary = [
    data.projectType && `Projeto: ${data.projectType}`,
    data.objective && `Objetivo: ${data.objective}`,
    data.city && `Cidade: ${data.city}`,
    data.property && `Imovel: ${data.property}`,
    data.budget && `Orcamento: ${data.budget}`,
    data.timeline && `Prazo: ${data.timeline}`,
    data.message && `Observacoes: ${data.message}`,
  ].filter(Boolean).join('\n')

  return { score, scoreLabel, recommendedAction, reasons, summary }
}

export async function partnerAnalyticsRoute(app: FastifyInstance) {

  // POST /api/v1/public/partner-track — registrar evento de clique/visualização
  app.post('/partner-track', async (req, reply) => {
    const result = TrackSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR' })
    }

    const data = result.data
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip
    const ua = req.headers['user-agent'] || ''
    const referrer = req.headers.referer || ''

    try {
      await app.prisma.$executeRawUnsafe(
        `INSERT INTO partner_analytics (id, "partnerId", event, "condoName", "condoSlug", "auctionId", "propertyId", "visitorIp", "visitorUserAgent", referrer, "pageUrl")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        data.partnerId, data.event, data.condoName || null, data.condoSlug || null,
        data.auctionId || null, data.propertyId || null, ip, ua.substring(0, 500),
        referrer.substring(0, 500), data.pageUrl || null
      )

      // Incrementar contadores no parceiro
      if (data.event === 'whatsapp_click') {
        await app.prisma.$executeRawUnsafe(
          `UPDATE partners SET "whatsappClicks" = "whatsappClicks" + 1 WHERE id = $1`,
          data.partnerId
        ).catch(() => {})
      } else if (data.event === 'profile_view') {
        await app.prisma.$executeRawUnsafe(
          `UPDATE partners SET "profileViews" = "profileViews" + 1 WHERE id = $1`,
          data.partnerId
        ).catch(() => {})
      }

      // Disparar evento de conversão para Facebook/Google Ads (retargeting)
      if (data.event === 'whatsapp_click') {
        // Facebook Conversions API (server-side)
        const fbPixelId = process.env.FB_PIXEL_ID || '932688306232065'
        const fbAccessToken = process.env.FB_CONVERSIONS_TOKEN
        if (fbAccessToken) {
          fetch(`https://graph.facebook.com/v18.0/${fbPixelId}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: [{
                event_name: 'Lead',
                event_time: Math.floor(Date.now() / 1000),
                action_source: 'website',
                user_data: {
                  client_ip_address: ip,
                  client_user_agent: ua,
                },
                custom_data: {
                  content_category: 'partner_contact',
                  content_name: data.partnerId,
                  value: 50, // valor estimado do lead
                  currency: 'BRL',
                },
              }],
              access_token: fbAccessToken,
            }),
          }).catch(() => {})
        }
      }

      return reply.status(201).send({ ok: true })
    } catch (err: any) {
      return reply.status(500).send({ error: 'TRACKING_ERROR' })
    }
  })

  // POST /api/v1/public/partner-leads — qualificador publico de clientes.
  app.post('/partner-leads', async (req, reply) => {
    const result = PartnerLeadSchema.safeParse(req.body)
    if (!result.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', issues: result.error.flatten() })
    }

    const data = result.data
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip
    const ua = String(req.headers['user-agent'] || '')
    const referrer = String(req.headers.referer || '')
    const qualified = scorePartnerLead(data)

    try {
      const rows = await app.prisma.$queryRawUnsafe<any[]>(
        `INSERT INTO partner_leads (
           id, "partnerId", "partnerName", name, email, phone, city,
           "projectType", objective, budget, timeline, property, message,
           score, "scoreLabel", "recommendedAction", summary,
           "pageUrl", referrer, "visitorIp", "visitorUserAgent", metadata
         )
         VALUES (
           gen_random_uuid()::text, $1, $2, $3, $4, $5, $6,
           $7, $8, $9, $10, $11, $12,
           $13, $14, $15, $16,
           $17, $18, $19, $20, $21::jsonb
         )
         RETURNING id, score, "scoreLabel", "recommendedAction", summary, "createdAt"`,
        data.partnerId,
        data.partnerName || null,
        data.name,
        data.email || null,
        data.phone,
        data.city || null,
        data.projectType || null,
        data.objective || null,
        data.budget || null,
        data.timeline || null,
        data.property || null,
        data.message || null,
        qualified.score,
        qualified.scoreLabel,
        qualified.recommendedAction,
        qualified.summary || null,
        data.pageUrl || null,
        referrer.substring(0, 500),
        ip,
        ua.substring(0, 500),
        JSON.stringify({ reasons: qualified.reasons }),
      )

      await app.prisma.$executeRawUnsafe(
        `INSERT INTO partner_analytics (id, "partnerId", event, "visitorIp", "visitorUserAgent", referrer, "pageUrl")
         VALUES (gen_random_uuid()::text, $1, 'qualified_lead', $2, $3, $4, $5)`,
        data.partnerId, ip, ua.substring(0, 500), referrer.substring(0, 500), data.pageUrl || null,
      ).catch(() => {})

      return reply.status(201).send({
        ok: true,
        data: rows[0],
      })
    } catch (err: any) {
      req.log.error({ err }, '[partner-leads] create failed')
      return reply.status(500).send({ error: 'PARTNER_LEAD_ERROR' })
    }
  })

  // GET /api/v1/public/partner-stats/:partnerId — dashboard do parceiro
  // Requires authentication to prevent enumeration of partner data
  app.get('/partner-stats/:partnerId', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { partnerId } = req.params as { partnerId: string }

    // SEGURANÇA (BOLA): só o próprio parceiro (match pelo e-mail do login) ou
    // SUPER_ADMIN vê as estatísticas. Antes, qualquer usuário autenticado lia as
    // stats/PII de qualquer parceiro informando o partnerId.
    if ((req.user as any).role !== 'SUPER_ADMIN') {
      const me = await app.prisma.user.findUnique({ where: { id: (req.user as any).sub }, select: { email: true } })
      const owns = await app.prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM partners WHERE id = $1 AND lower(email) = lower($2) LIMIT 1`,
        partnerId, me?.email ?? '',
      )
      if (!owns.length) return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    try {
      // Stats do mês atual
      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const [monthlyStats, allTimeStats, recentEvents, partner] = await Promise.all([
        // Stats do mês
        app.prisma.$queryRawUnsafe<any[]>(
          `SELECT
            COUNT(*) FILTER (WHERE event = 'profile_view') as profile_views,
            COUNT(*) FILTER (WHERE event = 'whatsapp_click') as whatsapp_clicks,
            COUNT(*) FILTER (WHERE event = 'phone_click') as phone_clicks,
            COUNT(*) FILTER (WHERE event = 'qualified_lead') as qualified_leads,
            COUNT(*) FILTER (WHERE event = 'condo_impression') as condo_impressions,
            COUNT(DISTINCT "condoName") as condos_appeared,
            COUNT(DISTINCT "visitorIp") as unique_visitors
          FROM partner_analytics
          WHERE "partnerId" = $1 AND "createdAt" >= $2`,
          partnerId, firstOfMonth
        ),

        // Stats total
        app.prisma.$queryRawUnsafe<any[]>(
          `SELECT
            COUNT(*) as total_events,
            COUNT(*) FILTER (WHERE event = 'whatsapp_click') as total_whatsapp,
            COUNT(*) FILTER (WHERE event = 'profile_view') as total_views,
            COUNT(*) FILTER (WHERE event = 'qualified_lead') as total_qualified_leads
          FROM partner_analytics
          WHERE "partnerId" = $1`,
          partnerId
        ),

        // Últimos 20 eventos
        app.prisma.$queryRawUnsafe<any[]>(
          `SELECT event, "condoName", "pageUrl", "createdAt"
          FROM partner_analytics
          WHERE "partnerId" = $1
          ORDER BY "createdAt" DESC
          LIMIT 20`,
          partnerId
        ),

        // Dados do parceiro
        app.prisma.$queryRawUnsafe<any[]>(
          `SELECT name, email, plan, "isFounder", "planPrice", condos, "whatsappClicks", "profileViews", "createdAt"
          FROM partners WHERE id = $1`,
          partnerId
        ),
      ])

      const monthly = monthlyStats[0] || {}
      const allTime = allTimeStats[0] || {}
      const partnerData = partner[0] || null

      // Custo por lead (se for parceiro pago)
      const planPrice = partnerData?.planPrice ? Number(partnerData.planPrice) : 0
      const whatsappClicks = Number(monthly.whatsapp_clicks || 0)
      const costPerLead = planPrice > 0 && whatsappClicks > 0 ? planPrice / whatsappClicks : null

      return reply.send({
        partner: partnerData,
        monthly: {
          profileViews: Number(monthly.profile_views || 0),
          whatsappClicks: Number(monthly.whatsapp_clicks || 0),
          phoneClicks: Number(monthly.phone_clicks || 0),
          qualifiedLeads: Number(monthly.qualified_leads || 0),
          condoImpressions: Number(monthly.condo_impressions || 0),
          condosAppeared: Number(monthly.condos_appeared || 0),
          uniqueVisitors: Number(monthly.unique_visitors || 0),
          costPerLead: costPerLead ? Number(costPerLead.toFixed(2)) : null,
        },
        allTime: {
          totalEvents: Number(allTime.total_events || 0),
          totalWhatsapp: Number(allTime.total_whatsapp || 0),
          totalViews: Number(allTime.total_views || 0),
          totalQualifiedLeads: Number(allTime.total_qualified_leads || 0),
        },
        recentEvents,
      })
    } catch (err: any) {
      return reply.status(500).send({ error: 'STATS_ERROR' })
    }
  })
}
