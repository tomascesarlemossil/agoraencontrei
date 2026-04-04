'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import {
  FileText, Search, ChevronLeft, ChevronRight, ExternalLink,
  Receipt, RefreshCw, TrendingUp, Home, User, Calendar,
  DollarSign, Filter, Download, Eye, X, AlertCircle
} from 'lucide-react'

const NAVY = '#1B2B5B'
const GOLD = '#C9A84C'
const API  = process.env.NEXT_PUBLIC_API_URL ?? ''

const fmt = (v?: number | string | null) => {
  const n = Number(v)
  if (isNaN(n)) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

type DocType = 'BOLETO' | 'REAJUSTE' | 'EXTRATO' | 'FINANCEIRO' | 'IPTU'

interface FinDoc {
  id: string
  type: DocType
  category: string
  month?: string | null
  year?: number | null
  name: string
  publicUrl?: string | null
  client?: { id: string; name: string } | null
}

interface ContractHistory {
  id: string
  tenant?: { id: string; name: string; email?: string; phone?: string } | null
  property?: { id: string; address?: string; unit?: string } | null
  rentValue?: string | number | null
  adjustmentIndex?: string | null
  adjustmentPercent?: string | number | null
  startDate?: string | null
  status: string
  boletos: FinDoc[]
  reajustes: FinDoc[]
  ultimoReajuste?: FinDoc | null
}

interface BoletoListItem {
  id: string
  name: string
  type: string
  month?: string | null
  year?: number | null
  publicUrl?: string | null
  client?: { id: string; name: string; email?: string } | null
  contract?: { id: string; rentValue?: string | null; status?: string | null; isActive?: boolean } | null
  legacyRef?: string | null
}

type Tab = 'historico' | 'boletos' | 'reajustes' | 'iptu'

export default function HistoricoFinanceiroPage() {
  const { accessToken: token } = useAuth()
  const [tab, setTab] = useState<Tab>('historico')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [yearFilter, setYearFilter] = useState<string>('')
  const [monthFilter, setMonthFilter] = useState<string>('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const LIMIT = 20

  // ── Histórico por contrato ────────────────────────────────────────────────
  const { data: historico, isLoading: loadingHistorico, refetch: refetchHistorico } = useQuery({
    queryKey: ['historico-financeiro', token],
    queryFn: async () => {
      const r = await fetch(`${API}/api/v1/finance/historico-financeiro`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!r.ok) throw new Error('Erro ao carregar histórico')
      return r.json() as Promise<ContractHistory[]>
    },
    enabled: !!token && tab === 'historico',
  })

  // ── Lista de boletos ──────────────────────────────────────────────────────
  const { data: boletosData, isLoading: loadingBoletos, refetch: refetchBoletos } = useQuery({
    queryKey: ['boletos-list', page, yearFilter, monthFilter, token],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (yearFilter) params.set('year', yearFilter)
      if (monthFilter) params.set('month', monthFilter)
      const r = await fetch(`${API}/api/v1/finance/boletos?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!r.ok) throw new Error('Erro ao carregar boletos')
      return r.json() as Promise<{ data: BoletoListItem[]; total: number; page: number; limit: number }>
    },
    enabled: !!token && tab === 'boletos',
  })

  // ── Lista de reajustes ────────────────────────────────────────────────────
  const { data: reajustesData, isLoading: loadingReajustes, refetch: refetchReajustes } = useQuery({
    queryKey: ['reajustes-list', page, yearFilter, token],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (yearFilter) params.set('year', yearFilter)
      const r = await fetch(`${API}/api/v1/finance/reajustes?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!r.ok) throw new Error('Erro ao carregar reajustes')
      return r.json() as Promise<{ data: BoletoListItem[]; total: number; page: number; limit: number }>
    },
    enabled: !!token && tab === 'reajustes',
  })

  // ── Lista de IPTU ─────────────────────────────────────────────────────────
  const { data: iptuData, isLoading: loadingIptu, refetch: refetchIptu } = useQuery({
    queryKey: ['iptu-list', page, yearFilter, token],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (yearFilter) params.set('year', yearFilter)
      const r = await fetch(`${API}/api/v1/finance/iptu?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!r.ok) throw new Error('Erro ao carregar IPTU')
      return r.json() as Promise<{ data: BoletoListItem[]; total: number; page: number; limit: number }>
    },
    enabled: !!token && tab === 'iptu',
  })

  // ── Filtro de busca no histórico ──────────────────────────────────────────
  const filteredHistorico = (historico ?? []).filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.tenant?.name?.toLowerCase().includes(q) ||
      c.property?.address?.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    )
  })

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'historico', label: 'Por Contrato', icon: Home, count: historico?.length },
    { id: 'boletos', label: 'Boletos', icon: Receipt, count: boletosData?.total },
    { id: 'reajustes', label: 'Reajustes', icon: TrendingUp, count: reajustesData?.total },
    { id: 'iptu', label: 'IPTU', icon: FileText, count: iptuData?.total },
  ]

  function DocBadge({ doc }: { doc: FinDoc }) {
    const monthLabel = doc.month ? `${doc.month}/${doc.year ?? ''}` : doc.year ? String(doc.year) : ''
    return (
      <button
        onClick={() => doc.publicUrl && setPreviewUrl(doc.publicUrl)}
        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border hover:shadow transition-all"
        style={{ borderColor: GOLD + '60', backgroundColor: GOLD + '10', color: NAVY }}
        title={doc.name}
      >
        <FileText className="w-3 h-3" style={{ color: GOLD }} />
        {monthLabel || doc.name}
        {doc.publicUrl && <ExternalLink className="w-3 h-3 opacity-50" />}
      </button>
    )
  }

  function DocRow({ doc }: { doc: BoletoListItem }) {
    const monthLabel = doc.month && doc.year ? `${doc.month}/${doc.year}` : doc.year ? String(doc.year) : '—'
    return (
      <tr className="border-b hover:bg-gray-50 transition-colors">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 flex-shrink-0" style={{ color: GOLD }} />
            <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{doc.name}</span>
          </div>
          {doc.legacyRef && (
            <div className="text-xs text-gray-400 truncate max-w-[300px] mt-0.5">{doc.legacyRef}</div>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">{doc.client?.name ?? '—'}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{monthLabel}</td>
        <td className="px-4 py-3 text-sm font-medium" style={{ color: NAVY }}>
          {doc.contract?.rentValue ? fmt(doc.contract.rentValue) : '—'}
        </td>
        <td className="px-4 py-3">
          {doc.publicUrl ? (
            <button
              onClick={() => setPreviewUrl(doc.publicUrl!)}
              className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full font-medium transition-all hover:opacity-80"
              style={{ backgroundColor: NAVY, color: 'white' }}
            >
              <Eye className="w-3 h-3" /> Ver
            </button>
          ) : (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Sem URL
            </span>
          )}
        </td>
      </tr>
    )
  }

  const isLoading = loadingHistorico || loadingBoletos || loadingReajustes || loadingIptu

  const currentData = tab === 'boletos' ? boletosData
    : tab === 'reajustes' ? reajustesData
    : tab === 'iptu' ? iptuData
    : null

  const totalPages = currentData ? Math.ceil(currentData.total / LIMIT) : 1

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 shadow-sm" style={{ background: NAVY }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: GOLD + '30' }}>
              <DollarSign className="w-5 h-5" style={{ color: GOLD }} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Histórico Financeiro</h1>
              <p className="text-xs text-white/60">Boletos · Reajustes · IPTU · Extratos</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (tab === 'historico') refetchHistorico()
              else if (tab === 'boletos') refetchBoletos()
              else if (tab === 'reajustes') refetchReajustes()
              else refetchIptu()
            }}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 pb-0">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setPage(1) }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all"
              style={{
                background: tab === t.id ? 'white' : 'transparent',
                color: tab === t.id ? NAVY : 'rgba(255,255,255,0.7)',
              }}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
              {t.count != null && (
                <span className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: tab === t.id ? GOLD + '20' : 'rgba(255,255,255,0.15)', color: tab === t.id ? NAVY : 'white' }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Filtros */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3 items-center">
          {tab === 'historico' ? (
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por inquilino ou endereço..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': GOLD } as any}
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Filtrar:</span>
              </div>
              <select
                value={yearFilter}
                onChange={e => { setYearFilter(e.target.value); setPage(1) }}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
              >
                <option value="">Todos os anos</option>
                {[2026, 2025, 2024, 2023, 2022].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              {tab === 'boletos' && (
                <select
                  value={monthFilter}
                  onChange={e => { setMonthFilter(e.target.value); setPage(1) }}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none"
                >
                  <option value="">Todos os meses</option>
                  {MONTHS.map((m, i) => (
                    <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
                  ))}
                </select>
              )}
            </>
          )}
          {currentData && (
            <span className="ml-auto text-sm text-gray-500">
              {currentData.total} documento{currentData.total !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GOLD, borderTopColor: 'transparent' }} />
          </div>
        )}

        {/* ── TAB: Por Contrato ────────────────────────────────────────────── */}
        {!isLoading && tab === 'historico' && (
          <div className="space-y-4">
            {filteredHistorico.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Home className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum contrato ativo com documentos financeiros</p>
              </div>
            )}
            {filteredHistorico.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Cabeçalho do contrato */}
                <div className="px-5 py-4 flex flex-wrap items-start justify-between gap-3" style={{ borderLeft: `4px solid ${GOLD}` }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: NAVY + '10' }}>
                      <User className="w-5 h-5" style={{ color: NAVY }} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{c.tenant?.name ?? 'Inquilino não vinculado'}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <Home className="w-3 h-3" />
                        {c.property?.address ?? 'Endereço não informado'}
                        {c.property?.unit && ` · ${c.property.unit}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-xs text-gray-400">Aluguel atual</p>
                      <p className="font-bold text-lg" style={{ color: NAVY }}>{fmt(c.rentValue)}</p>
                    </div>
                    {c.adjustmentPercent && (
                      <div>
                        <p className="text-xs text-gray-400">Reajuste</p>
                        <p className="font-medium text-sm text-green-600">+{c.adjustmentPercent}% ({c.adjustmentIndex ?? 'IGP-M'})</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Boletos */}
                {c.boletos.length > 0 && (
                  <div className="px-5 py-3 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Receipt className="w-3 h-3" /> Boletos ({c.boletos.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {c.boletos.map(d => <DocBadge key={d.id} doc={d} />)}
                    </div>
                  </div>
                )}

                {/* Reajustes */}
                {c.reajustes.length > 0 && (
                  <div className="px-5 py-3 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Reajustes ({c.reajustes.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {c.reajustes.map(d => <DocBadge key={d.id} doc={d} />)}
                    </div>
                  </div>
                )}

                {c.boletos.length === 0 && c.reajustes.length === 0 && (
                  <div className="px-5 py-3 border-t border-gray-100 text-sm text-gray-400 italic">
                    Nenhum documento financeiro vinculado a este contrato
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: Boletos / Reajustes / IPTU ─────────────────────────────── */}
        {!isLoading && tab !== 'historico' && currentData && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ background: NAVY + '08' }}>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Documento</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Inquilino</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Período</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor Aluguel</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16 text-gray-400">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>Nenhum documento encontrado</p>
                      </td>
                    </tr>
                  ) : (
                    currentData.data.map(d => <DocRow key={d.id} doc={d} />)
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Página {page} de {totalPages} · {currentData.total} registros
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de preview de documento */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: GOLD + '40' }}>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5" style={{ color: GOLD }} />
                Visualizar Documento
              </h3>
              <div className="flex gap-2">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg font-medium transition-all hover:opacity-80"
                  style={{ background: NAVY, color: 'white' }}
                >
                  <Download className="w-3.5 h-3.5" /> Abrir
                </a>
                <button
                  onClick={() => setPreviewUrl(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {previewUrl.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewUrl} className="w-full h-full min-h-[500px]" title="Documento" />
              ) : (
                <img src={previewUrl} alt="Documento" className="w-full h-full object-contain" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
