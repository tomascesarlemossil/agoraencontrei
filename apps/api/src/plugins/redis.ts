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

  const redis = new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 3 })
  await redis.connect()
  app.decorate('redis', redis)

  app.addHook('onClose', async () => {
    await redis.quit()
  })
})
