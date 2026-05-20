'use client'

import { useState, useCallback } from 'react'
import { BarChart3, Loader2, Calculator, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface MarketStats {
  totalListings: number
  avgPrice: number | null
  avgPricePerSqm: number | null
  medianPricePerSqm: number | null
  byType: { type: string; count: number; avgPrice: number | null }[]
  byNeighborhood: { neighborhood: string; count: number; avgPricePerSqm: number | null }[]
  priceBuckets: { range: string; count: number }[]
}
interface Estimate {
  estimate: number | null; low: number | null; high: number | null
  pricePerSqm: number | null; comparableCount: number; basis: string
}

const brl = (n: number | null) =>
  n != null && n > 0 ? `R$ ${Math.round(n).toLocaleString('pt-BR')}` : '—'

const PROPERTY_TYPES = ['HOUSE', 'APARTMENT', 'LAND', 'FARM', 'COMMERCIAL', 'STORE']

export default function MarketPage() {
  const { getValidToken } = useAuth()
  const [filters, setFilters] = useState({ city: 'Franca', neighborhood: '', type: '', purpose: 'SALE' })
  const [stats, setStats] = useState<MarketStats | null>(null)
  const [loading, setLoading] = useState(false)
  // Estimator
  const [est, setEst] = useState({ city: 'Franca', neighborhood: '', type: '', area: '', bedrooms: '', purpose: 'SALE' })
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [estLoading, setEstLoading] = useState(false)

  const token = useCallback(async () => {
    const t = await getValidToken()
    if (!t) throw new Error('Sessão expirada.')
    return t
  }, [getValidToken])

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams()
      if (filters.city) q.set('city', filters.city)
      if (filters.neighborhood) q.set('neighborhood', filters.neighborhood)
      if (filters.type) q.set('type', filters.type)
      if (filters.purpose) q.set('purpose', filters.purpose)
      const res = await fetch(`${API_URL}/api/v1/market/stats?${q}`, {
        headers: { Authorization: `Bearer ${await token()}` },
      })
      const j = await res.json()
      setStats(j.data ?? null)
    } catch { setStats(null) }
    finally { setLoading(false) }
  }, [filters, token])

  // Initial load
  if (stats === null && !loading) {
    void loadStats()
  }

  async function runEstimate() {
    if (!est.area || Number(est.area) <= 0) return
    setEstLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/market/estimate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: est.city,
          neighborhood: est.neighborhood || undefined,
          type: est.type || undefined,
          area: Number(est.area),
          bedrooms: est.bedrooms ? Number(est.bedrooms) : undefined,
          purpose: est.purpose,
        }),
      })
      const j = await res.json()
      setEstimate(j.data ?? null)
    } catch { setEstimate(null) }
    finally { setEstLoading(false) }
  }

  const maxBucket = Math.max(1, ...(stats?.priceBuckets ?? []).map(b => b.count))
  const input = 'rounded-md border border-gray-700 bg-gray-900 px-2.5 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none'

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6 sm:px-6 flex items-center gap-3">
          <BarChart3 size={26} className="text-amber-400" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold">Radar de Mercado</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-gray-400">
              Inteligência de preços por bairro e precificador automático
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 space-y-5">
        {/* Filters */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-[10px] text-gray-500">Cidade</label>
            <input value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className={`${input} w-32`} />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500">Bairro</label>
            <input value={filters.neighborhood} onChange={(e) => setFilters({ ...filters, neighborhood: e.target.value })}
              placeholder="Todos" className={`${input} w-40`} />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500">Tipo</label>
            <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} className={`${input} w-36`}>
              <option value="">Todos</option>
              {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500">Finalidade</label>
            <select value={filters.purpose} onChange={(e) => setFilters({ ...filters, purpose: e.target.value })} className={`${input} w-28`}>
              <option value="SALE">Venda</option>
              <option value="RENT">Aluguel</option>
            </select>
          </div>
          <button onClick={loadStats}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500">
            <RefreshCw size={13} /> Atualizar
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-amber-400" /></div>
        ) : stats ? (
          <>
            {/* Headline cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Imóveis ativos"     value={stats.totalListings.toLocaleString('pt-BR')} />
              <Stat label="Preço médio"        value={brl(stats.avgPrice)} />
              <Stat label="Preço médio / m²"   value={brl(stats.avgPricePerSqm)} />
              <Stat label="Mediana preço / m²" value={brl(stats.medianPricePerSqm)} />
            </div>

            {/* By neighborhood + by type */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                <h2 className="text-sm font-semibold mb-2">Bairros por preço / m²</h2>
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {stats.byNeighborhood.slice(0, 15).map(n => (
                    <div key={n.neighborhood} className="flex items-center justify-between border-b border-gray-800 py-1.5">
                      <span className="text-sm text-white">{n.neighborhood}</span>
                      <div className="text-right">
                        <p className="text-sm font-medium text-amber-400">{brl(n.avgPricePerSqm)}</p>
                        <p className="text-[10px] text-gray-500">{n.count} imóvel(is)</p>
                      </div>
                    </div>
                  ))}
                  {stats.byNeighborhood.length === 0 && <p className="text-sm text-gray-500">Sem dados.</p>}
                </div>
              </div>

              <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                <h2 className="text-sm font-semibold mb-2">Distribuição de preços</h2>
                <div className="space-y-2">
                  {stats.priceBuckets.map(b => (
                    <div key={b.range}>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300">{b.range}</span>
                        <span className="text-gray-500">{b.count}</span>
                      </div>
                      <div className="mt-0.5 h-2 bg-gray-800 rounded">
                        <div className="h-full bg-amber-500 rounded"
                          style={{ width: `${(b.count / maxBucket) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <h2 className="text-sm font-semibold mt-4 mb-2">Por tipo de imóvel</h2>
                <div className="space-y-1">
                  {stats.byType.slice(0, 6).map(t => (
                    <div key={t.type} className="flex items-center justify-between text-xs border-b border-gray-800 py-1">
                      <span className="text-gray-300">{t.type}</span>
                      <span className="text-gray-500">{t.count} · {brl(t.avgPrice)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">Não foi possível carregar.</p>
        )}

        {/* Precificador */}
        <div className="rounded-xl border border-amber-500/20 bg-gray-900/40 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calculator size={18} className="text-amber-400" />
            <h2 className="font-semibold">Precificador — estimar valor</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div><label className="block text-[10px] text-gray-500">Cidade *</label>
              <input value={est.city} onChange={(e) => setEst({ ...est, city: e.target.value })} className={input} /></div>
            <div><label className="block text-[10px] text-gray-500">Bairro</label>
              <input value={est.neighborhood} onChange={(e) => setEst({ ...est, neighborhood: e.target.value })} className={input} /></div>
            <div><label className="block text-[10px] text-gray-500">Tipo</label>
              <select value={est.type} onChange={(e) => setEst({ ...est, type: e.target.value })} className={input}>
                <option value="">Qualquer</option>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select></div>
            <div><label className="block text-[10px] text-gray-500">Finalidade</label>
              <select value={est.purpose} onChange={(e) => setEst({ ...est, purpose: e.target.value })} className={input}>
                <option value="SALE">Venda</option><option value="RENT">Aluguel</option>
              </select></div>
            <div><label className="block text-[10px] text-gray-500">Área (m²) *</label>
              <input type="number" value={est.area} onChange={(e) => setEst({ ...est, area: e.target.value })} className={input} /></div>
            <div><label className="block text-[10px] text-gray-500">Quartos</label>
              <input type="number" value={est.bedrooms} onChange={(e) => setEst({ ...est, bedrooms: e.target.value })} className={input} /></div>
            <button onClick={runEstimate} disabled={!est.area || Number(est.area) <= 0 || estLoading}
              className="col-span-2 sm:col-span-2 rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50 mt-3">
              {estLoading ? 'Calculando...' : 'Estimar valor'}
            </button>
          </div>

          {estimate && (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              {estimate.estimate ? (
                <>
                  <p className="text-[10px] uppercase tracking-wider text-amber-200/70">Valor estimado</p>
                  <p className="text-2xl font-bold text-amber-300">{brl(estimate.estimate)}</p>
                  <p className="text-xs text-white/60 mt-1">
                    Faixa: {brl(estimate.low)} – {brl(estimate.high)} ·
                    {' '}{brl(estimate.pricePerSqm)} / m² ·
                    {' '}{estimate.comparableCount} comparável(is) ·
                    {' '}base {estimate.basis === 'tight' ? 'precisa' : estimate.basis === 'broad' ? 'ampliada (cidade)' : 'insuficiente'}
                  </p>
                </>
              ) : (
                <p className="text-sm text-white/60">
                  Comparáveis insuficientes para estimar — tente sem o bairro/tipo, ou em outra cidade.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  )
}
