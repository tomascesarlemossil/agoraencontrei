'use client'

import { useState, useEffect } from 'react'
import { Activity, Database, TrendingUp, AlertTriangle, RefreshCw, BarChart3, MapPin, Clock } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

// Fallback: consulta Supabase diretamente se API Railway estiver fora
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oenbzvxcsgyzqjtlovdq.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

interface Analytics {
  summary: {
    totalActive: number
    totalValueMinBid: number
    totalValueAppraisal: number
    avgMinBid: number
    avgDiscount: number
  }
  bySource: { source: string; count: number; avgDiscount: number; avgScore: number }[]
  byCity: { city: string; state: string; count: number; avgScore: number; avgDiscount: number; cheapest: number }[]
  scraperRuns: { id: string; source: string; status: string; startedAt: string; finishedAt: string | null; itemsFound: number; itemsCreated: number; errorMessage: string | null }[]
  blockedSources: { source: string; url: string; error: string; at: string }[]
  topOpportunities: { id: string; title: string; city: string; state: string; source: string; minimumBid: number; discountPercent: number; opportunityScore: number }[]
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function sourceColor(source: string): string {
  const colors: Record<string, string> = {
    CAIXA: '#005CA9', BANCO_DO_BRASIL: '#FDD835', BRADESCO: '#CC092F',
    ITAU: '#EC7000', SANTANDER: '#EC0000', JUDICIAL: '#6B7280', EXTRAJUDICIAL: '#8B5CF6',
  }
  return colors[source] || '#9CA3AF'
}

function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    CAIXA: 'Caixa', BANCO_DO_BRASIL: 'BB', BRADESCO: 'Bradesco',
    ITAU: 'Itaú', SANTANDER: 'Santander', JUDICIAL: 'Judicial', EXTRAJUDICIAL: 'Extrajudicial',
  }
  return labels[source] || source
}

async function fetchFromSupabaseDirect(): Promise<Analytics | null> {
  if (!SUPABASE_ANON_KEY) return null
  try {
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }

    // Fetch auctions count
    const countRes = await fetch(`${SUPABASE_URL}/rest/v1/auctions?select=id,source,city,state,"minimumBid","appraisalValue","discountPercent","opportunityScore"`, { headers })
    const auctions = countRes.ok ? await countRes.json() : []

    // Fetch scraper runs
    const runsRes = await fetch(`${SUPABASE_URL}/rest/v1/scraper_runs?select=*&order=startedAt.desc&limit=20`, { headers })
    const runs = runsRes.ok ? await runsRes.json() : []

    // Aggregate locally
    const bySourceMap = new Map<string, { count: number; discounts: number[]; scores: number[] }>()
    const byCityMap = new Map<string, { count: number; scores: number[]; discounts: number[]; minBid: number }>()

    let totalBid = 0, totalAppr = 0, discounts: number[] = []

    for (const a of auctions) {
      // By source
      const s = bySourceMap.get(a.source) || { count: 0, discounts: [], scores: [] }
      s.count++
      if (a.discountPercent) s.discounts.push(a.discountPercent)
      if (a.opportunityScore) s.scores.push(a.opportunityScore)
      bySourceMap.set(a.source, s)

      // By city
      const key = `${a.city}-${a.state}`
      const c = byCityMap.get(key) || { count: 0, scores: [], discounts: [], minBid: Infinity }
      c.count++
      if (a.opportunityScore) c.scores.push(a.opportunityScore)
      if (a.discountPercent) c.discounts.push(a.discountPercent)
      if (a.minimumBid && a.minimumBid < c.minBid) c.minBid = a.minimumBid
      byCityMap.set(key, c)

      if (a.minimumBid) totalBid += Number(a.minimumBid)
      if (a.appraisalValue) totalAppr += Number(a.appraisalValue)
      if (a.discountPercent) discounts.push(a.discountPercent)
    }

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

    return {
      summary: {
        totalActive: auctions.length,
        totalValueMinBid: totalBid,
        totalValueAppraisal: totalAppr,
        avgMinBid: auctions.length ? totalBid / auctions.length : 0,
        avgDiscount: avg(discounts),
      },
      bySource: Array.from(bySourceMap.entries()).map(([source, d]) => ({
        source, count: d.count,
        avgDiscount: Number(avg(d.discounts).toFixed(1)),
        avgScore: Number(avg(d.scores).toFixed(0)),
      })).sort((a, b) => b.count - a.count),
      byCity: Array.from(byCityMap.entries()).map(([key, d]) => {
        const [city, state] = key.split('-')
        return {
          city, state, count: d.count,
          avgScore: Number(avg(d.scores).toFixed(0)),
          avgDiscount: Number(avg(d.discounts).toFixed(1)),
          cheapest: d.minBid === Infinity ? 0 : d.minBid,
        }
      }).sort((a, b) => b.count - a.count),
      scraperRuns: runs.map((r: any) => ({
        id: r.id, source: r.source, status: r.status,
        startedAt: r.startedAt, finishedAt: r.finishedAt,
        itemsFound: r.itemsFound, itemsCreated: r.itemsCreated,
        errorMessage: r.errorMessage,
      })),
      blockedSources: runs.filter((r: any) => r.status === 'FAILED').map((r: any) => ({
        source: r.source, url: r.sourceUrl, error: r.errorMessage?.substring(0, 200), at: r.startedAt,
      })),
      topOpportunities: auctions
        .filter((a: any) => a.opportunityScore >= 70)
        .sort((a: any, b: any) => (b.opportunityScore || 0) - (a.opportunityScore || 0))
        .slice(0, 10)
        .map((a: any) => ({
          id: a.id, title: `${a.source} - ${a.city}/${a.state}`,
          city: a.city, state: a.state, source: a.source,
          minimumBid: Number(a.minimumBid), discountPercent: a.discountPercent,
          opportunityScore: a.opportunityScore,
        })),
    }
  } catch {
    return null
  }
}

export default function AuctionMonitor() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [source, setSource] = useState<'api' | 'supabase' | 'none'>('none')

  const fetchData = async () => {
    setLoading(true)
    // Try Railway API first
    try {
      const res = await fetch(`${API_URL}/api/v1/auctions/analytics`)
      if (res.ok) {
        setData(await res.json())
        setSource('api')
        setLoading(false)
        return
      }
    } catch {}

    // Fallback: Supabase direct
    const sbData = await fetchFromSupabaseDirect()
    if (sbData) {
      setData(sbData)
      setSource('supabase')
    }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-white rounded-xl shadow-2xl border p-4 w-80 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
        <div className="h-8 bg-gray-200 rounded mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    )
  }

  if (!data) return null

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-50 bg-[#1B2B5B] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-2xl hover:scale-110 transition"
      >
        <Activity className="w-6 h-6" />
        {data.summary.totalActive > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {data.summary.totalActive}
          </span>
        )}
      </button>
    )
  }

  const maxCount = Math.max(...data.bySource.map(s => s.count), 1)

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-xl shadow-2xl border w-96 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-[#1B2B5B] text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#C9A84C]" />
          <span className="font-semibold text-sm">Monitor de Leilões</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-white/20">
            {source === 'api' ? 'API' : 'Supabase'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={fetchData} className="p-1 hover:bg-white/20 rounded">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setCollapsed(true)} className="p-1 hover:bg-white/20 rounded text-lg leading-none">
            ×
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2 p-3">
        <div className="bg-blue-50 rounded-lg p-2 text-center">
          <Database className="w-4 h-4 mx-auto text-blue-600 mb-1" />
          <div className="text-xl font-bold text-blue-800">{data.summary.totalActive}</div>
          <div className="text-[10px] text-blue-600">Pescados</div>
        </div>
        <div className="bg-green-50 rounded-lg p-2 text-center">
          <TrendingUp className="w-4 h-4 mx-auto text-green-600 mb-1" />
          <div className="text-xl font-bold text-green-800">{data.summary.avgDiscount.toFixed(1)}%</div>
          <div className="text-[10px] text-green-600">Desc. Médio</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-2 text-center">
          <BarChart3 className="w-4 h-4 mx-auto text-yellow-600 mb-1" />
          <div className="text-sm font-bold text-yellow-800">{formatCurrency(data.summary.totalValueMinBid)}</div>
          <div className="text-[10px] text-yellow-600">Valor Total</div>
        </div>
      </div>

      {/* Chart: Desconto Médio por Fonte */}
      <div className="px-3 pb-2">
        <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
          <BarChart3 className="w-3.5 h-3.5" /> Imóveis por Fonte
        </h4>
        <div className="space-y-1.5">
          {data.bySource.map(s => (
            <div key={s.source} className="flex items-center gap-2 text-xs">
              <div className="w-16 text-right font-medium text-gray-700 truncate">{sourceLabel(s.source)}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden relative">
                <div
                  className="h-full rounded-full flex items-center justify-end px-1.5 text-white text-[10px] font-bold transition-all"
                  style={{
                    width: `${Math.max((s.count / maxCount) * 100, 15)}%`,
                    backgroundColor: sourceColor(s.source),
                  }}
                >
                  {s.count}
                </div>
              </div>
              <div className="w-10 text-right text-gray-500">{s.avgDiscount}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Cities */}
      <div className="px-3 pb-2 border-t pt-2">
        <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" /> Score por Cidade
        </h4>
        <div className="space-y-1">
          {data.byCity.slice(0, 8).map(c => (
            <div key={`${c.city}-${c.state}`} className="flex items-center justify-between text-xs">
              <span className="text-gray-700">{c.city}/{c.state}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">{c.count} imóveis</span>
                <span className={`font-bold ${c.avgScore >= 80 ? 'text-green-600' : c.avgScore >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {c.avgScore}/100
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scraper Runs */}
      <div className="px-3 pb-2 border-t pt-2">
        <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> Últimos Scrapers
        </h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {data.scraperRuns.slice(0, 10).map(r => (
            <div key={r.id} className="flex items-center justify-between text-xs">
              <span className="text-gray-700">{sourceLabel(r.source)}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">
                  {r.itemsFound > 0 ? `${r.itemsFound} → ${r.itemsCreated} novos` : '0'}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  r.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                  r.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                  r.status === 'RUNNING' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {r.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Blocked Sources Warning */}
      {data.blockedSources.length > 0 && (
        <div className="px-3 pb-3 border-t pt-2">
          <h4 className="text-xs font-semibold text-red-600 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Fontes com Erro
          </h4>
          {data.blockedSources.map((b, i) => (
            <div key={i} className="text-xs text-red-500 bg-red-50 rounded p-1.5 mb-1">
              <strong>{b.source}</strong>: {b.error || 'Sem detalhes'}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
