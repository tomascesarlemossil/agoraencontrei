/**
 * Lead Auto-Score — deriva o LeadBehavior do que está no DB e pontua o lead.
 *
 * Diferente do lead-scoring.service genérico (que recebe dados de analytics
 * externo), aqui usamos os sinais que JÁ temos: telefone, e-mail, propriedades
 * de interesse (LeadProperty), visitas agendadas/realizadas (PropertyVisit),
 * propostas enviadas (Proposal), última atividade (lastContactAt + Activity).
 *
 * Chamar após qualquer evento que mude esses sinais. Fail-soft: nunca lança.
 */

import type { PrismaClient } from '@prisma/client'
import { calculateLeadScore, type LeadBehavior } from './lead-scoring.service.js'

export async function scoreLeadFromDb(
  prisma: PrismaClient,
  leadId: string,
): Promise<{ score: number; temperature: string } | null> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true, name: true, email: true, phone: true, interest: true, budget: true,
      utmSource: true, utmMedium: true, contactId: true, lastContactAt: true,
      createdAt: true, companyId: true,
    },
  }).catch(() => null)
  if (!lead) return null

  const phone = lead.phone ?? null
  const email = lead.email ?? null

  // Quantos imóveis de interesse este lead já tem (LeadProperty).
  const favCount = await prisma.leadProperty.count({
    where: { leadId: lead.id },
  }).catch(() => 0)

  // Visitas — fortíssimo sinal de intenção. Cruzamos por contato e telefone.
  let visitScheduledCount = 0
  let visitDoneCount = 0
  if (lead.contactId || phone) {
    const visits = await prisma.propertyVisit.findMany({
      where: {
        companyId: lead.companyId,
        OR: [
          phone ? { visitorPhone: phone } : {},
          // future: tie by contactId once that link exists
        ].filter(o => Object.keys(o).length > 0),
      },
      select: { status: true },
    }).catch(() => [])
    for (const v of visits) {
      if (v.status === 'done') visitDoneCount++
      else if (v.status === 'pending' || v.status === 'confirmed') visitScheduledCount++
    }
  }

  // Propostas — sinal mais forte ainda.
  let proposalCount = 0
  let proposalAcceptedCount = 0
  if (lead.contactId) {
    const proposals = await prisma.proposal.findMany({
      where: { leadId: lead.id },
      select: { status: true },
    }).catch(() => [])
    proposalCount = proposals.length
    proposalAcceptedCount = proposals.filter(p => p.status === 'accepted').length
  }

  // Atividade nas últimas X horas/dias — recência.
  const lastTouch = lead.lastContactAt ?? lead.createdAt
  const lastVisitDaysAgo = Math.floor((Date.now() - lastTouch.getTime()) / 86_400_000)

  // Mensagens trocadas (Activity type "message" ou similar).
  const messagesCount = await prisma.activity.count({
    where: { leadId: lead.id, type: { in: ['message', 'whatsapp', 'call'] } },
  }).catch(() => 0)

  const behavior: LeadBehavior = {
    totalPageViews: 0,
    propertyViews: favCount,                 // proxy: salvou imóvel = viu
    photoViews: 0,
    timeOnSiteMinutes: 0,
    messagesCount,
    // Sinais ricos do nosso domínio entram como "cliques fortes" — não há
    // campo dedicado no LeadBehavior original, então mapeamos como WhatsApp
    // clicks (peso alto) os eventos de intenção real: visita agendada,
    // visita realizada, proposta enviada. Cada evento conta como 1 clique
    // até o cap (3) — depois disso vira saturação.
    whatsappClicks: Math.min(visitScheduledCount + proposalCount, 3),
    phoneCallClicks: Math.min(visitDoneCount + proposalAcceptedCount, 2),
    favoritesCount: favCount,
    searchesCount: 0,
    returnVisits: 0,
    lastVisitDaysAgo,
    utmSource: lead.utmSource ?? undefined,
    utmMedium: lead.utmMedium ?? undefined,
    interest: lead.interest ?? undefined,
    budget: lead.budget ? Number(lead.budget) : undefined,
    hasEmail: !!email,
    hasPhone: !!phone,
  }

  const result = calculateLeadScore(behavior)

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      score: result.score,
      // Preserva tags existentes, troca apenas o token de temperatura.
      tags: { set: await rebuildTagsWithTemperature(prisma, leadId, result.temperature) },
      metadata: {
        ...((await prisma.lead.findUnique({
          where: { id: leadId }, select: { metadata: true },
        }).catch(() => null))?.metadata as Record<string, unknown> ?? {}),
        leadScore: result as unknown as object,
        scoredAt: new Date().toISOString(),
      } as object,
    },
  }).catch(() => {})

  return { score: result.score, temperature: result.temperature }
}

async function rebuildTagsWithTemperature(
  prisma: PrismaClient,
  leadId: string,
  temperature: string,
): Promise<string[]> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { tags: true },
  }).catch(() => null)
  const existing = (lead?.tags ?? []).filter(t => !t.startsWith('temperature:'))
  return [...existing, `temperature:${temperature}`]
}
