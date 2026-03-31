import type { FastifyInstance } from 'fastify'

export default async function healthRoutes(app: FastifyInstance) {
  app.get('/', { schema: { tags: ['system'] } }, async (_req, reply) => {
    try {
      await app.prisma.$queryRaw`SELECT 1`
      return reply.send({
        status: 'ok',
        service: 'agoraencontrei-api',
        version: '1.0.0',
        db: 'connected',
        timestamp: new Date().toISOString(),
      })
    } catch {
      return reply.status(503).send({ status: 'degraded', db: 'disconnected' })
    }
  })
}
