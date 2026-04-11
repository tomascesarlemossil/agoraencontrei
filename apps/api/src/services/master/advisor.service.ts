/**
 * Tomás Advisor Service — Geração de insights proativos para Dashboard Master
 *
 * Lê métricas reais e gera headline + recomendações acionáveis.
 * Nunca inventa números — usa dados do JSON consolidado.
 */

import type {
  RevenueMetrics,
  SalesMetrics,
  RetentionMetrics,
  ForecastMetrics,
  ChannelMetrics,
  AffiliateMetrics,
  AdvisorInsights,
  AdvisorRecommendation,
} from '../../types/master-intelligence.js'

function fmt(v: number): string {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}K`
  return `R$ ${v.toFixed(0)}`
}

export function generateAdvisorInsights(
  revenue: RevenueMetrics,
  sales: SalesMetrics,
  retention: RetentionMetrics,
  forecast: ForecastMetrics,
  channels: ChannelMetrics,
  affiliates: AffiliateMetrics,
): AdvisorInsights {
  const recommendations: AdvisorRecommendation[] = []

  // ── Headline generation ─────────────────────────────────────────────────

  let headline: string

  if (retention.churnRiskCount > 3) {
    headline = `Atenção: ${retention.churnRiskCount} tenants em risco de churn. MRR atual: ${fmt(revenue.mrr)}.`
  } else if (forecast.tendencia === 'crescimento') {
    headline = `Crescimento detectado. Receita do mês: ${fmt(revenue.receitaMes)} — forecast: ${fmt(forecast.forecastFechamentoMes)}.`
  } else if (forecast.tendencia === 'queda') {
    headline = `Alerta: tendência de queda. Receita atual ${fmt(revenue.receitaMes)} abaixo do ritmo. Ação necessária.`
  } else {
    headline = `Operação estável. MRR: ${fmt(revenue.mrr)} | Receita mês: ${fmt(revenue.receitaMes)} | ${retention.clientesAtivos} clientes ativos.`
  }

  // ── Revenue recommendations ───────────────────────────────────────────

  if (revenue.inadimplenciaPercentual > 10) {
    recommendations.push({
      type: 'revenue',
      priority: 'high',
      title: 'Inadimplência acima de 10%',
      description: `${revenue.inadimplenciaPercentual.toFixed(1)}% da receita está em atraso (${fmt(revenue.inadimplencia)}). Ativar cobrança automatizada via Asaas.`,
      actionLabel: 'Ver cobranças vencidas',
    })
  }

  if (revenue.ticketMedio > 0 && revenue.ticketMedio < 150) {
    recommendations.push({
      type: 'revenue',
      priority: 'medium',
      title: 'Ticket médio baixo',
      description: `Ticket médio de ${fmt(revenue.ticketMedio)}. Considerar campanha de upsell para plano PRO/ENTERPRISE.`,
      actionLabel: 'Criar campanha de upsell',
    })
  }

  // ── Channel recommendations ───────────────────────────────────────────

  const topChannel = channels.channels[0]
  if (topChannel && topChannel.leads > 0) {
    recommendations.push({
      type: 'channel',
      priority: 'medium',
      title: `Canal líder: ${topChannel.name}`,
      description: `${topChannel.name} gerou ${topChannel.leads} leads no mês (${topChannel.conversao}% conversão). Investir mais nesse canal.`,
    })
  }

  const lowConversionChannels = channels.channels.filter(ch => ch.leads >= 5 && ch.conversao < 2)
  if (lowConversionChannels.length > 0) {
    const names = lowConversionChannels.map(c => c.name).join(', ')
    recommendations.push({
      type: 'channel',
      priority: 'medium',
      title: 'Canais com baixa conversão',
      description: `${names} — leads chegando mas sem converter. Revisar qualificação e follow-up.`,
    })
  }

  // ── Retention recommendations ─────────────────────────────────────────

  if (retention.clientesPastDue > 0) {
    recommendations.push({
      type: 'retention',
      priority: 'high',
      title: `${retention.clientesPastDue} cliente(s) com pagamento atrasado`,
      description: 'Enviar lembrete via WhatsApp + email com link de PIX facilitado.',
      actionLabel: 'Ver inadimplentes',
    })
  }

  if (retention.tenantsSemAcesso30d > 0) {
    recommendations.push({
      type: 'retention',
      priority: 'high',
      title: `${retention.tenantsSemAcesso30d} tenant(s) inativos há 30+ dias`,
      description: 'Risco alto de cancelamento. Agendar contato proativo.',
      actionLabel: 'Ver tenants inativos',
    })
  }

  if (retention.clientesTrial > 2) {
    recommendations.push({
      type: 'retention',
      priority: 'medium',
      title: `${retention.clientesTrial} tenant(s) em trial`,
      description: 'Disparar sequência de onboarding e oferecer call de configuração.',
    })
  }

  // ── Forecast recommendations ──────────────────────────────────────────

  if (forecast.tendencia === 'queda') {
    recommendations.push({
      type: 'revenue',
      priority: 'critical',
      title: 'Tendência de queda no mês',
      description: `Ritmo atual (${fmt(forecast.ritmoAtual)}/dia) abaixo do mês anterior. Forecast: ${fmt(forecast.forecastFechamentoMes)}.`,
      actionLabel: 'Planejar ações de receita',
    })
  }

  // ── Affiliate recommendations ─────────────────────────────────────────

  if (affiliates.activeAffiliates === 0) {
    recommendations.push({
      type: 'opportunity',
      priority: 'medium',
      title: 'Nenhum afiliado ativo',
      description: 'Ativar programa de afiliados para criar canal de aquisição com custo variável.',
      actionLabel: 'Cadastrar afiliados',
    })
  } else if (affiliates.activeAffiliates > 0 && affiliates.totalAffiliateCommission === 0) {
    recommendations.push({
      type: 'opportunity',
      priority: 'low',
      title: 'Afiliados sem conversão',
      description: `${affiliates.activeAffiliates} afiliados ativos, mas sem comissões geradas. Revisar material de vendas.`,
    })
  }

  // ── Sort by priority ──────────────────────────────────────────────────

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return {
    advisorHeadline: headline,
    advisorRecommendations: recommendations.slice(0, 6),
  }
}
