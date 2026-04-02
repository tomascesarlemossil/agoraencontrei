'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import {
  FileText, Download, Search, Filter, FolderOpen,
  ChevronDown, Eye, Loader2, RefreshCw, Upload,
  ReceiptText, ScrollText, TrendingUp, FileSpreadsheet,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

type DocType = 'ALL' | 'EXTRATO' | 'BOLETO' | 'REAJUSTE' | 'FINANCEIRO'

interface Document {
  id: string
  contractId?: string
  clientId?: string
  type: string
  category: string
  name: string
  month?: string
  year?: number
  fileSize?: number
  mimeType?: string
  createdAt: string
}

interface Stats {
  type: string
  category: string
  month: string
  year: number
  count: number
  total_size: number
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string; bg: string }> = {
  EXTRATO:    { label: 'Extratos Proprietários', icon: ScrollText,      color: 'text-blue-700',   bg: 'bg-blue-50'  },
  BOLETO:     { label: 'Boletos Inquilinos',      icon: ReceiptText,    color: 'text-green-700',  bg: 'bg-green-50' },
  REAJUSTE:   { label: 'Cartas de Reajuste',      icon: TrendingUp,     color: 'text-amber-700',  bg: 'bg-amber-50' },
  FINANCEIRO: { label: 'Financeiro Lemos',         icon: FileSpreadsheet, color: 'text-purple-700', bg: 'bg-purple-50' },
}

function fmtSize(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function fmtMonth(month?: string) {
  if (!month) return ''
  const parts = month.split('.')
  if (parts.length === 2) {
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
    const m = parseInt(parts[0])
    return `${months[m - 1] || parts[0]}/${parts[1]}`
  }
  return month
}

export default function HistoricoPage() {
  const { token } = useAuthStore()
  const [docs, setDocs] = useState<Document[]>([])
  const [stats, setStats] = useState<Stats[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<DocType>('ALL')
  const [search, setSearch] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState<string | null>(null)

  const headers = { Authorization: `Bearer ${token}` }

  const loadStats = async () => {
    const res = await fetch(`${API_URL}/api/v1/documents/stats`, { headers })
    if (res.ok) {
      const data = await res.json()
      setStats(data.stats || [])
    }
  }

  const loadDocs = async (reset = false) => {
    setLoading(true)
    const p = reset ? 1 : page
    const params = new URLSearchParams({ page: String(p), limit: '30' })
    if (activeType !== 'ALL') params.set('type', activeType)
    if (search) params.set('search', search)
    if (selectedMonth) params.set('month', selectedMonth)

    const res = await fetch(`${API_URL}/api/v1/documents?${params}`, { headers })
    if (res.ok) {
      const data = await res.json()
      setDocs(data.documents || [])
      setTotal(data.total || 0)
    }
    setLoading(false)
  }

  useEffect(() => { loadStats() }, [])
  useEffect(() => { loadDocs(true); setPage(1) }, [activeType, search, selectedMonth])

  // Group stats by type
  const statsByType: Record<string, { count: number; size: number }> = {}
  for (const s of stats) {
    if (!statsByType[s.type]) statsByType[s.type] = { count: 0, size: 0 }
    statsByType[s.type].count += parseInt(String(s.count))
    statsByType[s.type].size += parseInt(String(s.total_size || 0))
  }

  // Get unique months for filter
  const months = [...new Set(stats.map(s => s.month).filter(Boolean))].sort().reverse()

  const handleDownload = (doc: Document) => {
    window.open(`${API_URL}/api/v1/documents/${doc.id}/download`, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Documentos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Extratos, boletos, reajustes e relatórios financeiros
          </p>
        </div>
        <button
          onClick={() => loadDocs(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
          const s = statsByType[type] || { count: 0, size: 0 }
          const Icon = cfg.icon
          return (
            <button
              key={type}
              onClick={() => setActiveType(activeType === type as DocType ? 'ALL' : type as DocType)}
              className={`text-left p-4 rounded-2xl border-2 transition-all ${
                activeType === type
                  ? `border-current ${cfg.color} bg-white shadow-md`
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${cfg.color}`} />
              </div>
              <div className="font-semibold text-gray-900 text-sm">{cfg.label}</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">{s.count}</div>
              <div className="text-xs text-gray-400">{fmtSize(s.size)}</div>
            </button>
          )
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, pessoa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30"
            />
          </div>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/30 bg-white"
          >
            <option value="">Todos os meses</option>
            {months.map(m => (
              <option key={m} value={m}>{fmtMonth(m)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            {loading ? 'Carregando...' : `${total} documento${total !== 1 ? 's' : ''}`}
          </span>
          {activeType !== 'ALL' && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_CONFIG[activeType]?.bg} ${TYPE_CONFIG[activeType]?.color}`}>
              {TYPE_CONFIG[activeType]?.label}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
          </div>
        ) : docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FolderOpen className="w-12 h-12 mb-3 opacity-40" />
            <p className="font-medium">Nenhum documento encontrado</p>
            <p className="text-sm mt-1">Tente ajustar os filtros</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {docs.map(doc => {
              const cfg = TYPE_CONFIG[doc.type] || { label: doc.type, icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50' }
              const Icon = cfg.icon
              return (
                <div key={doc.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors group">
                  <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{doc.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {doc.month && (
                        <span className="text-xs text-gray-400">{fmtMonth(doc.month)}</span>
                      )}
                      {doc.fileSize && (
                        <span className="text-xs text-gray-300">·</span>
                      )}
                      {doc.fileSize && (
                        <span className="text-xs text-gray-400">{fmtSize(doc.fileSize)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                      title="Baixar"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setViewing(doc.id)
                        window.open(`${API_URL}/api/v1/documents/${doc.id}/download`, '_blank')
                      }}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {total > 30 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <button
              disabled={page === 1}
              onClick={() => { setPage(p => p - 1); loadDocs() }}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-500">
              Página {page} de {Math.ceil(total / 30)}
            </span>
            <button
              disabled={page >= Math.ceil(total / 30)}
              onClick={() => { setPage(p => p + 1); loadDocs() }}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
