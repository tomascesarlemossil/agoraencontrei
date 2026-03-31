import fp from 'fastify-plugin'
import fastifyHelmet from '@fastify/helmet'
import type { FastifyInstance } from 'fastify'

export default fp(async (app: FastifyInstance) => {
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,          // managed by Next.js frontend
    crossOriginResourcePolicy: false,       // allow cross-origin API responses
    crossOriginOpenerPolicy: false,         // not needed for API
  })
})
