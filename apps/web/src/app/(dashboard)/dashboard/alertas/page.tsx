'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Loader2, RefreshCw, Phone, Mail, MapPin, Check, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface Alert {
  id: string
  email: string
  name: string | null
  phone: string | null
  companyId: string | null
  city: string | null
  neighborhood: string | null
  type: string | null
  purpose: string | null
  minPrice: string | null
  maxPrice: string | null
  bedrooms: number | null
  active: boolean
  lastMatchedAt: string | null
  createdAt: string
}

const TYPE_LABEL: Record<string, string> = {
  HOUSE: 'Casa', APARTMENT: 'Apartamento', LAND: 'Terreno', FARM: 'Sítio',
  RANCH: 'Fazenda', WAREHOUSE: 'Galpão', OFFICE: 'Sala', STORE: 'Comercial',
  STUDIO: 'Studio', PENTHOUSE: 'Cobertura', CONDO: 'Condomínio', KITNET: 'Kitnet',
}

function fmtPrice(v: string | null) {
  if (!v) return null
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function AlertasPage() {
  const { getValidToken } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getValidToken()
      const q = new URLSearchParams({ limit: '200' })
      if (filter === 'active') q.set('active', 'true')
      if (filter === 'inactive') q.set('active', 'false')
      const res = await fetch(`${API_URL}/api/v1/alerts?${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const j = await res.json()
      setAlerts(j.data ?? [])
    } catch { setAlerts([]) }
    finally { setLoading(false) }
  }, [filter, getValidToken])

  useEffect(() => { load() }, [load])

  const activeCount = alerts.filter(a => a.active).length
  const withMatch = alerts.filter(a => a.lastMatchedAt).length

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6 sm:px-6 flex items-center gap-3">
          <Bell size={24} className="text-amber-400" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold">Alertas de Match</h1>
            <p className="mt-0.5 text-xs sm:text-sm text-gray-400">
              Clientes esperando por imóveis com perfil específico — quando um match é encontrado, eles são avisados automaticamente
            </p>
          </div>
          <button onClick={load}
            className="flex items-center gap-1.5 rounded-lg border border-gray-700 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
            <div className="text-[10px] uppercase tracking-wider text-gray-500">Alertas ativos</div>
            <p className="mt-1 text-xl font-bold text-white">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3">
            <div className="text-[10px] uppercase tracking-wider text-gray-500">Já receberam match</div>
            <p className="mt-1 text-xl font-bold text-emerald-300">{withMatch}</p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-3 col-span-2 sm:col-span-1">
            <div className="text-[10px] uppercase tracking-wider text-gray-500">Total cadastrado</div>
            <p className="mt-1 text-xl font-bold text-white">{alerts.length}</p>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-1">
          {([['active', 'Ativos'], ['inactive', 'Cancelados'], ['all', 'Todos']] as const).map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`rounded-full px-3 py-1 text-xs ${filter === v ? 'bg-amber-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-amber-400" /></div>
        ) : alerts.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-600">Nenhum alerta cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {alerts.map(a => {
              const criteria: string[] = []
              if (a.type) criteria.push(TYPE_LABEL[a.type] ?? a.type)
              if (a.purpose) criteria.push(a.purpose === 'RENT' ? 'Alugar' : 'Comprar')
              if (a.bedrooms) criteria.push(`${a.bedrooms}+ qtos`)
              const min = fmtPrice(a.minPrice)
              const max = fmtPrice(a.maxPrice)
              if (min && max) criteria.push(`${min}–${max}`)
              else if (max) criteria.push(`até ${max}`)
              else if (min) criteria.push(`a partir de ${min}`)
              const where = [a.neighborhood, a.city].filter(Boolean).join(', ')

              return (
                <div key={a.id} className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white">{a.name ?? a.email.split('@')[0]}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${a.active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-gray-700/40 text-gray-400'}`}>
                          {a.active ? 'Ativo' : 'Cancelado'}
                        </span>
                        {a.lastMatchedAt && (
                          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                            <Check size={10} className="inline mr-0.5" /> match em {fmtDate(a.lastMatchedAt)}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                        <span className="inline-flex items-center gap-1"><Mail size={11} /> {a.email}</span>
                        {a.phone && <span className="inline-flex items-center gap-1"><Phone size={11} /> {a.phone}</span>}
                        {where && <span className="inline-flex items-center gap-1"><MapPin size={11} /> {where}</span>}
                      </div>
                      {criteria.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {criteria.map((c, i) => (
                            <span key={i} className="rounded-md bg-gray-800 px-2 py-0.5 text-[10px] text-gray-300">{c}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-[10px] text-gray-500 flex-shrink-0">
                      {fmtDate(a.createdAt)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
