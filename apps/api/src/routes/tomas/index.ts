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
  type TomasMessage,
  type TomasChatParams,
} from '../../services/tomas.service.js'

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
      propertyContext?: TomasChatParams['propertyContext']
    }

    // Try to authenticate, but don't require it
    let userId: string | undefined
    let companyId: string | undefined
    try {
      await request.jwtVerify()
      const user = request.user as { sub?: string; cid?: string }
      userId = user.sub
      companyId = user.cid
    } catch {
      // Anonymous visitor — that's fine for site mode
    }

    const channel = (body.channel || 'site') as 'site' | 'dashboard'

    // Dashboard mode requires authentication
    if (channel === 'dashboard' && !userId) {
      return reply.status(401).send({ error: 'Autenticação necessária para o modo dashboard.' })
    }

    // Create or resume conversation
    const chatId = await getOrCreateChat(app.prisma, {
      chatId: body.chatId,
      channel,
      visitorId: body.visitorId,
      companyId,
      userId,
      propertyId: body.propertyContext?.propertyId,
    })

    // Run the agent
    const result = await runTomasChat(app.prisma, {
      messages: body.messages,
      channel,
      chatId,
      visitorId: body.visitorId,
      companyId,
      userId,
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
