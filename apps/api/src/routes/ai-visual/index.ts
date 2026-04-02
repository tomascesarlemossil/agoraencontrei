/**
 * AI Visual Routes
 * Integrations: Veras AI (renders), mnml.ai (virtual staging), Imagen AI (batch editing)
 * All jobs are async — enqueued to BullMQ, results stored and polled via GET /:id
 */
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../../utils/env.js' // used in /config and /stats routes

const CreateJobBody = z.object({
  tipo:       z.enum(['render', 'staging', 'enhance_batch']),
  propertyId: z.string().cuid(),
  inputUrl:   z.string().url(),
  style:      z.string().optional(),
  // render: 'modern' | 'classic' | 'minimalist'
  // staging: 'sala' | 'quarto' | 'cozinha'
  // enhance_batch: leave empty
})

export default async function aiVisualRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // POST /api/v1/ai-visual/jobs — enqueue a new VisualAI job
  app.post('/jobs', async (req, reply) => {
    const body   = CreateJobBody.parse(req.body)
    const userId = req.user.sub
    const cid    = req.user.cid

    // Verify property belongs to company
    const property = await app.prisma.property.findFirst({
      where: { id: body.propertyId, companyId: cid },
      select: { id: true },
    })
    if (!property) {
      return reply.status(404).send({ error: 'PROPERTY_NOT_FOUND' })
    }

    const job = await app.prisma.visualAIJob.create({
      data: {
        companyId:  cid,
        userId,
        propertyId: body.propertyId,
        tipo:       body.tipo,
        status:     'PENDING',
        inputUrl:   body.inputUrl,
        style:      body.style ?? null,
      },
    })

    // Enqueue via shared BullMQ queue (decorated by automation plugin)
    const visualAIQueue = (app as any).visualAIQueue
    if (visualAIQueue) {
      try {
        await visualAIQueue.add('process', {
          jobId:      job.id,
          tipo:       body.tipo,
          inputUrl:   body.inputUrl,
          style:      body.style,
          propertyId: body.propertyId,
          companyId:  cid,
        }, {
          attempts: 2,
          backoff: { type: 'fixed', delay: 5000 },
          removeOnComplete: { count: 100 },
          removeOnFail:     { count: 200 },
        })
      } catch (err) {
        app.log.warn({ err }, 'visual-ai: failed to enqueue (non-fatal)')
      }
    }

    return reply.status(201).send(job)
  })

  // GET /api/v1/ai-visual/jobs — list jobs for company
  app.get('/jobs', async (req, reply) => {
    const q   = req.query as any
    const cid = req.user.cid

    const where: any = { companyId: cid }
    if (q.tipo)       where.tipo       = q.tipo
    if (q.status)     where.status     = q.status
    if (q.propertyId) where.propertyId = q.propertyId

    const page  = parseInt(q.page  ?? '1',  10)
    const limit = parseInt(q.limit ?? '20', 10)

    const [total, items] = await Promise.all([
      app.prisma.visualAIJob.count({ where }),
      app.prisma.visualAIJob.findMany({
        where,
        include: {
          property: { select: { id: true, title: true, slug: true } },
          user:     { select: { id: true, name: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return reply.send({ data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } })
  })

  // GET /api/v1/ai-visual/jobs/:id — poll single job status
  app.get('/jobs/:id', async (req, reply) => {
    const { id } = req.params as any
    const cid    = req.user.cid

    const job = await app.prisma.visualAIJob.findFirst({
      where: { id, companyId: cid },
      include: {
        property: { select: { id: true, title: true, slug: true } },
        user:     { select: { id: true, name: true } },
      },
    })
    if (!job) return reply.status(404).send({ error: 'NOT_FOUND' })
    return reply.send(job)
  })

  // DELETE /api/v1/ai-visual/jobs/:id
  app.delete('/jobs/:id', async (req, reply) => {
    const { id } = req.params as any
    const cid    = req.user.cid

    const job = await app.prisma.visualAIJob.findFirst({ where: { id, companyId: cid } })
    if (!job) return reply.status(404).send({ error: 'NOT_FOUND' })
    if (job.status === 'PROCESSING') {
      return reply.status(409).send({ error: 'JOB_RUNNING', message: 'Job em processamento' })
    }

    await app.prisma.visualAIJob.delete({ where: { id } })
    return reply.status(204).send()
  })

  // GET /api/v1/ai-visual/config — returns which integrations are configured
  app.get('/config', async (_req, reply) => {
    return reply.send({
      mnml:   !!env.MNML_API_KEY,
      imagen: !!env.GOOGLE_IMAGEN_API_KEY,
      anthropic: !!env.ANTHROPIC_API_KEY,
    })
  })

  // GET /api/v1/ai-visual/stats
  app.get('/stats', async (req, reply) => {
    const cid = req.user.cid
    const [total, byTipo, byStatus] = await Promise.all([
      app.prisma.visualAIJob.count({ where: { companyId: cid } }),
      app.prisma.visualAIJob.groupBy({ by: ['tipo'],   where: { companyId: cid }, _count: true }),
      app.prisma.visualAIJob.groupBy({ by: ['status'], where: { companyId: cid }, _count: true }),
    ])
    return reply.send({ total, byTipo, byStatus })
  })
}
