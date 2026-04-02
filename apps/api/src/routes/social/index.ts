import type { FastifyInstance } from 'fastify'
import { env } from '../../utils/env.js'
import { syncInstagramToBlog, syncYouTubeToBlog } from '../../services/social-sync.service.js'

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

    // Sync YouTube
    if (env.YOUTUBE_API_KEY) {
      try {
        results.youtube = await syncYouTubeToBlog(app.prisma as any, companyId, env.YOUTUBE_API_KEY, 'imobiliarialemos')
      } catch (e: any) {
        results.youtube_error = e.message
      }
    }

    if (!env.INSTAGRAM_TOKEN_LEMOS && !env.INSTAGRAM_TOKEN_TOMAS && !env.YOUTUBE_API_KEY) {
      return reply.send({ message: 'No social media APIs configured. Add INSTAGRAM_TOKEN_LEMOS, INSTAGRAM_TOKEN_TOMAS or YOUTUBE_API_KEY to Railway env vars.', results: {} })
    }

    return reply.send({ synced: true, results })
  })

  // GET /api/v1/social/status — check what's configured
  app.get('/status', { preHandler: [app.authenticate] }, async (_req, reply) => {
    return reply.send({
      instagram_lemos: !!env.INSTAGRAM_TOKEN_LEMOS,
      instagram_tomas: !!env.INSTAGRAM_TOKEN_TOMAS,
      youtube: !!env.YOUTUBE_API_KEY,
      instructions: {
        instagram: 'Get access token from https://developers.facebook.com/docs/instagram-basic-display-api',
        youtube: 'Get API key from https://console.cloud.google.com/apis/library/youtube.googleapis.com',
      },
    })
  })
}
