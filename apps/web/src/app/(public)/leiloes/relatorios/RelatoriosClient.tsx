'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, Search, MapPin, TrendingDown, Home } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

function fmt(v: number | null | undefined): string {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v))
}

interface NumStats { count: number; min: number; avg: number; median: number; max: number }
interface Report {
  total: number
  message?: string
  counts?: { sold: number; occupied: number; byStatus: Record<string, number>; byPropertyType: Record<string, number> }
  values?: {
    appraisalValue: NumStats | null; minimumBid: NumStats | null; soldValue: NumStats | null
    pricePerM2: NumStats | null; discountPercent: NumStats | null; opportunityScore: NumStats | null
  }
  topNeighborhoods?: { neighborhood: string; count: number; avgValue: number | null }[]
}

const TYPE_LABEL: Record<string, string> = {
  HOUSE: 'Casas', APARTMENT: 'Apartamentos', LAND: 'Terrenos', COMMERCIAL: 'Comerciais', FARM: 'Rurais',
}

function StatRow({ label, stats, suffix }: { label: string; stats: NumStats | null; suffix?: string }) {
  if (!stats) return null
  const val = (n: number) => (suffix ? `${n}${suffix}` : fmt(n))
  return (
    <div className="grid grid-cols-5 gap-2 py-2 border-b text-sm items-center">
      <div className="col-span-1 text-gray-600">{label}</div>
      <div className="text-center"><div className="text-xs text-gray-400">mín</div><div className="font-medium">{val(stats.min)}</div></div>
      <div className="text-center"><div className="text-xs text-gray-400">médio</div><div className="font-medium">{val(stats.avg)}</div></div>
      <div className="text-center"><div className="text-xs text-gray-400">mediana</div><div className="font-bold text-gray-800">{val(stats.median)}</div></div>
      <div className="text-center"><div className="text-xs text-gray-400">máx</div><div className="font-medium">{val(stats.max)}</div></div>
    </div>
  )
}

export default function RelatoriosClient() {
  const [city, setCity] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [category, setCategory] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [soldOnly, setSoldOnly] = useState(false)
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    setReport(null)
    const p = new URLSearchParams()
    if (city) p.set('city', city)
    if (neighborhood) p.set('neighborhood', neighborhood)
    if (category) p.set('category', category)
    if (propertyType) p.set('propertyType', propertyType)
    if (soldOnly) p.set('soldOnly', 'true')
    try {
      const r = await fetch(`${API_URL}/api/v1/auctions/report?${p.toString()}`)
      if (r.ok) setReport(await r.json())
    } catch { /* best-effort */ }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Link href="/leiloes" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-4 h-4" /> Voltar aos Leilões
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-1">
          <BarChart3 className="w-6 h-6" style={{ color: '#C9A84C' }} /> Relatórios de Leilões
        </h1>
        <p className="text-gray-500 mb-6">Valores por localização e tipo — quanto arrematou, lance mínimo, avaliação, desconto e preço/m².</p>

        {/* Filtros */}
        <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade (ex.: Franca)"
              className="px-3 py-2 border rounded-lg text-base" />
            <input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro (ex.: Centro)"
              className="px-3 py-2 border rounded-lg text-base" />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 border rounded-lg text-base bg-white">
              <option value="">Categoria (todas)</option>
              <option value="RESIDENTIAL">Residencial</option>
              <option value="COMMERCIAL">Comercial</option>
            </select>
            <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="px-3 py-2 border rounded-lg text-base bg-white">
              <option value="">Tipo (todos)</option>
              <option value="HOUSE">Casa</option>
              <option value="APARTMENT">Apartamento</option>
              <option value="LAND">Terreno</option>
              <option value="COMMERCIAL">Comercial</option>
            </select>
          </div>
          <div className="flex items-center justify-between mt-3">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={soldOnly} onChange={(e) => setSoldOnly(e.target.checked)} /> Só arrematados
            </label>
            <button onClick={run} disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-white font-medium disabled:opacity-60"
              style={{ background: '#1B2B5B' }}>
              <Search className="w-4 h-4" /> {loading ? 'Consultando…' : 'Gerar relatório'}
            </button>
          </div>
        </div>

        {report && report.total === 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm text-center text-gray-500">
            {report.message || 'Nenhum leilão encontrado com esses filtros.'}
          </div>
        )}

        {report && report.total > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <div className="text-2xl font-bold text-gray-800">{report.total}</div>
                <div className="text-xs text-gray-500">leilões</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <div className="text-2xl font-bold text-green-600">{report.counts?.sold ?? 0}</div>
                <div className="text-xs text-gray-500">arrematados</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <div className="text-2xl font-bold text-gray-800">{report.values?.discountPercent?.median ?? '—'}%</div>
                <div className="text-xs text-gray-500">desconto (mediana)</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                <div className="text-2xl font-bold text-gray-800">{report.values?.pricePerM2 ? fmt(report.values.pricePerM2.median) : '—'}</div>
                <div className="text-xs text-gray-500">preço/m² (mediana)</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" style={{ color: '#C9A84C' }} /> Valores
              </h3>
              <StatRow label="Arremate" stats={report.values?.soldValue ?? null} />
              <StatRow label="Lance mínimo" stats={report.values?.minimumBid ?? null} />
              <StatRow label="Avaliação" stats={report.values?.appraisalValue ?? null} />
              <StatRow label="Desconto" stats={report.values?.discountPercent ?? null} suffix="%" />
            </div>

            {report.counts?.byPropertyType && Object.keys(report.counts.byPropertyType).length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Home className="w-5 h-5" style={{ color: '#C9A84C' }} /> Por tipo
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(report.counts.byPropertyType).map(([t, n]) => (
                    <span key={t} className="px-3 py-1.5 bg-gray-50 rounded-lg text-sm">
                      {TYPE_LABEL[t] || t}: <b>{n}</b>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {report.topNeighborhoods && report.topNeighborhoods.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5" style={{ color: '#C9A84C' }} /> Por bairro
                </h3>
                <div className="space-y-2">
                  {report.topNeighborhoods.map((n, i) => (
                    <div key={i} className="flex items-center justify-between text-sm border-b last:border-0 py-1.5">
                      <span className="text-gray-700">{n.neighborhood}</span>
                      <span className="text-gray-500">{n.count} · valor médio <b className="text-gray-800">{fmt(n.avgValue)}</b></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
