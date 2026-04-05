import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const CreateAlertBody = z.object({
  email:    z.string().email(),
  city:     z.string().optional(),
  type:     z.string().optional(),
  purpose:  z.string().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  bedrooms: z.number().int().min(1).optional(),
})

export default async function alertsRoutes(app: FastifyInstance) {
  // POST / — public, no auth required
  app.post('/', {
    schema: { tags: ['alerts'], summary: 'Create a property alert (public)' },
  }, async (req, reply) => {
    const body = CreateAlertBody.parse(req.body)

    const alert = await app.prisma.propertyAlert.create({
      data: {
        email:    body.email,
        city:     body.city ?? null,
        type:     body.type ?? null,
        purpose:  body.purpose ?? null,
        minPrice: body.minPrice ?? null,
        maxPrice: body.maxPrice ?? null,
        bedrooms: body.bedrooms ?? null,
      },
    })

    return reply.status(201).send({ data: alert })
  })

  // GET / — admin only
  app.get('/', {
    schema: { tags: ['alerts'], summary: 'List property alerts (admin)' },
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const q = req.query as any
    const page  = parseInt(q.page  ?? '1',  10)
    const limit = parseInt(q.limit ?? '50', 10)

    const where: any = {
      ...(q.active !== undefined && { active: q.active === 'true' }),
      ...(q.email && { email: { contains: q.email, mode: 'insensitive' } }),
    }

    const [total, items] = await Promise.all([
      app.prisma.propertyAlert.count({ where }),
      app.prisma.propertyAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return reply.send({ data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  })

  // DELETE /:id — by token (public unsubscribe) or admin
  app.delete('/:id', {
    schema: { tags: ['alerts'], summary: 'Delete a property alert' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { token } = req.query as { token?: string }

    const alert = await app.prisma.propertyAlert.findUnique({ where: { id } })
    if (!alert) {
      return reply.status(404).send({ error: 'NOT_FOUND', message: 'Alert not found' })
    }

    // Allow deletion by token (unsubscribe link) or by authenticated admin
    let authorized = false
    if (token && alert.token === token) {
      authorized = true
    } else {
      try {
        await app.authenticate(req, reply)
        authorized = true
      } catch {
        // not authenticated
      }
    }

    if (!authorized) {
      return reply.status(401).send({ error: 'UNAUTHORIZED', message: 'Invalid token or not authenticated' })
    }

    await app.prisma.propertyAlert.delete({ where: { id } })

    return reply.send({ success: true })
  })
}
