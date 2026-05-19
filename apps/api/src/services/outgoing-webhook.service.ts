/**
 * Outgoing Webhooks — entrega de eventos a sistemas parceiros.
 *
 * `dispatchWebhooks(...)` envia um POST assinado (HMAC-SHA256 do corpo) para
 * cada webhook ativo da empresa inscrito no evento. Fail-soft: nunca lança;
 * os chamadores devem usar `void dispatchWebhooks(...)` (não-bloqueante).
 */

import type { PrismaClient } from '@prisma/client'
import { createHmac } from 'node:crypto'

export type WebhookEvent = 'lead.created' | 'property.created' | 'deal.payment_received'

export const WEBHOOK_EVENTS: WebhookEvent[] = ['lead.created', 'property.created', 'deal.payment_received']

export async function dispatchWebhooks(
  prisma: PrismaClient,
  companyId: string,
  event: WebhookEvent,
  data: Record<string, unknown>,
): Promise<void> {
  const hooks = await prisma.outgoingWebhook
    .findMany({ where: { companyId, isActive: true, events: { has: event } } })
    .catch(() => [])
  if (!hooks.length) return

  const body = JSON.stringify({ event, data, sentAt: new Date().toISOString() })

  for (const hook of hooks) {
    // Assinatura HMAC do corpo — o parceiro valida com o segredo do webhook.
    const signature = createHmac('sha256', hook.secret).update(body).digest('hex')
    try {
      const res = await fetch(hook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-agoraencontrei-event': event,
          'x-agoraencontrei-signature': `sha256=${signature}`,
        },
        body,
        signal: AbortSignal.timeout(8000),
      })
      await prisma.outgoingWebhook.update({
        where: { id: hook.id },
        data: res.ok ? { lastFiredAt: new Date(), failCount: 0 } : { failCount: { increment: 1 } },
      }).catch(() => {})
    } catch {
      await prisma.outgoingWebhook
        .update({ where: { id: hook.id }, data: { failCount: { increment: 1 } } })
        .catch(() => {})
    }
  }
}
