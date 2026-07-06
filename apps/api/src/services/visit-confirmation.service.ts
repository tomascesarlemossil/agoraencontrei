/**
 * Confirmação automática de visita ao CLIENTE via WhatsApp Cloud API.
 *
 * DESLIGADO POR PADRÃO. Só envia quando `VISIT_CLIENT_WHATSAPP_AUTO=true` e as
 * credenciais do WhatsApp estão configuradas. Chamado no momento do agendamento
 * (rota pública de visitas), de forma best-effort — nunca lança.
 *
 * ⚠️ Janela de 24h do Meta: uma mensagem iniciada pela empresa para um cliente
 * que NÃO te escreveu nas últimas 24h só é entregue via TEMPLATE pré-aprovado.
 * O cliente agenda pelo site (sem abrir conversa), então o caminho correto em
 * produção é `VISIT_CONFIRMATION_TEMPLATE_NAME` apontando para um template
 * aprovado no Meta Business Manager com 3 variáveis no corpo:
 *   {{1}} = nome do cliente, {{2}} = título do imóvel, {{3}} = data/hora.
 *
 * Sem template configurado, cai para texto livre (útil só em teste/dev, dentro
 * da janela de 24h) para não travar o fluxo.
 */

import { env } from '../utils/env.js'

export interface VisitConfirmationInput {
  visitorName: string
  visitorPhone: string
  propertyTitle: string
  scheduledAt: Date
}

/** Normaliza telefone BR para o formato da Cloud API (dígitos + DDI 55). */
function normalizeBrPhone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('55') && digits.length >= 12) return digits
  return `55${digits}`
}

/** Ex.: "sábado, 18/07 às 10:30". */
function formatDateLabel(d: Date): string {
  const day = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${day} às ${time}`
}

/** Texto livre de fallback (só entregue dentro da janela de 24h). */
function confirmationText(i: VisitConfirmationInput): string {
  const first = (i.visitorName || '').trim().split(/\s+/)[0] || 'tudo bem'
  return [
    `Olá ${first}! 👋`,
    ``,
    `Recebemos seu agendamento de visita:`,
    ``,
    `🏡 ${i.propertyTitle}`,
    `📅 ${formatDateLabel(i.scheduledAt)}`,
    ``,
    `Em breve confirmamos os detalhes com você. Qualquer coisa, é só responder por aqui. 😊`,
  ].join('\n')
}

/**
 * Envia a confirmação ao cliente se o recurso estiver ativado.
 * Retorna 'disabled' | 'skipped' | 'sent' | 'failed'. Nunca lança.
 */
export async function maybeSendVisitConfirmation(
  input: VisitConfirmationInput,
): Promise<'disabled' | 'skipped' | 'sent' | 'failed'> {
  // Trava mestra: desligado por padrão.
  if (!env.VISIT_CLIENT_WHATSAPP_AUTO) return 'disabled'
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_ID) return 'skipped'

  const to = normalizeBrPhone(input.visitorPhone)
  if (!to) return 'skipped'

  try {
    const { whatsappService } = await import('./whatsapp.service.js')

    if (env.VISIT_CONFIRMATION_TEMPLATE_NAME) {
      // Caminho de produção: template aprovado no Meta.
      await whatsappService.sendTemplate(
        to,
        env.VISIT_CONFIRMATION_TEMPLATE_NAME,
        env.VISIT_CONFIRMATION_TEMPLATE_LANG,
        [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: input.visitorName || 'Cliente' },
              { type: 'text', text: input.propertyTitle || 'o imóvel' },
              { type: 'text', text: formatDateLabel(input.scheduledAt) },
            ],
          },
        ],
      )
    } else {
      // Fallback texto livre (só entrega dentro da janela de 24h).
      await whatsappService.sendText(to, confirmationText(input))
    }
    return 'sent'
  } catch {
    return 'failed'
  }
}
