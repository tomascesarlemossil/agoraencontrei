import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { env } from '../utils/env.js'

export interface JwtPayload {
  sub: string      // userId (staff) — clientId no token de portal
  cid: string      // companyId
  role: string
  jti?: string
  tv?: number      // tokenVersion — invalidação imediata (staff)
  type?: string    // 'portal' quando é token de portal (proprietário/inquilino)
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
    authenticatePortal: (req: FastifyRequest, reply: any) => Promise<void>
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

  // ── Staff auth ─────────────────────────────────────────────────────────────
  // Além de validar assinatura/expiração, agora:
  //  (1) REJEITA tokens de portal (type:'portal') — eles NÃO podem acessar rotas
  //      de staff (fechava confusão staff↔portal, já que ambos usam o mesmo
  //      JWT_SECRET; um token de cliente tinha `cid` undefined e vazava queries).
  //  (2) confirma que o usuário existe e está ACTIVE (suspenso/inativo perde acesso
  //      imediatamente, não só no próximo login).
  //  (3) confere `tv` (tokenVersion) contra o banco — troca de senha/role/suspensão
  //      incrementam tokenVersion e invalidam os access tokens antigos na hora.
  app.decorate('authenticate', async (req: FastifyRequest, reply: any) => {
    try {
      await req.jwtVerify()
      const u = req.user as JwtPayload
      if (u?.type === 'portal') {
        return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Portal token not allowed on staff routes' })
      }
      const prisma = (req.server as any).prisma
      const dbUser = await prisma.user.findUnique({
        where: { id: u.sub },
        select: { status: true, tokenVersion: true },
      })
      if (!dbUser || dbUser.status !== 'ACTIVE') {
        return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Account inactive or not found' })
      }
      if ((u.tv ?? 0) !== (dbUser.tokenVersion ?? 0)) {
        return reply.status(401).send({ error: 'TOKEN_STALE', message: 'Session invalidated, please log in again' })
      }
    } catch (err) {
      reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Invalid or expired token' })
    }
  })

  // ── Portal auth (proprietário/inquilino) ────────────────────────────────────
  // Centraliza o guard antes duplicado em routes/portal. Exige type:'portal' e
  // confirma que o Client ainda existe (token de 24h não vale para cliente
  // removido). Anexa req.portalClient { id, companyId } para escopo por empresa.
  app.decorate('authenticatePortal', async (req: FastifyRequest, reply: any) => {
    try {
      await req.jwtVerify()
      const u = req.user as JwtPayload
      if (u?.type !== 'portal') {
        return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Portal token required' })
      }
      const prisma = (req.server as any).prisma
      const client = await prisma.client.findUnique({ where: { id: u.sub }, select: { id: true, companyId: true } })
      if (!client) {
        return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Client not found' })
      }
      ;(req as any).portalClient = client
    } catch {
      return reply.status(401).send({ error: 'UNAUTHORIZED' })
    }
  })

  app.decorate('optionalAuth', async (req: FastifyRequest, _reply: any) => {
    try {
      await req.jwtVerify()
      // Token de portal não deve virar "usuário staff" em rotas públicas.
      if ((req.user as JwtPayload)?.type === 'portal') {
        ;(req as any).user = undefined
      }
    } catch {
      // silently ignore — user is unauthenticated
    }
  })
})
