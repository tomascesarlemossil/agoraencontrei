import fp from 'fastify-plugin'
import fastifyRateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'

export default fp(async (app: FastifyInstance) => {
  await app.register(fastifyRateLimit, {
    global: true,
    max: 200,
    timeWindow: '1 minute',
    keyGenerator: (req) =>
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ?? req.ip,
    errorResponseBuilder: () => ({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please slow down.',
    }),
  })

  // ── Bot protection: stricter limits for scraping-prone endpoints ──────
  // These run as route-level rate limits (applied via onRequest hooks)
  app.addHook('onRequest', async (req, reply) => {
    const ua = (req.headers['user-agent'] || '').toLowerCase()
    const path = req.url

    // Block known scraper user agents on property/auction data endpoints
    const BLOCKED_BOTS = [
      'scrapy', 'python-requests', 'httpclient', 'curl/', 'wget/',
      'node-fetch', 'axios/', 'go-http-client', 'java/',
      'php/', 'libwww-perl', 'mechanize', 'crawler', 'spider',
    ]

    const isDataEndpoint = path.includes('/api/v1/public/properties') ||
      path.includes('/api/v1/auctions') ||
      path.includes('/api/v1/public/map-clusters')

    if (isDataEndpoint && BLOCKED_BOTS.some(bot => ua.includes(bot))) {
      reply.status(403).send({
        error: 'ACCESS_DENIED',
        message: 'Automated access is not permitted. Use our website at www.agoraencontrei.com.br',
      })
      return
    }

    // Add anti-scraping headers to all responses
    reply.header('X-Content-Type-Options', 'nosniff')
    reply.header('X-Frame-Options', 'DENY')
    reply.header('X-Robots-Tag', 'noai, noimageai')
  })
})
