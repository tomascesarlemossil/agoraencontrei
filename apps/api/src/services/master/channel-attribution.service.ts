/**
 * Master Channel Attribution Service — Análise de canais de aquisição
 *
 * Agrega dados de Lead.source para: WhatsApp, Afiliados, Ads, SEO, Site, Manual.
 * Enriquece com receita quando possível.
 */

import type { ChannelMetrics, ChannelDetail } from '../../types/master-intelligence.js'

// Map source values to canonical channel names
const SOURCE_CHANNEL_MAP: Record<string, { name: string; slug: string }> = {
  whatsapp: { name: 'WhatsApp', slug: 'whatsapp' },
  portal: { name: 'Portais', slug: 'portal' },
  site: { name: 'Site / SEO', slug: 'seo' },
  referral: { name: 'Afiliados', slug: 'afiliados' },
  manual: { name: 'Manual', slug: 'manual' },
  tomas_chat: { name: 'Tomás Chat', slug: 'tomas' },
  tomas_hunter: { name: 'Hunter Mode', slug: 'hunter' },
  facebook: { name: 'Meta Ads', slug: 'ads' },
  instagram: { name: 'Meta Ads', slug: 'ads' },
  google: { name: 'Google Ads', slug: 'ads' },
}

function resolveChannel(source: string | null): { name: string; slug: string } {
  if (!source) return { name: 'Direto', slug: 'direct' }
  const lower = source.toLowerCase()
  return SOURCE_CHANNEL_MAP[lower] ?? { name: source, slug: source.toLowerCase() }
}

export async function buildChannelAttribution(prisma: any): Promise<ChannelMetrics> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Leads by source (this month)
  const leadsBySource = await prisma.lead.groupBy({
    by: ['source'],
    where: { createdAt: { gte: startOfMonth } },
    _count: true,
  }).catch(() => [])

  // Deals closed this month (won)
  const wonDeals = await prisma.deal.findMany({
    where: { status: 'CLOSED_WON', closedAt: { gte: startOfMonth } },
    select: { value: true, leadId: true },
  }).catch(() => [])

  // Map leadId → deal value for enrichment
  const leadDealMap: Record<string, number> = {}
  for (const deal of wonDeals) {
    if (deal.leadId) {
      leadDealMap[deal.leadId] = Number(deal.value || 0)
    }
  }

  // Get leads that converted to deals to attribute revenue to channels
  const convertedLeadIds = Object.keys(leadDealMap)
  let convertedLeadSources: Record<string, { count: number; revenue: number }> = {}

  if (convertedLeadIds.length > 0) {
    const convertedLeads = await prisma.lead.findMany({
      where: { id: { in: convertedLeadIds } },
      select: { id: true, source: true },
    }).catch(() => [])

    for (const lead of convertedLeads) {
      const ch = resolveChannel(lead.source)
      if (!convertedLeadSources[ch.slug]) convertedLeadSources[ch.slug] = { count: 0, revenue: 0 }
      convertedLeadSources[ch.slug].count++
      convertedLeadSources[ch.slug].revenue += leadDealMap[lead.id] || 0
    }
  }

  // Aggregate channels
  const channelMap: Record<string, ChannelDetail> = {}

  for (const item of leadsBySource) {
    const ch = resolveChannel(item.source)
    if (!channelMap[ch.slug]) {
      channelMap[ch.slug] = { name: ch.name, slug: ch.slug, leads: 0, vendas: 0, receita: 0, conversao: 0 }
    }
    channelMap[ch.slug].leads += item._count
  }

  // Enrich with deal data
  for (const [slug, data] of Object.entries(convertedLeadSources)) {
    if (!channelMap[slug]) {
      const found = Object.values(SOURCE_CHANNEL_MAP).find(s => s.slug === slug)
      channelMap[slug] = { name: found?.name ?? slug, slug, leads: 0, vendas: 0, receita: 0, conversao: 0 }
    }
    channelMap[slug].vendas += data.count
    channelMap[slug].receita += data.revenue
  }

  // Calculate conversion rates
  for (const ch of Object.values(channelMap)) {
    ch.conversao = ch.leads > 0 ? Math.round((ch.vendas / ch.leads) * 10000) / 100 : 0
  }

  // Sort by leads desc
  const channels = Object.values(channelMap).sort((a, b) => b.leads - a.leads)

  return { channels }
}
