'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import {
  Sparkles, Image, Sofa, Wand2, Plus, X, CheckCircle,
  XCircle, Clock, Loader2, Download, Trash2, Building2,
  AlertTriangle,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

async function apiFetch(path: string, token: string, opts?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts?.headers as any) },
    credentials: 'include',
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? 'Erro') }
  if (res.status === 204) return null
  return res.json()
}

const TIPO_CONFIG = {
  render: {
    label: 'Render Fotorrealista',
    icon: Image,
    color: 'bg-purple-50 text-purple-700',
    desc: 'Gera visualização profissional do imóvel reformado/decorado',
    styles: ['modern', 'classic', 'minimalist', 'industrial', 'scandinavian'],
    styleLabels: { modern: 'Moderno', classic: 'Clássico', minimalist: 'Minimalista', industrial: 'Industrial', scandinavian: 'Escandinavo' },
    provider: 'Veras AI',
  },
  staging: {
    label: 'Virtual Staging',
    icon: Sofa,
    color: 'bg-green-50 text-green-700',
    desc: 'Adiciona ou remove móveis virtualmente para valorizar o imóvel',
    styles: ['sala', 'quarto', 'cozinha', 'escritorio', 'banheiro'],
    styleLabels: { sala: 'Sala de Estar', quarto: 'Quarto', cozinha: 'Cozinha', escritorio: 'Escritório', banheiro: 'Banheiro' },
    provider: 'mnml.ai',
  },
  enhance_batch: {
    label: 'Melhorar Foto',
    icon: Wand2,
    color: 'bg-orange-50 text-orange-700',
    desc: 'Melhora automaticamente brilho, contraste e qualidade da foto',
    styles: [],
    styleLabels: {},
    provider: 'Imagen AI',
  },
} as const

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  PENDING:    { label: 'Aguardando',   icon: Clock,         color: 'text-gray-500 bg-gray-50' },
  PROCESSING: { label: 'Processando', icon: Loader2,       color: 'text-yellow-600 bg-yellow-50' },
  DONE:       { label: 'Pronto',      icon: CheckCircle,   color: 'text-green-600 bg-green-50' },
  ERROR:      { label: 'Erro',        icon: XCircle,       color: 'text-red-600 bg-red-50' },
}

export default function AIVisualPage() {
  const { accessToken: token } = useAuthStore()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    tipo: 'render' as 'render' | 'staging' | 'enhance_batch',
    propertyId: '',
    inputUrl: '',
    style: '',
  })
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'render' | 'staging' | 'enhance_batch'>('render')

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ['ai-visual-jobs', activeTab],
    queryFn: () => apiFetch(`/api/v1/ai-visual/jobs?tipo=${activeTab}&limit=20`, token!),
    enabled: !!token,
    refetchInterval: 5_000, // poll every 5s for status updates
  })

  const { data: statsData } = useQuery({
    queryKey: ['ai-visual-stats'],
    queryFn: () => apiFetch('/api/v1/ai-visual/stats', token!),
    enabled: !!token,
  })

  const createMutation = useMutation({
    mutationFn: (body: any) => apiFetch('/api/v1/ai-visual/jobs', token!, {
      method: 'POST', body: JSON.stringify(body),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-visual-jobs'] })
      qc.invalidateQueries({ queryKey: ['ai-visual-stats'] })
      setShowForm(false)
      setForm({ tipo: 'render', propertyId: '', inputUrl: '', style: '' })
      setMsg({ type: 'success', text: 'Job enfileirado! Acompanhe o status abaixo.' })
    },
    onError: (e: any) => setMsg({ type: 'error', text: e.message }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/ai-visual/jobs/${id}`, token!, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-visual-jobs'] }),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.propertyId.trim()) { setMsg({ type: 'error', text: 'Informe o ID do imóvel' }); return }
    if (!form.inputUrl.trim())   { setMsg({ type: 'error', text: 'Informe a URL da foto' }); return }
    const body: any = { tipo: form.tipo, propertyId: form.propertyId, inputUrl: form.inputUrl }
    if (form.style) body.style = form.style
    createMutation.mutate(body)
  }

  const jobs = jobsData?.data ?? []
  const cfg = TIPO_CONFIG[activeTab]
  const CfgIcon = cfg.icon

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-500" />
            IA Visual
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Renders, virtual staging e melhoria de fotos com IA
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#1B2B5B' }}
        >
          <Plus className="w-4 h-4" />
          Novo Job
        </button>
      </div>

      {/* Configuração aviso */}
      <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ backgroundColor: 'rgba(201,168,76,0.06)', borderColor: 'rgba(201,168,76,0.2)' }}>
        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#C9A84C' }} />
        <div className="text-sm" style={{ color: '#1B2B5B' }}>
          <strong>Configuração necessária:</strong> Para ativar os recursos de IA, configure as chaves no Railway:
          <code className="ml-1 text-xs bg-white px-1 py-0.5 rounded border font-mono">VERAS_API_KEY</code>,{' '}
          <code className="text-xs bg-white px-1 py-0.5 rounded border font-mono">MNML_API_KEY</code>,{' '}
          <code className="text-xs bg-white px-1 py-0.5 rounded border font-mono">GOOGLE_IMAGEN_API_KEY</code>
        </div>
      </div>

      {/* Stats */}
      {statsData && (
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(TIPO_CONFIG).map(([key, c]) => {
            const count = statsData.byTipo?.find((t: any) => t.tipo === key)?._count ?? 0
            const Icon = c.icon
            return (
              <div key={key} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className={`w-8 h-8 rounded-lg ${c.color} flex items-center justify-center mb-2`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
                <p className="text-xs text-gray-400">{c.provider}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Mensagem */}
      {msg && (
        <div className={`flex items-center gap-3 p-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(Object.keys(TIPO_CONFIG) as Array<keyof typeof TIPO_CONFIG>).map(k => {
          const c = TIPO_CONFIG[k]
          const Icon = c.icon
          return (
            <button
              key={k}
              onClick={() => setActiveTab(k)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {c.label}
            </button>
          )
        })}
      </div>

      {/* Jobs list */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto" /></div>
        ) : jobs.length === 0 ? (
          <div className="py-16 text-center">
            <CfgIcon className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum job de {cfg.label.toLowerCase()} ainda</p>
            <button
              onClick={() => { setForm(f => ({ ...f, tipo: activeTab })); setShowForm(true) }}
              className="mt-3 text-sm text-blue-600 hover:text-blue-700"
            >
              Criar o primeiro job
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {jobs.map((job: any) => {
              const st = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.PENDING
              const StatusIcon = st.icon
              return (
                <div key={job.id} className="p-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                  {/* Input thumbnail */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {job.inputUrl ? (
                      <img src={job.inputUrl} alt="Input" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                        <StatusIcon className={`w-3 h-3 ${job.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                        {st.label}
                      </span>
                      {job.style && (
                        <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                          {(cfg.styleLabels as any)[job.style] ?? job.style}
                        </span>
                      )}
                    </div>
                    {job.property && (
                      <p className="text-sm text-gray-700 truncate">{job.property.title}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(job.createdAt).toLocaleString('pt-BR')}
                    </p>
                    {job.errorMsg && (
                      <p className="text-xs text-red-600 mt-1">{job.errorMsg}</p>
                    )}
                  </div>

                  {/* Output thumbnail + actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {job.outputUrl && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-green-200">
                        <img src={job.outputUrl} alt="Output" className="w-full h-full object-cover" />
                      </div>
                    )}
                    {job.outputUrl && (
                      <a
                        href={job.outputUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Baixar
                      </a>
                    )}
                    {job.status !== 'PROCESSING' && (
                      <button
                        onClick={() => deleteMutation.mutate(job.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-semibold text-gray-900">Novo Job de IA Visual</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Tipo de processamento</label>
                <select
                  value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value as any, style: '' }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none"
                >
                  {Object.entries(TIPO_CONFIG).map(([k, c]) => (
                    <option key={k} value={k}>{c.label} ({c.provider})</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">{TIPO_CONFIG[form.tipo].desc}</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">ID do Imóvel</label>
                <input
                  value={form.propertyId}
                  onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
                  placeholder="cuid do imóvel (ex: cma...)"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">URL da foto de entrada</label>
                <input
                  value={form.inputUrl}
                  onChange={e => setForm(f => ({ ...f, inputUrl: e.target.value }))}
                  placeholder="https://..."
                  type="url"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none"
                />
              </div>

              {TIPO_CONFIG[form.tipo].styles.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Estilo</label>
                  <select
                    value={form.style}
                    onChange={e => setForm(f => ({ ...f, style: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none"
                  >
                    <option value="">Selecione...</option>
                    {TIPO_CONFIG[form.tipo].styles.map(s => (
                      <option key={s} value={s}>{(TIPO_CONFIG[form.tipo].styleLabels as any)[s] ?? s}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-2 text-sm font-medium rounded-xl text-white disabled:opacity-50"
                  style={{ backgroundColor: '#1B2B5B' }}
                >
                  {createMutation.isPending ? 'Enfileirando...' : 'Processar com IA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
