/**
 * Billing Automation Service — Régua de Cobrança Multicanal
 * Automatiza cobranças de aluguel com lembretes progressivos.
 *
 * Régua:
 * - D-5: Lembrete amigável via WhatsApp com boleto/PIX
 * - D-0: Notificação de vencimento
 * - D+1: Primeiro aviso de atraso
 * - D+3: Segundo aviso com renegociação
 * - D+7: Aviso formal
 * - D+15: Notificação de protesto/negativação
 * - D+30: Encaminhamento jurídico
 */

import { PrismaClient } from '@prisma/client'
import { createCharge, findOrCreateCustomer, getPixQrCode, type AsaasCharge } from './asaas.service.js'
import { env } from '../utils/env.js'

// ── Types ────────────────────────────────────────────────────────────────────

export interface BillingRuleStep {
  daysOffset: number          // Negativo = antes, positivo = depois do vencimento
  channel: 'whatsapp' | 'email' | 'sms' | 'push'
  templateKey: string
  isAutomated: boolean        // Dispara automaticamente ou precisa de aprovação
}

export interface CollectionSummary {
  totalPending: number
  totalOverdue: number
  totalReceived: number
  overdueAmount: number
  pendingAmount: number
  receivedAmount: number
  overduePercentage: number
  overdueByDays: {
    '1-5': number
    '6-15': number
    '16-30': number
    '30+': number
  }
}

export interface SplitConfig {
  landlordWalletId: string
  landlordPercentage: number    // e.g., 90
  agencyPercentage: number      // e.g., 10
}

// ── Default Collection Rules ────────────────────────────────────────────────

export const DEFAULT_COLLECTION_RULES: BillingRuleStep[] = [
  { daysOffset: -5, channel: 'whatsapp', templateKey: 'reminder_friendly', isAutomated: true },
  { daysOffset: 0,  channel: 'whatsapp', templateKey: 'due_today', isAutomated: true },
  { daysOffset: 1,  channel: 'whatsapp', templateKey: 'overdue_day1', isAutomated: true },
  { daysOffset: 3,  channel: 'whatsapp', templateKey: 'overdue_day3_renegotiation', isAutomated: true },
  { daysOffset: 7,  channel: 'email',    templateKey: 'overdue_formal_day7', isAutomated: true },
  { daysOffset: 15, channel: 'whatsapp', templateKey: 'overdue_day15_protest', isAutomated: false },
  { daysOffset: 30, channel: 'email',    templateKey: 'overdue_day30_legal', isAutomated: false },
]

// ── WhatsApp Message Templates ──────────────────────────────────────────────

const TEMPLATES: Record<string, (data: TemplateData) => string> = {
  reminder_friendly: (d) =>
    `Olá ${d.tenantName}! 😊\n\nLembramos que seu aluguel de *${d.propertyAddress}* vence em *${d.dueDate}*.\n\n💰 Valor: *R$ ${d.amount}*\n\n📱 PIX: ${d.pixCode || 'Gerando...'}\n🔗 Boleto: ${d.boletoUrl || 'Em processamento'}\n\nQualquer dúvida, estamos à disposição!\n_Agora Encontrei - Imobiliária_`,

  due_today: (d) =>
    `Olá ${d.tenantName}! ⏰\n\nSeu aluguel de *${d.propertyAddress}* vence *HOJE*.\n\n💰 Valor: *R$ ${d.amount}*\n📱 PIX: ${d.pixCode || ''}\n🔗 Boleto: ${d.boletoUrl || ''}\n\nEvite juros e multa pagando até o final do dia!`,

  overdue_day1: (d) =>
    `Olá ${d.tenantName}.\n\nIdentificamos que o aluguel de *${d.propertyAddress}* (vencimento ${d.dueDate}) ainda não foi pago.\n\n💰 Valor atualizado: *R$ ${d.amountWithFine}*\n📱 PIX: ${d.pixCode || ''}\n\nPrecisa de ajuda? Podemos negociar o parcelamento dos juros. Responda esta mensagem.`,

  overdue_day3_renegotiation: (d) =>
    `${d.tenantName}, seu aluguel de *${d.propertyAddress}* está *${d.daysOverdue} dias em atraso*.\n\n💰 Valor atualizado: *R$ ${d.amountWithFine}*\n\n🤝 Podemos oferecer:\n• Parcelamento dos juros em até 3x\n• Desconto de ${d.discountPercentage || '5'}% para pagamento via PIX hoje\n\nResponda esta mensagem para negociar.`,

  overdue_formal_day7: (d) =>
    `Prezado(a) ${d.tenantName},\n\nInformamos que seu aluguel referente ao imóvel ${d.propertyAddress} encontra-se em atraso desde ${d.dueDate}.\n\nValor atualizado com multa e juros: R$ ${d.amountWithFine}\n\nSolicitamos a regularização em até 48 horas para evitar medidas administrativas.\n\nAtenciosamente,\nAgora Encontrei - Gestão Imobiliária`,

  overdue_day15_protest: (d) =>
    `AVISO IMPORTANTE\n\n${d.tenantName}, seu aluguel de ${d.propertyAddress} está *${d.daysOverdue} dias em atraso*.\n\nValor: R$ ${d.amountWithFine}\n\nInformamos que, caso não regularizado em 5 dias úteis, seu nome poderá ser incluído nos órgãos de proteção ao crédito.\n\nPara negociar, entre em contato imediatamente.`,

  overdue_day30_legal: (d) =>
    `Prezado(a) ${d.tenantName},\n\nÚltimo aviso referente ao aluguel em atraso do imóvel ${d.propertyAddress} (${d.daysOverdue} dias).\n\nValor total: R$ ${d.amountWithFine}\n\nCaso não regularizado em 5 dias, o caso será encaminhado ao departamento jurídico para as medidas legais cabíveis, incluindo ação de despejo.\n\nAtenciosamente,\nDepartamento Financeiro - Agora Encontrei`,
}

interface TemplateData {
  tenantName: string
  propertyAddress: string
  dueDate: string
  amount: string
  amountWithFine?: string
  pixCode?: string
  boletoUrl?: string
  daysOverdue?: number
  discountPercentage?: string
}

// ── Core Functions ──────────────────────────────────────────────────────────

/**
 * Gera cobrança no Asaas com split automático (proprietário/imobiliária).
 */
export async function createRentalCharge(params: {
  tenantName: string
  tenantCpf: string
  tenantEmail?: string
  tenantPhone?: string
  propertyAddress: string
  amount: number
  dueDate: string           // YYYY-MM-DD
  contractId: string
  rentalId: string
  split?: SplitConfig
}): Promise<AsaasCharge & { pixCode?: string }> {
  // 1. Find or create customer in Asaas
  const customer = await findOrCreateCustomer({
    name: params.tenantName,
    cpfCnpj: params.tenantCpf,
    email: params.tenantEmail,
    mobilePhone: params.tenantPhone,
  })

  // 2. Create charge with fine and interest
  const charge = await createCharge({
    customer: customer.id,
    billingType: 'UNDEFINED',    // Aceita PIX, Boleto e Cartão
    value: params.amount,
    dueDate: params.dueDate,
    description: `Aluguel - ${params.propertyAddress}`,
    externalReference: `rental:${params.rentalId}`,
    fine: { value: 10 },         // 10% multa
    interest: { value: 1 },      // 1% juros ao mês
  })

  // 3. Get PIX code
  let pixCode: string | undefined
  try {
    const pix = await getPixQrCode(charge.id)
    pixCode = pix.payload
  } catch {
    // PIX may not be available immediately
  }

  return { ...charge, pixCode }
}

/**
 * Processa a régua de cobrança para todos os aluguéis pendentes/atrasados.
 * Deve ser chamada diariamente via cron job.
 */
export async function processCollectionRules(
  prisma: PrismaClient,
  companyId: string,
  rules: BillingRuleStep[] = DEFAULT_COLLECTION_RULES,
): Promise<{ processed: number; notifications: number }> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let processed = 0
  let notifications = 0

  // Get all active rentals (PENDING and LATE)
  const rentals = await prisma.rental.findMany({
    where: {
      companyId,
      status: { in: ['PENDING', 'LATE'] },
      dueDate: { not: null },
    },
    include: {
      contract: {
        select: {
          tenantName: true,
          propertyAddress: true,
          tenant: {
            select: { phoneMobile: true, email: true, whatsapp: true, document: true },
          },
        },
      },
    },
  })

  for (const rental of rentals) {
    if (!rental.dueDate || !rental.contract) continue
    processed++

    const dueDate = new Date(rental.dueDate)
    dueDate.setHours(0, 0, 0, 0)
    const daysDiff = Math.round((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

    // Check which rules apply today
    for (const rule of rules) {
      if (daysDiff === rule.daysOffset && rule.isAutomated) {
        const template = TEMPLATES[rule.templateKey]
        if (!template) continue

        const amount = Number(rental.totalAmount || rental.rentAmount || 0)
        const fineRate = 0.10   // 10%
        const interestDaily = 0.01 / 30  // 1% ao mês
        const daysOverdue = Math.max(daysDiff, 0)
        const amountWithFine = daysOverdue > 0
          ? amount + (amount * fineRate) + (amount * interestDaily * daysOverdue)
          : amount

        const message = template({
          tenantName: rental.contract.tenantName || 'Inquilino(a)',
          propertyAddress: rental.contract.propertyAddress || 'Imóvel',
          dueDate: dueDate.toLocaleDateString('pt-BR'),
          amount: amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
          amountWithFine: amountWithFine.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
          pixCode: rental.boletoPixCode || undefined,
          boletoUrl: rental.boletoUrl || undefined,
          daysOverdue,
        })

        // Log the notification (actual sending depends on WhatsApp/Email service config)
        console.log(`[billing] ${rule.channel} notification for rental ${rental.id}: ${rule.templateKey}`)
        notifications++

        // Update rental status to LATE if overdue
        if (daysDiff > 0 && rental.status === 'PENDING') {
          await prisma.rental.update({
            where: { id: rental.id },
            data: { status: 'LATE' },
          })
        }
      }
    }
  }

  return { processed, notifications }
}

/**
 * Calcula resumo de cobranças para o dashboard financeiro.
 */
export async function getCollectionSummary(
  prisma: PrismaClient,
  companyId: string,
  month?: number,
  year?: number,
): Promise<CollectionSummary> {
  const now = new Date()
  const targetMonth = month ?? now.getMonth() + 1
  const targetYear = year ?? now.getFullYear()

  const monthStart = new Date(targetYear, targetMonth - 1, 1)
  const monthEnd = new Date(targetYear, targetMonth, 0, 23, 59, 59)

  const rentals = await prisma.rental.findMany({
    where: {
      companyId,
      dueDate: { gte: monthStart, lte: monthEnd },
    },
    select: {
      status: true,
      totalAmount: true,
      rentAmount: true,
      dueDate: true,
    },
  })

  const today = new Date()
  let totalPending = 0, totalOverdue = 0, totalReceived = 0
  let pendingAmount = 0, overdueAmount = 0, receivedAmount = 0
  const overdueByDays = { '1-5': 0, '6-15': 0, '16-30': 0, '30+': 0 }

  for (const r of rentals) {
    const amount = Number(r.totalAmount || r.rentAmount || 0)

    if (r.status === 'PAID') {
      totalReceived++
      receivedAmount += amount
    } else if (r.status === 'LATE') {
      totalOverdue++
      overdueAmount += amount
      if (r.dueDate) {
        const days = Math.round((today.getTime() - r.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        if (days <= 5) overdueByDays['1-5']++
        else if (days <= 15) overdueByDays['6-15']++
        else if (days <= 30) overdueByDays['16-30']++
        else overdueByDays['30+']++
      }
    } else {
      totalPending++
      pendingAmount += amount
    }
  }

  const total = rentals.length || 1
  const overduePercentage = Math.round((totalOverdue / total) * 100)

  return {
    totalPending, totalOverdue, totalReceived,
    pendingAmount, overdueAmount, receivedAmount,
    overduePercentage, overdueByDays,
  }
}

/**
 * Calcula o valor de repasse para o proprietário após descontar comissão.
 */
export function calculateOwnerRepasse(
  totalPaid: number,
  commissionPercent: number,
  adminFeePercent?: number,
): { ownerAmount: number; agencyCommission: number; adminFee: number } {
  const agencyCommission = totalPaid * (commissionPercent / 100)
  const adminFee = adminFeePercent ? totalPaid * (adminFeePercent / 100) : 0
  const ownerAmount = totalPaid - agencyCommission - adminFee

  return {
    ownerAmount: Math.round(ownerAmount * 100) / 100,
    agencyCommission: Math.round(agencyCommission * 100) / 100,
    adminFee: Math.round(adminFee * 100) / 100,
  }
}
