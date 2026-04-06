import { FastifyInstance } from 'fastify'
import { z } from 'zod'

const TrackSchema = z.object({
  partnerId: z.string(),
  event: z.enum(['whatsapp_click', 'phone_click', 'profile_view', 'condo_impression']),
  condoName: z.string().optional(),
  condoSlug: z.string().optional(),
  auctionId: z.string().optional(),
  propertyId: z.string().optional(),
  pageUrl: z.string().optional(),
})

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

  // GET /api/v1/public/partner-stats/:partnerId — dashboard do parceiro
  app.get('/partner-stats/:partnerId', async (req, reply) => {
    const { partnerId } = req.params as { partnerId: string }

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
            COUNT(*) FILTER (WHERE event = 'profile_view') as total_views
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
          condoImpressions: Number(monthly.condo_impressions || 0),
          condosAppeared: Number(monthly.condos_appeared || 0),
          uniqueVisitors: Number(monthly.unique_visitors || 0),
          costPerLead: costPerLead ? Number(costPerLead.toFixed(2)) : null,
        },
        allTime: {
          totalEvents: Number(allTime.total_events || 0),
          totalWhatsapp: Number(allTime.total_whatsapp || 0),
          totalViews: Number(allTime.total_views || 0),
        },
        recentEvents,
      })
    } catch (err: any) {
      return reply.status(500).send({ error: 'STATS_ERROR' })
    }
  })
}
