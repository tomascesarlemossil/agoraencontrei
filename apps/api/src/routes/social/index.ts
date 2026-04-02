import type { FastifyInstance } from 'fastify'
import { env } from '../../utils/env.js'
import { syncInstagramToBlog, syncYouTubeToBlog } from '../../services/social-sync.service.js'

// Channel ID: UCKpTcdWhQZIPMX8EF_nNckw
const YOUTUBE_CHANNEL_ID = env.YOUTUBE_CHANNEL_ID ?? 'UCKpTcdWhQZIPMX8EF_nNckw'

async function resolveCompanyId(app: FastifyInstance): Promise<string | null> {
  const companyId = env.PUBLIC_COMPANY_ID
  if (companyId) return companyId
  const company = await app.prisma.company.findFirst({ where: { isActive: true } })
  return company?.id ?? null
}

export default async function socialRoutes(app: FastifyInstance) {

  // POST /api/v1/social/sync — manual sync trigger (authenticated)
  app.post('/sync', { preHandler: [app.authenticate] }, async (req, reply) => {
    const companyId = await resolveCompanyId(app)
    if (!companyId) return reply.status(503).send({ error: 'NO_COMPANY' })

    const results: Record<string, number | string> = {}

    // Sync Instagram @imobiliarialemos
    if (env.INSTAGRAM_TOKEN_LEMOS) {
      try {
        results.instagram_lemos = await syncInstagramToBlog(app.prisma as any, companyId, env.INSTAGRAM_TOKEN_LEMOS, 'imobiliarialemos')
      } catch (e: any) {
        results.instagram_lemos_error = e.message
      }
    }

    // Sync Instagram @tomaslemosbr
    if (env.INSTAGRAM_TOKEN_TOMAS) {
      try {
        results.instagram_tomas = await syncInstagramToBlog(app.prisma as any, companyId, env.INSTAGRAM_TOKEN_TOMAS, 'tomaslemosbr')
      } catch (e: any) {
        results.instagram_tomas_error = e.message
      }
    }

    // Sync YouTube — uses channel ID directly (no API key needed via RSS fallback)
    try {
      results.youtube = await syncYouTubeToBlog(
        app.prisma as any,
        companyId,
        env.YOUTUBE_API_KEY ?? null,
        YOUTUBE_CHANNEL_ID,
      )
    } catch (e: any) {
      results.youtube_error = e.message
    }

    return reply.send({ synced: true, results })
  })

  // GET /api/v1/social/status — check what's configured
  app.get('/status', { preHandler: [app.authenticate] }, async (_req, reply) => {
    return reply.send({
      instagram_lemos: !!env.INSTAGRAM_TOKEN_LEMOS,
      instagram_tomas: !!env.INSTAGRAM_TOKEN_TOMAS,
      youtube_api_key: !!env.YOUTUBE_API_KEY,
      youtube_channel_id: YOUTUBE_CHANNEL_ID,
      youtube_rss_fallback: true, // always available
      instagram_publisher: {
        configured: !!(env.INSTAGRAM_BUSINESS_ACCOUNT_ID && env.INSTAGRAM_PAGE_ACCESS_TOKEN),
        business_account_id: env.INSTAGRAM_BUSINESS_ACCOUNT_ID ? '✅ set' : '❌ missing',
        page_access_token: env.INSTAGRAM_PAGE_ACCESS_TOKEN ? '✅ set' : '❌ missing',
      },
      facebook_page_id: env.FACEBOOK_PAGE_ID ?? '932688306232065',
      meta_pixel_id: env.META_PIXEL_ID ?? '932688306232065',
      instructions: {
        youtube_sync: 'YouTube RSS works without API key. For full metadata, add YOUTUBE_API_KEY from console.cloud.google.com',
        instagram_read: 'INSTAGRAM_TOKEN_TOMAS already set. For @imobiliarialemos, generate at developers.facebook.com/tools/explorer',
        instagram_publish: [
          '1. Go to developers.facebook.com/tools/explorer',
          '2. Select your App → Get User Access Token',
          '3. Add permissions: instagram_basic, instagram_content_publish, pages_read_engagement, pages_manage_posts',
          '4. Generate Page Access Token for page 932688306232065',
          '5. Run: GET /932688306232065?fields=instagram_business_account&access_token={token}',
          '6. Get the instagram_business_account.id → set as INSTAGRAM_BUSINESS_ACCOUNT_ID',
          '7. Set long-lived token as INSTAGRAM_PAGE_ACCESS_TOKEN',
        ],
      },
    })
  })

  // POST /api/v1/social/daily-post — manual trigger for daily post job
  app.post('/daily-post', { preHandler: [app.authenticate] }, async (_req, reply) => {
    try {
      const { runDailySocialPost } = await import('../../jobs/daily-social-post.js')
      runDailySocialPost(app).catch((err: Error) => app.log.error(err))
      return reply.send({ message: 'Daily post job triggered in background' })
    } catch {
      return reply.status(501).send({ message: 'Daily post job not configured yet' })
    }
  })

  // Register social post routes (property publisher)
  const { default: socialPostRoutes } = await import('./posts.js')
  app.register(socialPostRoutes, { prefix: '/post' })
}
