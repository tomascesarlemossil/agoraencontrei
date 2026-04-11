'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import {
  Plus, Send, X, Megaphone, MessageCircle, Mail,
  Clock, CheckCircle, XCircle, Loader2, Users, Trash2,
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

const SEGMENTOS: { value: string; label: string; desc: string }[] = [
  { value: 'todos_clientes',   label: 'Todos os clientes',        desc: 'Proprietários e inquilinos' },
  { value: 'proprietarios',    label: 'Proprietários',            desc: 'Donos de imóveis' },
  { value: 'inquilinos',       label: 'Inquilinos',               desc: 'Locatários ativos' },
  { value: 'leads_frios',      label: 'Leads frios',              desc: 'Sem interação há 30+ dias' },
  { value: 'custom',           label: 'Personalizado',            desc: 'Todos os contatos' },
]

const STATUS_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  DRAFT:     { label: 'Rascunho',    icon: Clock,         color: 'text-gray-500 bg-gray-50' },
  SCHEDULED: { label: 'Agendada',    icon: CalendarIcon,  color: 'text-blue-600 bg-blue-50' },
  SENDING:   { label: 'Enviando',    icon: Loader2,       color: 'text-yellow-600 bg-yellow-50' },
  SENT:      { label: 'Enviada',     icon: CheckCircle,   color: 'text-green-600 bg-green-50' },
  CANCELLED: { label: 'Cancelada',   icon: XCircle,       color: 'text-red-600 bg-red-50' },
}

function CalendarIcon({ className }: { className?: string }) {
  return <Clock className={className} />
}

export default function CampanhasPage() {
  const { accessToken: token } = useAuthStore()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    nome: '', tipo: 'whatsapp', segmento: 'todos_clientes', mensagem: '', agendadoPara: '',
  })
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['campanhas'],
    queryFn: () => apiFetch('/api/v1/marketing/campanhas', token!),
    enabled: !!token,
  })

  const createMutation = useMutation({
    mutationFn: (body: any) => apiFetch('/api/v1/marketing/campanhas', token!, {
      method: 'POST', body: JSON.stringify(body),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campanhas'] })
      setShowForm(false)
      setForm({ nome: '', tipo: 'whatsapp', segmento: 'todos_clientes', mensagem: '', agendadoPara: '' })
      setMsg({ type: 'success', text: 'Campanha criada com sucesso!' })
    },
    onError: (e: any) => setMsg({ type: 'error', text: e.message }),
  })

  const enviarMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/marketing/campanhas/${id}/enviar`, token!, { method: 'POST' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campanhas'] }); setMsg({ type: 'success', text: 'Campanha em processamento!' }) },
    onError: (e: any) => setMsg({ type: 'error', text: e.message }),
  })

  const cancelarMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/marketing/campanhas/${id}/cancelar`, token!, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campanhas'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/marketing/campanhas/${id}`, token!, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campanhas'] }),
  })

  const handleSegmentoChange = async (seg: string) => {
    setForm(f => ({ ...f, segmento: seg }))
    setPreviewCount(null)
    try {
      const res = await apiFetch(`/api/v1/marketing/campanhas/preview-count?segmento=${seg}`, token!)
      setPreviewCount(res.count)
    } catch { /* ignore */ }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const body: any = { nome: form.nome, tipo: form.tipo, segmento: form.segmento, mensagem: form.mensagem }
    if (form.agendadoPara) body.agendadoPara = new Date(form.agendadoPara).toISOString()
    createMutation.mutate(body)
  }

  const campanhas = data?.data ?? []

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Campanhas</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">E-mail e WhatsApp em massa</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-xl text-white transition-colors hover:opacity-90 shrink-0"
          style={{ backgroundColor: '#1B2B5B' }}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Campanha</span>
          <span className="sm:hidden">Nova</span>
        </button>
      </div>

      {/* Mensagem */}
      {msg && (
        <div className={`flex items-center gap-3 p-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-semibold text-gray-900">Nova Campanha</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Nome da campanha</label>
                <input
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  required
                  placeholder="Ex: Promoção de Carnaval"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Canal</label>
                <div className="flex gap-3">
                  {[
                    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'green' },
                    { value: 'email',    label: 'E-mail',   icon: Mail,          color: 'blue' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, tipo: opt.value }))}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        form.tipo === opt.value
                          ? opt.color === 'green' ? 'border-green-500 bg-green-50 text-green-700' : 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Segmento</label>
                <select
                  value={form.segmento}
                  onChange={e => handleSegmentoChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none"
                >
                  {SEGMENTOS.map(s => (
                    <option key={s.value} value={s.value}>{s.label} — {s.desc}</option>
                  ))}
                </select>
                {previewCount !== null && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {previewCount} contatos serão atingidos
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Mensagem</label>
                <textarea
                  value={form.mensagem}
                  onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))}
                  required
                  rows={5}
                  placeholder={form.tipo === 'whatsapp'
                    ? 'Olá! Temos uma oportunidade especial para você...'
                    : 'Prezado cliente, informamos que...'}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{form.mensagem.length} caracteres</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Agendamento (opcional)</label>
                <input
                  type="datetime-local"
                  value={form.agendadoPara}
                  onChange={e => setForm(f => ({ ...f, agendadoPara: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-2 text-sm font-medium rounded-xl text-white disabled:opacity-50"
                  style={{ backgroundColor: '#1B2B5B' }}
                >
                  {createMutation.isPending ? 'Criando...' : 'Criar Campanha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin text-gray-300 mx-auto" /></div>
        ) : campanhas.length === 0 ? (
          <div className="py-16 text-center">
            <Megaphone className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Nenhuma campanha criada ainda</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Campanha</th>
                  <th className="px-3 sm:px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Canal</th>
                  <th className="px-3 sm:px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Segmento</th>
                  <th className="px-3 sm:px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 sm:px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Enviados</th>
                  <th className="px-3 sm:px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {campanhas.map((c: any) => {
                  const st = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.DRAFT
                  const StatusIcon = st.icon
                  const segLabel = SEGMENTOS.find(s => s.value === c.segmento)?.label ?? c.segmento
                  const canEnviar = ['DRAFT', 'SCHEDULED'].includes(c.status)
                  const canCancelar = ['DRAFT', 'SCHEDULED'].includes(c.status)
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{c.nome}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                          c.tipo === 'whatsapp' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {c.tipo === 'whatsapp' ? <MessageCircle className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                          {c.tipo === 'whatsapp' ? 'WhatsApp' : 'E-mail'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-center text-xs text-gray-600 hidden sm:table-cell">{segLabel}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">{c.totalEnviados}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {canEnviar && (
                            <button
                              onClick={() => { if (confirm(`Enviar "${c.nome}" para ${segLabel}?`)) enviarMutation.mutate(c.id) }}
                              disabled={enviarMutation.isPending}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
                            >
                              <Send className="w-3 h-3" />
                              Enviar
                            </button>
                          )}
                          {canCancelar && (
                            <button
                              onClick={() => cancelarMutation.mutate(c.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            >
                              <X className="w-3 h-3" />
                              Cancelar
                            </button>
                          )}
                          {['DRAFT', 'CANCELLED'].includes(c.status) && (
                            <button
                              onClick={() => { if (confirm('Excluir campanha?')) deleteMutation.mutate(c.id) }}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
