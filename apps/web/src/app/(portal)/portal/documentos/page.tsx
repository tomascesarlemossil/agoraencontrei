'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Loader2, ArrowLeft, FolderOpen, FileText, Receipt, BarChart3, RefreshCw, DollarSign } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface Doc {
  id: string
  name: string
  type: string
  month: number | null
  year: number | null
  fileSize: number
  mimeType: string
  createdAt: string
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: any }> = {
  BOLETO:     { label: 'Boleto',   color: '#D97706', bg: '#FEF3C7', Icon: Receipt    },
  EXTRATO:    { label: 'Extrato',  color: '#059669', bg: '#D1FAE5', Icon: BarChart3  },
  REAJUSTE:   { label: 'Reajuste', color: '#7C3AED', bg: '#EDE9FE', Icon: RefreshCw  },
  FINANCEIRO: { label: 'Financeiro',color:'#0EA5E9', bg: '#E0F2FE', Icon: DollarSign },
}

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmtDate(m: number | null, y: number | null) {
  if (!m && !y) return '—'
  if (m && y) return `${MONTH_NAMES[m - 1]}/${y}`
  if (y) return String(y)
  return `Mês ${m}`
}

function fmtSize(b?: number) {
  if (!b) return ''
  return b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`
}

export default function DocumentosPage() {
  const router = useRouter()
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('portal_auth')
    if (!stored) { router.push('/portal/login'); return }
    const auth = JSON.parse(stored)
    if (auth.expiresAt && Date.now() > auth.expiresAt) {
      localStorage.removeItem('portal_auth')
      router.push('/portal/login')
      return
    }

    fetch(`${API_URL}/api/v1/portal/documentos`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then(r => r.ok ? r.json() : { documents: [] })
      .then(d => setDocs(d.documents ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  const filtered = filter ? docs.filter(d => d.type === filter) : docs

  // Count by type
  const counts = docs.reduce((acc, d) => {
    acc[d.type] = (acc[d.type] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const types = Object.keys(counts)

  function downloadDoc(id: string, name: string) {
    const stored = localStorage.getItem('portal_auth')
    if (!stored) return
    const auth = JSON.parse(stored)
    fetch(`${API_URL}/api/v1/portal/documentos/${id}/download`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    }).then(r => r.blob()).then(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
    }).catch(() => {})
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Documentos
          </h1>
          <p className="text-sm text-gray-500">Boletos, extratos e cartas de reajuste</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C9A84C' }} />
        </div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FolderOpen className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium">Nenhum documento disponível</p>
          <p className="text-sm mt-1">Os documentos serão disponibilizados pela imobiliária</p>
        </div>
      ) : (
        <>
          {/* Type filter tabs */}
          {types.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilter('')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  !filter ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={!filter ? { backgroundColor: '#1B2B5B' } : {}}
              >
                Todos ({docs.length})
              </button>
              {types.map(t => {
                const cfg = TYPE_CONFIG[t] ?? { label: t, color: '#555', bg: '#eee', Icon: FileText }
                return (
                  <button
                    key={t}
                    onClick={() => setFilter(filter === t ? '' : t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors`}
                    style={filter === t
                      ? { backgroundColor: cfg.color, color: '#fff' }
                      : { backgroundColor: cfg.bg, color: cfg.color }
                    }
                  >
                    {cfg.label} ({counts[t]})
                  </button>
                )
              })}
            </div>
          )}

          {/* List */}
          <div className="bg-white rounded-2xl border divide-y" style={{ borderColor: '#ddd9d0' }}>
            {filtered.map(doc => {
              const cfg = TYPE_CONFIG[doc.type] ?? { label: doc.type, color: '#555', bg: '#eee', Icon: FileText }
              const Icon = cfg.Icon
              return (
                <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: cfg.bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                      {(doc.month || doc.year) && (
                        <span className="text-xs text-gray-400">· {fmtDate(doc.month, doc.year)}</span>
                      )}
                      {doc.fileSize > 0 && (
                        <span className="text-xs text-gray-400">· {fmtSize(doc.fileSize)}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => downloadDoc(doc.id, doc.name)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Baixar documento"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
