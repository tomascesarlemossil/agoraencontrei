import fp from 'fastify-plugin'
import fastifyCors from '@fastify/cors'
import type { FastifyInstance } from 'fastify'
import { env } from '../utils/env.js'

export default fp(async (app: FastifyInstance) => {
  await app.register(fastifyCors, {
    origin: [env.WEB_URL, 'https://www.agoraencontrei.com.br', 'https://agoraencontrei.com.br', 'https://agoraencontrei.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Company-ID'],
  })
})
