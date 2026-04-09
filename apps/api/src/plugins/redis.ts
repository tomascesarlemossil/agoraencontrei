import fp from 'fastify-plugin'
import { Redis } from 'ioredis'
import { env } from '../utils/env.js'

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis | null
  }
}

export default fp(async (app) => {
  if (!env.REDIS_URL) {
    app.log.warn('REDIS_URL not set — chat sessions will use in-memory fallback')
    app.decorate('redis', null)
    return
  }

  const redis = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    connectTimeout: 10000,
    commandTimeout: 5000,
  })

  // Connect with timeout — don't block server startup
  try {
    await Promise.race([
      redis.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Redis connection timeout (10s)')), 10000)),
    ])
    app.log.info('✅ Redis connected')
  } catch (err: any) {
    app.log.warn(`⚠️ Redis connect failed: ${err.message} — falling back to in-memory`)
  }

  app.decorate('redis', redis)

  app.addHook('onClose', async () => {
    await redis.quit()
  })
})
