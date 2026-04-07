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
})
