'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import {
  ArrowLeft, Scale, Edit, Save, X, Loader2, Plus, Trash2,
  Calendar, DollarSign, User, Building2, FileText, File,
  Phone, Mail, MapPin, Clock, CheckCircle2, TrendingUp,
  PauseCircle, Archive, AlertCircle, ExternalLink, Download,
  FileImage, FileSpreadsheet, Tag,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

async function apiFetch(path: string, token: string, opts?: RequestInit) {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts?.headers ?? {}) },
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message ?? 'Erro') }
  return res.json()
}

const TYPE_LABELS: Record<string, string> = {
  DESPEJO:'Despejo', COBRANCA:'Cobrança', REVISIONAL:'Revisional',
  RESCISAO:'Rescisão', DANO:'Dano', TRABALHISTA:'Trabalhista',
  CRIMINAL:'Criminal', OUTROS:'Outros',
}
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ATIVO:     { label: 'Ativo',     color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  ENCERRADO: { label: 'Encerrado', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  SUSPENSO:  { label: 'Suspenso',  color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  ARQUIVADO: { label: 'Arquivado', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
}
const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  BAIXA:   { label: 'Baixa',   color: 'text-gray-400' },
  NORMAL:  { label: 'Normal',  color: 'text-blue-400' },
  ALTA:    { label: 'Alta',    color: 'text-orange-400' },
  URGENTE: { label: 'Urgente', color: 'text-red-400' },
}
const UPDATE_TYPE_LABELS: Record<string, string> = {
  ANDAMENTO:'Andamento', AUDIENCIA:'Audiência', DECISAO:'Decisão',
  RECURSO:'Recurso', ACORDO:'Acordo', CITACAO:'Citação',
  PETICAO:'Petição', OUTROS:'Outros',
}
const UPDATE_TYPE_COLORS: Record<string, string> = {
  ANDAMENTO:'bg-blue-500/20 text-blue-400',
  AUDIENCIA:'bg-purple-500/20 text-purple-400',
  DECISAO:'bg-yellow-500/20 text-yellow-400',
  RECURSO:'bg-orange-500/20 text-orange-400',
  ACORDO:'bg-emerald-500/20 text-emerald-400',
  CITACAO:'bg-cyan-500/20 text-cyan-400',
  PETICAO:'bg-indigo-500/20 text-indigo-400',
  OUTROS:'bg-gray-500/20 text-gray-400',
}

function fmt(v?: number | null) {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}
function fmtDate(d?: string | null, withTime = false) {
  if (!d) return '—'
  const opts: any = { day: '2-digit', month: '2-digit', year: 'numeric' }
  if (withTime) { opts.hour = '2-digit'; opts.minute = '2-digit' }
  return new Date(d).toLocaleDateString('pt-BR', opts)
}
function fileIcon(name: string, mime?: string | null) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (mime?.startsWith('image/') || ['jpg','jpeg','png','gif','webp'].includes(ext))
    return <FileImage className="w-4 h-4 text-blue-400" />
  if (['xls','xlsx','csv'].includes(ext)) return <FileSpreadsheet className="w-4 h-4 text-green-400" />
  if (ext === 'pdf') return <FileText className="w-4 h-4 text-red-400" />
  return <File className="w-4 h-4 text-gray-400" />
}

const inputCls = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
const selectCls = "w-full bg-[#1a2744] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-white/40">{label}</span>
      <span className="text-sm text-white">{value || '—'}</span>
    </div>
  )
}

export default function ProcessoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const qc = useQueryClient()
  const { getValidToken } = useAuth()
  const [activeTab, setActiveTab] = useState<'info'|'andamentos'|'documentos'|'editar'>('info')
  const [editing, setEditing] = useState(false)
  const [newUpdate, setNewUpdate] = useState({ description: '', type: 'ANDAMENTO', occurredAt: '' })
  const [addingUpdate, setAddingUpdate] = useState(false)
  const [savingUpdate, setSavingUpdate] = useState(false)
  const [editForm, setEditForm] = useState<any>(null)
  const [savingEdit, setSavingEdit] = useState(false)

  const { data: legalCase, isLoading } = useQuery({
    queryKey: ['legal-case', id],
    queryFn: async () => {
      const token = await getValidToken()
      return apiFetch(`/api/v1/legal/${id}`, token!)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const token = await getValidToken()
      return apiFetch(`/api/v1/legal/${id}`, token!, { method: 'DELETE' })
    },
    onSuccess: () => router.push('/dashboard/juridico'),
  })

  const handleAddUpdate = async () => {
    if (!newUpdate.description.trim()) return
    setSavingUpdate(true)
    try {
      const token = await getValidToken()
      await apiFetch(`/api/v1/legal/${id}/updates`, token!, {
        method: 'POST',
        body: JSON.stringify(newUpdate),
      })
      qc.invalidateQueries({ queryKey: ['legal-case', id] })
      setNewUpdate({ description: '', type: 'ANDAMENTO', occurredAt: '' })
      setAddingUpdate(false)
    } catch (e: any) { alert(e.message) }
    finally { setSavingUpdate(false) }
  }

  const handleSaveEdit = async () => {
    if (!editForm) return
    setSavingEdit(true)
    try {
      const token = await getValidToken()
      await apiFetch(`/api/v1/legal/${id}`, token!, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      })
      qc.invalidateQueries({ queryKey: ['legal-case', id] })
      setEditing(false)
    } catch (e: any) { alert(e.message) }
    finally { setSavingEdit(false) }
  }

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
    </div>
  )
  if (!legalCase) return (
    <div className="p-8 text-center">
      <p className="text-red-400">Processo não encontrado</p>
      <Link href="/dashboard/juridico" className="text-indigo-400 text-sm mt-2 inline-block">← Voltar</Link>
    </div>
  )

  const c = legalCase
  const statusCfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.ATIVO
  const priorityCfg = PRIORITY_CONFIG[c.priority] ?? PRIORITY_CONFIG.NORMAL

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <Link href="/dashboard/juridico">
            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors mt-1">
              <ArrowLeft className="w-4 h-4 text-white/60" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-white">{c.title}</h1>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
                {statusCfg.label}
              </span>
              <span className={`text-xs font-semibold ${priorityCfg.color}`}>● {priorityCfg.label}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {c.caseNumber && <span className="text-xs text-white/40">Processo #{c.caseNumber}</span>}
              <span className="text-xs text-white/40">{TYPE_LABELS[c.type] ?? c.type}</span>
              <span className="text-xs text-white/30">Aberto em {fmtDate(c.openedAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEditing(true); setEditForm({ ...c }); setActiveTab('editar') }}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 rounded-lg text-xs text-white/70 hover:bg-white/20 transition-colors">
            <Edit className="w-3.5 h-3.5" /> Editar
          </button>
          <button onClick={() => {
            if (confirm('Excluir este processo? Esta ação não pode ser desfeita.'))
              deleteMutation.mutate()
          }} className="flex items-center gap-1.5 px-3 py-2 bg-red-500/20 rounded-lg text-xs text-red-400 hover:bg-red-500/30 transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Excluir
          </button>
        </div>
      </div>

      {/* Próxima audiência destaque */}
      {c.nextHearingAt && (
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${new Date(c.nextHearingAt) < new Date() ? 'bg-red-500/10 border-red-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
          <Calendar className={`w-4 h-4 ${new Date(c.nextHearingAt) < new Date() ? 'text-red-400' : 'text-blue-400'}`} />
          <div>
            <p className="text-xs text-white/40">Próxima Audiência</p>
            <p className={`text-sm font-semibold ${new Date(c.nextHearingAt) < new Date() ? 'text-red-400' : 'text-blue-400'}`}>
              {fmtDate(c.nextHearingAt, true)}
              {new Date(c.nextHearingAt) < new Date() && ' — VENCIDA'}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
        {[
          { id: 'info', label: 'Informações' },
          { id: 'andamentos', label: `Andamentos (${c.updates?.length ?? 0})` },
          { id: 'documentos', label: `Documentos (${c.documents?.length ?? 0})` },
          { id: 'editar', label: 'Editar' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${activeTab === tab.id ? 'bg-indigo-500/30 text-indigo-300' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline de Retomada — visual progress for property repossession cases */}
      {(c.type === 'DESPEJO' || c.type === 'COBRANCA' || c.metadata?.isRepossession) && (
        <RetomadaTimeline legalCase={c} />
      )}

      {/* Tab: Informações */}
      {activeTab === 'info' && (
        <div className="space-y-4">
          {/* Partes */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Partes Envolvidas</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <InfoRow label="Autor / Requerente" value={c.plaintiffName} />
              <InfoRow label="Réu / Requerido" value={c.defendantName} />
              {c.clientName && <InfoRow label="Cliente Vinculado" value={c.clientName} />}
            </div>
          </div>

          {/* Advogado */}
          {(c.lawyerName || c.lawyerOab) && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Advogado Responsável</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <InfoRow label="Nome" value={c.lawyerName} />
                <InfoRow label="OAB" value={c.lawyerOab} />
                <InfoRow label="Telefone" value={c.lawyerPhone} />
                <InfoRow label="E-mail" value={c.lawyerEmail} />
              </div>
            </div>
          )}

          {/* Tribunal */}
          {(c.court || c.courtSection) && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Tribunal / Vara</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <InfoRow label="Tribunal" value={c.court} />
                <InfoRow label="Vara / Seção" value={c.courtSection} />
                <InfoRow label="Cidade" value={c.courtCity} />
              </div>
            </div>
          )}

          {/* Datas e Valores */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Datas</h3>
              <div className="space-y-3">
                <InfoRow label="Data de Abertura" value={fmtDate(c.openedAt)} />
                <InfoRow label="Próxima Audiência" value={fmtDate(c.nextHearingAt, true)} />
                {c.closedAt && <InfoRow label="Data de Encerramento" value={fmtDate(c.closedAt)} />}
              </div>
            </div>
            <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Valores</h3>
              <div className="space-y-3">
                <InfoRow label="Valor Reclamado" value={fmt(c.claimedValue)} />
                <InfoRow label="Valor Acordado" value={fmt(c.settledValue)} />
                <InfoRow label="Custas Processuais" value={fmt(c.courtCosts)} />
              </div>
            </div>
          </div>

          {/* Observações */}
          {(c.observations || c.internalNotes) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {c.observations && (
                <div className="bg-white/5 rounded-xl border border-white/10 p-5">
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Observações</h3>
                  <p className="text-sm text-white/70 whitespace-pre-wrap">{c.observations}</p>
                </div>
              )}
              {c.internalNotes && (
                <div className="bg-yellow-500/5 rounded-xl border border-yellow-500/20 p-5">
                  <h3 className="text-xs font-semibold text-yellow-400/60 uppercase tracking-wider mb-3">Notas Internas</h3>
                  <p className="text-sm text-white/70 whitespace-pre-wrap">{c.internalNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {c.tags?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-3.5 h-3.5 text-white/30" />
              {c.tags.map((t: string) => (
                <span key={t} className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Andamentos */}
      {activeTab === 'andamentos' && (
        <div className="space-y-4">
          {/* Adicionar andamento */}
          <div className="bg-indigo-500/10 rounded-xl border border-indigo-500/20 p-4">
            {!addingUpdate ? (
              <button onClick={() => setAddingUpdate(true)}
                className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                <Plus className="w-4 h-4" /> Adicionar Andamento
              </button>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Tipo</label>
                    <select value={newUpdate.type} onChange={e => setNewUpdate(u => ({ ...u, type: e.target.value }))}
                      className={selectCls}>
                      {Object.entries(UPDATE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Data</label>
                    <input type="date" value={newUpdate.occurredAt}
                      onChange={e => setNewUpdate(u => ({ ...u, occurredAt: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-1 block">Descrição *</label>
                  <textarea value={newUpdate.description}
                    onChange={e => setNewUpdate(u => ({ ...u, description: e.target.value }))}
                    rows={3} placeholder="Descreva o andamento..."
                    className={inputCls + ' resize-none'} />
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setAddingUpdate(false)}
                    className="px-3 py-1.5 bg-white/10 rounded-lg text-xs text-white/60 hover:bg-white/20 transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleAddUpdate} disabled={savingUpdate || !newUpdate.description.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 rounded-lg text-xs text-white font-medium hover:bg-indigo-400 disabled:opacity-50 transition-colors">
                    {savingUpdate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Salvar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Lista de andamentos */}
          {(c.updates ?? []).length === 0 ? (
            <div className="text-center py-10 text-white/30">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum andamento registrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(c.updates ?? []).map((u: any) => (
                <div key={u.id} className="bg-white/5 rounded-xl border border-white/10 p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${UPDATE_TYPE_COLORS[u.type] ?? 'bg-gray-500/20 text-gray-400'}`}>
                        {UPDATE_TYPE_LABELS[u.type] ?? u.type}
                      </span>
                      {u.userName && (
                        <span className="text-xs text-white/40 flex items-center gap-1">
                          <User className="w-3 h-3" />{u.userName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/30">
                      {u.occurredAt && <span>{fmtDate(u.occurredAt)}</span>}
                      <span>Registrado: {fmtDate(u.createdAt)}</span>
                    </div>
                  </div>
                  <p className="text-sm text-white/80 mt-2 whitespace-pre-wrap">{u.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Documentos */}
      {activeTab === 'documentos' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/40">{c.documents?.length ?? 0} documento(s) jurídico(s) encontrado(s)</p>
            <Link href={`/dashboard/lemosbank/arquivo-morto?type=JURIDICO`}
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              Ver todos os documentos jurídicos <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          {(c.documents ?? []).length === 0 ? (
            <div className="text-center py-10 text-white/30">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum documento jurídico encontrado</p>
              <p className="text-xs mt-1">Documentos com tipo JURIDICO vinculados ao cliente aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(c.documents ?? []).map((doc: any) => {
                const meta = typeof doc.metadata === 'object' ? doc.metadata : {}
                const publicUrl = meta?.publicUrl ?? meta?.storageUrl
                return (
                  <div key={doc.id} className="flex items-center gap-3 bg-white/5 rounded-xl border border-white/10 p-3 hover:bg-white/10 transition-colors">
                    {fileIcon(doc.name, doc.mimeType)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded">{doc.type}</span>
                        {doc.month && doc.year && (
                          <span className="text-xs text-white/40">{doc.month}/{doc.year}</span>
                        )}
                        {doc.fileSize && (
                          <span className="text-xs text-white/30">
                            {doc.fileSize < 1024*1024 ? `${(doc.fileSize/1024).toFixed(0)} KB` : `${(doc.fileSize/1024/1024).toFixed(1)} MB`}
                          </span>
                        )}
                      </div>
                    </div>
                    {publicUrl && (
                      <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors" title="Abrir">
                        <ExternalLink className="w-3.5 h-3.5 text-white/60" />
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Editar */}
      {activeTab === 'editar' && editForm && (
        <div className="space-y-4">
          <div className="bg-white/5 rounded-xl border border-white/10 p-5 space-y-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Editar Processo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['title','Título'],['caseNumber','Nº Processo'],
                ['plaintiffName','Autor/Requerente'],['defendantName','Réu/Requerido'],
                ['lawyerName','Advogado'],['lawyerOab','OAB'],
                ['lawyerPhone','Tel. Advogado'],['lawyerEmail','E-mail Advogado'],
                ['court','Tribunal'],['courtSection','Vara/Seção'],['courtCity','Cidade'],
              ].map(([k, label]) => (
                <div key={k} className="space-y-1.5">
                  <label className="text-xs text-white/40">{label}</label>
                  <input value={editForm[k] ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, [k]: e.target.value }))}
                    className={inputCls} />
                </div>
              ))}
              {[
                ['type','Tipo', Object.entries(TYPE_LABELS)],
                ['status','Status', [['ATIVO','Ativo'],['ENCERRADO','Encerrado'],['SUSPENSO','Suspenso'],['ARQUIVADO','Arquivado']]],
                ['priority','Prioridade', [['BAIXA','Baixa'],['NORMAL','Normal'],['ALTA','Alta'],['URGENTE','Urgente']]],
              ].map(([k, label, opts]) => (
                <div key={k as string} className="space-y-1.5">
                  <label className="text-xs text-white/40">{label as string}</label>
                  <select value={editForm[k as string] ?? ''} onChange={e => setEditForm((f: any) => ({ ...f, [k as string]: e.target.value }))} className={selectCls}>
                    {(opts as [string,string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
              {[['openedAt','Data Abertura'],['nextHearingAt','Próx. Audiência'],['closedAt','Data Encerramento']].map(([k, label]) => (
                <div key={k} className="space-y-1.5">
                  <label className="text-xs text-white/40">{label}</label>
                  <input type={k === 'nextHearingAt' ? 'datetime-local' : 'date'}
                    value={editForm[k] ? new Date(editForm[k]).toISOString().slice(0, k === 'nextHearingAt' ? 16 : 10) : ''}
                    onChange={e => setEditForm((f: any) => ({ ...f, [k]: e.target.value }))}
                    className={inputCls} />
                </div>
              ))}
              {[['claimedValue','Valor Reclamado'],['settledValue','Valor Acordado'],['courtCosts','Custas']].map(([k, label]) => (
                <div key={k} className="space-y-1.5">
                  <label className="text-xs text-white/40">{label}</label>
                  <input type="number" step="0.01" min="0" value={editForm[k] ?? ''}
                    onChange={e => setEditForm((f: any) => ({ ...f, [k]: e.target.value ? parseFloat(e.target.value) : null }))}
                    className={inputCls} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Observações</label>
                <textarea value={editForm.observations ?? ''} rows={4}
                  onChange={e => setEditForm((f: any) => ({ ...f, observations: e.target.value }))}
                  className={inputCls + ' resize-none'} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/40">Notas Internas</label>
                <textarea value={editForm.internalNotes ?? ''} rows={4}
                  onChange={e => setEditForm((f: any) => ({ ...f, internalNotes: e.target.value }))}
                  className={inputCls + ' resize-none'} />
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setActiveTab('info')}
              className="px-4 py-2 bg-white/10 rounded-lg text-sm text-white/70 hover:bg-white/20 transition-colors">
              Cancelar
            </button>
            <button onClick={handleSaveEdit} disabled={savingEdit}
              className="flex items-center gap-2 px-5 py-2 bg-yellow-400 rounded-lg text-sm font-bold text-[#1B2B5B] hover:bg-yellow-300 disabled:opacity-50 transition-colors">
              {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Retomada Timeline Component ─────────────────────────────────────────────

const RETOMADA_STAGES = [
  { key: 'arrematacao',    label: 'Arrematação',         icon: '🔨', description: 'Imóvel arrematado em leilão' },
  { key: 'carta_arrem',   label: 'Carta de Arrematação', icon: '📜', description: 'Expedição da carta pelo juiz' },
  { key: 'registro',      label: 'Registro em Cartório', icon: '🏛️', description: 'Transferência de titularidade' },
  { key: 'notificacao',   label: 'Notificação',          icon: '📩', description: 'Notificação do ocupante para desocupação' },
  { key: 'imissao_posse', label: 'Imissão na Posse',     icon: '🔑', description: 'Pedido judicial de posse' },
  { key: 'desocupacao',   label: 'Desocupação',          icon: '🏠', description: 'Imóvel desocupado e disponível' },
]

function getRetomadaStage(legalCase: any): number {
  const updates = (legalCase.updates ?? []).map((u: any) => u.description?.toLowerCase() ?? '')
  const allText = [legalCase.observations, legalCase.internalNotes, ...updates]
    .filter(Boolean).join(' ').toLowerCase()

  if (allText.includes('desocup') || allText.includes('posse obtida') || allText.includes('entrega das chaves') || legalCase.status === 'ENCERRADO')
    return 6
  if (allText.includes('imissão') || allText.includes('imissao') || allText.includes('mandado de imissão'))
    return 5
  if (allText.includes('notificação') || allText.includes('notificado') || allText.includes('intimação'))
    return 4
  if (allText.includes('registr') || allText.includes('cartório') || allText.includes('cartorio') || allText.includes('matrícula'))
    return 3
  if (allText.includes('carta de arrematação') || allText.includes('carta arrematação') || allText.includes('expedição'))
    return 2
  if (allText.includes('arrematação') || allText.includes('arrematado') || allText.includes('leilão'))
    return 1

  return 0
}

function RetomadaTimeline({ legalCase }: { legalCase: any }) {
  const currentStage = getRetomadaStage(legalCase)

  return (
    <div className="bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-xl border border-indigo-500/20 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Scale className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-bold text-indigo-300">Timeline de Retomada</h3>
        <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full ml-auto">
          {currentStage}/{RETOMADA_STAGES.length} etapas
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative mb-6">
        <div className="h-2 bg-white/10 rounded-full">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${(currentStage / RETOMADA_STAGES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Stage cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {RETOMADA_STAGES.map((stage, idx) => {
          const stageNum = idx + 1
          const isCompleted = stageNum <= currentStage
          const isCurrent = stageNum === currentStage
          const isPending = stageNum > currentStage

          return (
            <div
              key={stage.key}
              className={`relative rounded-xl p-3 text-center transition-all ${
                isCurrent
                  ? 'bg-indigo-500/20 border-2 border-indigo-500/50 ring-2 ring-indigo-500/20'
                  : isCompleted
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : 'bg-white/5 border border-white/10 opacity-50'
              }`}
            >
              <div className="text-2xl mb-1">{stage.icon}</div>
              <div className={`text-xs font-bold mb-0.5 ${
                isCurrent ? 'text-indigo-300' : isCompleted ? 'text-emerald-400' : 'text-white/40'
              }`}>
                {stage.label}
              </div>
              <div className="text-[10px] text-white/30 leading-tight">{stage.description}</div>

              {/* Status indicator */}
              <div className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                isCompleted
                  ? 'bg-emerald-500 text-white'
                  : isCurrent
                    ? 'bg-indigo-500 text-white animate-pulse'
                    : 'bg-white/20 text-white/40'
              }`}>
                {isCompleted ? '✓' : isPending ? stageNum : '●'}
              </div>
            </div>
          )
        })}
      </div>

      {currentStage > 0 && currentStage < RETOMADA_STAGES.length && (
        <div className="mt-4 flex items-center gap-2 text-xs text-indigo-300/70">
          <Clock className="w-3.5 h-3.5" />
          Próximo passo: <span className="font-semibold text-indigo-300">{RETOMADA_STAGES[currentStage]?.label}</span>
          — {RETOMADA_STAGES[currentStage]?.description}
        </div>
      )}
      {currentStage >= RETOMADA_STAGES.length && (
        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Retomada concluída — imóvel desocupado e disponível
        </div>
      )}
    </div>
  )
}
