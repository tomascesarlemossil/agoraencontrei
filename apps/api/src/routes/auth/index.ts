import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { AuthService } from '../../services/auth.service.js'

// ── Schemas ──────────────────────────────────────────────────────────────────

const RegisterBody = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phone: z.string().optional(),
  companyName: z.string().min(2).max(100).optional(),
  companyId: z.string().cuid().optional(),
})

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const RefreshBody = z.object({
  refreshToken: z.string().min(1),
})

const ChangePasswordBody = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
})

// ── Routes ───────────────────────────────────────────────────────────────────

export default async function authRoutes(app: FastifyInstance) {
  const svc = new AuthService(app.prisma, app)

  // POST /api/v1/auth/register
  app.post('/register', {
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
    schema: { tags: ['auth'], summary: 'Register a new user + company' },
  }, async (req, reply) => {
    const parsed = RegisterBody.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: 'VALIDATION_ERROR', message: parsed.error.message })
    const result = await svc.register(parsed.data)
    return reply.status(201).send(result)
  })

  // POST /api/v1/auth/login
  app.post('/login', {
    config: { rateLimit: { max: 20, timeWindow: '15 minutes' } },
    schema: { tags: ['auth'], summary: 'Login with email + password' },
  }, async (req, reply) => {
    const parsed = LoginBody.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: 'VALIDATION_ERROR', message: parsed.error.message })
    const body = parsed.data
    const result = await svc.login(
      body,
      req.headers['x-forwarded-for'] as string ?? req.ip,
      req.headers['user-agent'],
    )

    // Set refresh token in httpOnly cookie
    reply.setCookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/api/v1/auth',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return reply.send({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    })
  })

  // POST /api/v1/auth/refresh
  app.post('/refresh', {
    config: { rateLimit: { max: 60, timeWindow: '15 minutes' } },
    schema: { tags: ['auth'], summary: 'Refresh access token' },
  }, async (req, reply) => {
    // Try body first, then cookie
    const tokenFromBody = (req.body as any)?.refreshToken
    const tokenFromCookie = req.cookies?.refresh_token
    const refreshToken = tokenFromBody ?? tokenFromCookie

    if (!refreshToken) {
      return reply.status(400).send({ error: 'MISSING_REFRESH_TOKEN', message: 'Refresh token required' })
    }

    const result = await svc.refresh(refreshToken)

    reply.setCookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/api/v1/auth',
      maxAge: 30 * 24 * 60 * 60,
    })

    return reply.send({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    })
  })

  // POST /api/v1/auth/logout
  app.post('/logout', {
    schema: { tags: ['auth'], summary: 'Logout — revoke refresh token' },
  }, async (req, reply) => {
    const tokenFromBody = (req.body as any)?.refreshToken
    const tokenFromCookie = req.cookies?.refresh_token
    const refreshToken = tokenFromBody ?? tokenFromCookie

    if (refreshToken) {
      await svc.logout(refreshToken)
    }

    reply.clearCookie('refresh_token', { path: '/api/v1/auth' })
    return reply.send({ success: true })
  })

  // GET /api/v1/auth/me
  app.get('/me', {
    preHandler: [app.authenticate],
    schema: { tags: ['auth'], summary: 'Get current authenticated user' },
  }, async (req, reply) => {
    const user = await svc.me(req.user.sub)
    return reply.send(user)
  })

  // POST /api/v1/auth/change-password
  app.post('/change-password', {
    preHandler: [app.authenticate],
    schema: { tags: ['auth'], summary: 'Change password' },
  }, async (req, reply) => {
    const parsed = ChangePasswordBody.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: 'VALIDATION_ERROR', message: parsed.error.message })
    await svc.changePassword(req.user.sub, parsed.data.currentPassword, parsed.data.newPassword)
    return reply.send({ success: true, message: 'Senha alterada com sucesso' })
  })
}
