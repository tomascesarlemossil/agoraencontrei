/**
 * Master Intelligence Service — Aggregação central de métricas da plataforma
 *
 * Consolida dados reais de: Tenant, Lead, Deal, SaasFinancialTransaction,
 * Affiliate, AffiliateEarning para o Dashboard Master.
 */

import type {
  RevenueMetrics,
  SalesMetrics,
  ChannelMetrics,
  AffiliateMetrics,
  GeoMetrics,
  GrowthEngineMetrics,
  MasterIntelligenceResponse,
} from '../../types/master-intelligence.js'
import { buildForecast } from './forecast.service.js'
import { buildRetention } from './retention.service.js'
import { buildChannelAttribution } from './channel-attribution.service.js'
import { generateAdvisorInsights } from './advisor.service.js'
import { getOutboundMetrics } from '../outbound-queue.service.js'
import { getFollowUpMetrics } from '../followup.service.js'
import { getFunnelConversionMetrics } from '../sales-funnel.service.js'

// ── Revenue Metrics ─────────────────────────────────────────────────────────

async function buildRevenue(prisma: any): Promise<RevenueMetrics> {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Active tenants for MRR
  const activeTenants = await prisma.tenant.findMany({
    where: { planStatus: 'ACTIVE' },
    select: { plan: true, planPrice: true },
  }).catch(() => [])

  const mrr = activeTenants.reduce((sum: number, t: any) => sum + Number(t.planPrice || 0), 0)

  // Revenue by plan
  const planGroups: Record<string, { count: number; revenue: number }> = {}
  for (const t of activeTenants) {
    const plan = t.plan || 'LITE'
    if (!planGroups[plan]) planGroups[plan] = { count: 0, revenue: 0 }
    planGroups[plan].count++
    planGroups[plan].revenue += Number(t.planPrice || 0)
  }

  const receitaPorPlano = Object.entries(planGroups).map(([plan, data]) => ({
    plan,
    count: data.count,
    revenue: data.revenue,
    mrr: data.revenue,
  }))

  // Transaction-based revenue
  const [todayPaid, monthPaid, monthPending, monthOverdue, totalPaid] = await Promise.all([
    prisma.saasFinancialTransaction.aggregate({
      where: { status: 'paid', paidAt: { gte: startOfDay } },
      _sum: { amount: true, netAmount: true, commissionAmount: true },
      _count: true,
    }).catch(() => ({ _sum: { amount: 0, netAmount: 0, commissionAmount: 0 }, _count: 0 })),
    prisma.saasFinancialTransaction.aggregate({
      where: { status: 'paid', paidAt: { gte: startOfMonth } },
      _sum: { amount: true, netAmount: true, commissionAmount: true },
      _count: true,
    }).catch(() => ({ _sum: { amount: 0, netAmount: 0, commissionAmount: 0 }, _count: 0 })),
    prisma.saasFinancialTransaction.aggregate({
      where: { status: 'pending' },
      _sum: { amount: true },
    }).catch(() => ({ _sum: { amount: 0 } })),
    prisma.saasFinancialTransaction.aggregate({
      where: { status: 'overdue' },
      _sum: { amount: true },
    }).catch(() => ({ _sum: { amount: 0 } })),
    prisma.saasFinancialTransaction.aggregate({
      where: { status: 'paid' },
      _sum: { amount: true },
      _count: true,
    }).catch(() => ({ _sum: { amount: 0 }, _count: 0 })),
  ])

  const receitaBruta = Number(monthPaid._sum.amount || 0)
  const comissoes = Number(monthPaid._sum.commissionAmount || 0)
  const inadimplencia = Number(monthOverdue._sum.amount || 0)
  const totalReceived = Number(totalPaid._sum.amount || 0)

  return {
    receitaHoje: Number(todayPaid._sum.amount || 0),
    receitaMes: receitaBruta,
    mrr,
    arr: mrr * 12,
    ticketMedio: totalPaid._count > 0 ? totalReceived / totalPaid._count : 0,
    receitaPorPlano,
    receitaBruta,
    receitaLiquida: receitaBruta - comissoes,
    inadimplencia,
    inadimplenciaPercentual: (receitaBruta + inadimplencia) > 0
      ? (inadimplencia / (receitaBruta + inadimplencia)) * 100
      : 0,
  }
}

// ── Sales Metrics ───────────────────────────────────────────────────────────

async function buildSales(prisma: any): Promise<SalesMetrics> {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [leadsHoje, leadsSemana, leadsMes, vendasHoje, vendasMes, totalLeadsMes] = await Promise.all([
    prisma.lead.count({ where: { createdAt: { gte: startOfDay } } }).catch(() => 0),
    prisma.lead.count({ where: { createdAt: { gte: startOfWeek } } }).catch(() => 0),
    prisma.lead.count({ where: { createdAt: { gte: startOfMonth } } }).catch(() => 0),
    prisma.deal.count({ where: { status: 'CLOSED_WON', closedAt: { gte: startOfDay } } }).catch(() => 0),
    prisma.deal.count({ where: { status: 'CLOSED_WON', closedAt: { gte: startOfMonth } } }).catch(() => 0),
    prisma.lead.count({ where: { createdAt: { gte: startOfMonth } } }).catch(() => 0),
  ])

  // Channel breakdown
  const channelLeads = await prisma.lead.groupBy({
    by: ['source'],
    where: { createdAt: { gte: startOfMonth } },
    _count: true,
  }).catch(() => [])

  const conversaoPorCanal = channelLeads.map((c: any) => ({
    channel: c.source || 'direct',
    leads: c._count,
    vendas: 0, // Will be enriched if Deal tracks source
    receita: 0,
    conversao: 0,
  }))

  return {
    leadsHoje,
    leadsSemana,
    leadsMes,
    vendasHoje,
    vendasMes,
    conversaoGeral: totalLeadsMes > 0 ? (vendasMes / totalLeadsMes) * 100 : 0,
    conversaoPorCanal,
  }
}

// ── Affiliate Metrics ───────────────────────────────────────────────────────

async function buildAffiliateMetrics(prisma: any): Promise<AffiliateMetrics> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [activeAffiliates, totalCommission, monthCommission, topAffiliatesRaw] = await Promise.all([
    prisma.affiliate.count({ where: { isActive: true } }).catch(() => 0),
    prisma.affiliateEarning.aggregate({
      _sum: { amount: true },
    }).catch(() => ({ _sum: { amount: 0 } })),
    prisma.affiliateEarning.aggregate({
      where: { createdAt: { gte: startOfMonth } },
      _sum: { amount: true, grossValue: true },
    }).catch(() => ({ _sum: { amount: 0, grossValue: 0 } })),
    prisma.affiliate.findMany({
      where: { isActive: true },
      orderBy: { totalEarnings: 'desc' },
      take: 5,
      select: { id: true, name: true, code: true, level: true, totalEarnings: true, totalClients: true },
    }).catch(() => []),
  ])

  return {
    totalAffiliateRevenue: Number(monthCommission._sum.grossValue || 0),
    totalAffiliateCommission: Number(totalCommission._sum.amount || 0),
    activeAffiliates,
    topAffiliates: topAffiliatesRaw.map((a: any) => ({
      id: a.id,
      name: a.name,
      code: a.code,
      level: a.level,
      totalEarnings: Number(a.totalEarnings || 0),
      activeClients: a.totalClients || 0,
    })),
    affiliateMrr: Number(monthCommission._sum.amount || 0),
  }
}

// ── Geo Metrics ─────────────────────────────────────────────────────────────

async function buildGeo(prisma: any): Promise<GeoMetrics> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Group leads by city
  const leadsByCity = await prisma.lead.groupBy({
    by: ['metadata'],
    where: { createdAt: { gte: startOfMonth } },
    _count: true,
  }).catch(() => [])

  // Use contact city if available
  const contactCities = await prisma.contact.groupBy({
    by: ['city', 'state'],
    where: { createdAt: { gte: startOfMonth }, city: { not: null } },
    _count: true,
  }).catch(() => [])

  const cityMap: Record<string, { city: string; state: string; leads: number }> = {}
  for (const c of contactCities) {
    if (!c.city) continue
    const key = `${c.city}-${c.state || ''}`
    if (!cityMap[key]) cityMap[key] = { city: c.city, state: c.state || '', leads: 0 }
    cityMap[key].leads += c._count
  }

  const vendasPorCidade = Object.values(cityMap)
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 20)
    .map(c => ({
      city: c.city,
      state: c.state,
      leads: c.leads,
      vendas: 0, // enriched when deal city is tracked
      receita: 0,
    }))

  // Group by UF
  const ufMap: Record<string, { leads: number }> = {}
  for (const c of Object.values(cityMap)) {
    if (!c.state) continue
    if (!ufMap[c.state]) ufMap[c.state] = { leads: 0 }
    ufMap[c.state].leads += c.leads
  }

  const vendasPorUF = Object.entries(ufMap)
    .sort(([, a], [, b]) => b.leads - a.leads)
    .map(([uf, data]) => ({
      uf,
      leads: data.leads,
      vendas: 0,
      receita: 0,
    }))

  return { vendasPorCidade, vendasPorUF }
}

// ── Consolidação ────────────────────────────────────────────────────────────

// ── Growth Engine Metrics ───────────────────────────────────────────────────

async function buildGrowthEngine(prisma: any): Promise<GrowthEngineMetrics> {
  const [outbound, followUp, funnelConversion] = await Promise.all([
    getOutboundMetrics(prisma).catch(() => ({
      sentToday: 0, sentMonth: 0, deliveredMonth: 0, repliedMonth: 0,
      failedMonth: 0, deliveryRate: 0, replyRate: 0, templatePerformance: [],
    })),
    getFollowUpMetrics(prisma).catch(() => ({
      pending: 0, sentMonth: 0, skippedMonth: 0, byStep: [],
    })),
    getFunnelConversionMetrics(prisma).catch(() => ({
      stages: [], channelPerformance: [], dailyTrend: [],
    })),
  ])

  return {
    funnel: funnelConversion.stages,
    outbound,
    followUp,
    channelPerformance: funnelConversion.channelPerformance,
    dailyTrend: funnelConversion.dailyTrend,
  }
}

export async function buildMasterIntelligence(prisma: any): Promise<MasterIntelligenceResponse> {
  const [revenue, sales, retention, forecast, affiliates, geo, growthEngine] = await Promise.all([
    buildRevenue(prisma),
    buildSales(prisma),
    buildRetention(prisma),
    buildForecast(prisma),
    buildAffiliateMetrics(prisma),
    buildGeo(prisma),
    buildGrowthEngine(prisma),
  ])

  const channels = await buildChannelAttribution(prisma)

  // Generate advisor insights based on all metrics
  const advisor = generateAdvisorInsights(revenue, sales, retention, forecast, channels, affiliates)

  // CAC/LTV/ROAS — structured for future media integration
  const unitEconomics = {
    cacPorCanal: channels.channels.map(ch => ({
      channel: ch.slug,
      cac: null as number | null,
      status: 'aguardando_integracao' as const,
    })),
    ltvPorPlano: revenue.receitaPorPlano.map(p => ({
      plan: p.plan,
      ltv: p.mrr * 12, // Simplified: assuming 12-month retention average
      avgMonths: 12,
    })),
    roasPorCanal: channels.channels.map(ch => ({
      channel: ch.slug,
      roas: null as number | null,
      status: 'aguardando_integracao' as const,
    })),
    integracaoMidiaStatus: 'aguardando_integracao' as const,
  }

  return {
    revenue,
    sales,
    channels,
    retention,
    forecast,
    unitEconomics,
    affiliates,
    geo,
    advisor,
    growthEngine,
    generatedAt: new Date().toISOString(),
  }
}
