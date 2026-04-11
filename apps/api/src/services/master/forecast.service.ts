/**
 * Master Forecast Service — Projeção de receita baseada nos últimos 7 dias
 *
 * Calcula: fechamento do mês, ritmo necessário, tendência, confiança.
 */

import type { ForecastMetrics } from '../../types/master-intelligence.js'

export async function buildForecast(prisma: any): Promise<ForecastMetrics> {
  const now = new Date()
  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const diasRestantes = daysInMonth - dayOfMonth
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Last 7 days revenue
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 7)

  const [last7Revenue, monthRevenue, prevMonthRevenue] = await Promise.all([
    prisma.saasFinancialTransaction.aggregate({
      where: { status: 'paid', paidAt: { gte: sevenDaysAgo } },
      _sum: { amount: true },
      _count: true,
    }).catch(() => ({ _sum: { amount: 0 }, _count: 0 })),
    prisma.saasFinancialTransaction.aggregate({
      where: { status: 'paid', paidAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }).catch(() => ({ _sum: { amount: 0 } })),
    // Previous month for trend comparison
    prisma.saasFinancialTransaction.aggregate({
      where: {
        status: 'paid',
        paidAt: {
          gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          lt: startOfMonth,
        },
      },
      _sum: { amount: true },
    }).catch(() => ({ _sum: { amount: 0 } })),
  ])

  const last7Val = Number(last7Revenue._sum.amount || 0)
  const monthVal = Number(monthRevenue._sum.amount || 0)
  const prevMonthVal = Number(prevMonthRevenue._sum.amount || 0)

  // Average daily revenue from last 7 days
  const mediaUltimos7Dias = last7Val / 7

  // Forecast: current revenue + (daily avg * remaining days)
  const forecastFechamento = monthVal + (mediaUltimos7Dias * diasRestantes)

  // Ritmo atual: what we've earned per day so far this month
  const ritmoAtual = dayOfMonth > 0 ? monthVal / dayOfMonth : 0

  // Ritmo necessário: what we'd need per remaining day to match last month
  const ritmoNecessario = diasRestantes > 0
    ? Math.max(0, prevMonthVal - monthVal) / diasRestantes
    : 0

  // Trend: compare current month's daily pace vs previous month's
  const prevMonthDailyPace = prevMonthVal / daysInMonth
  let tendencia: 'crescimento' | 'estavel' | 'queda'
  if (ritmoAtual > prevMonthDailyPace * 1.05) {
    tendencia = 'crescimento'
  } else if (ritmoAtual < prevMonthDailyPace * 0.95) {
    tendencia = 'queda'
  } else {
    tendencia = 'estavel'
  }

  // MRR next month: current MRR + growth trend
  const activeTenants = await prisma.tenant.findMany({
    where: { planStatus: 'ACTIVE' },
    select: { planPrice: true },
  }).catch(() => [])
  const currentMrr = activeTenants.reduce((sum: number, t: any) => sum + Number(t.planPrice || 0), 0)

  // Simple MRR projection based on growth trend
  const growthRate = prevMonthVal > 0 ? (monthVal / prevMonthVal) - 1 : 0
  const forecastMrrProximoMes = currentMrr * (1 + Math.max(-0.1, Math.min(0.3, growthRate)))

  // Confidence based on data volume
  let confianca: 'alta' | 'media' | 'baixa'
  if (last7Revenue._count >= 10 && dayOfMonth >= 10) {
    confianca = 'alta'
  } else if (last7Revenue._count >= 3 && dayOfMonth >= 5) {
    confianca = 'media'
  } else {
    confianca = 'baixa'
  }

  return {
    forecastFechamentoMes: Math.round(forecastFechamento * 100) / 100,
    forecastMrrProximoMes: Math.round(forecastMrrProximoMes * 100) / 100,
    ritmoAtual: Math.round(ritmoAtual * 100) / 100,
    ritmoNecessario: Math.round(ritmoNecessario * 100) / 100,
    tendencia,
    mediaUltimos7Dias: Math.round(mediaUltimos7Dias * 100) / 100,
    diasRestantesMes: diasRestantes,
    confianca,
  }
}
