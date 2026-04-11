/**
 * Master Retention Service — Churn Radar + Sugestões de Retenção
 *
 * Detecta tenants em risco baseado em: inatividade, queda de uso,
 * status de pagamento. Gera sugestões acionáveis.
 */

import type { RetentionMetrics, ChurnRiskTenant, RetentionSuggestion } from '../../types/master-intelligence.js'

export async function buildRetention(prisma: any): Promise<RetentionMetrics> {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Tenant counts by status
  const [active, trial, pastDue, suspended] = await Promise.all([
    prisma.tenant.count({ where: { planStatus: 'ACTIVE' } }).catch(() => 0),
    prisma.tenant.count({ where: { planStatus: 'TRIAL' } }).catch(() => 0),
    prisma.tenant.count({ where: { planStatus: 'PAST_DUE' } }).catch(() => 0),
    prisma.tenant.count({ where: { planStatus: 'SUSPENDED' } }).catch(() => 0),
  ])

  // Tenants without recent activity (updatedAt as proxy for activity)
  const allActiveTenants = await prisma.tenant.findMany({
    where: { planStatus: { in: ['ACTIVE', 'TRIAL'] } },
    select: {
      id: true,
      name: true,
      subdomain: true,
      plan: true,
      planPrice: true,
      planStatus: true,
      updatedAt: true,
      createdAt: true,
      settings: true,
    },
  }).catch(() => [])

  const churnRiskTenants: ChurnRiskTenant[] = []
  let semAcesso7d = 0
  let semAcesso30d = 0

  for (const tenant of allActiveTenants) {
    const lastActivity = new Date(tenant.updatedAt)
    const daysSince = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSince >= 7) semAcesso7d++
    if (daysSince >= 30) semAcesso30d++

    // Risk assessment
    let riskLevel: ChurnRiskTenant['riskLevel'] = 'low'
    let reason = ''

    if (tenant.planStatus === 'PAST_DUE') {
      riskLevel = 'critical'
      reason = 'Pagamento em atraso'
    } else if (daysSince >= 30) {
      riskLevel = 'critical'
      reason = `Sem atividade há ${daysSince} dias`
    } else if (daysSince >= 14) {
      riskLevel = 'high'
      reason = `Sem atividade há ${daysSince} dias`
    } else if (daysSince >= 7) {
      riskLevel = 'medium'
      reason = `Sem atividade há ${daysSince} dias`
    }

    if (riskLevel !== 'low') {
      churnRiskTenants.push({
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        plan: tenant.plan,
        planPrice: Number(tenant.planPrice || 0),
        daysSinceLastActivity: daysSince,
        riskLevel,
        reason,
      })
    }
  }

  // Sort by risk level
  const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  churnRiskTenants.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel])

  // Retention suggestions
  const retentionSuggestions = generateRetentionSuggestions(
    churnRiskTenants, pastDue, active, trial,
  )

  return {
    clientesAtivos: active,
    clientesTrial: trial,
    clientesPastDue: pastDue,
    clientesSuspensos: suspended,
    churnRiskCount: churnRiskTenants.length,
    churnRiskTenants: churnRiskTenants.slice(0, 10), // Top 10 at-risk
    retentionSuggestions,
    tenantsSemAcesso7d: semAcesso7d,
    tenantsSemAcesso30d: semAcesso30d,
  }
}

function generateRetentionSuggestions(
  churnRisk: ChurnRiskTenant[],
  pastDue: number,
  active: number,
  trial: number,
): RetentionSuggestion[] {
  const suggestions: RetentionSuggestion[] = []

  const criticalCount = churnRisk.filter(t => t.riskLevel === 'critical').length
  const highCount = churnRisk.filter(t => t.riskLevel === 'high').length

  if (criticalCount > 0) {
    suggestions.push({
      type: 'call',
      priority: 'high',
      title: `${criticalCount} tenant(s) em risco crítico`,
      description: `Contato direto urgente. Tenants com mais de 30 dias sem atividade ou pagamento atrasado.`,
      impactEstimate: `Potencial de ${criticalCount} cancelamentos`,
    })
  }

  if (pastDue > 0) {
    suggestions.push({
      type: 'message',
      priority: 'high',
      title: `${pastDue} cobrança(s) em atraso`,
      description: 'Enviar lembrete de pagamento com opção de PIX facilitado ou desconto para regularização.',
      impactEstimate: `Recuperar até R$ ${(pastDue * 200).toLocaleString('pt-BR')} em receita`,
    })
  }

  if (highCount > 2) {
    suggestions.push({
      type: 'coupon',
      priority: 'medium',
      title: 'Campanha de reativação',
      description: 'Oferecer desconto temporário ou feature grátis para tenants com queda de atividade.',
      impactEstimate: `Reter ${highCount} tenants em risco`,
    })
  }

  if (trial > 3) {
    suggestions.push({
      type: 'message',
      priority: 'medium',
      title: `${trial} tenant(s) em trial`,
      description: 'Disparar sequência de onboarding com destaque para features premium. Oferecer call de setup.',
    })
  }

  if (suggestions.length === 0) {
    suggestions.push({
      type: 'feature',
      priority: 'low',
      title: 'Base saudável',
      description: 'Sem riscos críticos detectados. Manter foco em expansão e upsell.',
    })
  }

  return suggestions
}
