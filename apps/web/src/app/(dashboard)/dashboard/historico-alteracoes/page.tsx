'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  History, Filter, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  FileText, Building2, Users, UserCheck, CreditCard, Loader2, Search, X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { UserAvatar } from '@/components/ui/UserAvatar'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface AuditLog {
  id: string
  action: string
  resource: string
  resourceId: string
  userId: string | null
  ipAddress: string | null
  payload: { before?: Record<string, unknown>; after?: Record<string, unknown>; changes?: string[] } | null
  createdAt: string
  user: { id: string; name: string; avatarUrl: string | null } | null
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

// ── Labels e cores ────────────────────────────────────────────────────────────
const ACTION_LABELS: Record<string, string> = {
  'contract.create':     'criou Contrato',
  'contract.update':     'editou Contrato',
  'contract.delete':     'excluiu Contrato',
  'contract.rescission': 'rescindiu Contrato',
  'rental.pay':          'registrou pagamento de Aluguel',
  'property.create':     'cadastrou Imóvel',
  'property.update':     'editou Imóvel',
  'property.delete':     'desativou Imóvel',
  'contact.create':      'criou Contato',
  'contact.update':      'editou Contato',
  'contact.delete':      'excluiu Contato',
  'client.create':       'criou Cliente',
  'client.update':       'editou Cliente',
  'client.delete':       'excluiu Cliente',
  'deal.create':         'criou Negociação',
  'deal.update':         'editou Negociação',
  'user.login':          'fez login',
  'user.register':       'criou conta',
}

const ACTION_COLORS: Record<string, { dot: string; badge: string }> = {
  create:     { dot: 'bg-green-500',  badge: 'bg-green-100 text-green-800' },
  update:     { dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-800' },
  delete:     { dot: 'bg-red-500',    badge: 'bg-red-100 text-red-800' },
  rescission: { dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800' },
  pay:        { dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-800' },
  login:      { dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-600' },
  register:   { dot: 'bg-teal-500',   badge: 'bg-teal-100 text-teal-800' },
}

const RESOURCE_ICONS: Record<string, React.ElementType> = {
  contract: FileText,
  property: Building2,
  contact:  UserCheck,
  client:   Users,
  rental:   CreditCard,
  user:     Users,
}

function getActionStyle(action: string) {
  const verb = action.split('.')[1] ?? 'update'
  return ACTION_COLORS[verb] ?? ACTION_COLORS.update
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value as string))) {
    try { return new Date(value as string).toLocaleDateString('pt-BR') } catch { return String(value) }
  }
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 80)
  return String(value).slice(0, 120)
}

function translateFieldName(field: string): string {
  const map: Record<string, string> = {
    rentValue: 'Valor do Aluguel', status: 'Status', isActive: 'Ativo',
    tenantName: 'Inquilino', landlordId: 'Proprietário', tenantId: 'Inquilino (ID)',
    startDate: 'Data de Início', rescissionDate: 'Data Rescisão',
    adjustmentIndex: 'Índice de Reajuste', tenantDueDay: 'Vencimento Inquilino',
    landlordDueDay: 'Vencimento Proprietário', title: 'Título', price: 'Preço',
    priceRent: 'Aluguel', type: 'Tipo', city: 'Cidade', neighborhood: 'Bairro',
    address: 'Endereço', bedrooms: 'Quartos', bathrooms: 'Banheiros', area: 'Área (m²)',
    name: 'Nome', email: 'E-mail', phone: 'Telefone', document: 'CPF/CNPJ',
    paidAmount: 'Valor Pago', paymentDate: 'Data Pagamento',
  }
  return map[field] ?? field
}

// ── DiffTable component ───────────────────────────────────────────────────────
function DiffTable({ before, after, changes }: {
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  changes?: string[]
}) {
  const fields = changes?.length
    ? changes
    : Object.keys(after ?? before ?? {}).filter(k => !['id', 'companyId', 'createdAt', 'updatedAt'].includes(k))

  if (!fields.length) return <p className="text-xs text-gray-400 py-2">Sem detalhes de alteração disponíveis.</p>

  return (
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr className="bg-gray-50">
          <th className="text-left p-2 border border-gray-200 text-gray-500 font-medium w-1/3">Campo</th>
          {before !== null && before !== undefined && <th className="text-left p-2 border border-gray-200 text-gray-500 font-medium">Antes</th>}
          <th className="text-left p-2 border border-gray-200 text-gray-500 font-medium">Depois</th>
        </tr>
      </thead>
      <tbody>
        {fields.map(field => (
          <tr key={field} className="hover:bg-gray-50">
            <td className="p-2 border border-gray-200 font-medium text-gray-700">{translateFieldName(field)}</td>
            {before !== null && before !== undefined && (
              <td className="p-2 border border-gray-200 text-red-600 line-through">
                {formatFieldValue(before?.[field])}
              </td>
            )}
            <td className="p-2 border border-gray-200 text-green-700 font-medium">
              {formatFieldValue(after?.[field])}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Log item ──────────────────────────────────────────────────────────────────
function AuditLogItem({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false)
  const style = getActionStyle(log.action)
  const label = ACTION_LABELS[log.action] ?? log.action
  const ResourceIcon = RESOURCE_ICONS[log.resource] ?? FileText
  const hasDiff = log.payload && (log.payload.before !== undefined || log.payload.after !== undefined)

  return (
    <div className="flex gap-4 group">
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} />
        <div className="w-px flex-1 bg-gray-200 mt-1" />
      </div>

      {/* Content */}
      <div className="pb-5 flex-1 min-w-0">
        <div className="flex items-start gap-3 flex-wrap">
          <UserAvatar name={log.user?.name ?? 'Sistema'} avatarUrl={log.user?.avatarUrl} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-gray-800">
                {log.user?.name ?? 'Sistema'}
              </span>
              <span className="text-sm text-gray-600">{label}</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>
                <ResourceIcon className="h-3 w-3" />
                {log.resource}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{formatDate(log.createdAt)}</p>
          </div>

          {hasDiff && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 flex-shrink-0"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? 'Ocultar' : 'Ver diff'}
            </button>
          )}
        </div>

        {expanded && hasDiff && (
          <div className="mt-3 ml-9 rounded-xl border border-gray-200 overflow-hidden">
            <DiffTable
              before={log.payload?.before ?? null}
              after={log.payload?.after ?? null}
              changes={log.payload?.changes}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HistoricoAlteracoesPage() {
  const { accessToken: token, user } = useAuthStore()
  const router = useRouter()

  const [logs, setLogs]   = useState<AuditLog[]>([])
  const [meta, setMeta]   = useState<Meta | null>(null)
  const [loading, setLoading] = useState(true)

  const [page, setPage]         = useState(1)
  const [resource, setResource] = useState('')
  const [action, setAction]     = useState('')
  const [from, setFrom]         = useState('')
  const [to, setTo]             = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const fetchLogs = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' })
      if (resource) params.set('resource', resource)
      if (action)   params.set('action', action)
      if (from)     params.set('from', from)
      if (to)       params.set('to', to)

      const res = await fetch(`${API_URL}/api/v1/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 403) { router.push('/dashboard'); return }
      const data = await res.json()
      setLogs(data.data ?? [])
      setMeta(data.meta ?? null)
    } catch {}
    finally { setLoading(false) }
  }, [token, page, resource, action, from, to, router])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  function clearFilters() {
    setResource(''); setAction(''); setFrom(''); setTo(''); setPage(1)
  }

  const hasFilters = resource || action || from || to

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#EEF2FF' }}
          >
            <History className="h-5 w-5" style={{ color: '#1B2B5B' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
              Histórico de Alterações
            </h1>
            <p className="text-sm text-gray-500">
              Todas as ações realizadas no sistema
              {meta && ` · ${meta.total.toLocaleString('pt-BR')} registros`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowFilters(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          style={{ borderColor: '#ddd9d0' }}
        >
          <Filter className="h-4 w-4" />
          Filtros
          {hasFilters && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ backgroundColor: '#f8f7f5', border: '1px solid #ddd9d0' }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Recurso</label>
              <select
                value={resource}
                onChange={e => { setResource(e.target.value); setPage(1) }}
                className="w-full text-sm border rounded-xl px-3 py-2 bg-white focus:outline-none"
                style={{ borderColor: '#ddd9d0' }}
              >
                <option value="">Todos</option>
                <option value="contract">Contratos</option>
                <option value="property">Imóveis</option>
                <option value="contact">Contatos</option>
                <option value="client">Clientes</option>
                <option value="rental">Aluguéis</option>
                <option value="user">Usuários</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ação</label>
              <select
                value={action}
                onChange={e => { setAction(e.target.value); setPage(1) }}
                className="w-full text-sm border rounded-xl px-3 py-2 bg-white focus:outline-none"
                style={{ borderColor: '#ddd9d0' }}
              >
                <option value="">Todas</option>
                <option value="create">Criação</option>
                <option value="update">Edição</option>
                <option value="delete">Exclusão</option>
                <option value="rescission">Rescisão</option>
                <option value="pay">Pagamento</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">De</label>
              <input
                type="date"
                value={from}
                onChange={e => { setFrom(e.target.value); setPage(1) }}
                className="w-full text-sm border rounded-xl px-3 py-2 bg-white focus:outline-none"
                style={{ borderColor: '#ddd9d0' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Até</label>
              <input
                type="date"
                value={to}
                onChange={e => { setTo(e.target.value); setPage(1) }}
                className="w-full text-sm border rounded-xl px-3 py-2 bg-white focus:outline-none"
                style={{ borderColor: '#ddd9d0' }}
              />
            </div>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors"
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {/* Log list */}
      <div
        className="rounded-2xl bg-white p-6"
        style={{ border: '1px solid #ddd9d0' }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#C9A84C' }} />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <History className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">Nenhum registro encontrado</p>
            <p className="text-sm mt-1">
              {hasFilters ? 'Tente ajustar os filtros.' : 'As alterações aparecerão aqui automaticamente.'}
            </p>
          </div>
        ) : (
          <div>
            {logs.map((log, i) => (
              <div key={log.id}>
                <AuditLogItem log={log} />
                {/* Remove the trailing line on the last item */}
                {i === logs.length - 1 && (
                  <div className="h-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ borderColor: '#ddd9d0' }}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>

          <span className="text-sm text-gray-500">
            Página {meta.page} de {meta.totalPages}
          </span>

          <button
            onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
            disabled={page >= meta.totalPages}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ borderColor: '#ddd9d0' }}
          >
            Próxima
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
