/**
 * Notifications — Critical polling endpoint
 *
 * GET /critical?since=ISO  — Returns unattended critical events since timestamp
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

export default async function notificationsRoutes(app: FastifyInstance) {
  // ── GET /critical — Poll for critical events ────────────────────────────
  app.get('/critical', {
    schema: {
      tags: ['notifications'],
      description: 'Poll for critical notifications (hunter leads, proposals, plan sales)',
      querystring: {
        type: 'object',
        properties: {
          since: { type: 'string', description: 'ISO timestamp to filter from' },
        },
      },
    },
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { sub: string; cid: string; role: string }
    const { since } = request.query as { since?: string }

    const sinceDate = since ? new Date(since) : new Date(Date.now() - 60_000)
    const results: Array<{
      id: string
      type: string
      title: string
      body: string
      payload: Record<string, unknown>
      createdAt: string
    }> = []

    // 1. Hunter leads (handoff chats from Tomás)
    const hunterChats = await app.prisma.tomasChat.findMany({
      where: {
        companyId: user.cid,
        handoffNeeded: true,
        updatedAt: { gte: sinceDate },
      },
      select: {
        id: true,
        summary: true,
        metadata: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    })

    for (const chat of hunterChats) {
      const meta = chat.metadata as Record<string, unknown> || {}
      results.push({
        id: `hunter-${chat.id}`,
        type: 'hunter_lead',
        title: `Investidor identificado pelo Tomás`,
        body: chat.summary || 'Lead quente — busca externa solicitada',
        payload: {
          chatId: chat.id,
          notification: meta.notification,
        },
        createdAt: chat.updatedAt.toISOString(),
      })
    }

    // 2. New proposals
    const newProposals = await app.prisma.proposal.findMany({
      where: {
        companyId: user.cid,
        status: 'sent',
        createdAt: { gte: sinceDate },
      },
      select: {
        id: true,
        offerValue: true,
        propertyId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    for (const proposal of newProposals) {
      results.push({
        id: `proposal-${proposal.id}`,
        type: 'proposal_received',
        title: `Nova proposta: R$ ${Number(proposal.offerValue).toLocaleString('pt-BR')}`,
        body: '',
        payload: {
          proposalId: proposal.id,
          propertyId: proposal.propertyId,
          value: Number(proposal.offerValue),
        },
        createdAt: proposal.createdAt.toISOString(),
      })
    }

    // 3. New leads from Tomás (source: tomas_hunter)
    const hunterLeads = await app.prisma.contact.findMany({
      where: {
        companyId: user.cid,
        source: 'tomas_hunter',
        createdAt: { gte: sinceDate },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    for (const lead of hunterLeads) {
      const meta = lead.metadata as Record<string, unknown> || {}
      results.push({
        id: `lead-${lead.id}`,
        type: 'hunter_lead',
        title: `Novo Investidor: ${lead.name}`,
        body: `${(meta.neighborhoods as string[] || []).join(', ')} — Budget: R$ ${Number(meta.budgetMax ?? 0).toLocaleString('pt-BR')}`,
        payload: {
          contactId: lead.id,
          name: lead.name,
          phone: lead.phone,
          neighborhoods: meta.neighborhoods,
          budgetMax: meta.budgetMax,
          city: meta.city,
        },
        createdAt: lead.createdAt.toISOString(),
      })
    }

    // Sort by createdAt descending
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return reply.send(results)
  })
}
