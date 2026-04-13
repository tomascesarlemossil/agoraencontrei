/**
 * Repasse Service — D+7 Custody / Scheduled Transfers
 *
 * Manages the financial escrow system where payments are held
 * for a configurable delay (default D+7) before being transferred
 * to property owners/landlords.
 *
 * Features:
 * - Schedule repasses with configurable delay (D+N days)
 * - Fixed day of month option (e.g., always on the 15th)
 * - SaaS commission split before repasse
 * - Batch processing of due repasses
 * - Asaas transfer integration
 */

import type { PrismaClient } from '@prisma/client'
import { getBalance, WALLET_ID } from './asaas.service.js'
import { env } from '../utils/env.js'

// ── Executor ────────────────────────────────────────────────────────────────
// scheduleRepasse pode ser chamado tanto standalone (PrismaClient) quanto
// dentro de um $transaction (TransactionClient). Tipamos como `any` para
// permitir ambos sem batalha de tipos — as chamadas reais usam `(exec as any)`
// porque o schema exige `scheduledRepasse`/`saasCommissionLog` que estão
// tipados dinamicamente em partes do projeto.
type PrismaExecutor = PrismaClient | any

// ── Types ───────────────────────────────────────────────────────────────────

export interface ScheduleRepasseInput {
  tenantId?: string
  companyId: string
  contractId?: string
  rentalId?: string
  landlordId: string
  grossValue: number
  commissionPercent?: number
  delayDays?: number
  fixedDay?: number
}

export interface RepasseSummary {
  total: number
  scheduled: number
  processing: number
  completed: number
  failed: number
  totalValue: number
  completedValue: number
  pendingValue: number
}

// ── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_DELAY_DAYS = 7
const ASAAS_BASE_URL = (env as any).ASAAS_BASE_URL ?? 'https://www.asaas.com/api/v3'
const ASAAS_API_KEY = (env as any).ASAAS_API_KEY ?? ''

// ── Core Functions ──────────────────────────────────────────────────────────

/**
 * Calculates the scheduled date for a repasse based on configuration.
 * - If fixedDay is set, uses the next occurrence of that day
 * - Otherwise, adds delayDays to current date
 */
function calculateScheduledDate(delayDays: number, fixedDay?: number): Date {
  if (fixedDay && fixedDay >= 1 && fixedDay <= 31) {
    const now = new Date()
    let targetDate = new Date(now.getFullYear(), now.getMonth(), fixedDay)

    // If the fixed day has already passed this month, schedule for next month
    if (targetDate <= now) {
      targetDate = new Date(now.getFullYear(), now.getMonth() + 1, fixedDay)
    }

    return targetDate
  }

  // Default: D+N days from now
  return new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000)
}

/**
 * Schedules a new repasse (escrow transfer).
 * Calculates commission split and net value for the landlord.
 *
 * O primeiro parâmetro aceita tanto `PrismaClient` quanto um
 * `TransactionClient` (passado de dentro de `prisma.$transaction`). Quando
 * chamado dentro de uma transação, QUALQUER falha aqui — inclusive no log
 * de comissão SaaS — reverte a transação inteira, garantindo que nenhum
 * pagamento seja marcado como PAID sem o repasse e o log financeiro
 * correspondentes.
 */
export async function scheduleRepasse(
  exec: PrismaExecutor,
  input: ScheduleRepasseInput,
): Promise<any> {
  const delayDays = input.delayDays ?? DEFAULT_DELAY_DAYS
  const commissionPercent = input.commissionPercent ?? 0
  const commissionValue = Math.round(input.grossValue * commissionPercent / 100 * 100) / 100
  const netValue = Math.round((input.grossValue - commissionValue) * 100) / 100
  const scheduledDate = calculateScheduledDate(delayDays, input.fixedDay)

  const repasse = await (exec as any).scheduledRepasse.create({
    data: {
      tenantId: input.tenantId || null,
      companyId: input.companyId,
      contractId: input.contractId || null,
      rentalId: input.rentalId || null,
      landlordId: input.landlordId,
      grossValue: input.grossValue,
      commissionValue,
      netValue,
      scheduledDate,
      status: 'SCHEDULED',
      metadata: {
        commissionPercent,
        delayDays,
        fixedDay: input.fixedDay || null,
      },
    },
  })

  // Se o tenant tiver split SaaS, registra a comissão da plataforma.
  // IMPORTANTE: não engolimos mais a falha. Comissão SaaS é obrigatória
  // para auditoria financeira; perder silenciosamente = perda real de receita.
  if (input.tenantId) {
    const tenant = await (exec as any).tenant.findUnique({
      where: { id: input.tenantId },
      select: { splitPercent: true },
    })

    if (tenant?.splitPercent && Number(tenant.splitPercent) > 0) {
      const platformCommission = Math.round(input.grossValue * Number(tenant.splitPercent) / 100 * 100) / 100
      await (exec as any).saasCommissionLog.create({
        data: {
          tenantId: input.tenantId,
          transactionId: repasse.id,
          originalValue: input.grossValue,
          splitPercent: tenant.splitPercent,
          commissionValue: platformCommission,
          tenantNetValue: input.grossValue - platformCommission,
          status: 'PENDING',
        },
      })
    }
  }

  return repasse
}

/**
 * Processes all due repasses (scheduled date has passed).
 * Attempts Asaas transfer for each, updating status accordingly.
 */
export async function processDueRepasses(
  prisma: PrismaClient,
): Promise<{ processed: number; succeeded: number; failed: number }> {
  const now = new Date()

  // Staleness sweep: se algum repasse ficou preso em PROCESSING por >15 min
  // (processo crashou entre a marcação PROCESSING e o resultado do
  // Asaas), rebaixa para SCHEDULED com pequeno atraso para retomar na
  // próxima rodada. Impede o deadlock "for-ever PROCESSING".
  const STALE_MS = 15 * 60 * 1000
  const staleCutoff = new Date(now.getTime() - STALE_MS)
  await (prisma as any).scheduledRepasse.updateMany({
    where: { status: 'PROCESSING', updatedAt: { lt: staleCutoff } },
    data: { status: 'SCHEDULED', scheduledDate: new Date(now.getTime() + 60_000) },
  }).catch(() => {
    /* best-effort — se a coluna updatedAt não existir, o sweep é no-op */
  })

  const dueRepasses = await (prisma as any).scheduledRepasse.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledDate: { lte: now },
    },
    orderBy: { scheduledDate: 'asc' },
    take: 100,
  })

  let succeeded = 0
  let failed = 0

  for (const repasse of dueRepasses) {
    // Mark as processing
    await (prisma as any).scheduledRepasse.update({
      where: { id: repasse.id },
      data: { status: 'PROCESSING' },
    })

    try {
      // Attempt Asaas transfer if API key is configured.
      // idempotencyKey = repasse.id garante que reenvios (worker reiniciado
      // entre request e resposta do Asaas, retry manual, race) NÃO resultem
      // em transferência duplicada — Asaas honra a mesma chave retornando
      // o recurso original em vez de criar novo.
      let asaasTransferId: string | null = null
      if (ASAAS_API_KEY) {
        const transferResult = await executeAsaasTransfer(
          repasse.netValue,
          repasse.landlordId,
          `Repasse ${repasse.id}`,
          repasse.id,
        )
        asaasTransferId = transferResult?.id || null
      }

      // Mark as completed
      await (prisma as any).scheduledRepasse.update({
        where: { id: repasse.id },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          asaasTransferId,
        },
      })

      // Also mark SaaS commission as processed. Falha aqui cai no catch
      // externo → repasse vai para FAILED, e saasCommissionLog fica PENDING
      // para reconciliação manual. Sem silent catch: nada de comissão
      // "fantasma" em COMPLETED sem evidência.
      if (repasse.tenantId) {
        await (prisma as any).saasCommissionLog.updateMany({
          where: { transactionId: repasse.id, status: 'PENDING' },
          data: { status: 'COMPLETED', processedAt: new Date() },
        })
      }

      succeeded++
    } catch (error: any) {
      await (prisma as any).scheduledRepasse.update({
        where: { id: repasse.id },
        data: {
          status: 'FAILED',
          failureReason: error.message || 'Transfer failed',
        },
      })
      failed++
    }
  }

  return { processed: dueRepasses.length, succeeded, failed }
}

/**
 * Gets repasse summary for a company or tenant.
 */
export async function getRepasseSummary(
  prisma: PrismaClient,
  filters: { companyId?: string; tenantId?: string },
): Promise<RepasseSummary> {
  const where: any = {}
  if (filters.companyId) where.companyId = filters.companyId
  if (filters.tenantId) where.tenantId = filters.tenantId

  const repasses = await (prisma as any).scheduledRepasse.findMany({
    where,
    select: { status: true, netValue: true },
  })

  const scheduled = repasses.filter((r: any) => r.status === 'SCHEDULED')
  const processing = repasses.filter((r: any) => r.status === 'PROCESSING')
  const completed = repasses.filter((r: any) => r.status === 'COMPLETED')
  const failedItems = repasses.filter((r: any) => r.status === 'FAILED')

  const sumValues = (items: any[]) => items.reduce((sum: number, r: any) => sum + Number(r.netValue || 0), 0)

  return {
    total: repasses.length,
    scheduled: scheduled.length,
    processing: processing.length,
    completed: completed.length,
    failed: failedItems.length,
    totalValue: sumValues(repasses),
    completedValue: sumValues(completed),
    pendingValue: sumValues(scheduled) + sumValues(processing),
  }
}

/**
 * Lists repasses with filtering and pagination.
 */
export async function listRepasses(
  prisma: PrismaClient,
  filters: {
    companyId?: string
    tenantId?: string
    status?: string
    landlordId?: string
    page?: number
    limit?: number
  },
): Promise<{ repasses: any[]; total: number }> {
  const where: any = {}
  if (filters.companyId) where.companyId = filters.companyId
  if (filters.tenantId) where.tenantId = filters.tenantId
  if (filters.status) where.status = filters.status
  if (filters.landlordId) where.landlordId = filters.landlordId

  const page = filters.page || 1
  const limit = filters.limit || 20

  const [repasses, total] = await Promise.all([
    (prisma as any).scheduledRepasse.findMany({
      where,
      orderBy: { scheduledDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    (prisma as any).scheduledRepasse.count({ where }),
  ])

  return { repasses, total }
}

/**
 * Retries a failed repasse.
 */
export async function retryRepasse(
  prisma: PrismaClient,
  repasseId: string,
): Promise<any> {
  return (prisma as any).scheduledRepasse.update({
    where: { id: repasseId },
    data: {
      status: 'SCHEDULED',
      failureReason: null,
      scheduledDate: new Date(Date.now() + 60 * 60 * 1000), // Retry in 1 hour
    },
  })
}

/**
 * Gets SaaS commission logs for a tenant.
 */
export async function getTenantCommissions(
  prisma: PrismaClient,
  tenantId: string,
): Promise<{ logs: any[]; totalCommission: number }> {
  const logs = await (prisma as any).saasCommissionLog.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const totalCommission = logs.reduce(
    (sum: number, l: any) => sum + Number(l.commissionValue || 0), 0,
  )

  return { logs, totalCommission }
}

// ── Asaas Transfer Helper ──────────────────────────────────────────────────

// Timeout defensivo para chamada externa Asaas. Sem isso, uma chamada
// pendurada travaria o drainer até o read-timeout default do Node (que
// é infinito em várias versões) — fazendo o worker não avançar para os
// próximos repasses da janela. 10s é folgado para uma PIX síncrona; se
// estourar, processDueRepasses marca o item como FAILED e segue.
const ASAAS_TRANSFER_TIMEOUT_MS = 10_000

/**
 * Executa transferência via Asaas API v3.
 *
 * idempotencyKey (opcional mas fortemente recomendado): chave estável passada
 * no header `idempotency-key` — Asaas usa isso para deduplificar requests
 * que chegam 2x (retry de rede, worker re-processando, crash entre request
 * e resposta). Sem isso, um retry-storm pode resultar em N transferências
 * reais para o mesmo repasse. Com isso, Asaas retorna o recurso original.
 *
 * Ref: https://docs.asaas.com/reference/idempotencia (header oficial).
 *
 * A chave deve ser:
 *   - Estável para a mesma operação lógica (usamos repasse.id — id interno imutável).
 *   - Única por operação distinta (repasses diferentes = chaves diferentes).
 *   - Com TTL aceitável na Asaas (padrão 24h é suficiente para nosso D+7).
 */
async function executeAsaasTransfer(
  value: number,
  walletId: string,
  description: string,
  idempotencyKey?: string,
): Promise<{ id: string } | null> {
  if (!ASAAS_API_KEY) return null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'access_token': ASAAS_API_KEY,
  }
  if (idempotencyKey) {
    // Prefixo evita colisão caso alguma outra parte do sistema use o mesmo id
    // bruto para outra operação Asaas (ex.: cobrança vs transferência).
    headers['idempotency-key'] = `repasse:${idempotencyKey}`
  }

  try {
    const res = await fetch(`${ASAAS_BASE_URL}/transfers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        value,
        walletId,
        operationType: 'PIX',
        description,
      }),
      signal: AbortSignal.timeout(ASAAS_TRANSFER_TIMEOUT_MS),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as any).errors?.[0]?.description || `Asaas transfer failed (HTTP ${res.status})`)
    }

    return res.json() as Promise<{ id: string }>
  } catch (error: any) {
    // AbortError vira mensagem explícita para aparecer nos logs/alertas.
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw new Error(`Asaas transfer timeout after ${ASAAS_TRANSFER_TIMEOUT_MS}ms`)
    }
    throw new Error(`Asaas transfer error: ${error.message}`)
  }
}
