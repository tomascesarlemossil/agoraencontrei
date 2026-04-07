import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { AuthService } from '../../services/auth.service.js'

// ── Schemas ──────────────────────────────────────────────────────────────────

const RegisterBody = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  phone: z.string().optional(),
  companyName: z.string().min(2).max(100).optional(),
  companyId: z.string().cuid().optional(),
})

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
})

const RefreshBody = z.object({
  refreshToken: z.string().min(1),
})

const ChangePasswordBody = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
})

const GoogleLoginBody = z.object({
  credential: z.string().min(1),
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
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
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

    // Limpar cookie com TODOS os mesmos parâmetros usados no setCookie
    reply.clearCookie('refresh_token', {
      path: '/api/v1/auth',
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    })
    // Também tentar limpar com path raiz (caso haja cookie antigo)
    reply.clearCookie('refresh_token', { path: '/' })
    reply.clearCookie('access_token', { path: '/' })
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

  // POST /api/v1/auth/google — Sign in with Google
  app.post('/google', {
    config: { rateLimit: { max: 20, timeWindow: '15 minutes' } },
    schema: { tags: ['auth'], summary: 'Sign in with Google' },
  }, async (req, reply) => {
    const parsed = GoogleLoginBody.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: 'VALIDATION_ERROR', message: parsed.error.message })

    const result = await svc.googleLogin(
      parsed.data.credential,
      req.headers['x-forwarded-for'] as string ?? req.ip,
      req.headers['user-agent'],
    )

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

  // POST /api/v1/auth/portal-login — Login for portal (proprietários/inquilinos) via CPF + birthdate
  app.post('/portal-login', {
    config: { rateLimit: { max: 10, timeWindow: '15 minutes' } },
  }, async (req, reply) => {
    const { cpf, birthDate } = req.body as { cpf?: string; birthDate?: string }

    if (!cpf || !birthDate) {
      return reply.status(400).send({ error: 'MISSING_FIELDS', message: 'CPF e data de nascimento são obrigatórios' })
    }

    // Normalize CPF: remove dots, dashes
    const cpfNorm = cpf.replace(/\D/g, '')

    // Validate CPF format (11 digits)
    if (!/^\d{11}$/.test(cpfNorm)) {
      return reply.status(400).send({ error: 'INVALID_CPF', message: 'CPF deve ter 11 dígitos' })
    }

    // Look up client by CPF (document field) — using parameterized query
    const client = await app.prisma.$queryRaw<any[]>`
      SELECT c.id, c.name, c.document, c."birthDate", c.email, c.phone, c.roles,
              co."landlordName", co."tenantName", co.id as "contractId", co.status as "contractStatus",
              co."rentValue", co."propertyAddress", co."startDate"
       FROM clients c
       LEFT JOIN contracts co ON (co."tenantId" = c.id OR co."landlordId" = c.id) AND co."isActive" = true
       WHERE c.document = ${cpfNorm}
       LIMIT 1`

    if (!client.length) {
      // Generic error message to prevent CPF enumeration
      return reply.status(401).send({ error: 'INVALID_CREDENTIALS', message: 'CPF ou data de nascimento incorretos' })
    }

    const cl = client[0]

    // Verify birthdate
    if (cl.birthDate) {
      const dbDate = new Date(cl.birthDate).toISOString().split('T')[0]
      const inputDate = birthDate.trim()
      // Accept YYYY-MM-DD or DD/MM/YYYY
      const normalizedInput = inputDate.includes('/')
        ? inputDate.split('/').reverse().join('-')
        : inputDate
      if (dbDate !== normalizedInput) {
        return reply.status(401).send({ error: 'INVALID_CREDENTIALS', message: 'CPF ou data de nascimento incorretos' })
      }
    }

    // Return portal token (simple JWT)
    const token = app.jwt.sign(
      { sub: cl.id, name: cl.name, type: 'portal', roles: cl.roles || [] } as any,
      { expiresIn: '24h' }
    )

    return reply.send({
      accessToken: token,
      expiresIn: 86400,
      user: { id: cl.id, name: cl.name, cpf: cpfNorm, email: cl.email, phone: cl.phone },
      client: {
        id: cl.id,
        name: cl.name,
        email: cl.email,
        phone: cl.phone,
        roles: cl.roles,
        contract: cl.contractId ? {
          id: cl.contractId,
          status: cl.contractStatus,
          rentValue: cl.rentValue,
          propertyAddress: cl.propertyAddress,
          startDate: cl.startDate,
        } : null,
      },
    })
  })
}
