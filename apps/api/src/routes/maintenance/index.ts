/**
 * Predictive Maintenance Routes — Manutenção preditiva de imóveis
 *
 * POST /api/v1/maintenance/tickets          — Cria ticket de manutenção
 * GET  /api/v1/maintenance/tickets          — Lista tickets
 * PATCH /api/v1/maintenance/tickets/:id     — Atualiza ticket
 * POST /api/v1/maintenance/analyze-image    — IA analisa foto do problema
 * GET  /api/v1/maintenance/dashboard        — Dashboard de manutenção
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import Anthropic from '@anthropic-ai/sdk'
import { env } from '../../utils/env.js'
import { createAuditLog } from '../../services/audit.service.js'

export default async function maintenanceRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // POST /tickets — Cria ticket de manutenção (inquilino reporta problema)
  app.post('/tickets', {
    schema: { tags: ['maintenance'], summary: 'Create maintenance ticket' },
  }, async (req, reply) => {
    const body = z.object({
      contractId: z.string().optional(),
      propertyId: z.string().optional(),
      propertyAddress: z.string().optional(),
      tenantName: z.string(),
      tenantPhone: z.string().optional(),
      category: z.enum([
        'HYDRAULIC', 'ELECTRICAL', 'STRUCTURAL', 'PAINTING',
        'LOCKSMITH', 'APPLIANCE', 'PEST_CONTROL', 'CLEANING', 'OTHER',
      ]).default('OTHER'),
      description: z.string().min(10),
      urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).default('MEDIUM'),
      images: z.array(z.string()).default([]),
    }).parse(req.body)

    // Create maintenance ticket as an activity
    const ticket = await app.prisma.activity.create({
      data: {
        companyId: req.user.cid,
        userId: req.user.sub,
        propertyId: body.propertyId || undefined,
        type: 'maintenance_ticket',
        title: `[Manutenção] ${body.category} - ${body.tenantName}`,
        description: body.description,
        metadata: {
          category: body.category,
          urgency: body.urgency,
          status: 'OPEN',
          tenantName: body.tenantName,
          tenantPhone: body.tenantPhone,
          propertyAddress: body.propertyAddress,
          contractId: body.contractId,
          images: body.images,
          createdAt: new Date().toISOString(),
          updates: [],
        },
      },
    })

    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'automation.run' as any,
      resource: 'activity',
      resourceId: ticket.id,
      meta: { type: 'maintenance.ticket_created', category: body.category, urgency: body.urgency },
    })

    return reply.status(201).send({ success: true, data: ticket })
  })

  // GET /tickets — Lista tickets de manutenção
  app.get('/tickets', {
    schema: { tags: ['maintenance'], summary: 'List maintenance tickets' },
  }, async (req, reply) => {
    const q = req.query as any
    const status = q.status as string | undefined
    const urgency = q.urgency as string | undefined

    const tickets = await app.prisma.activity.findMany({
      where: {
        companyId: req.user.cid,
        type: 'maintenance_ticket',
        ...(status && {
          metadata: { path: ['status'], equals: status },
        }),
      },
      include: {
        property: { select: { id: true, title: true, street: true, neighborhood: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Filter by urgency if requested (metadata filter)
    let filtered = tickets
    if (urgency) {
      filtered = tickets.filter((t: any) => (t.metadata as any)?.urgency === urgency)
    }

    return reply.send({ success: true, data: filtered })
  })

  // PATCH /tickets/:id — Atualiza status do ticket
  app.patch('/tickets/:id', {
    schema: { tags: ['maintenance'], summary: 'Update maintenance ticket' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = z.object({
      status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_PARTS', 'RESOLVED', 'CLOSED']).optional(),
      assignedTo: z.string().optional(),
      providerName: z.string().optional(),
      providerPhone: z.string().optional(),
      estimatedCost: z.number().optional(),
      resolution: z.string().optional(),
      notes: z.string().optional(),
    }).parse(req.body)

    const existing = await app.prisma.activity.findFirst({
      where: { id, companyId: req.user.cid, type: 'maintenance_ticket' },
    })

    if (!existing) {
      return reply.status(404).send({ error: 'TICKET_NOT_FOUND' })
    }

    const meta = (existing.metadata as any) || {}
    const updates = meta.updates || []
    updates.push({
      timestamp: new Date().toISOString(),
      userId: req.user.sub,
      changes: body,
    })

    const updatedTicket = await app.prisma.activity.update({
      where: { id },
      data: {
        metadata: {
          ...meta,
          ...(body.status && { status: body.status }),
          ...(body.assignedTo && { assignedTo: body.assignedTo }),
          ...(body.providerName && { providerName: body.providerName }),
          ...(body.providerPhone && { providerPhone: body.providerPhone }),
          ...(body.estimatedCost && { estimatedCost: body.estimatedCost }),
          ...(body.resolution && { resolution: body.resolution }),
          updates,
        },
        ...(body.status === 'RESOLVED' || body.status === 'CLOSED'
          ? { completedAt: new Date() }
          : {}),
      },
    })

    return reply.send({ success: true, data: updatedTicket })
  })

  // POST /analyze-image — IA analisa foto do problema e sugere ação
  app.post('/analyze-image', {
    schema: { tags: ['maintenance'], summary: 'AI analyze maintenance issue from photo' },
  }, async (req, reply) => {
    const body = z.object({
      imageUrl: z.string(),
      description: z.string().optional(),
    }).parse(req.body)

    if (!env.ANTHROPIC_API_KEY) {
      return reply.send({
        success: true,
        data: {
          category: 'OTHER',
          urgency: 'MEDIUM',
          description: 'Análise de IA indisponível. Configure ANTHROPIC_API_KEY.',
          suggestedAction: 'Agende uma visita técnica para avaliar o problema.',
          estimatedCost: null,
        },
      })
    }

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: body.imageUrl } },
          {
            type: 'text',
            text: `Analise esta foto de um problema em um imóvel.${body.description ? ` Descrição do morador: "${body.description}"` : ''}

Retorne SOMENTE JSON (sem markdown):
{
  "category": "HYDRAULIC|ELECTRICAL|STRUCTURAL|PAINTING|LOCKSMITH|APPLIANCE|PEST_CONTROL|CLEANING|OTHER",
  "urgency": "LOW|MEDIUM|HIGH|EMERGENCY",
  "problemDescription": "Descrição técnica do problema em 1-2 frases",
  "suggestedAction": "Ação recomendada (ex: chamar encanador, trocar disjuntor)",
  "suggestedProfessional": "Tipo de profissional necessário",
  "estimatedCostRange": "Faixa de custo estimado (ex: R$ 100-300)",
  "isUrgent": true/false
}`,
          },
        ],
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
    const jsonStr = text.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()

    try {
      const analysis = JSON.parse(jsonStr)
      return reply.send({ success: true, data: analysis })
    } catch {
      return reply.send({
        success: true,
        data: {
          category: 'OTHER',
          urgency: 'MEDIUM',
          problemDescription: text,
          suggestedAction: 'Agende uma visita técnica para avaliação.',
          estimatedCostRange: 'A definir',
        },
      })
    }
  })

  // GET /dashboard — Dashboard resumo de manutenções
  app.get('/dashboard', {
    schema: { tags: ['maintenance'], summary: 'Maintenance dashboard summary' },
  }, async (req, reply) => {
    const cid = req.user.cid

    const allTickets = await app.prisma.activity.findMany({
      where: { companyId: cid, type: 'maintenance_ticket' },
      select: { metadata: true, createdAt: true },
    })

    const stats = {
      total: allTickets.length,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
      emergency: 0,
      byCategory: {} as Record<string, number>,
      avgResolutionDays: 0,
    }

    let resolvedDaysTotal = 0
    let resolvedCount = 0

    for (const t of allTickets) {
      const meta = t.metadata as any
      const status = meta?.status || 'OPEN'
      const category = meta?.category || 'OTHER'
      const urgency = meta?.urgency || 'MEDIUM'

      if (status === 'OPEN') stats.open++
      else if (status === 'IN_PROGRESS') stats.inProgress++
      else if (status === 'RESOLVED') stats.resolved++
      else if (status === 'CLOSED') stats.closed++

      if (urgency === 'EMERGENCY') stats.emergency++

      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1

      if (status === 'RESOLVED' || status === 'CLOSED') {
        const updates = meta?.updates || []
        const lastUpdate = updates[updates.length - 1]
        if (lastUpdate?.timestamp) {
          const days = Math.round(
            (new Date(lastUpdate.timestamp).getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24),
          )
          resolvedDaysTotal += days
          resolvedCount++
        }
      }
    }

    stats.avgResolutionDays = resolvedCount > 0
      ? Math.round(resolvedDaysTotal / resolvedCount)
      : 0

    return reply.send({ success: true, data: stats })
  })
}
