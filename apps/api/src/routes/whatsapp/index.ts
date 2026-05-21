import type { FastifyInstance } from 'fastify'
import { whatsappService, BOT_STEPS, type BotState } from '../../services/whatsapp.service.js'
import { env } from '../../utils/env.js'
import { emitAutomation } from '../../services/automation.emitter.js'
import { emitSSE } from '../../services/sse.emitter.js'
import { safeStringEqual } from '../../utils/crypto-safe.js'

// ── Bot state helpers ────────────────────────────────────────────────────────

const BOT_TTL = 60 * 60 * 24 // 24h in seconds

async function getState(redis: any, phone: string): Promise<BotState> {
  if (!redis) return { step: 'GREET' }
  const raw = await redis.get(`bot:${phone}`)
  return raw ? JSON.parse(raw) : { step: 'GREET' }
}

async function setState(redis: any, phone: string, state: BotState) {
  if (!redis) return
  await redis.setex(`bot:${phone}`, BOT_TTL, JSON.stringify(state))
}

async function clearState(redis: any, phone: string) {
  if (!redis) return
  await redis.del(`bot:${phone}`)
}

// ── Route ────────────────────────────────────────────────────────────────────

export default async function whatsappRoutes(app: FastifyInstance) {
  // GET — webhook verification (no auth)
  app.get('/webhook', {
    config: { rateLimit: { max: 100 } },
    schema: { tags: ['whatsapp'] },
  }, async (req, reply) => {
    const q = req.query as any
    const provided = typeof q['hub.verify_token'] === 'string' ? q['hub.verify_token'] : ''
    // Timing-safe comparison — avoids leaking the verify token via response
    // time when Meta's infra (or an attacker) probes the endpoint.
    if (env.WHATSAPP_VERIFY_TOKEN && safeStringEqual(provided, env.WHATSAPP_VERIFY_TOKEN)) {
      return reply.send(q['hub.challenge'])
    }
    return reply.status(403).send('Forbidden')
  })

  // POST — receive messages (no auth, verified by X-Hub-Signature)
  app.post('/webhook', {
    config: { rateLimit: { max: 500 } },
    schema: { tags: ['whatsapp'] },
  }, async (req, reply) => {
    const body = req.body as any

    // Extract message events
    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages ?? []
    const contacts = value?.contacts ?? []

    for (const msg of messages) {
      try {
        await processIncoming(app, msg, contacts, value?.metadata?.phone_number_id)
      } catch (err) {
        app.log.error({ err, msg }, 'Error processing WhatsApp message')
      }
    }

    // Always return 200 to WhatsApp
    return reply.send({ status: 'ok' })
  })

  // POST /api/v1/whatsapp/send — send message (authenticated)
  app.post('/send', {
    schema: { tags: ['whatsapp'] },
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { to, text, conversationId } = req.body as any

    if (!env.WHATSAPP_TOKEN) {
      return reply.status(503).send({ error: 'WHATSAPP_NOT_CONFIGURED' })
    }

    await whatsappService.sendText(to, text)

    // Save outbound message
    if (conversationId) {
      await app.prisma.message.create({
        data: {
          conversationId,
          direction: 'outbound',
          type: 'text',
          content: text,
          sentBy: req.user.sub,
          status: 'sent',
        },
      })

      await app.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessage: text, lastMessageAt: new Date() },
      })
    }

    return reply.send({ success: true })
  })
}

// ── Message processor ────────────────────────────────────────────────────────

async function processIncoming(app: FastifyInstance, msg: any, contacts: any[], phoneNumberId?: string) {
  const phone = msg.from
  const waId = msg.id
  const contactName = contacts.find((c: any) => c.wa_id === phone)?.profile?.name

  // Find company by phone number ID
  // For now, use the first company (single-tenant for MVP)
  const company = await app.prisma.company.findFirst({ select: { id: true } })
  if (!company) return

  // Dedup: skip if we already processed this message
  const existing = await app.prisma.message.findFirst({ where: { whatsappId: waId } })
  if (existing) return

  // Get or create conversation
  let conversation = await app.prisma.conversation.findUnique({
    where: { companyId_phone: { companyId: company.id, phone } },
  })

  if (!conversation) {
    conversation = await app.prisma.conversation.create({
      data: {
        companyId: company.id,
        phone,
        contactName: contactName ?? null,
        status: 'bot',
      },
    })
  }

  // Extract text content
  let content = ''
  let mediaUrl: string | undefined
  const type = msg.type ?? 'text'

  if (type === 'text') {
    content = msg.text?.body ?? ''
  } else if (type === 'interactive') {
    content = msg.interactive?.button_reply?.id ?? msg.interactive?.list_reply?.id ?? ''
  } else if (['audio', 'image', 'document', 'video'].includes(type)) {
    const media = msg[type]
    mediaUrl = media?.link ?? undefined
    content = media?.caption ?? `[${type}]`
  }

  // Save inbound message
  await app.prisma.message.create({
    data: {
      conversationId: conversation.id,
      whatsappId: waId,
      direction: 'inbound',
      type,
      content,
      mediaUrl,
      status: 'delivered',
      metadata: msg as any,
    },
  })

  // Update conversation
  await app.prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessage: content,
      lastMessageAt: new Date(),
      contactName: contactName ?? conversation.contactName,
      unreadCount: { increment: 1 },
    },
  })

  emitAutomation({ companyId: company.id, event: 'whatsapp_message', data: { phone, content, type, conversationId: conversation.id } })
  emitSSE({ type: 'whatsapp_message', companyId: company.id, payload: { phone, conversationId: conversation.id, type } })

  // Run bot if in bot mode
  if (conversation.status === 'bot') {
    // ── Audio fallback: humanized response when audio can't be processed ──
    if (type === 'audio' && (content === '[audio]' || !content.trim())) {
      const audioFallbackMsg = 'Desculpe, não consegui entender o áudio. 😊\n\n' +
        'Para te ajudar mais rápido, você pode:\n' +
        '1️⃣ Digitar sua dúvida aqui\n' +
        '2️⃣ Ver nosso Tour Virtual de imóveis\n' +
        '3️⃣ Falar sobre valores e planos\n\n' +
        'Como posso te ajudar?'

      if (env.WHATSAPP_TOKEN) {
        await whatsappService.sendText(phone, audioFallbackMsg).catch(() => {})
      }

      // Save bot response
      await app.prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction: 'outbound',
          type: 'text',
          content: audioFallbackMsg,
          status: 'sent',
        },
      }).catch(() => {})

      return // Don't advance bot state on audio
    }

    await runBot(app, conversation, phone, content, company.id)
  }
}

// ── Qualification bot ────────────────────────────────────────────────────────

async function runBot(app: FastifyInstance, conversation: any, phone: string, input: string, companyId: string) {
  const state = await getState(app.redis, phone)

  let next: Partial<BotState> = {}

  switch (state.step) {
    case 'GREET': {
      // First contact — greet
      if (!env.WHATSAPP_TOKEN) {
        // Dev mode: just advance
        next = { step: 'ASK_NAME', interest: 'buy' }
      } else {
        await BOT_STEPS.GREET(phone)
        next = { step: 'ASK_NAME' }
      }
      break
    }

    case 'ASK_NAME': {
      // Receive interest from interactive button, or just greet again
      if (input.startsWith('interest_')) {
        next.interest = input === 'interest_buy' ? 'buy' : 'rent'
        if (env.WHATSAPP_TOKEN) await BOT_STEPS.ASK_NAME(phone)
        // Stay on ASK_NAME to get the name next
      } else if (input.length > 1) {
        // Got name
        next.name = input.trim()
        next.step = 'ASK_BUDGET'
        if (env.WHATSAPP_TOKEN) await BOT_STEPS.ASK_BUDGET(phone, state.interest ?? 'buy')
      }
      break
    }

    case 'ASK_BUDGET': {
      next.budget = input.trim()
      next.step = 'ASK_PROPERTY'
      if (env.WHATSAPP_TOKEN) await BOT_STEPS.ASK_PROPERTY(phone)
      break
    }

    case 'ASK_PROPERTY': {
      next.propertySearch = input.trim()
      next.step = 'ASK_URGENCY'
      if (env.WHATSAPP_TOKEN) await BOT_STEPS.ASK_URGENCY(phone)
      break
    }

    case 'ASK_URGENCY': {
      // Accept the interactive button id or free text fallback.
      const urgency = input.startsWith('urgency_')
        ? input.replace('urgency_', '')
        : /(já|agora|urg)/i.test(input) ? 'urgent'
        : /(mês|mes|semana)/i.test(input) ? 'month'
        : 'exploring'
      next.urgency = urgency
      next.step = 'DONE'

      const finalState = { ...state, urgency }
      const name = finalState.name ?? contactName(conversation)
      const budget = parseBudget(finalState.budget)
      const urgencyLabel = urgency === 'urgent' ? 'Alta (quer já)'
        : urgency === 'month' ? 'Média (neste mês)' : 'Baixa (pesquisando)'

      const lead = await app.prisma.lead.create({
        data: {
          companyId,
          name,
          phone,
          interest: finalState.interest,
          budget,
          source: 'whatsapp',
          status: 'NEW',
          notes: [
            `Qualificado via WhatsApp bot.`,
            `Busca: ${finalState.propertySearch ?? '—'}`,
            `Orçamento informado: ${finalState.budget ?? '—'}`,
            `Urgência: ${urgencyLabel}`,
          ].join('\n'),
          tags: urgency === 'urgent' ? ['urgente', 'whatsapp_bot'] : ['whatsapp_bot'],
          metadata: { botState: finalState } as any,
        },
      })

      // Link lead to conversation; handoff: urgentes vão direto pra fila
      // humana (open), os demais ficam open também mas sem flag.
      await app.prisma.conversation.update({
        where: { id: conversation.id },
        data: { leadId: lead.id, status: 'open' },
      })

      await app.prisma.activity.create({
        data: {
          companyId,
          leadId: lead.id,
          type: 'system',
          title: 'Lead qualificado via WhatsApp',
          description: `Bot: ${name} · ${finalState.interest ?? '?'} · ${finalState.budget ?? '?'} · urgência ${urgencyLabel}`,
        },
      }).catch(() => {})

      // Score imediatamente com os sinais coletados (#124).
      let scored: { score: number; temperature: string } | null = null
      try {
        const { scoreLeadFromDb } = await import('../../services/lead-auto-score.service.js')
        scored = await scoreLeadFromDb(app.prisma, lead.id)
      } catch { /* non-fatal */ }

      // Notifica o time — urgentes com prioridade visual no corpo.
      try {
        const { notify } = await import('../../services/notification.service.js')
        const tempLabel = scored
          ? (scored.score >= 76 ? '🔥 Super quente' : scored.score >= 51 ? '🌶️ Quente' : scored.score >= 26 ? '☀️ Morno' : '❄️ Frio')
          : ''
        await notify({
          prisma: app.prisma,
          companyId,
          type: 'lead_captured',
          title: urgency === 'urgent'
            ? `🔥 Lead URGENTE via WhatsApp: ${name}`
            : `Novo lead via WhatsApp: ${name}`,
          body: [
            `${name} foi qualificado pelo bot do WhatsApp.`,
            `Telefone: ${phone}`,
            `Interesse: ${finalState.interest === 'buy' ? 'Comprar' : finalState.interest === 'rent' ? 'Alugar' : '—'}`,
            `Orçamento: ${finalState.budget ?? '—'}`,
            `Busca: ${finalState.propertySearch ?? '—'}`,
            `Urgência: ${urgencyLabel}`,
            scored ? `Score: ${scored.score}/100 ${tempLabel}` : '',
          ].filter(Boolean).join('\n'),
          payload: { leadId: lead.id, phone, conversationId: conversation.id, urgency, score: scored?.score ?? null },
        })
      } catch { /* non-fatal */ }

      if (env.WHATSAPP_TOKEN) await BOT_STEPS.DONE(phone, name)
      await clearState(app.redis, phone)
      return
    }

    default:
      return
  }

  await setState(app.redis, phone, { ...state, ...next } as BotState)
}

function contactName(conv: any): string {
  return conv.contactName ?? conv.phone
}

function parseBudget(raw?: string): number | undefined {
  if (!raw) return undefined
  const n = raw.replace(/[^0-9,]/g, '').replace(',', '.')
  const v = parseFloat(n)
  return isNaN(v) ? undefined : v
}
