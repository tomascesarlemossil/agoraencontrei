import type { FastifyInstance } from 'fastify'
import type { ActionDef } from './automation.types.js'
import { whatsappService } from './whatsapp.service.js'
import { scoreLead } from './ai.service.js'

/** Replace {{field}} tokens with data values */
function interpolate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key] ?? ''))
}

export async function executeAction(
  app: FastifyInstance,
  action: ActionDef,
  data: Record<string, unknown>,
  companyId: string,
): Promise<unknown> {
  const p = action.params

  switch (action.type) {
    case 'send_whatsapp': {
      const phone = String(p.phone ?? data['phone'] ?? data['leadPhone'] ?? '')
      const message = interpolate(String(p.message ?? ''), data)
      if (!phone) throw new Error('send_whatsapp: no phone resolved')
      return whatsappService.sendText(phone, message)
    }

    case 'create_activity': {
      const leadId = String(p.leadId ?? data['leadId'] ?? data['id'] ?? '')
      const dealId = String(p.dealId ?? data['dealId'] ?? '')
      const title = interpolate(String(p.title ?? 'Automação executada'), data)
      // Valida ownership antes de criar activity — evita vincular activity
      // com leadId/dealId de outro tenant (Prisma aceitaria o FK, mas o
      // registro ficaria cross-tenant porque activity.companyId é definido
      // pelo contexto e não pelo lead).
      if (leadId) {
        const lead = await app.prisma.lead.findFirst({
          where: { id: leadId, companyId },
          select: { id: true },
        })
        if (!lead) throw new Error(`create_activity: lead ${leadId} not found in company ${companyId}`)
      }
      if (dealId) {
        const deal = await app.prisma.deal.findFirst({
          where: { id: dealId, companyId },
          select: { id: true },
        })
        if (!deal) throw new Error(`create_activity: deal ${dealId} not found in company ${companyId}`)
      }
      return app.prisma.activity.create({
        data: {
          companyId,
          leadId:      leadId  || undefined,
          dealId:      dealId  || undefined,
          type:        String(p.type ?? 'system'),
          title,
          description: p.description
            ? interpolate(String(p.description), data)
            : undefined,
        },
      })
    }

    case 'update_lead': {
      const leadId = String(p.leadId ?? data['id'] ?? '')
      if (!leadId) throw new Error('update_lead: no leadId resolved')
      // Scope por companyId: updateMany com filtro composto retorna count=0
      // se o lead não pertence ao tenant, em vez de update silencioso
      // cross-tenant. Erro explícito quando não encontrado.
      const result = await app.prisma.lead.updateMany({
        where: { id: leadId, companyId },
        data: {
          ...(p.status        !== undefined && { status:       p.status as any }),
          ...(p.score         !== undefined && { score:        Number(p.score) }),
          ...(p.assignedToId  !== undefined && { assignedToId: String(p.assignedToId) }),
        },
      })
      if (result.count === 0) {
        throw new Error(`update_lead: lead ${leadId} not found in company ${companyId}`)
      }
      return result
    }

    case 'score_lead': {
      const leadId = String(p.leadId ?? data['id'] ?? '')
      // findFirst com companyId impede leak cross-tenant — findUnique por id
      // isolado retornaria lead de qualquer company.
      const lead = await app.prisma.lead.findFirst({
        where: { id: leadId, companyId },
        include: {
          _count: { select: { activities: true, deals: true } },
          contact: { select: { id: true } },
        },
      })
      if (!lead) throw new Error(`score_lead: lead ${leadId} not found in company ${companyId}`)
      const result = await scoreLead({
        lead: {
          source:        lead.source    ?? undefined,
          interest:      lead.interest  ?? undefined,
          budget:        lead.budget    ? Number(lead.budget) : undefined,
          status:        lead.status,
          score:         lead.score,
          createdAt:     lead.createdAt.toISOString(),
          lastContactAt: lead.lastContactAt?.toISOString(),
        },
        activitiesCount: lead._count.activities,
        dealsCount:      lead._count.deals,
        hasPhone:        !!lead.phone,
        hasEmail:        !!lead.email,
        hasContact:      !!lead.contact,
      })
      await app.prisma.lead.updateMany({
        where: { id: leadId, companyId },
        data:  { score: result.score },
      })
      return result
    }

    case 'notify_webhook': {
      const url = String(p.url ?? '')
      if (!url) throw new Error('notify_webhook: no url')
      const res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ event: data, params: p }),
        signal:  AbortSignal.timeout(10_000),
      })
      return { status: res.status, ok: res.ok }
    }

    case 'assign_broker': {
      const leadId   = String(p.leadId   ?? data['id'] ?? '')
      const brokerId = String(p.brokerId ?? '')
      if (!leadId || !brokerId) throw new Error('assign_broker: missing leadId or brokerId')
      // Valida broker pertence à mesma company para evitar atribuir
      // corretor cross-tenant (vazaria PII e lead pipeline).
      const broker = await app.prisma.user.findFirst({
        where: { id: brokerId, companyId },
        select: { id: true },
      })
      if (!broker) throw new Error(`assign_broker: broker ${brokerId} not found in company ${companyId}`)
      const result = await app.prisma.lead.updateMany({
        where: { id: leadId, companyId },
        data:  { assignedToId: brokerId },
      })
      if (result.count === 0) {
        throw new Error(`assign_broker: lead ${leadId} not found in company ${companyId}`)
      }
      return result
    }

    case 'create_deal': {
      const leadId = String(p.leadId ?? data['leadId'] ?? data['id'] ?? '')
      if (!leadId) throw new Error('create_deal: no leadId resolved')
      // findFirst com companyId — findUnique por id cruzaria tenants.
      const lead = await app.prisma.lead.findFirst({
        where: { id: leadId, companyId },
        include: { properties: { select: { propertyId: true } } },
      })
      if (!lead) throw new Error(`create_deal: lead ${leadId} not found in company ${companyId}`)

      const dealType = p.type ?? (lead.interest === 'rent' ? 'RENT' : 'SALE')
      const title = p.title
        ? interpolate(String(p.title), data)
        : `${dealType === 'RENT' ? 'Locação' : 'Venda'} — ${lead.name}`

      const deal = await app.prisma.deal.create({
        data: {
          companyId: companyId,
          brokerId:  lead.assignedToId || String(p.brokerId ?? data['brokerId'] ?? ''),
          leadId:    lead.id,
          contactId: lead.contactId || undefined,
          title,
          type:   dealType as any,
          status: 'OPEN',
          value:  lead.budget ? Number(lead.budget) : undefined,
          properties: {
            create: lead.properties.map(lp => ({ propertyId: lp.propertyId })),
          },
        },
      })

      await app.prisma.lead.updateMany({
        where: { id: leadId, companyId },
        data:  { status: 'NEGOTIATING' },
      })
      await app.prisma.activity.create({
        data: {
          companyId, leadId: lead.id, dealId: deal.id,
          type: 'system', title: 'Negócio criado via automação',
          description: `Deal "${title}" criado automaticamente`,
        },
      })
      return deal
    }

    default:
      throw new Error(`Unknown action type: ${(action as any).type}`)
  }
}
