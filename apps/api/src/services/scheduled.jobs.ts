/**
 * Scheduled Jobs — emits automation triggers based on time-based conditions
 * Runs every 30 minutes via setInterval (wired in automation.ts plugin)
 */

import type { FastifyInstance } from 'fastify'
import { emitAutomation } from './automation.emitter.js'

export async function runScheduledJobs(app: FastifyInstance) {
  const now = new Date()

  // ── 1. boleto_vencendo: rentals que vencem em ≤ 3 dias e ainda PENDING ───
  try {
    const dueInThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    const boletosVencendo = await app.prisma.rental.findMany({
      where: {
        status: 'PENDING',
        dueDate: { gte: now, lte: dueInThreeDays },
      },
      include: {
        contract: {
          select: {
            companyId: true,
            tenantName: true,
            propertyAddress: true,
            landlordName: true,
          },
        },
      },
    })

    for (const boleto of boletosVencendo) {
      const cid = boleto.contract?.companyId ?? boleto.companyId
      emitAutomation({
        companyId: cid,
        event: 'boleto_vencendo',
        data: {
          rentalId:        boleto.id,
          contractId:      boleto.contractId ?? '',
          tenantName:      boleto.contract?.tenantName ?? '',
          propertyAddress: boleto.contract?.propertyAddress ?? '',
          amount:          boleto.rentAmount?.toString() ?? '0',
          dueDate:         boleto.dueDate?.toISOString() ?? '',
          daysUntilDue:    boleto.dueDate
            ? Math.ceil((boleto.dueDate.getTime() - now.getTime()) / 86_400_000)
            : 0,
        },
      })
    }

    if (boletosVencendo.length > 0) {
      app.log.info(`[scheduled] boleto_vencendo: emitted ${boletosVencendo.length} events`)
    }
  } catch (err) {
    app.log.error({ err }, '[scheduled] boleto_vencendo failed')
  }

  // ── 2. lead_sem_resposta_48h: leads NEW/CONTACTED sem atividade em 48h ───
  try {
    const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000)
    const staleLeads = await app.prisma.lead.findMany({
      where: {
        status: { in: ['NEW', 'CONTACTED'] },
        updatedAt: { lt: cutoff48h },
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    })

    for (const lead of staleLeads) {
      emitAutomation({
        companyId: lead.companyId,
        event: 'lead_sem_resposta_48h',
        data: {
          leadId:         lead.id,
          leadName:       lead.name,
          leadEmail:      lead.email ?? '',
          leadPhone:      lead.phone ?? '',
          status:         lead.status,
          assignedToId:   lead.assignedToId ?? '',
          assignedToName: lead.assignedTo?.name ?? '',
          lastActivity:   lead.updatedAt.toISOString(),
          hoursIdle:      Math.floor((now.getTime() - lead.updatedAt.getTime()) / 3_600_000),
        },
      })
    }

    if (staleLeads.length > 0) {
      app.log.info(`[scheduled] lead_sem_resposta_48h: emitted ${staleLeads.length} events`)
    }
  } catch (err) {
    app.log.error({ err }, '[scheduled] lead_sem_resposta_48h failed')
  }

  // ── 3. visita_agendada: atividades tipo 'visit' marcadas para as próximas 2h ─
  try {
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    const visits = await app.prisma.activity.findMany({
      where: {
        type: 'visit',
        scheduledAt: { gte: now, lte: twoHoursFromNow },
      },
      include: {
        lead:     { select: { id: true, name: true, phone: true } },
        user:     { select: { id: true, name: true } },
      },
    })

    for (const visit of visits) {
      emitAutomation({
        companyId: visit.companyId,
        event: 'visita_agendada',
        data: {
          activityId: visit.id,
          leadId:     visit.leadId ?? '',
          leadName:   visit.lead?.name ?? '',
          leadPhone:  visit.lead?.phone ?? '',
          brokerId:   visit.userId ?? '',
          brokerName: visit.user?.name ?? '',
          scheduledAt: visit.scheduledAt?.toISOString() ?? '',
          propertyId: visit.propertyId ?? '',
        },
      })
    }

    if (visits.length > 0) {
      app.log.info(`[scheduled] visita_agendada: emitted ${visits.length} events`)
    }
  } catch (err) {
    app.log.error({ err }, '[scheduled] visita_agendada failed')
  }

  // ── 4. contrato_vencendo_30d: contratos ativos cujo endDate calculado ≤ 30d ─
  // Contract.endDate = startDate + duration months
  try {
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    const activeContracts = await app.prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
        isActive: true,
        startDate: { not: null },
        duration:  { not: null, gt: 0 },
      },
      select: {
        id: true, companyId: true, tenantName: true, landlordName: true,
        propertyAddress: true, startDate: true, duration: true, rentValue: true,
      },
    })

    let emitted = 0
    for (const contract of activeContracts) {
      if (!contract.startDate || !contract.duration) continue
      const endDate = new Date(contract.startDate)
      endDate.setMonth(endDate.getMonth() + contract.duration)

      if (endDate >= now && endDate <= in30Days) {
        const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / 86_400_000)
        emitAutomation({
          companyId: contract.companyId,
          event: 'contrato_vencendo_30d',
          data: {
            contractId:      contract.id,
            tenantName:      contract.tenantName ?? '',
            landlordName:    contract.landlordName ?? '',
            propertyAddress: contract.propertyAddress ?? '',
            endDate:         endDate.toISOString(),
            daysLeft,
            rentValue:       contract.rentValue?.toString() ?? '0',
          },
        })
        emitted++
      }
    }

    if (emitted > 0) {
      app.log.info(`[scheduled] contrato_vencendo_30d: emitted ${emitted} events`)
    }
  } catch (err) {
    app.log.error({ err }, '[scheduled] contrato_vencendo_30d failed')
  }
}
