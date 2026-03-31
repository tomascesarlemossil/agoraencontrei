/**
 * WhatsApp Cloud API client
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
import { env } from '../utils/env.js'

const BASE = 'https://graph.facebook.com/v19.0'

async function call<T>(path: string, body: unknown): Promise<T> {
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_ID) {
    throw new Error('WhatsApp credentials not configured')
  }

  const res = await fetch(`${BASE}/${env.WHATSAPP_PHONE_ID}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`WhatsApp API error ${res.status}: ${JSON.stringify(err)}`)
  }

  return res.json() as Promise<T>
}

export const whatsappService = {
  sendText: (to: string, text: string) =>
    call('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text, preview_url: false },
    }),

  sendTemplate: (to: string, name: string, lang = 'pt_BR', components: unknown[] = []) =>
    call('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: { name, language: { code: lang }, components },
    }),

  sendInteractive: (to: string, body: string, buttons: { id: string; title: string }[]) =>
    call('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: body },
        action: {
          buttons: buttons.map((b) => ({
            type: 'reply',
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    }),

  markRead: (messageId: string) =>
    call('/messages', {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }),
}

// ── Qualification Bot ────────────────────────────────────────────────────────

type BotState = {
  step: 'GREET' | 'ASK_NAME' | 'ASK_INTEREST' | 'ASK_BUDGET' | 'ASK_PROPERTY' | 'DONE'
  name?: string
  interest?: string
  budget?: string
  propertySearch?: string
}

export const BOT_STEPS = {
  GREET: async (to: string) => {
    await whatsappService.sendInteractive(
      to,
      '👋 Olá! Sou o assistente da AgoraEncontrei. Você quer *comprar* ou *alugar* um imóvel?',
      [
        { id: 'interest_buy', title: 'Comprar 🏠' },
        { id: 'interest_rent', title: 'Alugar 🔑' },
      ],
    )
    return { step: 'ASK_NAME' as const }
  },

  ASK_NAME: async (to: string) => {
    await whatsappService.sendText(to, 'Qual é o seu nome? 😊')
    return {}
  },

  ASK_BUDGET: async (to: string, interest: string) => {
    const label = interest === 'buy' ? 'compra' : 'aluguel'
    await whatsappService.sendText(
      to,
      `Qual é o seu orçamento para ${label}? (Ex: R$ 300.000 ou R$ 2.000/mês)`,
    )
    return {}
  },

  ASK_PROPERTY: async (to: string) => {
    await whatsappService.sendText(
      to,
      'Que tipo de imóvel você procura? Localização preferida? 📍',
    )
    return {}
  },

  DONE: async (to: string, name: string) => {
    await whatsappService.sendText(
      to,
      `Obrigado, ${name}! 🙌 Um de nossos corretores vai entrar em contato em breve. Enquanto isso, pode explorar nossos imóveis disponíveis no site.`,
    )
    return { step: 'DONE' as const }
  },
}

export type { BotState }
