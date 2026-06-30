/**
 * Rescission Routes — Motor de rescisão de locação
 *
 *   POST /api/v1/rescission/preview            — calcula o acerto (sem salvar)
 *   POST /api/v1/rescission/contracts/:id      — calcula e PERSISTE o acerto
 *   GET  /api/v1/rescission/contracts/:id       — lista rescisões do contrato
 *   POST /api/v1/rescission/:id/confirm         — confirma a rescisão
 *
 * O cálculo usa `calculateRescission` (serviço puro). Quando vinculado a um
 * contrato, os valores faltantes (aluguel, datas) são puxados do contrato.
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { calculateRescission, type RescissionInput } from '../../services/rescission.service.js'

const inputSchema = z.object({
  monthlyRent: z.number().positive().optional(),
  exitDate: z.string(),
  contractStart: z.string().optional(),
  contractEnd: z.string().optional(),
  monthlyIptu: z.number().min(0).optional(),
  penaltyBaseValue: z.number().min(0).optional(),
  penaltyProportional: z.boolean().optional(),
  outstandingValue: z.number().min(0).optional(),
  bonusValue: z.number().min(0).optional(),
  depositHeld: z.number().min(0).optional(),
})

export default async function rescissionRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)
  const db = () => app.prisma as any

  /** Monta o input do cálculo a partir do body + (opcional) dados do contrato. */
  async function buildInput(
    companyId: string,
    body: z.infer<typeof inputSchema>,
    contractId?: string,
  ): Promise<RescissionInput | { error: string }> {
    let contract: any = null
    if (contractId) {
      contract = await app.prisma.contract.findFirst({
        where: { id: contractId, companyId },
        select: { rentValue: true, startDate: true, endDate: true, duration: true, penalty: true },
      })
      if (!contract) return { error: 'CONTRACT_NOT_FOUND' }
    }

    const monthlyRent = body.monthlyRent ?? (contract?.rentValue != null ? Number(contract.rentValue) : undefined)
    const contractStartStr = body.contractStart ?? (contract?.startDate ? contract.startDate.toISOString() : undefined)
    let contractEndStr = body.contractEnd ?? (contract?.endDate ? contract.endDate.toISOString() : undefined)

    // Se não houver término explícito mas houver início + duração (meses), calcula.
    if (!contractEndStr && contractStartStr && contract?.duration) {
      const s = new Date(contractStartStr)
      const e = new Date(s.getFullYear(), s.getMonth() + Number(contract.duration), s.getDate())
      contractEndStr = e.toISOString()
    }

    if (monthlyRent == null || !contractStartStr || !contractEndStr) {
      return { error: 'MISSING_FIELDS: monthlyRent, contractStart e contractEnd são obrigatórios (informe no body ou via contrato).' }
    }

    return {
      monthlyRent,
      exitDate: new Date(body.exitDate),
      contractStart: new Date(contractStartStr),
      contractEnd: new Date(contractEndStr),
      monthlyIptu: body.monthlyIptu,
      penaltyBaseValue: body.penaltyBaseValue,
      penaltyProportional: body.penaltyProportional,
      outstandingValue: body.outstandingValue,
      bonusValue: body.bonusValue,
      depositHeld: body.depositHeld,
    }
  }

  // POST /preview — calcula sem persistir
  app.post('/preview', {
    schema: { tags: ['rescission'], summary: 'Preview rescission settlement (no save)' },
  }, async (req, reply) => {
    const body = inputSchema.parse(req.body)
    const input = await buildInput(req.user.cid, body)
    if ('error' in input) return reply.status(400).send({ error: input.error })
    return reply.send({ success: true, data: calculateRescission(input) })
  })

  // POST /contracts/:contractId — calcula e persiste
  app.post('/contracts/:contractId', {
    schema: { tags: ['rescission'], summary: 'Calculate and persist rescission for a contract' },
  }, async (req, reply) => {
    const { contractId } = req.params as { contractId: string }
    const body = inputSchema.parse(req.body)
    const input = await buildInput(req.user.cid, body, contractId)
    if ('error' in input) {
      const code = input.error === 'CONTRACT_NOT_FOUND' ? 404 : 400
      return reply.status(code).send({ error: input.error })
    }

    const result = calculateRescission(input)
    const created = await db().rescission.create({
      data: {
        companyId: req.user.cid,
        contractId,
        exitDate: new Date(result.exitDate),
        proRataRent: result.items.find((i) => i.key === 'proRataRent')?.value ?? 0,
        proRataIptu: result.items.find((i) => i.key === 'proRataIptu')?.value ?? 0,
        penaltyValue: result.items.find((i) => i.key === 'penalty')?.value ?? 0,
        outstandingValue: result.items.find((i) => i.key === 'outstanding')?.value ?? 0,
        bonusValue: result.items.find((i) => i.key === 'bonus')?.value ?? 0,
        depositRefund: result.items.find((i) => i.key === 'deposit')?.value ?? 0,
        totalDebits: result.totalDebits,
        totalCredits: result.totalCredits,
        netResult: result.netResult,
        settlement: result.settlement,
        status: 'DRAFT',
        items: result.items as any,
        notes: (req.body as any)?.notes ?? null,
        createdBy: req.user.sub ?? null,
      },
    })
    return reply.status(201).send({ success: true, data: { rescission: created, calculation: result } })
  })

  // GET /contracts/:contractId — lista rescisões do contrato
  app.get('/contracts/:contractId', {
    schema: { tags: ['rescission'], summary: 'List rescissions of a contract' },
  }, async (req, reply) => {
    const { contractId } = req.params as { contractId: string }
    const rows = await db().rescission.findMany({
      where: { contractId, companyId: req.user.cid },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send({ success: true, data: rows })
  })

  // POST /:id/confirm — confirma a rescisão
  app.post('/:id/confirm', {
    schema: { tags: ['rescission'], summary: 'Confirm a rescission' },
  }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const existing = await db().rescission.findFirst({ where: { id, companyId: req.user.cid } })
    if (!existing) return reply.status(404).send({ error: 'NOT_FOUND' })
    const updated = await db().rescission.update({ where: { id }, data: { status: 'CONFIRMED' } })
    return reply.send({ success: true, data: updated })
  })
}
