import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { createAuditLog } from '../../services/audit.service.js'

const toUpper = (v: unknown) => typeof v === 'string' ? v.toUpperCase() : v

const CreateContactBody = z.object({
  name:         z.string().min(2).max(200),
  type:         z.preprocess(toUpper, z.enum(['INDIVIDUAL', 'COMPANY'])).default('INDIVIDUAL'),
  email:        z.string().email().optional(),
  phone:        z.string().optional(),
  mobilePhone:  z.string().optional(),
  cpf:          z.string().optional(),
  cnpj:         z.string().optional(),
  rg:           z.string().optional(),
  birthDate:    z.string().optional(),
  zipCode:      z.string().optional(),
  address:      z.string().optional(),
  neighborhood: z.string().optional(),
  city:         z.string().optional(),
  state:        z.string().max(2).optional(),
  notes:        z.string().optional(),
  tags:         z.array(z.string()).default([]),
  isOwner:      z.boolean().default(false),
  isTenant:     z.boolean().default(false),
  isGuarantor:  z.boolean().default(false),
  source:       z.string().optional(),
})

const UpdateContactBody = CreateContactBody.partial()

const ContactFilters = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(200).default(50),
  search: z.string().optional(),
  type:   z.string().optional(),
  city:   z.string().optional(),
  role:   z.string().optional(), // owner | tenant | guarantor
})

export default async function contactsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /api/v1/contacts
  app.get('/', {
    schema: { tags: ['contacts'], summary: 'List contacts' },
  }, async (req, reply) => {
    const q = ContactFilters.parse(req.query)

    const where: any = { companyId: req.user.cid }
    if (q.search) {
      where.OR = [
        { name:  { contains: q.search, mode: 'insensitive' } },
        { email: { contains: q.search, mode: 'insensitive' } },
        { phone: { contains: q.search } },
        { mobilePhone: { contains: q.search } },
        { cpf:  { contains: q.search } },
        { cnpj: { contains: q.search } },
        { externalId: { contains: q.search } },
      ]
    }
    if (q.type) where.type = q.type.toUpperCase()
    if (q.city) where.city = { contains: q.city, mode: 'insensitive' }
    // Role filter
    if (q.role === 'owner')     where.isOwner     = true
    if (q.role === 'tenant')    where.isTenant    = true
    if (q.role === 'guarantor') where.isGuarantor = true

    const [total, items] = await Promise.all([
      app.prisma.contact.count({ where }),
      app.prisma.contact.findMany({
        where,
        select: {
          id: true, name: true, type: true, email: true,
          phone: true, mobilePhone: true, cpf: true, cnpj: true,
          city: true, state: true,
          isOwner: true, isTenant: true, isGuarantor: true,
          tags: true, createdAt: true, externalId: true,
        },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return reply.send({
      data: items,
      meta: { total, page: q.page, limit: q.limit, totalPages: Math.ceil(total / q.limit) },
    })
  })

  // GET /api/v1/contacts/:id
  app.get('/:id', {
    schema: { tags: ['contacts'] },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }

    const contact = await app.prisma.contact.findFirst({
      where: { id, companyId: req.user.cid },
      include: {
        leads: { orderBy: { createdAt: 'desc' }, take: 5 },
        deals: { orderBy: { createdAt: 'desc' }, take: 5 },
        activities: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    })

    if (!contact) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send(contact)
  })

  // POST /api/v1/contacts
  app.post('/', {
    schema: { tags: ['contacts'], summary: 'Create contact' },
  }, async (req, reply) => {
    const body = CreateContactBody.parse(req.body)

    // Check for duplicate email within company
    if (body.email) {
      const existing = await app.prisma.contact.findFirst({
        where: { email: body.email, companyId: req.user.cid },
      })
      if (existing) return reply.status(409).send({ error: 'EMAIL_EXISTS', message: 'Contato com este e-mail já cadastrado' })
    }

    const contact = await app.prisma.contact.create({
      data: {
        ...body,
        companyId: req.user.cid,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
      },
    })

    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'contact.create',
      resource: 'contact',
      resourceId: contact.id,
      before: null,
      after: contact as any,
    })

    return reply.status(201).send(contact)
  })

  // PATCH /api/v1/contacts/:id
  app.patch('/:id', {
    schema: { tags: ['contacts'] },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = UpdateContactBody.parse(req.body)

    const existing = await app.prisma.contact.findFirst({
      where: { id, companyId: req.user.cid },
    })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })

    const updated = await app.prisma.contact.update({
      where: { id },
      data: {
        ...body,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
      },
    })

    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'contact.update',
      resource: 'contact',
      resourceId: id,
      before: existing as any,
      after:  updated  as any,
    })

    return reply.send(updated)
  })

  // DELETE /api/v1/contacts/:id
  app.delete('/:id', {
    schema: { tags: ['contacts'] },
  }, async (req, reply) => {
    if (!['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }

    const existing = await app.prisma.contact.findFirst({
      where: { id: (req.params as any).id, companyId: req.user.cid },
    })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })

    await app.prisma.contact.delete({ where: { id: existing.id } })

    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'contact.delete',
      resource: 'contact',
      resourceId: existing.id,
      before: existing as any,
      after: null,
    })

    return reply.send({ success: true })
  })
}
