/**
 * Tomás OS — API Routes
 *
 * POST /chat           — Conversar com o Tomás (público ou autenticado)
 * GET  /conversations   — Listar conversas (autenticado)
 * GET  /conversations/:id — Detalhe de uma conversa com mensagens
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import {
  runTomasChat,
  getOrCreateChat,
  persistMessages,
  resolveBrainLabel,
  type TomasMessage,
  type TomasChatParams,
} from '../../services/tomas.service.js'
import { findTenantByHost } from '../../services/tenant.service.js'

export default async function tomasRoutes(app: FastifyInstance) {
  // ── POST /chat — Conversa com o Tomás ──────────────────────────────────
  // Aceita tanto visitantes anônimos quanto usuários autenticados
  app.post('/chat', {
    schema: {
      tags: ['tomas'],
      description: 'Chat com o agente Tomás',
      body: {
        type: 'object',
        properties: {
          messages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                role: { type: 'string', enum: ['user', 'assistant'] },
                content: { type: 'string' },
              },
              required: ['role', 'content'],
            },
          },
          channel: { type: 'string', enum: ['site', 'dashboard'], default: 'site' },
          chatId: { type: 'string' },
          visitorId: { type: 'string' },
          nicheSlug: { type: 'string' },
          tenantTheme: { type: 'string' },
          // Slug/subdomínio do parceiro (site white-label). Resolvido
          // SERVER-SIDE para o companyId — nunca confiamos num companyId vindo
          // do cliente. Faz o visitante público falar com o cérebro do parceiro.
          tenantSlug: { type: 'string' },
          // Confirmação explícita do usuário para ações de escrita (Fase 4).
          confirm: { type: 'boolean' },
          propertyContext: {
            type: 'object',
            properties: {
              propertyId: { type: 'string' },
              title: { type: 'string' },
              city: { type: 'string' },
              neighborhood: { type: 'string' },
              price: { type: 'number' },
              type: { type: 'string' },
            },
          },
        },
        required: ['messages'],
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as {
      messages: TomasMessage[]
      channel?: string
      chatId?: string
      visitorId?: string
      nicheSlug?: string
      tenantTheme?: string
      tenantSlug?: string
      confirm?: boolean
      propertyContext?: TomasChatParams['propertyContext']
    }

    // Try to authenticate, but don't require it
    let userId: string | undefined
    let companyId: string | undefined
    let role: string | undefined
    try {
      await request.jwtVerify()
      const user = request.user as { sub?: string; cid?: string; role?: string }
      userId = user.sub
      companyId = user.cid
      role = user.role
    } catch {
      // Anonymous visitor — that's fine for site mode
    }

    const channel = (body.channel || 'site') as 'site' | 'dashboard'

    // Ingress do site público do parceiro: um visitante ANÔNIMO no site
    // white-label de um parceiro (subdomínio) conversa com o cérebro DAQUELE
    // parceiro (modo público). O companyId vem de um lookup SERVER-SIDE do slug
    // — nunca aceitamos um companyId do cliente. Se o visitante já está
    // autenticado, o companyId do JWT prevalece (não deixa o cliente trocar).
    if (!companyId && channel === 'site' && typeof body.tenantSlug === 'string') {
      const slug = body.tenantSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
      if (slug) {
        try {
          const tenant = await findTenantByHost(app.prisma, slug)
          if (tenant?.companyId && tenant.isActive !== false && tenant.planStatus !== 'SUSPENDED') {
            companyId = tenant.companyId as string
          }
        } catch {
          // Slug inválido/indisponível — segue como marketplace público.
        }
      }
    }

    // Dashboard mode requires authentication
    if (channel === 'dashboard' && !userId) {
      return reply.status(401).send({ error: 'Autenticação necessária para o modo dashboard.' })
    }

    // Qual cérebro atende (para separar a memória). Resolvido do companyId já
    // confiável (JWT ou lookup server-side do slug) — não do cliente.
    const brain = await resolveBrainLabel(app.prisma, companyId)

    // Create or resume conversation
    const chatId = await getOrCreateChat(app.prisma, {
      chatId: body.chatId,
      channel,
      visitorId: body.visitorId,
      companyId,
      userId,
      propertyId: body.propertyContext?.propertyId,
      brain,
    })

    // Run the agent
    const result = await runTomasChat(app.prisma, {
      messages: body.messages,
      channel,
      chatId,
      visitorId: body.visitorId,
      companyId,
      userId,
      role,
      confirmed: body.confirm === true,
      nicheSlug: body.nicheSlug,
      tenantTheme: body.tenantTheme,
      propertyContext: body.propertyContext,
    })

    // Persist the conversation
    const lastUserMsg = body.messages[body.messages.length - 1]?.content || ''
    await persistMessages(app.prisma, chatId, lastUserMsg, result)

    return reply.send({
      chatId,
      ...result,
    })
  })

  // ── GET /conversations — Listar conversas (autenticado) ────────────────
  app.get('/conversations', {
    schema: { tags: ['tomas'] },
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { sub: string; cid: string }

    const chats = await app.prisma.tomasChat.findMany({
      where: { companyId: user.cid },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        channel: true,
        visitorId: true,
        summary: true,
        nextAction: true,
        handoffNeeded: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    })

    return reply.send(chats)
  })

  // ── GET /conversations/:id — Detalhe com mensagens ─────────────────────
  app.get('/conversations/:id', {
    schema: { tags: ['tomas'] },
    preHandler: [app.authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string }
    const user = request.user as { cid: string }

    const chat = await app.prisma.tomasChat.findFirst({
      where: { id, companyId: user.cid },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 200,
        },
      },
    })

    if (!chat) {
      return reply.status(404).send({ error: 'Conversa não encontrada.' })
    }

    return reply.send(chat)
  })
}
