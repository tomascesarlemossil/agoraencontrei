import fp from 'fastify-plugin'
import { PrismaClient } from '@prisma/client'
import type { FastifyInstance } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}

export default fp(async (app: FastifyInstance) => {
  const prisma = new PrismaClient({
    log: app.log.level === 'debug'
      ? [{ emit: 'event', level: 'query' }]
      : [],
  })

  // Connect with timeout — don't block server startup if DB is slow/unreachable
  // Prisma auto-connects on first query, so the server can start without a connection
  try {
    await Promise.race([
      prisma.$connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB connection timeout (15s)')), 15000)),
    ])
    app.log.info('✅ Prisma connected')
  } catch (err: any) {
    app.log.warn(`⚠️ Prisma initial connect failed: ${err.message} — will retry on first query`)
  }

  app.decorate('prisma', prisma)

  app.addHook('onClose', async () => {
    await prisma.$disconnect()
  })
})
