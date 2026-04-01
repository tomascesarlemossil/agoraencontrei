import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const UpdateUserBody = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  bio: z.string().max(500).optional(),
  creciNumber: z.string().optional(),
  avatarUrl: z.string().url().optional(),
})

const CreateUserBody = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'MANAGER', 'BROKER', 'FINANCIAL', 'CLIENT']).default('BROKER'),
  phone: z.string().optional(),
  creciNumber: z.string().optional(),
})

export default async function usersRoutes(app: FastifyInstance) {
  // All routes require auth
  app.addHook('preHandler', app.authenticate)

  // GET /api/v1/users — list company users (admin/manager only)
  app.get('/', {
    schema: { tags: ['users'], summary: 'List company users' },
  }, async (req, reply) => {
    const { role } = req.user
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const users = await app.prisma.user.findMany({
      where: { companyId: req.user.cid, status: { not: 'SUSPENDED' } },
      select: {
        id: true, name: true, email: true, phone: true,
        avatarUrl: true, role: true, status: true,
        creciNumber: true, lastLoginAt: true, createdAt: true,
      },
      orderBy: { name: 'asc' },
    })

    return reply.send(users)
  })

  // POST /api/v1/users — create user (admin only)
  app.post('/', {
    schema: { tags: ['users'], summary: 'Create a user in the company' },
  }, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const body = CreateUserBody.parse(req.body)

    const existing = await app.prisma.user.findUnique({ where: { email: body.email } })
    if (existing) {
      return reply.status(409).send({ error: 'EMAIL_EXISTS', message: 'E-mail já cadastrado' })
    }

    const argon2 = await import('argon2')
    const passwordHash = await argon2.hash(body.password, { type: argon2.argon2id })

    const user = await app.prisma.user.create({
      data: {
        companyId: req.user.cid,
        name: body.name,
        email: body.email.toLowerCase(),
        phone: body.phone,
        passwordHash,
        role: body.role as any,
        creciNumber: body.creciNumber,
        status: 'ACTIVE',
      },
      select: {
        id: true, name: true, email: true, role: true,
        status: true, creciNumber: true, createdAt: true,
      },
    })

    return reply.status(201).send(user)
  })

  // GET /api/v1/users/company — get own company info
  app.get('/company', {
    preHandler: [app.authenticate],
    schema: { tags: ['users'], summary: 'Get company info' },
  }, async (req, reply) => {
    // Use user→company relation (same as auth/me) to avoid direct company lookup issues
    const user = await app.prisma.user.findUnique({
      where: { id: req.user.sub },
      include: { company: true },
    })
    if (!user?.company) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send(user.company)
  })

  // PATCH /api/v1/users/company — update own company info (admin only)
  app.patch('/company', {
    preHandler: [app.authenticate],
    schema: { tags: ['users'], summary: 'Update company info' },
  }, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }
    const { z } = await import('zod')
    const body = z.object({
      name:            z.string().min(2).max(100).optional(),
      tradeName:       z.string().optional(),
      cnpj:            z.string().optional(),
      creci:           z.string().optional(),
      phone:           z.string().optional(),
      email:           z.string().email().optional(),
      website:         z.string().optional(),
      logoUrl:         z.string().url().optional().or(z.literal('')),
      address:         z.string().optional(),
      city:            z.string().optional(),
      state:           z.string().max(2).optional(),
      zipCode:         z.string().optional(),
    }).parse(req.body)

    const updated = await app.prisma.company.update({
      where: { id: req.user.cid },
      data: body,
    })
    return reply.send(updated)
  })

  // PATCH /api/v1/users/site-settings — update public site configuration (hero video etc.)
  app.patch('/site-settings', {
    preHandler: [app.authenticate],
    schema: { tags: ['users'] },
  }, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const body = req.body as { heroVideoUrl?: string; heroVideoType?: string }
    const company = await app.prisma.company.findUnique({ where: { id: req.user.cid } })
    if (!company) return reply.status(404).send({ error: 'NOT_FOUND' })

    const currentSettings = (company.settings as any) ?? {}
    const newSettings = {
      ...currentSettings,
      ...(body.heroVideoUrl !== undefined && { heroVideoUrl: body.heroVideoUrl }),
      ...(body.heroVideoType !== undefined && { heroVideoType: body.heroVideoType }),
    }

    await app.prisma.company.update({ where: { id: req.user.cid }, data: { settings: newSettings } })
    return reply.send({ success: true, settings: newSettings })
  })

  // GET /api/v1/users/:id  (also handles /company as fallback for old builds)
  app.get('/:id', {
    schema: { tags: ['users'] },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }

    // Fallback: if id is "company", return the company info
    if (id === 'company') {
      const company = await app.prisma.company.findUnique({ where: { id: req.user.cid } })
      if (!company) return reply.status(404).send({ error: 'NOT_FOUND' })
      return reply.send(company)
    }

    // Users can only see themselves unless admin/manager
    if (id !== req.user.sub && !['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const user = await app.prisma.user.findFirst({
      where: { id, companyId: req.user.cid },
      select: {
        id: true, name: true, email: true, phone: true,
        avatarUrl: true, role: true, status: true,
        creciNumber: true, bio: true, lastLoginAt: true, createdAt: true,
        _count: { select: { leads: true, deals: true, properties: true } },
      },
    })

    if (!user) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send(user)
  })

  // PATCH /api/v1/users/:id  (also handles /company as fallback for old builds)
  app.patch('/:id', {
    schema: { tags: ['users'] },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }

    // Fallback: if id is "company", update company info
    if (id === 'company') {
      if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
        return reply.status(403).send({ error: 'FORBIDDEN' })
      }
      const { z } = await import('zod')
      const companyBody = z.object({
        name: z.string().min(2).max(100).optional(),
        tradeName: z.string().optional(),
        cnpj: z.string().optional(),
        creci: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        website: z.string().optional(),
        logoUrl: z.string().url().optional().or(z.literal('')),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().max(2).optional(),
        zipCode: z.string().optional(),
      }).parse(req.body)
      const updated = await app.prisma.company.update({ where: { id: req.user.cid }, data: companyBody })
      return reply.send(updated)
    }

    if (id !== req.user.sub && !['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const body = UpdateUserBody.parse(req.body)

    const user = await app.prisma.user.update({
      where: { id },
      data: body,
      select: {
        id: true, name: true, email: true, phone: true,
        avatarUrl: true, role: true, bio: true, creciNumber: true,
      },
    })

    return reply.send(user)
  })

  // DELETE /api/v1/users/:id — soft delete (set inactive)
  app.delete('/:id', {
    schema: { tags: ['users'] },
  }, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const { id } = req.params as { id: string }
    if (id === req.user.sub) {
      return reply.status(400).send({ error: 'CANNOT_DELETE_SELF' })
    }

    await app.prisma.user.update({
      where: { id, companyId: req.user.cid },
      data: { status: 'INACTIVE' },
    })

    return reply.send({ success: true })
  })

}
