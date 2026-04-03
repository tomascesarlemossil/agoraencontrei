'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Loader2, ArrowLeft, FolderOpen, BarChart3, History } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const NAVY = '#1B2B5B'
const GOLD = '#C9A84C'

interface Doc {
  id: string
  name: string
  month: string
  year: number
  fileSize: number
  mimeType: string
}

interface Forecast {
  id: string
  dueDate?: string
  amount?: number
  month?: number
  year?: number
  forecastStatus?: string
  valorAluguel?: number
  taxaAdm?: number
  valorRepasse?: number
  numeroBoleto?: string
  endereco?: string
  proprietarioNome?: string
}

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MONTH_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmtMonth(m: string) {
  if (!m) return ''
  const [num, yr] = m.split('.')
  return `${MONTH_NAMES[parseInt(num) - 1] || num} ${yr}`
}

function fmtMonthYear(m?: number | null, y?: number | null) {
  if (!m && !y) return '—'
  if (m && y) return `${MONTH_NAMES[(m - 1) % 12]} ${y}`
  if (y) return String(y)
  return `Mês ${m}`
}

function fmtMonthShort(m?: number | null, y?: number | null) {
  if (!m && !y) return '—'
  if (m && y) return `${MONTH_SHORT[(m - 1) % 12]}/${String(y).slice(-2)}`
  if (y) return String(y)
  return `M${m}`
}

function fmtSize(b?: number) {
  if (!b) return ''
  return b < 1024 * 1024 ? `${(b/1024).toFixed(0)} KB` : `${(b/1024/1024).toFixed(1)} MB`
}

const fmt = (v?: number | null) =>
  v != null ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v)) : '—'

export default function ExtratosPage() {
  const router = useRouter()
  const [docs, setDocs] = useState<Doc[]>([])
  const [forecasts, setForecasts] = useState<Forecast[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'documentos' | 'historico'>('historico')

  useEffect(() => {
    const stored = localStorage.getItem('portal_auth')
    if (!stored) { router.push('/portal/login'); return }
    const auth = JSON.parse(stored)
    if (auth.expiresAt && Date.now() > auth.expiresAt) {
      localStorage.removeItem('portal_auth'); router.push('/portal/login'); return
    }

    fetch(`${API_URL}/api/v1/portal/extratos`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    })
      .then(r => r.ok ? r.json() : { documents: [], forecasts: [] })
      .then(d => {
        setDocs(d.documents ?? [])
        setForecasts(d.forecasts ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  const totalItems = docs.length + forecasts.length

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: NAVY, fontFamily: 'Georgia, serif' }}>
            Extratos & Histórico
          </h1>
          <p className="text-sm text-gray-500">
            {loading ? 'Carregando...' : `${totalItems} registro(s)`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {([['historico', `Histórico Financeiro${forecasts.length > 0 ? ` (${forecasts.length})` : ''}`], ['documentos', `Extratos PDF${docs.length > 0 ? ` (${docs.length})` : ''}`]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${tab === key ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: GOLD }} />
        </div>
      ) : tab === 'historico' ? (
        forecasts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <History className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">Nenhum histórico disponível</p>
            <p className="text-sm mt-1">Os dados históricos serão importados em breve</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 px-1">
              Dados importados do sistema Uniloc — {forecasts.length} registros históricos
            </p>
            <div className="bg-white rounded-2xl border divide-y overflow-hidden" style={{ borderColor: '#ddd9d0' }}>
              {forecasts.map(f => (
                <div key={f.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-center"
                    style={{ backgroundColor: f.forecastStatus === 'RECEBIDO' ? '#D1FAE5' : '#FEF3C7' }}
                  >
                    <span className="text-xs font-bold leading-tight" style={{ color: f.forecastStatus === 'RECEBIDO' ? '#059669' : '#D97706' }}>
                      {fmtMonthShort(f.month, f.year)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-800">{fmt(f.valorAluguel ?? f.amount)}</p>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: f.forecastStatus === 'RECEBIDO' ? '#D1FAE5' : '#FEF3C7',
                          color: f.forecastStatus === 'RECEBIDO' ? '#059669' : '#D97706',
                        }}
                      >
                        {f.forecastStatus === 'RECEBIDO' ? 'Recebido' : f.forecastStatus === 'ATRASADO' ? 'Atrasado' : 'Previsto'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fmtMonthYear(f.month, f.year)}
                      {f.taxaAdm ? ` · Taxa: ${fmt(f.taxaAdm)}` : ''}
                      {f.valorRepasse ? ` · Repasse: ${fmt(f.valorRepasse)}` : ''}
                    </p>
                    {f.endereco && (
                      <p className="text-xs text-gray-400 truncate">{f.endereco}</p>
                    )}
                  </div>
                  {f.numeroBoleto && (
                    <span className="text-xs text-gray-300 font-mono flex-shrink-0">#{f.numeroBoleto}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FolderOpen className="w-12 h-12 mb-3 opacity-30" />
            <p className="font-medium">Nenhum extrato disponível</p>
            <p className="text-sm mt-1">Os extratos em PDF serão disponibilizados mensalmente</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border divide-y" style={{ borderColor: '#ddd9d0' }}>
            {docs.map(doc => (
              <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#D1FAE5' }}>
                  <BarChart3 className="w-5 h-5" style={{ color: '#059669' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{fmtMonth(doc.month)}</p>
                  <p className="text-xs text-gray-400">{fmtSize(doc.fileSize)}</p>
                </div>
                <button
                  onClick={() => {
                    const auth = JSON.parse(localStorage.getItem('portal_auth') || '{}')
                    fetch(`${API_URL}/api/v1/portal/documentos/${doc.id}/download`, {
                      headers: { Authorization: `Bearer ${auth.token}` },
                    }).then(r => r.blob()).then(blob => {
                      const url = URL.createObjectURL(blob)
                      window.open(url, '_blank')
                    })
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
