'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeft, TrendingUp, DollarSign, MapPin, Building, Bed, Bath, Car,
  SquareIcon, Shield, AlertTriangle, CheckCircle, X, Loader2, BarChart3,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-669c.up.railway.app'

interface AuctionComparison {
  id: string
  title: string
  slug: string
  source: string
  status: string
  propertyType: string
  city: string | null
  state: string | null
  neighborhood: string | null
  totalArea: number | null
  bedrooms: number | null
  bathrooms: number | null
  parkingSpaces: number | null
  appraisalValue: number | null
  minimumBid: number | null
  discountPercent: number | null
  opportunityScore: number | null
  estimatedROI: number | null
  occupation: string | null
  hasDebts: boolean | null
  financingAvailable: boolean
  fgtsAllowed: boolean
  coverImage: string | null
  streetViewUrl: string | null
  auctionDate: string | null
  bankName: string | null
  analysis: {
    pricePerM2: number | null
    totalCosts: number
    totalInvestment: number
    potentialProfit: number
    roiPercent: number
    monthlyRent: number
    capRate: number
    yieldComparison: {
      auction: number
      selic: number
      cdi: number
      savings: number
      advantage: number
    }
    riskFactors: {
      occupied: boolean
      hasDebts: boolean
      lowScore: boolean
      noFinancing: boolean
    }
  }
}

function fmt(v: number | null | undefined): string {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return '—'
  return `${v.toFixed(1)}%`
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-gray-400">—</span>
  const color = score >= 70 ? 'text-emerald-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'
  return <span className={`text-lg font-bold ${color}`}>{score}/100</span>
}

function RiskBadge({ label, risky }: { label: string; risky: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${risky ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
      {risky ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
      {label}
    </span>
  )
}

function YieldBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const width = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className={color}>{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color.replace('text-', 'bg-')}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

export default function ComparativoPage() {
  const searchParams = useSearchParams()
  const ids = searchParams.get('ids')?.split(',') || []
  const [data, setData] = useState<AuctionComparison[] | null>(null)
  const [macroRates, setMacroRates] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (ids.length < 2) {
      setError('Selecione pelo menos 2 leilões para comparar.')
      setLoading(false)
      return
    }
    fetch(`${API_URL}/api/v1/auctions/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setData(res.data.auctions)
          setMacroRates(res.data.macroRates)
        } else {
          setError(res.message || 'Erro ao comparar.')
        }
      })
      .catch(() => setError('Falha ao carregar comparação.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <p className="text-white text-lg mb-2">{error || 'Erro inesperado.'}</p>
          <Link href="/leiloes" className="text-yellow-400 hover:underline text-sm">
            Voltar para Leilões
          </Link>
        </div>
      </div>
    )
  }

  const maxROI = Math.max(...data.map(a => Math.max(a.analysis.roiPercent, macroRates?.selic || 14)))

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/leiloes">
            <button className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-yellow-400" />
              Comparativo de Leilões
            </h1>
            <p className="text-sm text-white/50 mt-1">
              {data.length} imóveis • Análise de ROI vs CDI/Selic/Poupança
            </p>
          </div>
        </div>

        {/* Main comparison table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-white/40 font-medium w-44">Critério</th>
                {data.map(a => (
                  <th key={a.id} className="text-center py-3 px-4 min-w-[220px]">
                    <div className="space-y-2">
                      {(a.coverImage || a.streetViewUrl) && (
                        <img
                          src={a.coverImage || a.streetViewUrl || ''}
                          alt={a.title}
                          className="w-full h-28 object-cover rounded-lg"
                        />
                      )}
                      <Link href={`/leiloes/${a.slug}`} className="text-yellow-400 hover:underline text-sm font-bold line-clamp-2">
                        {a.title}
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {/* Location */}
              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 text-white/60 flex items-center gap-2"><MapPin className="w-4 h-4" /> Localização</td>
                {data.map(a => (
                  <td key={a.id} className="py-3 px-4 text-center text-white">
                    {[a.neighborhood, a.city, a.state].filter(Boolean).join(', ') || '—'}
                  </td>
                ))}
              </tr>

              {/* Property Type */}
              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 text-white/60 flex items-center gap-2"><Building className="w-4 h-4" /> Tipo</td>
                {data.map(a => (
                  <td key={a.id} className="py-3 px-4 text-center text-white">{a.propertyType}</td>
                ))}
              </tr>

              {/* Area + Rooms */}
              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 text-white/60 flex items-center gap-2"><SquareIcon className="w-4 h-4" /> Área / Quartos</td>
                {data.map(a => (
                  <td key={a.id} className="py-3 px-4 text-center text-white">
                    {a.totalArea ? `${a.totalArea}m²` : '—'} • {a.bedrooms ?? 0}q • {a.bathrooms ?? 0}b • {a.parkingSpaces ?? 0}v
                  </td>
                ))}
              </tr>

              {/* Separator: Values */}
              <tr><td colSpan={data.length + 1} className="py-2 px-4 text-xs text-yellow-400 font-bold uppercase tracking-wider bg-yellow-400/5">Valores</td></tr>

              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 text-white/60">Avaliação</td>
                {data.map(a => <td key={a.id} className="py-3 px-4 text-center text-white font-medium">{fmt(a.appraisalValue)}</td>)}
              </tr>
              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 text-white/60">Lance Mínimo</td>
                {data.map(a => <td key={a.id} className="py-3 px-4 text-center text-emerald-400 font-bold text-lg">{fmt(a.minimumBid)}</td>)}
              </tr>
              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 text-white/60">Desconto</td>
                {data.map(a => (
                  <td key={a.id} className="py-3 px-4 text-center">
                    <span className={`text-lg font-bold ${(a.discountPercent ?? 0) >= 40 ? 'text-emerald-400' : (a.discountPercent ?? 0) >= 20 ? 'text-yellow-400' : 'text-white'}`}>
                      {fmtPct(a.discountPercent)}
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 text-white/60">R$/m²</td>
                {data.map(a => <td key={a.id} className="py-3 px-4 text-center text-white">{a.analysis.pricePerM2 ? fmt(a.analysis.pricePerM2) : '—'}</td>)}
              </tr>

              {/* Separator: ROI */}
              <tr><td colSpan={data.length + 1} className="py-2 px-4 text-xs text-emerald-400 font-bold uppercase tracking-wider bg-emerald-400/5">Retorno sobre Investimento</td></tr>

              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 text-white/60">Investimento Total</td>
                {data.map(a => <td key={a.id} className="py-3 px-4 text-center text-white font-medium">{fmt(a.analysis.totalInvestment)}</td>)}
              </tr>
              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 text-white/60">Custos (ITBI+Reg+Adv)</td>
                {data.map(a => <td key={a.id} className="py-3 px-4 text-center text-red-400">{fmt(a.analysis.totalCosts)}</td>)}
              </tr>
              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 text-white/60">Lucro Potencial</td>
                {data.map(a => (
                  <td key={a.id} className="py-3 px-4 text-center">
                    <span className={`font-bold text-lg ${a.analysis.potentialProfit > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fmt(a.analysis.potentialProfit)}
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-white/5 bg-white/5">
                <td className="py-3 px-4 text-white font-bold">ROI (%)</td>
                {data.map(a => (
                  <td key={a.id} className="py-3 px-4 text-center">
                    <span className={`text-2xl font-black ${a.analysis.roiPercent > 30 ? 'text-emerald-400' : a.analysis.roiPercent > 10 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {fmtPct(a.analysis.roiPercent)}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Separator: Yield Comparison */}
              <tr><td colSpan={data.length + 1} className="py-2 px-4 text-xs text-blue-400 font-bold uppercase tracking-wider bg-blue-400/5">ROI vs Renda Fixa</td></tr>

              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 text-white/60">vs Selic ({macroRates?.selic}%)</td>
                {data.map(a => (
                  <td key={a.id} className="py-3 px-4">
                    <YieldBar label="Leilão" value={a.analysis.roiPercent} max={maxROI} color="text-yellow-400" />
                    <YieldBar label="Selic" value={macroRates?.selic || 14.25} max={maxROI} color="text-blue-400" />
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 text-white/60">Vantagem vs CDI</td>
                {data.map(a => (
                  <td key={a.id} className="py-3 px-4 text-center">
                    <span className={`text-lg font-bold ${a.analysis.yieldComparison.advantage > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {a.analysis.yieldComparison.advantage > 0 ? '+' : ''}{fmtPct(a.analysis.yieldComparison.advantage)}
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 text-white/60">Renda Mensal Est.</td>
                {data.map(a => <td key={a.id} className="py-3 px-4 text-center text-white">{fmt(a.analysis.monthlyRent)}/mês</td>)}
              </tr>
              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 text-white/60">Cap Rate</td>
                {data.map(a => <td key={a.id} className="py-3 px-4 text-center text-white">{fmtPct(a.analysis.capRate)}</td>)}
              </tr>

              {/* Separator: Risk */}
              <tr><td colSpan={data.length + 1} className="py-2 px-4 text-xs text-red-400 font-bold uppercase tracking-wider bg-red-400/5">Riscos e Score</td></tr>

              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 text-white/60">Score Oportunidade</td>
                {data.map(a => <td key={a.id} className="py-3 px-4 text-center"><ScoreBadge score={a.opportunityScore} /></td>)}
              </tr>
              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 text-white/60">Fatores de Risco</td>
                {data.map(a => (
                  <td key={a.id} className="py-3 px-4 text-center">
                    <div className="flex flex-wrap gap-1 justify-center">
                      <RiskBadge label="Ocupado" risky={a.analysis.riskFactors.occupied} />
                      <RiskBadge label="Dívidas" risky={a.analysis.riskFactors.hasDebts} />
                      <RiskBadge label="Financ." risky={a.analysis.riskFactors.noFinancing} />
                    </div>
                  </td>
                ))}
              </tr>

              {/* Dates */}
              <tr><td colSpan={data.length + 1} className="py-2 px-4 text-xs text-purple-400 font-bold uppercase tracking-wider bg-purple-400/5">Detalhes</td></tr>
              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 text-white/60">Data do Leilão</td>
                {data.map(a => <td key={a.id} className="py-3 px-4 text-center text-white">{fmtDate(a.auctionDate)}</td>)}
              </tr>
              <tr className="hover:bg-white/5">
                <td className="py-3 px-4 text-white/60">Fonte</td>
                {data.map(a => <td key={a.id} className="py-3 px-4 text-center text-white">{a.source} {a.bankName && `(${a.bankName})`}</td>)}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Best Pick */}
        {data.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-yellow-400/10 to-emerald-400/10 border border-yellow-400/30 rounded-2xl p-6 text-center">
            <TrendingUp className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-yellow-400 mb-2">Melhor Oportunidade</h3>
            <Link href={`/leiloes/${data[0].slug}`} className="text-white hover:text-yellow-400 transition-colors">
              <p className="text-lg font-semibold">{data[0].title}</p>
            </Link>
            <p className="text-white/60 mt-1">
              ROI de <span className="text-emerald-400 font-bold">{fmtPct(data[0].analysis.roiPercent)}</span>
              {' '}• Desconto de <span className="text-yellow-400 font-bold">{fmtPct(data[0].discountPercent)}</span>
              {' '}• <span className="text-blue-400 font-bold">{fmtPct(data[0].analysis.yieldComparison.advantage)}</span> acima do CDI
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
