/**
 * System Events — log central de eventos de domínio.
 *
 * Cada operação importante (lead criado, pagamento recebido, imóvel
 * publicado, etc.) grava um registro em `system_events`. Distinto de
 * AuditLog: AuditLog rastreia ações de usuário sobre recursos; SystemEvent
 * rastreia o que aconteceu no domínio — base para auditoria, replay e
 * automações futuras. Fail-soft: nunca lança.
 */

import type { PrismaClient } from '@prisma/client'

export type SystemEventType =
  | 'lead.created'
  | 'property.created'
  | 'deal.payment_received'
  | 'deal.proposal_accepted'
  | 'deal.contract_signed'
  | 'registry.completed'

export interface RecordEventInput {
  prisma: PrismaClient
  companyId?: string | null
  eventType: SystemEventType | string
  source?: string
  entityType?: string
  entityId?: string
  payload?: Record<string, unknown>
}

export async function recordEvent(input: RecordEventInput): Promise<void> {
  try {
    await input.prisma.systemEvent.create({
      data: {
        companyId: input.companyId ?? null,
        eventType: input.eventType,
        source: input.source ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        payload: (input.payload ?? {}) as object,
      },
    })
  } catch (err) {
    console.error('[system-event] failed to record:', (err as Error)?.message)
  }
}
