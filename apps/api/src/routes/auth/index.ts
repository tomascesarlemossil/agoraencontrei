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
  // Aceita e-mail, telefone ou CPF via `identifier`; mantém `email` por
  // compatibilidade com clientes antigos. Pelo menos um é obrigatório.
  identifier: z.string().min(3).max(128).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).max(128),
}).refine((d) => !!(d.identifier || d.email), {
  message: 'Informe e-mail, telefone ou CPF',
  path: ['identifier'],
})

const ResolveCompanyBody = z.object({
  identifier: z.string().min(3).max(128),
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

  // POST /api/v1/auth/verify-email
  app.post('/verify-email', {
    config: { rateLimit: { max: 20, timeWindow: '15 minutes' } },
    schema: { tags: ['auth'], summary: 'Verify email with token' },
  }, async (req, reply) => {
    const { token } = req.body as { token?: string }
    if (!token) return reply.status(400).send({ error: 'MISSING_TOKEN', message: 'Token obrigatório' })
    const result = await svc.verifyEmail(token)
    return reply.send(result)
  })

  // POST /api/v1/auth/resend-verification
  app.post('/resend-verification', {
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
    schema: { tags: ['auth'], summary: 'Resend verification email' },
  }, async (req, reply) => {
    const { email } = req.body as { email?: string }
    if (!email) return reply.status(400).send({ error: 'MISSING_EMAIL', message: 'E-mail obrigatório' })
    const result = await svc.resendVerification(email)
    return reply.send(result)
  })

  // POST /api/v1/auth/resolve-company — etapa 1 do login white-label.
  // Recebe e-mail/telefone/CPF e devolve só a MARCA da empresa (nome + logo +
  // cor) para montar a tela de senha com a identidade do parceiro. Não
  // confirma senha nem devolve dados sensíveis. Rate-limit apertado para
  // desestimular varredura.
  app.post('/resolve-company', {
    config: { rateLimit: { max: 20, timeWindow: '15 minutes' } },
    schema: { tags: ['auth'], summary: 'Resolve company branding for white-label login' },
  }, async (req, reply) => {
    const parsed = ResolveCompanyBody.safeParse(req.body)
    if (!parsed.success) return reply.status(400).send({ error: 'VALIDATION_ERROR', message: parsed.error.message })
    const result = await svc.resolveCompanyBranding(parsed.data.identifier)
    return reply.send(result)
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
    const { cpf, birthDate, subdomain } = req.body as { cpf?: string; birthDate?: string; subdomain?: string }

    if (!cpf || !birthDate) {
      return reply.status(400).send({ error: 'MISSING_FIELDS', message: 'CPF e data de nascimento são obrigatórios' })
    }

    // Normalize CPF: remove dots, dashes
    const cpfNorm = cpf.replace(/\D/g, '')

    // Validate CPF format (11 digits)
    if (!/^\d{11}$/.test(cpfNorm)) {
      return reply.status(400).send({ error: 'INVALID_CPF', message: 'CPF deve ter 11 dígitos' })
    }

    // Normaliza a data informada (aceita YYYY-MM-DD ou DD/MM/YYYY).
    const inputDate = birthDate.trim()
    const normalizedInput = inputDate.includes('/') ? inputDate.split('/').reverse().join('-') : inputDate

    // Escopo por empresa: o portal é servido no subdomínio do parceiro. Quando o
    // front envia `subdomain`, resolvemos a company e filtramos por ela — isto
    // FECHA a colisão de CPF cross-tenant (Client.document é único só por empresa,
    // então o mesmo CPF pode existir em várias imobiliárias).
    let scopedCompanyId: string | null = null
    if (subdomain && /^[a-z0-9-]{2,}$/i.test(subdomain)) {
      const tenant = await app.prisma.tenant.findUnique({
        where: { subdomain: subdomain.toLowerCase() }, select: { companyId: true },
      }).catch(() => null)
      scopedCompanyId = tenant?.companyId ?? null
    }

    // Candidatos por CPF (+ empresa, se conhecida). NUNCA LIMIT 1 sem escopo.
    const candidates = await app.prisma.client.findMany({
      where: { document: cpfNorm, ...(scopedCompanyId ? { companyId: scopedCompanyId } : {}) },
      select: { id: true, name: true, companyId: true, birthDate: true, email: true, phone: true, roles: true },
    })

    // Exige birthDate cadastrada E igual à informada — registros sem data de
    // nascimento NÃO logam (antes o check era pulado se birthDate fosse null).
    const matches = candidates.filter(c =>
      c.birthDate && new Date(c.birthDate).toISOString().split('T')[0] === normalizedInput,
    )

    if (matches.length === 0) {
      // Mensagem genérica p/ não permitir enumeração de CPF.
      return reply.status(401).send({ error: 'INVALID_CREDENTIALS', message: 'CPF ou data de nascimento incorretos' })
    }
    // Ambiguidade cross-tenant: o mesmo CPF+nascimento existe em >1 empresa e o
    // front não informou o subdomínio. NÃO escolhemos arbitrariamente — pedimos
    // para acessar pelo site da imobiliária (que envia o subdomínio).
    const distinctCompanies = [...new Set(matches.map(m => m.companyId))]
    if (distinctCompanies.length > 1) {
      return reply.status(409).send({
        error: 'AMBIGUOUS_CLIENT',
        message: 'Encontramos seu cadastro em mais de uma imobiliária. Acesse pelo site da sua imobiliária.',
      })
    }

    const cl = matches[0]

    // Contrato ativo do cliente (para o resumo do portal).
    const contract = await app.prisma.contract.findFirst({
      where: { isActive: true, OR: [{ tenantId: cl.id }, { landlordId: cl.id }] },
      select: { id: true, status: true, rentValue: true, propertyAddress: true, startDate: true },
    }).catch(() => null)

    // Token de portal — agora carrega `cid` (companyId) para escopo tenant a jusante.
    const token = app.jwt.sign(
      { sub: cl.id, cid: cl.companyId, name: cl.name, type: 'portal', roles: cl.roles || [] } as any,
      { expiresIn: '24h' }
    )

    // Auditoria (antes o portal-login não deixava rastro de acesso).
    await app.prisma.auditLog.create({
      data: {
        companyId: cl.companyId, userId: cl.id, action: 'portal.login',
        resource: 'client', resourceId: cl.id,
        ipAddress: req.ip, payload: { cpf: cpfNorm, scoped: !!scopedCompanyId } as any,
      },
    }).catch(() => {})

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
        contract: contract ? {
          id: contract.id,
          status: contract.status,
          rentValue: contract.rentValue,
          propertyAddress: contract.propertyAddress,
          startDate: contract.startDate,
        } : null,
      },
    })
  })
}
