/**
 * Billing Automation Routes — Gestão de cobranças e régua de cobrança
 *
 * GET  /api/v1/billing/summary           — Resumo de cobranças do mês
 * POST /api/v1/billing/generate-charges  — Gera cobranças do mês no Asaas
 * POST /api/v1/billing/process-rules     — Processa régua de cobrança (notificações)
 * GET  /api/v1/billing/collection-rules  — Lista regras de cobrança
 * POST /api/v1/billing/calculate-repasse — Calcula repasse para proprietário
 */

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import {
  createRentalCharge,
  processCollectionRules,
  getCollectionSummary,
  calculateOwnerRepasse,
  DEFAULT_COLLECTION_RULES,
} from '../../services/billing-automation.service.js'
import { createAuditLog } from '../../services/audit.service.js'

export default async function billingRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authenticate)

  // GET /summary — Resumo de cobranças
  app.get('/summary', {
    schema: { tags: ['billing'], summary: 'Collection summary for the month' },
  }, async (req, reply) => {
    const q = req.query as any
    const month = q.month ? parseInt(q.month, 10) : undefined
    const year = q.year ? parseInt(q.year, 10) : undefined

    const summary = await getCollectionSummary(app.prisma, req.user.cid, month, year)

    return reply.send({ success: true, data: summary })
  })

  // POST /generate-charges — Gera cobranças do mês no Asaas
  app.post('/generate-charges', {
    schema: { tags: ['billing'], summary: 'Generate monthly charges in Asaas' },
  }, async (req, reply) => {
    const body = z.object({
      month: z.number().min(1).max(12),
      year: z.number().min(2024),
      contractIds: z.array(z.string()).optional(),  // Se vazio, gera para todos
    }).parse(req.body)

    const cid = req.user.cid

    // Get contracts to bill
    const where: any = {
      companyId: cid,
      status: 'ACTIVE',
    }
    if (body.contractIds?.length) {
      where.id = { in: body.contractIds }
    }

    const contracts = await app.prisma.contract.findMany({
      where,
      include: {
        tenant: {
          select: { name: true, document: true, email: true, phoneMobile: true },
        },
      },
    })

    const results = []
    let successCount = 0
    let errorCount = 0

    for (const contract of contracts) {
      if (!contract.tenant?.document || !contract.rentValue) {
        results.push({
          contractId: contract.id,
          success: false,
          error: 'Inquilino sem CPF/CNPJ ou contrato sem valor de aluguel',
        })
        errorCount++
        continue
      }

      // Check if rental already exists for this month
      const existingRental = await app.prisma.rental.findFirst({
        where: {
          contractId: contract.id,
          competenceMonth: body.month,
          competenceYear: body.year,
        },
      })

      if (existingRental) {
        results.push({
          contractId: contract.id,
          rentalId: existingRental.id,
          success: true,
          skipped: true,
          message: 'Cobrança já existe para este mês',
        })
        continue
      }

      try {
        // Calculate due date based on tenant's due day
        const dueDay = contract.tenantDueDay || 10
        const dueDate = new Date(body.year, body.month - 1, dueDay)
        const dueDateStr = dueDate.toISOString().split('T')[0]

        const amount = Number(contract.rentValue)

        // Create charge in Asaas
        const charge = await createRentalCharge({
          tenantName: contract.tenant.name,
          tenantCpf: contract.tenant.document,
          tenantEmail: contract.tenant.email || undefined,
          tenantPhone: contract.tenant.phoneMobile || undefined,
          propertyAddress: contract.propertyAddress || 'Imóvel',
          amount,
          dueDate: dueDateStr,
          contractId: contract.id,
          rentalId: '', // Will be updated below
        })

        // Create rental record
        const rental = await app.prisma.rental.create({
          data: {
            companyId: cid,
            contractId: contract.id,
            dueDate,
            rentAmount: amount,
            totalAmount: amount,
            status: 'PENDING',
            competenceMonth: body.month,
            competenceYear: body.year,
            boletoId: charge.id,
            boletoUrl: charge.bankSlipUrl || charge.invoiceUrl,
            boletoPixCode: charge.pixCode,
          },
        })

        results.push({
          contractId: contract.id,
          rentalId: rental.id,
          asaasId: charge.id,
          success: true,
          boletoUrl: charge.bankSlipUrl || charge.invoiceUrl,
          pixCode: charge.pixCode,
        })
        successCount++
      } catch (error: any) {
        results.push({
          contractId: contract.id,
          success: false,
          error: error.message,
        })
        errorCount++
      }
    }

    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'finance.create' as any,
      resource: 'billing',
      resourceId: `${body.year}-${body.month}`,
      meta: { type: 'billing.charges_generated', month: body.month, year: body.year, successCount, errorCount },
    })

    return reply.send({
      success: true,
      data: {
        total: contracts.length,
        successCount,
        errorCount,
        results,
      },
    })
  })

  // POST /process-rules — Processa régua de cobrança (envia notificações)
  app.post('/process-rules', {
    schema: { tags: ['billing'], summary: 'Process collection rules (send notifications)' },
  }, async (req, reply) => {
    const result = await processCollectionRules(app.prisma, req.user.cid)

    await createAuditLog({
      prisma: app.prisma as any, req,
      action: 'automation.run' as any,
      resource: 'billing',
      resourceId: 'rules',
      meta: { type: 'billing.rules_processed', ...result },
    })

    return reply.send({ success: true, data: result })
  })

  // GET /collection-rules — Lista regras de cobrança configuradas
  app.get('/collection-rules', {
    schema: { tags: ['billing'], summary: 'List collection rules' },
  }, async (_req, reply) => {
    return reply.send({
      success: true,
      data: DEFAULT_COLLECTION_RULES.map(rule => ({
        ...rule,
        label: rule.daysOffset < 0
          ? `${Math.abs(rule.daysOffset)} dias antes do vencimento`
          : rule.daysOffset === 0
            ? 'No dia do vencimento'
            : `${rule.daysOffset} dias após o vencimento`,
      })),
    })
  })

  // POST /calculate-repasse — Calcula repasse para proprietário
  app.post('/calculate-repasse', {
    schema: { tags: ['billing'], summary: 'Calculate owner repasse' },
  }, async (req, reply) => {
    const body = z.object({
      totalPaid: z.number().positive(),
      commissionPercent: z.number().min(0).max(100),
      adminFeePercent: z.number().min(0).max(100).optional(),
    }).parse(req.body)

    const result = calculateOwnerRepasse(
      body.totalPaid,
      body.commissionPercent,
      body.adminFeePercent,
    )

    return reply.send({ success: true, data: result })
  })
}
