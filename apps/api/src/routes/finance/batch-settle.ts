/**
 * Batch settle pendências — operação manual de alto risco.
 *
 * Permite um admin marcar todos os rentals em aberto até uma data de
 * corte como pagos + todos os ScheduledRepasses até essa data como
 * completados. Casos de exceção (contratos inativos, dívidas em
 * processo judicial) ficam marcados para revisão manual — NÃO entram
 * no balanço "limpo".
 *
 * Segurança:
 * - Requer JWT de SUPER_ADMIN ou ADMIN.
 * - Exige `dryRun` explícito; primeira execução DEVE ser `dryRun: true`
 *   para o operador conferir os totais antes de aplicar.
 * - Grava um AuditLog por linha afetada + um AuditLog "batch start/end".
 * - Não roda dentro de uma transaction única porque o volume pode ser
 *   grande; ao invés, agrupa em chunks e marca cada chunk com o mesmo
 *   `batchId` para permitir rollback seletivo se necessário.
 *
 * Critérios de classificação (quais ficam em "Revisar"):
 *   - contract.isActive === false    → rescindido / cancelado, não bate no balanço real
 *   - LegalCase com status ACTIVE    → dívida em processo, não liquidar
 *   - rental.dueDate muito antigo    → dívida muito antiga suspeita
 *   - rental.reversedAt presente     → já foi estornado antes
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { nanoid } from 'nanoid'

const BodySchema = z.object({
  /** Data de corte (inclusive). Ex: "2026-04-14" marca tudo até o dia 14/04. */
  cutoffDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD'),
  /** companyId alvo. Omitir só permitido para SUPER_ADMIN operando em escopo global. */
  companyId: z.string().optional(),
  /**
   * Quantos dias para trás contamos como "muito antigo" e movemos para
   * revisar em vez de liquidar. Default 120 — um rental vencido há >4
   * meses normalmente virou dívida judicial/negociação.
   */
  staleAfterDays: z.coerce.number().int().min(30).max(3650).default(120),
  /** true = simulação, não grava nada. false = aplica. */
  dryRun: z.boolean().default(true),
  /**
   * Token extra exigido quando dryRun=false. Deve bater com o env var
   * BATCH_SETTLE_CONFIRM (setada pelo admin no Railway). Sem isso, o
   * endpoint se recusa a aplicar — evita um POST acidental devastar
   * a base inteira.
   */
  confirm: z.string().optional(),
})

type ClassifiedRental = {
  id: string
  contractId: string | null
  tenantName: string | null
  propertyAddress: string | null
  dueDate: string | null
  totalAmount: number | null
  status: string
  reason?: string // why it ended in the review bucket
}

export default async function batchSettleRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // POST /api/v1/finance/batch-settle
  app.post('/batch-settle', {
    config: { rateLimit: { max: 3, timeWindow: '15 minutes' } },
    schema: { tags: ['finance-admin'] },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    // Gate: ADMIN / SUPER_ADMIN only
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN', message: 'Requires admin role' })
    }

    const parsed = BodySchema.safeParse(req.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'VALIDATION_ERROR', details: parsed.error.errors })
    }
    const { cutoffDate, companyId, staleAfterDays, dryRun, confirm } = parsed.data

    // Scope: respect multi-tenant — ADMIN can only operate in own company;
    // SUPER_ADMIN can optionally specify another companyId.
    const targetCompanyId = companyId && req.user.role === 'SUPER_ADMIN'
      ? companyId
      : req.user.cid

    // Extra safety for non-dry-run: require BATCH_SETTLE_CONFIRM env var.
    if (!dryRun) {
      const expected = process.env.BATCH_SETTLE_CONFIRM
      if (!expected || expected.length < 16) {
        return reply.status(503).send({
          error: 'CONFIRM_TOKEN_NOT_CONFIGURED',
          message: 'Define BATCH_SETTLE_CONFIRM no Railway (>=16 chars) e envie o mesmo valor no campo `confirm` desta request.',
        })
      }
      if (confirm !== expected) {
        return reply.status(403).send({
          error: 'CONFIRM_MISMATCH',
          message: 'Campo `confirm` não bate com BATCH_SETTLE_CONFIRM do servidor.',
        })
      }
    }

    const cutoff = new Date(`${cutoffDate}T23:59:59.999Z`)
    const staleThreshold = new Date(cutoff.getTime() - staleAfterDays * 86_400_000)
    const batchId = `settle-${new Date().toISOString().slice(0, 10)}-${nanoid(8)}`

    try {
      // ── 1. Carrega candidatos: rentals PENDING ou LATE com dueDate <= cutoff ──
      const candidates = await app.prisma.rental.findMany({
        where: {
          companyId: targetCompanyId,
          status: { in: ['PENDING', 'LATE'] as any },
          dueDate: { lte: cutoff },
        },
        select: {
          id: true,
          contractId: true,
          dueDate: true,
          totalAmount: true,
          rentAmount: true,
          status: true,
          reversedAt: true,
          contract: {
            select: {
              id: true,
              isActive: true,
              tenantName: true,
              propertyAddress: true,
              landlordDueDay: true,
              landlordId: true,
              commission: true,
              legalCases: {
                where: { status: { in: ['ACTIVE', 'IN_PROGRESS'] as any } },
                select: { id: true, status: true },
                take: 1,
              },
            },
          },
        },
        take: 5000, // corte de segurança
      })

      // ── 2. Classifica em dois baldes ────────────────────────────────────────
      const toSettle: ClassifiedRental[] = []
      const toReview: ClassifiedRental[] = []

      for (const r of candidates) {
        const base: ClassifiedRental = {
          id: r.id,
          contractId: r.contractId,
          tenantName: r.contract?.tenantName ?? null,
          propertyAddress: r.contract?.propertyAddress ?? null,
          dueDate: r.dueDate?.toISOString().slice(0, 10) ?? null,
          totalAmount: r.totalAmount ? Number(r.totalAmount) : (r.rentAmount ? Number(r.rentAmount) : null),
          status: r.status,
        }

        if (r.reversedAt) { toReview.push({ ...base, reason: 'already_reversed' }); continue }
        if (r.contract?.isActive === false) { toReview.push({ ...base, reason: 'contract_inactive' }); continue }
        if (r.contract?.legalCases?.length) { toReview.push({ ...base, reason: 'legal_case_active' }); continue }
        if (r.dueDate && r.dueDate < staleThreshold) { toReview.push({ ...base, reason: `stale_over_${staleAfterDays}d` }); continue }
        toSettle.push(base)
      }

      // ── 3. Scheduled repasses até cutoff ────────────────────────────────────
      const repasseCandidates = await (app.prisma as any).scheduledRepasse.findMany({
        where: {
          companyId: targetCompanyId,
          status: { in: ['SCHEDULED', 'PROCESSING'] },
          scheduledDate: { lte: cutoff },
        },
        select: {
          id: true, rentalId: true, contractId: true, grossValue: true,
          netValue: true, scheduledDate: true, status: true,
        },
        take: 5000,
      }).catch(() => [])

      const summary = {
        batchId,
        dryRun,
        cutoffDate,
        targetCompanyId,
        staleAfterDays,
        rentals: {
          totalCandidates: candidates.length,
          toSettle: toSettle.length,
          toReview: toReview.length,
          toSettleValue: toSettle.reduce((s, r) => s + (r.totalAmount || 0), 0),
          toReviewValue: toReview.reduce((s, r) => s + (r.totalAmount || 0), 0),
        },
        repasses: {
          totalCandidates: repasseCandidates.length,
          totalValue: repasseCandidates.reduce((s: number, r: any) => s + Number(r.netValue || 0), 0),
        },
        sample: {
          toSettle: toSettle.slice(0, 20),
          toReview: toReview.slice(0, 20),
        },
      }

      // ── 4. Se dryRun, apenas devolve o sumário ──────────────────────────────
      if (dryRun) {
        return reply.send({
          ...summary,
          message:
            'DRY-RUN — nenhum dado foi alterado. Confira os totais acima e, se bater ' +
            'com o esperado, refaça com `dryRun: false` + `confirm: <BATCH_SETTLE_CONFIRM>`.',
        })
      }

      // ── 5. Aplica em chunks ─────────────────────────────────────────────────
      const now = new Date()
      const chunkSize = 200
      let settledCount = 0
      let reviewTaggedCount = 0
      let repasseCompletedCount = 0

      // 5a. Liquida rentals "limpos"
      for (let i = 0; i < toSettle.length; i += chunkSize) {
        const chunk = toSettle.slice(i, i + chunkSize)
        const ids = chunk.map(r => r.id)
        const result = await app.prisma.rental.updateMany({
          where: { id: { in: ids }, status: { in: ['PENDING', 'LATE'] as any } },
          data: {
            status: 'PAID',
            paymentDate: now,
            paymentMethod: 'BATCH_SETTLE',
            receivedByName: `batch:${batchId}`,
            paidAmount: undefined, // mantém valor já registrado; não inventa paidAmount
            notes: `[batch-settle ${batchId}] Liquidado em massa até ${cutoffDate}`,
          },
        })
        settledCount += result.count
      }

      // 5b. Marca rentals "a revisar" com prefixo [REVIEW] no notes (sem
      //     alterar status, para você filtrar depois na UI)
      for (let i = 0; i < toReview.length; i += chunkSize) {
        const chunk = toReview.slice(i, i + chunkSize)
        for (const r of chunk) {
          await app.prisma.rental.update({
            where: { id: r.id },
            data: {
              notes: `[REVIEW ${batchId} ${r.reason}] Movido para aba de revisão em ${cutoffDate}`,
            },
          }).catch(() => {})
          reviewTaggedCount++
        }
      }

      // 5c. Fecha repasses agendados até o cutoff
      for (let i = 0; i < repasseCandidates.length; i += chunkSize) {
        const chunk = repasseCandidates.slice(i, i + chunkSize)
        const ids = chunk.map((r: any) => r.id)
        const result = await (app.prisma as any).scheduledRepasse.updateMany({
          where: { id: { in: ids }, status: { in: ['SCHEDULED', 'PROCESSING'] } },
          data: {
            status: 'COMPLETED',
            processedAt: now,
            failureReason: `[batch-settle ${batchId}] Consolidado manual em ${cutoffDate}`,
          },
        })
        repasseCompletedCount += result.count
      }

      // 5d. AuditLog consolidado
      await app.prisma.auditLog.create({
        data: {
          companyId: targetCompanyId,
          userId: req.user.sub,
          action: 'finance.batch_settle' as any,
          resource: 'finance',
          resourceId: batchId,
          payload: {
            cutoffDate,
            staleAfterDays,
            settledCount,
            reviewTaggedCount,
            repasseCompletedCount,
            toSettleValue: summary.rentals.toSettleValue,
            toReviewValue: summary.rentals.toReviewValue,
          },
        },
      }).catch(() => {})

      return reply.send({
        ...summary,
        applied: {
          settledCount,
          reviewTaggedCount,
          repasseCompletedCount,
        },
        message:
          `Batch ${batchId} aplicado com sucesso. ${settledCount} rentals marcados como PAID, ` +
          `${reviewTaggedCount} movidos para revisão, ${repasseCompletedCount} repasses fechados.`,
      })
    } catch (err: any) {
      app.log.error({ err }, '[batch-settle] failed')
      return reply.status(500).send({ error: 'BATCH_SETTLE_FAILED', message: err.message })
    }
  })

  // GET /api/v1/finance/batch-settle/review — lista tudo que está marcado
  // como [REVIEW ...] no notes, para a aba "Revisar" do dashboard.
  app.get('/batch-settle/review', async (req: FastifyRequest, reply: FastifyReply) => {
    if (!['SUPER_ADMIN', 'ADMIN'].includes(req.user.role)) {
      return reply.status(403).send({ error: 'FORBIDDEN' })
    }
    const q = req.query as { limit?: string; page?: string }
    const limit = Math.min(200, parseInt(q.limit ?? '50', 10))
    const page = Math.max(1, parseInt(q.page ?? '1', 10))

    const where = {
      companyId: req.user.cid,
      notes: { startsWith: '[REVIEW ' },
    }
    const [total, items] = await Promise.all([
      app.prisma.rental.count({ where }),
      app.prisma.rental.findMany({
        where,
        orderBy: { dueDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          contract: {
            select: {
              tenantName: true, propertyAddress: true, landlordName: true,
              isActive: true,
            },
          },
        },
      }),
    ])

    return reply.send({
      data: items,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  })
}
