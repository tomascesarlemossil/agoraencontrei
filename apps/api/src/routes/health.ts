import type { FastifyInstance } from 'fastify'

export default async function healthRoutes(app: FastifyInstance) {
  // Simple healthcheck — always returns 200 so Railway healthcheck passes
  // Database status is informational only, not a gate
  app.get('/', { schema: { tags: ['system'] } }, async (_req, reply) => {
    let dbStatus = 'unknown'
    try {
      await app.prisma.$queryRaw`SELECT 1`
      dbStatus = 'connected'
    } catch {
      dbStatus = 'disconnected'
    }
    return reply.send({
      status: 'ok',
      service: 'agoraencontrei-api',
      version: '1.0.0',
      db: dbStatus,
      timestamp: new Date().toISOString(),
    })
  })
}
