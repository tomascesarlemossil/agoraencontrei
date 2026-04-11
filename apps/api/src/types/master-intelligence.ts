/**
 * Master Intelligence Types — Tipagem forte para Dashboard Master
 *
 * Todas as métricas agregadas da plataforma: receita, vendas, canais,
 * retenção, projeção, advisor e geo.
 */

// ── Receita ────────────────────────────────────────────────────────────────

export interface RevenueMetrics {
  receitaHoje: number
  receitaMes: number
  mrr: number
  arr: number
  ticketMedio: number
  receitaPorPlano: PlanRevenue[]
  receitaBruta: number
  receitaLiquida: number
  inadimplencia: number
  inadimplenciaPercentual: number
}

export interface PlanRevenue {
  plan: string
  count: number
  revenue: number
  mrr: number
}

// ── Vendas ──────────────────────────────────────────────────────────────────

export interface SalesMetrics {
  leadsHoje: number
  leadsSemana: number
  leadsMes: number
  vendasHoje: number
  vendasMes: number
  conversaoGeral: number
  conversaoPorCanal: ChannelConversion[]
}

export interface ChannelConversion {
  channel: string
  leads: number
  vendas: number
  receita: number
  conversao: number
}

// ── Canais ──────────────────────────────────────────────────────────────────

export interface ChannelMetrics {
  channels: ChannelDetail[]
}

export interface ChannelDetail {
  name: string
  slug: string
  leads: number
  vendas: number
  receita: number
  conversao: number
}

// ── Retenção ────────────────────────────────────────────────────────────────

export interface RetentionMetrics {
  clientesAtivos: number
  clientesTrial: number
  clientesPastDue: number
  clientesSuspensos: number
  churnRiskCount: number
  churnRiskTenants: ChurnRiskTenant[]
  retentionSuggestions: RetentionSuggestion[]
  tenantsSemAcesso7d: number
  tenantsSemAcesso30d: number
}

export interface ChurnRiskTenant {
  id: string
  name: string
  subdomain: string
  plan: string
  planPrice: number
  daysSinceLastActivity: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  reason: string
}

export interface RetentionSuggestion {
  type: 'coupon' | 'message' | 'call' | 'upgrade' | 'feature'
  priority: 'low' | 'medium' | 'high'
  title: string
  description: string
  impactEstimate?: string
}

// ── Projeção ────────────────────────────────────────────────────────────────

export interface ForecastMetrics {
  forecastFechamentoMes: number
  forecastMrrProximoMes: number
  ritmoAtual: number
  ritmoNecessario: number
  tendencia: 'crescimento' | 'estavel' | 'queda'
  mediaUltimos7Dias: number
  diasRestantesMes: number
  confianca: 'alta' | 'media' | 'baixa'
}

// ── CAC / LTV / ROAS ───────────────────────────────────────────────────────

export interface UnitEconomics {
  cacPorCanal: CACByChannel[]
  ltvPorPlano: LTVByPlan[]
  roasPorCanal: ROASByChannel[]
  integracaoMidiaStatus: 'ativo' | 'aguardando_integracao'
}

export interface CACByChannel {
  channel: string
  cac: number | null
  status: 'calculado' | 'aguardando_integracao'
}

export interface LTVByPlan {
  plan: string
  ltv: number
  avgMonths: number
}

export interface ROASByChannel {
  channel: string
  roas: number | null
  status: 'calculado' | 'aguardando_integracao'
}

// ── Heatmap / Geo ───────────────────────────────────────────────────────────

export interface GeoMetrics {
  vendasPorCidade: CityMetric[]
  vendasPorUF: UFMetric[]
}

export interface CityMetric {
  city: string
  state: string
  leads: number
  vendas: number
  receita: number
}

export interface UFMetric {
  uf: string
  leads: number
  vendas: number
  receita: number
}

// ── Advisor ─────────────────────────────────────────────────────────────────

export interface AdvisorInsights {
  advisorHeadline: string
  advisorRecommendations: AdvisorRecommendation[]
}

export interface AdvisorRecommendation {
  type: 'revenue' | 'retention' | 'channel' | 'cost' | 'opportunity'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  actionLabel?: string
}

// ── Afiliados ───────────────────────────────────────────────────────────────

export interface AffiliateMetrics {
  totalAffiliateRevenue: number
  totalAffiliateCommission: number
  activeAffiliates: number
  topAffiliates: TopAffiliate[]
  affiliateMrr: number
}

export interface TopAffiliate {
  id: string
  name: string
  code: string
  level: string
  totalEarnings: number
  activeClients: number
}

// ── Growth Engine / Funnel ──────────────────────────────────────────────────

export interface GrowthEngineMetrics {
  funnel: FunnelStageCount[]
  outbound: OutboundStats
  followUp: FollowUpStats
  channelPerformance: ChannelFunnelPerformance[]
  dailyTrend: DailyTrendPoint[]
}

export interface FunnelStageCount {
  stage: string
  count: number
}

export interface OutboundStats {
  sentToday: number
  sentMonth: number
  deliveredMonth: number
  repliedMonth: number
  failedMonth: number
  deliveryRate: number
  replyRate: number
  templatePerformance: TemplatePerformance[]
}

export interface TemplatePerformance {
  version: string
  sent: number
  replied: number
  replyRate: number
}

export interface FollowUpStats {
  pending: number
  sentMonth: number
  skippedMonth: number
  byStep: Array<{ step: string; count: number }>
}

export interface ChannelFunnelPerformance {
  source: string
  total: number
  converted: number
  conversionRate: number
}

export interface DailyTrendPoint {
  date: string
  captured: number
  converted: number
}

// ── Response consolidada ────────────────────────────────────────────────────

export interface MasterIntelligenceResponse {
  revenue: RevenueMetrics
  sales: SalesMetrics
  channels: ChannelMetrics
  retention: RetentionMetrics
  forecast: ForecastMetrics
  unitEconomics: UnitEconomics
  affiliates: AffiliateMetrics
  geo: GeoMetrics
  advisor: AdvisorInsights
  growthEngine: GrowthEngineMetrics
  generatedAt: string
}
