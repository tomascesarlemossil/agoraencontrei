/**
 * WhatsApp Campaigns Routes — /api/v1/wa-campaigns
 *
 * Módulo tenant-facing (escopo por companyId) para disparo profissional de
 * campanhas de imóveis/empreendimentos. Envio SIMULADO no MVP.
 *
 *  POST   /                         — criar campanha
 *  GET    /                         — listar campanhas
 *  GET    /:id                      — detalhe + destinatários + risco
 *  POST   /:id/recipients           — colar/importar lista (normaliza+dedupe+optout)
 *  DELETE /:id/recipients/:rid      — remover destinatário
 *  POST   /:id/risk                 — recalcular risco
 *  POST   /:id/approve              — aprovação humana (ADMIN)
 *  POST   /:id/dispatch             — enfileirar disparo (simulado)
 *  POST   /:id/cancel               — cancelar
 *  GET    /optout                   — listar opt-outs
 *  POST   /optout                   — adicionar opt-out manual
 *  POST   /webhook/inbound          — resposta recebida (opt-out / abre CRM)
 *  POST   /:id/prospect/research    — agente de prospecção (revisão humana)
 *  GET    /:id/prospect             — listar prospects
 *  POST   /prospect/:pid/review     — aprovar/rejeitar prospect
 *  POST   /:id/prospect/import      — importar prospects aprovados
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  createCampaign,
  listCampaigns,
  getCampaign,
  addRecipients,
  removeRecipient,
  recomputeRisk,
  approveCampaign,
  dispatchCampaign,
  cancelCampaign,
} from '../../services/wa-campaigns/wa-campaigns.service.js'
import { parsePhoneList, normalizePhoneBR } from '../../services/wa-campaigns/phone.util.js'
import { addOptOut, handleInboundReply } from '../../services/wa-campaigns/wa-optout.service.js'
import {
  researchProspects,
  listProspects,
  reviewProspect,
  importApprovedProspects,
} from '../../services/wa-campaigns/wa-prospect.service.js'

const ADMIN_ROLES = ['ADMIN', 'OWNER', 'SUPER_ADMIN', 'MANAGER']

const CONSENT_BASES = ['consent', 'legitimate_interest', 'contract', 'existing_customer'] as const

export default async function waCampaignsRoutes(app: FastifyInstance) {
  // ── Webhook público de resposta (verificado por token) — antes do auth ────
  // Recebe respostas do provedor (ou simulação) para tratar SAIR e abrir CRM.
  app.post('/webhook/inbound', {
    config: { rateLimit: { max: 120, timeWindow: '1 minute' } },
    schema: { tags: ['wa-campaigns'], summary: 'Inbound reply webhook (opt-out / CRM)' },
  }, async (req, reply) => {
    const body = z.object({
      companyId: z.string().min(1),
      phone: z.string().min(8),
      text: z.string().default(''),
      token: z.string().optional(),
    }).parse(req.body)

    // Verificação simples por token compartilhado (reuso do verify token do WABA).
    const expected = process.env.WHATSAPP_VERIFY_TOKEN
    if (expected && body.token !== expected) {
      return reply.status(401).send({ error: 'INVALID_TOKEN' })
    }

    const result = await handleInboundReply(app.prisma, {
      companyId: body.companyId,
      phone: body.phone,
      text: body.text,
    })
    return reply.send({ success: true, data: result })
  })

  // ── Todas as demais rotas exigem autenticação staff ───────────────────────
  app.addHook('preHandler', app.authenticate)

  // ── POST / — criar campanha ───────────────────────────────────────────────
  app.post('/', {
    schema: { tags: ['wa-campaigns'], summary: 'Create campaign' },
  }, async (req, reply) => {
    const body = z.object({
      name: z.string().min(1),
      propertyId: z.string().optional(),
      empreendimento: z.string().optional(),
      templateName: z.string().optional(),
      templateLang: z.string().optional(),
      messageBody: z.string().min(1),
      variables: z.record(z.any()).optional(),
      scheduledAt: z.string().datetime().optional(),
    }).parse(req.body)

    const campaign = await createCampaign(app.prisma, {
      companyId: req.user.cid,
      createdById: req.user.sub,
      name: body.name,
      propertyId: body.propertyId,
      empreendimento: body.empreendimento,
      templateName: body.templateName,
      templateLang: body.templateLang,
      messageBody: body.messageBody,
      variables: body.variables,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
    })

    return reply.send({ success: true, data: campaign })
  })

  // ── GET / — listar ────────────────────────────────────────────────────────
  app.get('/', {
    schema: { tags: ['wa-campaigns'], summary: 'List campaigns' },
  }, async (req, reply) => {
    const q = req.query as any
    const campaigns = await listCampaigns(app.prisma, req.user.cid, q.status)
    return reply.send({ success: true, data: campaigns })
  })

  // ── GET /:id — detalhe ──────────────────────────────────────────────────────
  app.get('/:id', {
    schema: { tags: ['wa-campaigns'], summary: 'Campaign detail' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const campaign = await getCampaign(app.prisma, req.user.cid, id)
    if (!campaign) return reply.status(404).send({ error: 'CAMPAIGN_NOT_FOUND' })
    return reply.send({ success: true, data: campaign })
  })

  // ── POST /:id/recipients — colar/importar lista ─────────────────────────────
  app.post('/:id/recipients', {
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    schema: { tags: ['wa-campaigns'], summary: 'Add recipients (paste/import list)' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const campaign = await getCampaign(app.prisma, req.user.cid, id)
    if (!campaign) return reply.status(404).send({ error: 'CAMPAIGN_NOT_FOUND' })

    const body = z.object({
      // Ou um texto colado (uma coluna) ...
      rawList: z.string().optional(),
      // ... ou uma lista estruturada com nome por telefone.
      contacts: z.array(z.object({
        phone: z.string(),
        name: z.string().optional(),
        variables: z.record(z.any()).optional(),
      })).optional(),
      source: z.string().default('import'),
      consentBasis: z.enum(CONSENT_BASES).default('consent'),
      sourceRef: z.string().optional(),
    }).parse(req.body)

    const entries = body.contacts?.length
      ? body.contacts.map((c) => ({
          raw: c.phone,
          name: c.name,
          source: body.source,
          consentBasis: body.consentBasis,
          sourceRef: body.sourceRef,
          variables: c.variables,
        }))
      : parsePhoneList(body.rawList ?? '').map((raw) => ({
          raw,
          source: body.source,
          consentBasis: body.consentBasis,
          sourceRef: body.sourceRef,
        }))

    if (entries.length === 0) {
      return reply.status(400).send({ error: 'EMPTY_LIST' })
    }

    const report = await addRecipients(app.prisma, {
      campaignId: id,
      companyId: req.user.cid,
      entries,
    })
    const updated = await getCampaign(app.prisma, req.user.cid, id)
    return reply.send({ success: true, data: { report, campaign: updated } })
  })

  // ── DELETE /:id/recipients/:rid ─────────────────────────────────────────────
  app.delete('/:id/recipients/:rid', {
    schema: { tags: ['wa-campaigns'], summary: 'Remove recipient' },
  }, async (req, reply) => {
    const { id, rid } = req.params as { id: string; rid: string }
    await removeRecipient(app.prisma, req.user.cid, id, rid)
    return reply.send({ success: true })
  })

  // ── POST /:id/risk — recalcular risco ───────────────────────────────────────
  app.post('/:id/risk', {
    schema: { tags: ['wa-campaigns'], summary: 'Recompute risk' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const campaign = await getCampaign(app.prisma, req.user.cid, id)
    if (!campaign) return reply.status(404).send({ error: 'CAMPAIGN_NOT_FOUND' })
    const risk = await recomputeRisk(app.prisma, id)
    return reply.send({ success: true, data: risk })
  })

  // ── POST /:id/approve — aprovação humana (ADMIN) ────────────────────────────
  app.post('/:id/approve', {
    schema: { tags: ['wa-campaigns'], summary: 'Approve campaign (human review)' },
  }, async (req, reply) => {
    if (!ADMIN_ROLES.includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN', message: 'Aprovação exige perfil de gestor/admin' })
    }
    const { id } = req.params as { id: string }
    try {
      const campaign = await approveCampaign(app.prisma, req.user.cid, id, req.user.sub)
      return reply.send({ success: true, data: campaign })
    } catch (err: any) {
      return reply.status(404).send({ error: err.message })
    }
  })

  // ── POST /:id/dispatch — enfileirar disparo (simulado no MVP) ───────────────
  app.post('/:id/dispatch', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    schema: { tags: ['wa-campaigns'], summary: 'Dispatch campaign (queued, simulated)' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      const result = await dispatchCampaign(app.prisma, app.waCampaignsQueue, {
        companyId: req.user.cid,
        campaignId: id,
      })
      return reply.send({ success: true, data: result })
    } catch (err: any) {
      const code = err.message
      const status = code === 'CAMPAIGN_NOT_FOUND' ? 404 : 400
      return reply.status(status).send({ error: code })
    }
  })

  // ── POST /:id/cancel ────────────────────────────────────────────────────────
  app.post('/:id/cancel', {
    schema: { tags: ['wa-campaigns'], summary: 'Cancel campaign' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    await cancelCampaign(app.prisma, req.user.cid, id)
    return reply.send({ success: true })
  })

  // ── Opt-out registry ────────────────────────────────────────────────────────
  app.get('/optout', {
    schema: { tags: ['wa-campaigns'], summary: 'List opt-outs' },
  }, async (req, reply) => {
    const rows = await (app.prisma as any).waOptOut.findMany({
      where: { companyId: req.user.cid },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
    return reply.send({ success: true, data: rows })
  })

  app.post('/optout', {
    schema: { tags: ['wa-campaigns'], summary: 'Add manual opt-out' },
  }, async (req, reply) => {
    const body = z.object({ phone: z.string().min(8), reason: z.string().optional() }).parse(req.body)
    const norm = normalizePhoneBR(body.phone)
    if (!norm.valid || !norm.e164) return reply.status(400).send({ error: 'INVALID_PHONE', reason: norm.reason })
    await addOptOut(app.prisma, {
      companyId: req.user.cid,
      phoneE164: norm.e164,
      reason: body.reason ?? 'manual',
      source: 'manual',
    })
    return reply.send({ success: true, data: { phoneE164: norm.e164 } })
  })

  // ── Agente de prospecção (sempre com revisão humana) ────────────────────────
  app.post('/:id/prospect/research', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    schema: { tags: ['wa-campaigns'], summary: 'Research public business contacts (needs review)' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const campaign = await getCampaign(app.prisma, req.user.cid, id)
    if (!campaign) return reply.status(404).send({ error: 'CAMPAIGN_NOT_FOUND' })
    const body = z.object({
      query: z.string().min(2),
      city: z.string().optional(),
      category: z.string().optional(),
      limit: z.number().int().min(1).max(25).optional(),
    }).parse(req.body)

    const results = await researchProspects(app.prisma, {
      companyId: req.user.cid,
      campaignId: id,
      query: body.query,
      city: body.city,
      category: body.category,
      limit: body.limit,
    })
    return reply.send({
      success: true,
      data: results,
      notice: 'Resultados SIMULADOS. Revise a fonte e valide os telefones antes de aprovar. Nada é enviado sem revisão humana.',
    })
  })

  app.get('/:id/prospect', {
    schema: { tags: ['wa-campaigns'], summary: 'List prospects' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const q = req.query as any
    const rows = await listProspects(app.prisma, req.user.cid, { campaignId: id, status: q.status })
    return reply.send({ success: true, data: rows })
  })

  app.post('/prospect/:pid/review', {
    schema: { tags: ['wa-campaigns'], summary: 'Review (approve/reject) a prospect' },
  }, async (req, reply) => {
    if (!ADMIN_ROLES.includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }
    const { pid } = req.params as { pid: string }
    const body = z.object({
      action: z.enum(['approve', 'reject']),
      phone: z.string().optional(),
      sourceRef: z.string().optional(),
      notes: z.string().optional(),
    }).parse(req.body)
    try {
      const row = await reviewProspect(app.prisma, req.user.cid, pid, {
        ...body,
        reviewedById: req.user.sub,
      })
      return reply.send({ success: true, data: row })
    } catch (err: any) {
      return reply.status(400).send({ error: err.message })
    }
  })

  app.post('/:id/prospect/import', {
    schema: { tags: ['wa-campaigns'], summary: 'Import approved prospects into campaign' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const campaign = await getCampaign(app.prisma, req.user.cid, id)
    if (!campaign) return reply.status(404).send({ error: 'CAMPAIGN_NOT_FOUND' })
    const result = await importApprovedProspects(app.prisma, {
      companyId: req.user.cid,
      campaignId: id,
    })
    const updated = await getCampaign(app.prisma, req.user.cid, id)
    return reply.send({ success: true, data: { ...result, campaign: updated } })
  })
}
