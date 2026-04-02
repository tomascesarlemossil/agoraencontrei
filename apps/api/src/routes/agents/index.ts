import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  extractFromPdf,
  transcribeAudio,
  copywriteProperty,
  scoreLead,
  generateDocument,
  identifyDocument,
  type CopywriteInput,
} from '../../services/ai.service.js'
import { env } from '../../utils/env.js'
import { emitAutomation } from '../../services/automation.emitter.js'

export default async function agentsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // POST /api/v1/agents/pdf — extract property data from PDF
  app.post('/pdf', {
    schema: { tags: ['agents'] },
  }, async (req, reply) => {
    if (!env.ANTHROPIC_API_KEY) {
      return reply.status(503).send({ error: 'AI_NOT_CONFIGURED' })
    }

    const body = z.object({
      base64Pdf: z.string().min(100),
      propertyId: z.string().cuid().optional(),
    }).parse(req.body)

    // Create a job record
    const job = await app.prisma.agentJob.create({
      data: {
        companyId: req.user.cid,
        type: 'pdf_extract',
        status: 'processing',
        input: { propertyId: body.propertyId } as any,
        propertyId: body.propertyId,
      },
    })

    try {
      const result = await extractFromPdf(body.base64Pdf)

      await app.prisma.agentJob.update({
        where: { id: job.id },
        data: { status: 'done', output: result as any },
      })

      // Auto-fill property fields if propertyId provided
      if (body.propertyId && result.title) {
        await app.prisma.property.update({
          where: { id: body.propertyId, companyId: req.user.cid },
          data: {
            ...(result.description && { description: result.description }),
            ...(result.bedrooms && { bedrooms: result.bedrooms }),
            ...(result.bathrooms && { bathrooms: result.bathrooms }),
            ...(result.parkingSpaces && { parkingSpaces: result.parkingSpaces }),
            ...(result.totalArea && { totalArea: result.totalArea }),
            ...(result.builtArea && { builtArea: result.builtArea }),
            ...(result.street && { street: result.street }),
            ...(result.neighborhood && { neighborhood: result.neighborhood }),
            ...(result.city && { city: result.city }),
            ...(result.state && { state: result.state }),
          },
        }).catch(() => {})
      }

      emitAutomation({ companyId: req.user.cid, event: 'agent_job_done', data: { jobId: job.id, type: 'pdf_extract', propertyId: job.propertyId ?? null } })
      return reply.send({ jobId: job.id, result })
    } catch (err: any) {
      await app.prisma.agentJob.update({
        where: { id: job.id },
        data: { status: 'failed', errorMsg: err.message },
      })
      throw err
    }
  })

  // POST /api/v1/agents/transcribe — transcribe audio
  app.post('/transcribe', {
    schema: { tags: ['agents'] },
  }, async (req, reply) => {
    if (!env.ANTHROPIC_API_KEY) {
      return reply.status(503).send({ error: 'AI_NOT_CONFIGURED' })
    }

    const body = z.object({
      base64Audio: z.string().min(10),
      mimeType: z.string().default('audio/ogg'),
      leadId: z.string().cuid().optional(),
      contactId: z.string().cuid().optional(),
      dealId: z.string().cuid().optional(),
    }).parse(req.body)

    const job = await app.prisma.agentJob.create({
      data: {
        companyId: req.user.cid,
        type: 'audio_transcribe',
        status: 'processing',
        input: { mimeType: body.mimeType } as any,
        leadId: body.leadId,
        contactId: body.contactId,
        dealId: body.dealId,
      },
    })

    try {
      const result = await transcribeAudio(body.base64Audio, body.mimeType)

      await app.prisma.agentJob.update({
        where: { id: job.id },
        data: { status: 'done', output: result as any },
      })

      // Auto-create activity with transcript
      const entityId = body.leadId ?? body.dealId ?? body.contactId
      const entityField = body.leadId ? 'leadId' : body.dealId ? 'dealId' : body.contactId ? 'contactId' : null

      if (entityId && entityField) {
        await app.prisma.activity.create({
          data: {
            companyId: req.user.cid,
            userId: req.user.sub,
            [entityField]: entityId,
            type: 'call',
            title: `Transcrição de áudio: ${result.intent ?? 'other'}`,
            description: result.text,
            metadata: { intent: result.intent, entities: result.entities } as any,
          },
        })
      }

      emitAutomation({ companyId: req.user.cid, event: 'agent_job_done', data: { jobId: job.id, type: 'audio_transcribe', leadId: job.leadId ?? null } })
      return reply.send({ jobId: job.id, result })
    } catch (err: any) {
      await app.prisma.agentJob.update({
        where: { id: job.id },
        data: { status: 'failed', errorMsg: err.message },
      })
      throw err
    }
  })

  // POST /api/v1/agents/copywrite — generate property description
  app.post('/copywrite', {
    schema: { tags: ['agents'] },
  }, async (req, reply) => {
    if (!env.ANTHROPIC_API_KEY) {
      return reply.status(503).send({ error: 'AI_NOT_CONFIGURED' })
    }

    const body = z.object({
      propertyId: z.string().cuid().optional(),
      portal: z.enum(['olx', 'zap', 'vivareal', 'facebook', 'instagram', 'generic']).default('generic'),
      // Override fields if not loading from DB
      title: z.string().optional(),
      type: z.string().optional(),
      purpose: z.string().optional(),
    }).parse(req.body)

    let input: CopywriteInput

    if (body.propertyId) {
      const prop = await app.prisma.property.findFirst({
        where: { id: body.propertyId, companyId: req.user.cid },
      })
      if (!prop) return reply.status(404).send({ error: 'PROPERTY_NOT_FOUND' })

      input = {
        title: prop.title,
        type: prop.type,
        purpose: prop.purpose,
        totalArea: prop.totalArea ? Number(prop.totalArea) : undefined,
        builtArea: prop.builtArea ? Number(prop.builtArea) : undefined,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        parkingSpaces: prop.parkingSpaces,
        city: prop.city ?? undefined,
        neighborhood: prop.neighborhood ?? undefined,
        price: prop.price ? Number(prop.price) : undefined,
        priceRent: prop.priceRent ? Number(prop.priceRent) : undefined,
        features: prop.features,
        portal: body.portal,
      }
    } else {
      input = {
        title: body.title ?? 'Imóvel',
        type: body.type ?? 'APARTMENT',
        purpose: body.purpose ?? 'SALE',
        portal: body.portal,
      }
    }

    const job = await app.prisma.agentJob.create({
      data: {
        companyId: req.user.cid,
        type: 'copywrite',
        status: 'processing',
        input: { portal: body.portal, propertyId: body.propertyId } as any,
        propertyId: body.propertyId,
      },
    })

    try {
      const result = await copywriteProperty(input)

      await app.prisma.agentJob.update({
        where: { id: job.id },
        data: { status: 'done', output: result as any },
      })

      // Optionally save to portal description
      if (body.propertyId) {
        await app.prisma.property.update({
          where: { id: body.propertyId },
          data: {
            portalDescriptions: {
              ...(await app.prisma.property.findUnique({ where: { id: body.propertyId }, select: { portalDescriptions: true } }))?.portalDescriptions as any ?? {},
              [body.portal]: result.description,
            },
          },
        }).catch(() => {})
      }

      return reply.send({ jobId: job.id, result })
    } catch (err: any) {
      await app.prisma.agentJob.update({
        where: { id: job.id },
        data: { status: 'failed', errorMsg: err.message },
      })
      throw err
    }
  })

  // POST /api/v1/agents/score-lead — score a lead
  app.post('/score-lead', {
    schema: { tags: ['agents'] },
  }, async (req, reply) => {
    if (!env.ANTHROPIC_API_KEY) {
      return reply.status(503).send({ error: 'AI_NOT_CONFIGURED' })
    }

    const { leadId } = z.object({ leadId: z.string().cuid() }).parse(req.body)

    const lead = await app.prisma.lead.findFirst({
      where: { id: leadId, companyId: req.user.cid },
      include: {
        _count: { select: { activities: true, deals: true } },
        contact: { select: { id: true } },
      },
    })
    if (!lead) return reply.status(404).send({ error: 'NOT_FOUND' })

    const result = await scoreLead({
      lead: {
        source: lead.source ?? undefined,
        interest: lead.interest ?? undefined,
        budget: lead.budget ? Number(lead.budget) : undefined,
        status: lead.status,
        score: lead.score,
        createdAt: lead.createdAt.toISOString(),
        lastContactAt: lead.lastContactAt?.toISOString(),
      },
      activitiesCount: lead._count.activities,
      dealsCount: lead._count.deals,
      hasPhone: !!lead.phone,
      hasEmail: !!lead.email,
      hasContact: !!lead.contact,
    })

    // Update lead score
    await app.prisma.lead.update({
      where: { id: leadId },
      data: { score: result.score },
    })

    return reply.send(result)
  })

  // GET /api/v1/agents/jobs — list agent jobs
  app.get('/jobs', {
    schema: { tags: ['agents'] },
  }, async (req, reply) => {
    const q = req.query as any
    const jobs = await app.prisma.agentJob.findMany({
      where: {
        companyId: req.user.cid,
        ...(q.type && { type: q.type }),
        ...(q.status && { status: q.status }),
        ...(q.propertyId && { propertyId: q.propertyId }),
        ...(q.leadId && { leadId: q.leadId }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return reply.send(jobs)
  })

  // POST /api/v1/agents/documents/identify — identify document type from NL + OCR images
  app.post('/documents/identify', {
    schema: { tags: ['agents'], summary: 'Identify document type from natural language + images' },
  }, async (req, reply) => {
    if (!env.ANTHROPIC_API_KEY) {
      return reply.status(503).send({ error: 'AI_NOT_CONFIGURED', message: 'Chave da IA não configurada no servidor.' })
    }

    const body = z.object({
      text: z.string().min(1),
      templateIds: z.array(z.string()).optional().default([]),
      images: z.array(z.object({
        base64: z.string(),
        mediaType: z.string(),
        description: z.string().optional(),
      })).optional(),
    }).parse(req.body)

    const result = await identifyDocument({
      text: body.text,
      templateIds: body.templateIds,
      images: body.images?.map(({ base64, mediaType }) => ({ base64, mediaType })),
    })

    // Normalise confidence: AI may return 0-100 or 0-1 scale
    const confidence = result.confidence > 1 ? result.confidence / 100 : result.confidence

    return reply.send({ ...result, confidence })
  })

  // POST /api/v1/agents/documents/generate — AI document generation
  app.post('/documents/generate', {
    schema: { tags: ['agents'], summary: 'Generate document with AI' },
  }, async (req, reply) => {
    if (!env.ANTHROPIC_API_KEY) {
      return reply.status(503).send({ error: 'AI_NOT_CONFIGURED' })
    }

    const body = z.object({
      templateId: z.string(),
      templateContent: z.string(),
      formData: z.record(z.string()).default({}),
      userInstructions: z.string().default(''),
      images: z.array(z.object({
        base64: z.string(),
        mediaType: z.string(),
        description: z.string(),
      })).optional(),
    }).parse(req.body)

    const result = await generateDocument({
      templateId: body.templateId,
      templateContent: body.templateContent,
      formData: body.formData,
      userInstructions: body.userInstructions,
      images: body.images,
    })

    return reply.send(result)
  })
}
