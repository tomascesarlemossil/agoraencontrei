import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { env } from '../utils/env.js'

export interface JwtPayload {
  sub: string      // userId
  cid: string      // companyId
  role: string
  jti?: string
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: any) => Promise<void>
    optionalAuth: (req: FastifyRequest, reply: any) => Promise<void>
  }
}

export default fp(async (app: FastifyInstance) => {
  await app.register(fastifyCookie, { secret: env.COOKIE_SECRET })

  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: 'access_token', signed: false },
    sign: { expiresIn: env.JWT_ACCESS_EXPIRES },
  })

  app.decorate('authenticate', async (req: FastifyRequest, reply: any) => {
    try {
      await req.jwtVerify()
    } catch (err) {
      reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Invalid or expired token' })
    }
  })

  app.decorate('optionalAuth', async (req: FastifyRequest, _reply: any) => {
    try {
      await req.jwtVerify()
    } catch {
      // silently ignore — user is unauthenticated
    }
  })
})
