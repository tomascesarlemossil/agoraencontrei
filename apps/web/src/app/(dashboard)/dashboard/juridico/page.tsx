'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Scale, Plus, Search, Filter, Download, AlertTriangle,
  Calendar, DollarSign, User, Building2, FileText,
  ChevronLeft, ChevronRight, Loader2, TrendingUp,
  Clock, CheckCircle2, PauseCircle, Archive,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

async function apiFetch(path: string, token: string) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.message ?? 'Erro na requisição')
  }
  return res.json()
}

const TYPE_LABELS: Record<string, string> = {
  DESPEJO:      'Despejo',
  COBRANCA:     'Cobrança',
  REVISIONAL:   'Revisional',
  RESCISAO:     'Rescisão',
  DANO:         'Dano',
  TRABALHISTA:  'Trabalhista',
  CRIMINAL:     'Criminal',
  OUTROS:       'Outros',
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  ATIVO:      { label: 'Ativo',      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: TrendingUp },
  ENCERRADO:  { label: 'Encerrado',  color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',         icon: CheckCircle2 },
  SUSPENSO:   { label: 'Suspenso',   color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',   icon: PauseCircle },
  ARQUIVADO:  { label: 'Arquivado',  color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',      icon: Archive },
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  BAIXA:   { label: 'Baixa',   color: 'text-gray-400' },
  NORMAL:  { label: 'Normal',  color: 'text-blue-400' },
  ALTA:    { label: 'Alta',    color: 'text-orange-400' },
  URGENTE: { label: 'Urgente', color: 'text-red-400' },
}

function fmt(v?: number | null) {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

function fmtDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function JuridicoPage() {
  const router = useRouter()
  const { getValidToken } = useAuth()
  const user = useAuthStore(s => s.user)

  // Verificar acesso ao módulo
  const settings = (user as any)?.settings ?? {}
  const moduleAccess: string[] = settings?.moduleAccess ?? []
  const role = (user as any)?.role ?? ''
  const hasAccess = role === 'ADMIN' || role === 'OWNER' || moduleAccess.includes('juridico')

  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('')
  const [type, setType]       = useState('')
  const [priority, setPriority] = useState('')
  const [page, setPage]       = useState(1)

  const { data: stats } = useQuery({
    queryKey: ['legal-stats'],
    queryFn: async () => {
      const token = await getValidToken()
      return apiFetch('/api/v1/legal/stats', token!)
    },
    enabled: hasAccess,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['legal-list', search, status, type, priority, page],
    queryFn: async () => {
      const token = await getValidToken()
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search)   params.set('search', search)
      if (status)   params.set('status', status)
      if (type)     params.set('type', type)
      if (priority) params.set('priority', priority)
      return apiFetch(`/api/v1/legal?${params}`, token!)
    },
    enabled: hasAccess,
  })

  const handleExport = async () => {
    const token = await getValidToken()
    const res = await fetch(`${API_URL}/api/v1/legal/export/csv`, {
      headers: { Authorization: `Bearer ${token!}` },
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'processos-juridicos.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!hasAccess) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Acesso Restrito</h2>
        <p className="text-white/50 text-center max-w-sm">
          O módulo Jurídico é de acesso restrito. Solicite ao administrador do sistema a liberação do seu acesso.
        </p>
        <Link href="/dashboard" className="px-4 py-2 bg-white/10 rounded-lg text-white/70 hover:bg-white/20 transition-colors text-sm">
          Voltar ao Dashboard
        </Link>
      </div>
    )
  }

  const cases = data?.data ?? []
  const meta  = data?.meta ?? { total: 0, page: 1, totalPages: 1 }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Scale className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Módulo Jurídico</h1>
            <p className="text-xs text-white/40">Gestão de processos e ações jurídicas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/10 rounded-lg text-xs text-white/70 hover:bg-white/20 transition-colors">
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </button>
          <Link href="/dashboard/juridico/novo"
            className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400 rounded-lg text-xs font-bold text-[#1B2B5B] hover:bg-yellow-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Novo Processo
          </Link>
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-white/40">Total</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.total ?? 0}</p>
            <p className="text-xs text-white/30 mt-1">processos</p>
          </div>
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-white/40">Ativos</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{stats.ativos ?? 0}</p>
            <p className="text-xs text-white/30 mt-1">em andamento</p>
          </div>
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-white/40">Valor Reclamado</span>
            </div>
            <p className="text-lg font-bold text-yellow-400">{fmt(stats.total_reclamado)}</p>
            <p className="text-xs text-white/30 mt-1">total em processos</p>
          </div>
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-white/40">Próx. Audiências</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{stats.upcomingHearings?.length ?? 0}</p>
            <p className="text-xs text-white/30 mt-1">agendadas</p>
          </div>
        </div>
      )}

      {/* Próximas audiências */}
      {stats?.upcomingHearings?.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-400">Próximas Audiências</span>
          </div>
          <div className="space-y-2">
            {stats.upcomingHearings.map((h: any) => (
              <div key={h.id} className="flex items-center justify-between gap-4 flex-wrap">
                <Link href={`/dashboard/juridico/${h.id}`}
                  className="text-sm text-white hover:text-yellow-400 transition-colors flex items-center gap-2">
                  <Scale className="w-3.5 h-3.5 text-white/40" />
                  {h.title}
                  {h.caseNumber && <span className="text-white/40 text-xs">#{h.caseNumber}</span>}
                </Link>
                <span className="text-xs text-yellow-300 font-medium">
                  {new Date(h.nextHearingAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white/5 rounded-xl border border-white/10 p-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por título, número, partes..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
          <option value="">Todos os status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select value={type} onChange={e => { setType(e.target.value); setPage(1) }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
          <option value="">Todos os tipos</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={priority} onChange={e => { setPriority(e.target.value); setPage(1) }}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
          <option value="">Todas as prioridades</option>
          {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        {(search || status || type || priority) && (
          <button onClick={() => { setSearch(''); setStatus(''); setType(''); setPriority(''); setPage(1) }}
            className="px-3 py-2 bg-white/10 rounded-lg text-xs text-white/60 hover:bg-white/20 transition-colors">
            Limpar filtros
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Processo</th>
                <th className="text-left p-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden md:table-cell">Tipo</th>
                <th className="text-left p-3 text-xs font-semibold text-white/40 uppercase tracking-wider">Status</th>
                <th className="text-left p-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden lg:table-cell">Partes</th>
                <th className="text-left p-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden xl:table-cell">Advogado</th>
                <th className="text-left p-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden lg:table-cell">Audiência</th>
                <th className="text-right p-3 text-xs font-semibold text-white/40 uppercase tracking-wider hidden md:table-cell">Valor</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <Loader2 className="w-6 h-6 text-white/30 animate-spin mx-auto" />
                </td></tr>
              ) : cases.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <Scale className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-white/30 text-sm">Nenhum processo encontrado</p>
                  <Link href="/dashboard/juridico/novo"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300">
                    <Plus className="w-3.5 h-3.5" /> Cadastrar primeiro processo
                  </Link>
                </td></tr>
              ) : cases.map((c: any) => {
                const statusCfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.ATIVO
                const priorityCfg = PRIORITY_CONFIG[c.priority] ?? PRIORITY_CONFIG.NORMAL
                return (
                  <tr key={c.id}
                    onClick={() => router.push(`/dashboard/juridico/${c.id}`)}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                    <td className="p-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-white line-clamp-1">{c.title}</span>
                        {c.caseNumber && (
                          <span className="text-xs text-white/40">#{c.caseNumber}</span>
                        )}
                        <span className={`text-[10px] font-semibold ${priorityCfg.color}`}>
                          ● {priorityCfg.label}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      <span className="text-xs text-white/60">{TYPE_LABELS[c.type] ?? c.type}</span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
                        {c.status === 'ATIVO' && <TrendingUp className="w-2.5 h-2.5" />}
                        {c.status === 'ENCERRADO' && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {c.status === 'SUSPENSO' && <PauseCircle className="w-2.5 h-2.5" />}
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <div className="flex flex-col gap-0.5 text-xs text-white/60">
                        {c.plaintiffName && <span className="flex items-center gap-1"><User className="w-3 h-3" />{c.plaintiffName}</span>}
                        {c.defendantName && <span className="flex items-center gap-1 text-white/40">vs. {c.defendantName}</span>}
                        {c.clientName && <span className="flex items-center gap-1 text-indigo-400"><Building2 className="w-3 h-3" />{c.clientName}</span>}
                      </div>
                    </td>
                    <td className="p-3 hidden xl:table-cell">
                      <div className="flex flex-col gap-0.5 text-xs text-white/60">
                        {c.lawyerName && <span>{c.lawyerName}</span>}
                        {c.lawyerOab && <span className="text-white/40">OAB {c.lawyerOab}</span>}
                      </div>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      {c.nextHearingAt ? (
                        <div className="flex items-center gap-1 text-xs">
                          <Calendar className="w-3 h-3 text-blue-400" />
                          <span className={new Date(c.nextHearingAt) < new Date() ? 'text-red-400' : 'text-blue-400'}>
                            {fmtDate(c.nextHearingAt)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-white/30">—</span>
                      )}
                    </td>
                    <td className="p-3 text-right hidden md:table-cell">
                      {c.claimedValue ? (
                        <span className="text-xs font-medium text-yellow-400">{fmt(c.claimedValue)}</span>
                      ) : (
                        <span className="text-xs text-white/30">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-white/10">
            <span className="text-xs text-white/40">
              {meta.total} processo{meta.total !== 1 ? 's' : ''} · Página {meta.page} de {meta.totalPages}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors">
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors">
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
