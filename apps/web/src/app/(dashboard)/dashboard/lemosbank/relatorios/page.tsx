'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import Link from 'next/link'
import {
  ChevronRight, BarChart3, FileText, Users, Receipt, List,
  TrendingUp, Building2, ArrowLeft, Download, Printer, MessageCircle, Mail,
} from 'lucide-react'
import { SearchInputWithVoice } from '@/components/ui/SearchInputWithVoice'
import { financeApi, type FinanceSummary, type LegacyContract } from '@/lib/api'

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

const fmt = (v: number | null | undefined) =>
  v == null
    ? '—'
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

// ── Report Menu ───────────────────────────────────────────────────────────────
const REPORT_CATEGORIES = [
  {
    id: 'operacional',
    icon: BarChart3,
    color: 'bg-blue-50 text-blue-600',
    title: 'Relatórios Operacionais',
    description: 'Contratos ativos, inadimplência, vencimentos e aluguéis pendentes',
  },
  {
    id: 'gerencial',
    icon: TrendingUp,
    color: 'bg-green-50 text-green-600',
    title: 'Relatórios Gerenciais',
    description: 'Receita mensal, fluxo de caixa, repasses e indicadores de performance',
  },
  {
    id: 'proprietarios',
    icon: Users,
    color: 'bg-orange-50 text-orange-600',
    title: 'Relatório de Proprietários',
    description: 'Repasses, comissões e pagamentos por proprietário no mês',
  },
  {
    id: 'contratos',
    icon: FileText,
    color: 'bg-purple-50 text-purple-600',
    title: 'Contratos',
    description: 'Listagem completa de contratos ativos e encerrados com detalhes',
  },
  {
    id: 'recibos',
    icon: Receipt,
    color: 'bg-yellow-50 text-yellow-600',
    title: 'Recibos',
    description: 'Aluguéis pagos, pendentes e em atraso por período',
  },
  {
    id: 'listagens',
    icon: List,
    color: 'bg-indigo-50 text-indigo-600',
    title: 'Listagens',
    description: 'Listagem de inquilinos, proprietários, fiadores e imóveis',
  },
]

// ── Operacional Report ────────────────────────────────────────────────────────
function OperacionalReport({ token }: { token: string }) {
  const { data: summary } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: () => financeApi.summary(token),
  })
  const s = summary as FinanceSummary | undefined
  if (!s) return <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Contratos Ativos',    value: String(s.activeContracts),        color: 'text-blue-600'  },
          { label: 'Aluguéis em Atraso',  value: String(s.lateRentals),            color: 'text-red-600'   },
          { label: 'Inadimplência',        value: `${s.inadimplencia}%`,            color: s.inadimplencia > 10 ? 'text-red-600' : 'text-yellow-600' },
          { label: 'Vencimentos 30 dias',  value: String(s.upcomingRentals.length), color: 'text-orange-600' },
        ].map(item => (
          <div key={item.label} className="bg-gray-50 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-gray-500 mt-1">{item.label}</p>
          </div>
        ))}
      </div>
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Próximos Vencimentos</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-2 text-gray-500 font-medium">Inquilino</th>
                <th className="text-left pb-2 text-gray-500 font-medium">Endereço</th>
                <th className="text-right pb-2 text-gray-500 font-medium">Vencimento</th>
                <th className="text-right pb-2 text-gray-500 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {s.upcomingRentals.map(r => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2 text-gray-800">{r.contract?.tenantName ?? '—'}</td>
                  <td className="py-2 text-gray-500 text-xs truncate max-w-xs">{r.contract?.propertyAddress ?? '—'}</td>
                  <td className="py-2 text-right text-gray-600">{r.dueDate ? new Date(r.dueDate).toLocaleDateString('pt-BR') : '—'}</td>
                  <td className="py-2 text-right font-semibold text-blue-600">{fmt(r.totalAmount ?? r.rentAmount)}</td>
                </tr>
              ))}
              {s.upcomingRentals.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-gray-400">Nenhum vencimento nos próximos 30 dias</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Gerencial Report ──────────────────────────────────────────────────────────
function GerencialReport({ token }: { token: string }) {
  const { data: summary } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: () => financeApi.summary(token),
  })
  const { data: cashflow } = useQuery({
    queryKey: ['finance-cashflow'],
    queryFn: () => financeApi.cashflow(token),
  })
  const s = summary as FinanceSummary | undefined
  if (!s) return <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />

  const cf = cashflow?.data ?? []
  const lastMonths = cf.slice(-6)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Receita do Mês',    value: fmt(s.income),        color: 'text-green-600' },
          { label: 'Despesas do Mês',   value: fmt(s.expenses),      color: 'text-red-600'   },
          { label: 'Saldo',             value: fmt(s.balance),       color: s.balance >= 0 ? 'text-blue-600' : 'text-red-600' },
          { label: 'Receita Prevista',  value: fmt(s.expectedIncome), color: 'text-purple-600' },
          { label: 'Total de Clientes', value: String(s.totalClients), color: 'text-indigo-600' },
          { label: 'Contratos Ativos',  value: String(s.activeContracts), color: 'text-blue-600' },
        ].map(item => (
          <div key={item.label} className="bg-gray-50 rounded-xl p-4 text-center">
            <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-gray-500 mt-1">{item.label}</p>
          </div>
        ))}
      </div>
      {lastMonths.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Histórico — últimos 6 meses</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-2 text-gray-500 font-medium">Mês</th>
                  <th className="text-right pb-2 text-gray-500 font-medium">Receita</th>
                  <th className="text-right pb-2 text-gray-500 font-medium">Despesas</th>
                  <th className="text-right pb-2 text-gray-500 font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {lastMonths.map((m: any) => (
                  <tr key={m.label} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 text-gray-700 capitalize">{m.label}</td>
                    <td className="py-2 text-right text-green-600 font-medium">{fmt(m.income)}</td>
                    <td className="py-2 text-right text-red-500">{fmt(m.expenses)}</td>
                    <td className={`py-2 text-right font-semibold ${m.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{fmt(m.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Contratos Report ──────────────────────────────────────────────────────────
function ContratosReport({ token, activeOnly }: { token: string; activeOnly?: boolean }) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(activeOnly ? 'ACTIVE' : '')

  const { data, isLoading } = useQuery({
    queryKey: ['relatorio-contratos', page, search, statusFilter],
    queryFn: () => financeApi.contracts(token, {
      page: String(page),
      limit: '25',
      ...(search && { search }),
      ...(statusFilter && { status: statusFilter }),
    }),
  })

  const items = data?.data ?? []
  const meta  = data?.meta

  const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    ACTIVE:   { label: 'Ativo',     color: 'bg-green-100 text-green-700' },
    FINISHED: { label: 'Encerrado', color: 'bg-gray-100 text-gray-600'   },
    CANCELED: { label: 'Cancelado', color: 'bg-red-100 text-red-700'     },
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <SearchInputWithVoice
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          onVoiceResult={(t) => { setSearch(t); setPage(1) }}
          placeholder="Buscar inquilino, proprietário, endereço..."
          containerClassName="flex-1 min-w-48"
          className="w-full py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          {[['', 'Todos'], ['ACTIVE', 'Ativos'], ['FINISHED', 'Encerrados'], ['CANCELED', 'Cancelados']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => { setStatusFilter(v); setPage(1) }}
              className={`px-3 py-2 ${statusFilter === v ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              {l}
            </button>
          ))}
        </div>
        {meta && <span className="text-sm text-gray-400 self-center">{meta.total} contratos</span>}
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3 text-gray-500 font-medium">Cód.</th>
              <th className="text-left p-3 text-gray-500 font-medium">Inquilino</th>
              <th className="text-left p-3 text-gray-500 font-medium">Proprietário</th>
              <th className="text-left p-3 text-gray-500 font-medium hidden md:table-cell">Endereço</th>
              <th className="text-right p-3 text-gray-500 font-medium">Valor</th>
              <th className="text-right p-3 text-gray-500 font-medium">Início</th>
              <th className="text-center p-3 text-gray-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i}><td colSpan={7} className="p-3"><div className="h-6 bg-gray-100 rounded animate-pulse" /></td></tr>
              ))
            ) : items.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">Nenhum contrato encontrado</td></tr>
            ) : items.map((c: LegacyContract) => {
              const cfg = STATUS_LABEL[c.status] ?? STATUS_LABEL.FINISHED
              return (
                <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="p-3 text-gray-400 text-xs font-mono">{c.legacyId ?? '—'}</td>
                  <td className="p-3 text-gray-800 font-medium">{c.tenant?.name ?? c.tenantName ?? '—'}</td>
                  <td className="p-3 text-gray-600">{c.landlord?.name ?? c.landlordName ?? '—'}</td>
                  <td className="p-3 text-gray-500 text-xs truncate max-w-[200px] hidden md:table-cell">{c.propertyAddress ?? '—'}</td>
                  <td className="p-3 text-right font-semibold text-blue-600">
                    {c.rentValue != null
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(c.rentValue))
                      : '—'}
                  </td>
                  <td className="p-3 text-right text-gray-500 text-xs">
                    {c.startDate ? new Date(c.startDate).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Página {meta.page} de {meta.totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Anterior</button>
            <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Próxima</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Recibos Report ────────────────────────────────────────────────────────────
function RecibosReport({ token }: { token: string }) {
  const { data: summary } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: () => financeApi.summary(token),
  })
  const s = summary as FinanceSummary | undefined

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total de Aluguéis no Mês', value: String(s?.totalRentals ?? '—'),    color: 'text-blue-600'  },
          { label: 'Pagos no Mês',              value: String((s?.totalRentals ?? 0) - (s?.lateRentals ?? 0)), color: 'text-green-600' },
          { label: 'Em Atraso',                 value: String(s?.lateRentals ?? '—'),     color: 'text-red-600'   },
        ].map(item => (
          <div key={item.label} className="bg-gray-50 rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-gray-500 mt-1">{item.label}</p>
          </div>
        ))}
      </div>
      {s && (s.lateRentalsList ?? []).length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">Aluguéis em Atraso</h3>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 text-gray-500 font-medium">Inquilino</th>
                  <th className="text-left p-3 text-gray-500 font-medium hidden md:table-cell">Endereço</th>
                  <th className="text-right p-3 text-gray-500 font-medium">Vencimento</th>
                </tr>
              </thead>
              <tbody>
                {(s.lateRentalsList ?? []).map((r: any) => (
                  <tr key={r.id} className="border-t border-gray-50 hover:bg-red-50">
                    <td className="p-3 text-gray-800 font-medium">{r.contract?.tenantName ?? '—'}</td>
                    <td className="p-3 text-gray-500 text-xs hidden md:table-cell">{r.contract?.propertyAddress ?? '—'}</td>
                    <td className="p-3 text-right text-red-600 font-semibold">
                      {r.dueDate ? new Date(r.dueDate).toLocaleDateString('pt-BR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {(!s || (s.lateRentalsList ?? []).length === 0) && (
        <p className="text-center text-gray-400 py-8">Nenhum aluguel em atraso</p>
      )}
    </div>
  )
}

// ── Proprietários Report ──────────────────────────────────────────────────────
function ProprietariosReport({ token }: { token: string }) {
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [month, setMonth] = useState(defaultMonth)
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const [sendingWA, setSendingWA] = useState<string | null>(null)
  const [emailInput, setEmailInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [actionMsg, setActionMsg] = useState<{ id: string; type: 'success' | 'error'; text: string } | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['finance-report-proprietarios', month],
    queryFn: () =>
      apiFetch(`/api/v1/finance/reports/proprietarios?month=${month}`, token),
  })

  const items: any[] = data?.data ?? data ?? []

  const handleSendEmail = async (item: any) => {
    if (!emailInput.trim()) return
    try {
      await apiFetch(`/api/v1/finance/rentals/${item.rentalId ?? item.id}/send-email`, token, {
        method: 'POST',
        body: JSON.stringify({ email: emailInput }),
      })
      setActionMsg({ id: item.id, type: 'success', text: 'Email enviado!' })
    } catch (e: any) {
      setActionMsg({ id: item.id, type: 'error', text: e.message })
    } finally {
      setSendingEmail(null)
      setEmailInput('')
    }
  }

  const handleSendWA = async (item: any) => {
    if (!phoneInput.trim()) return
    try {
      await apiFetch(`/api/v1/finance/rentals/${item.rentalId ?? item.id}/send-whatsapp`, token, {
        method: 'POST',
        body: JSON.stringify({ phone: phoneInput }),
      })
      setActionMsg({ id: item.id, type: 'success', text: 'WhatsApp enviado!' })
    } catch (e: any) {
      setActionMsg({ id: item.id, type: 'error', text: e.message })
    } finally {
      setSendingWA(null)
      setPhoneInput('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Mês de referência</label>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 mt-5"
        >
          <Printer className="w-4 h-4" />
          Imprimir Relatório
        </button>
      </div>

      {isLoading ? (
        <div className="h-40 bg-gray-50 rounded-xl animate-pulse" />
      ) : items.length === 0 ? (
        <p className="text-center text-gray-400 py-10">Nenhum dado encontrado para {month}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 text-gray-500 font-medium">Proprietário</th>
                <th className="text-left p-3 text-gray-500 font-medium hidden md:table-cell">Imóvel</th>
                <th className="text-right p-3 text-gray-500 font-medium">Aluguel</th>
                <th className="text-right p-3 text-gray-500 font-medium">Valor Pago</th>
                <th className="text-right p-3 text-gray-500 font-medium hidden lg:table-cell">Data Pgto</th>
                <th className="text-right p-3 text-gray-500 font-medium">Comissão</th>
                <th className="text-right p-3 text-gray-500 font-medium">Repasse Líquido</th>
                <th className="text-center p-3 text-gray-500 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id ?? item.rentalId} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="p-3 text-gray-800 font-medium">{item.landlordName ?? item.landlord?.name ?? '—'}</td>
                  <td className="p-3 text-gray-500 text-xs truncate max-w-[180px] hidden md:table-cell">{item.propertyAddress ?? item.address ?? '—'}</td>
                  <td className="p-3 text-right font-semibold text-blue-600">{fmt(item.rentAmount ?? item.aluguel)}</td>
                  <td className="p-3 text-right text-green-600 font-medium">{fmt(item.paidAmount ?? item.valorPago)}</td>
                  <td className="p-3 text-right text-gray-500 text-xs hidden lg:table-cell">
                    {item.paymentDate ? new Date(item.paymentDate).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="p-3 text-right text-orange-600">{fmt(item.commission ?? item.comissao)}</td>
                  <td className="p-3 text-right font-bold text-gray-900">{fmt(item.netRepasse ?? item.repasseLiquido)}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Email inline */}
                      {sendingEmail === (item.id ?? item.rentalId) ? (
                        <div className="flex gap-1 items-center">
                          <input
                            type="email"
                            value={emailInput}
                            onChange={e => setEmailInput(e.target.value)}
                            placeholder="email@..."
                            className="text-xs border border-gray-200 rounded px-1.5 py-1 w-32 focus:outline-none"
                            autoFocus
                          />
                          <button onClick={() => handleSendEmail(item)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">OK</button>
                          <button onClick={() => { setSendingEmail(null); setEmailInput('') }} className="text-xs text-gray-400">✕</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setSendingEmail(item.id ?? item.rentalId); setSendingWA(null) }}
                          title="Enviar por Email"
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {/* WhatsApp inline */}
                      {sendingWA === (item.id ?? item.rentalId) ? (
                        <div className="flex gap-1 items-center">
                          <input
                            type="tel"
                            value={phoneInput}
                            onChange={e => setPhoneInput(e.target.value)}
                            placeholder="(11) 9..."
                            className="text-xs border border-gray-200 rounded px-1.5 py-1 w-28 focus:outline-none"
                            autoFocus
                          />
                          <button onClick={() => handleSendWA(item)} className="text-xs bg-green-600 text-white px-2 py-1 rounded">OK</button>
                          <button onClick={() => { setSendingWA(null); setPhoneInput('') }} className="text-xs text-gray-400">✕</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setSendingWA(item.id ?? item.rentalId); setSendingEmail(null) }}
                          title="Enviar por WhatsApp"
                          className="p-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {actionMsg?.id === (item.id ?? item.rentalId) && actionMsg && (
                      <p className={`text-xs mt-1 text-center ${actionMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {actionMsg.text}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Listagens Report ──────────────────────────────────────────────────────────
function ListagensReport() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { href: '/dashboard/clientes?role=TENANT',    icon: Users,    label: 'Lista de Inquilinos',  desc: 'Todos os locatários cadastrados',         color: 'bg-blue-50 text-blue-600' },
        { href: '/dashboard/clientes?role=LANDLORD',  icon: Building2, label: 'Lista de Proprietários', desc: 'Todos os proprietários cadastrados',    color: 'bg-green-50 text-green-600' },
        { href: '/dashboard/clientes?role=GUARANTOR', icon: Users,    label: 'Lista de Fiadores',    desc: 'Todos os fiadores cadastrados',           color: 'bg-purple-50 text-purple-600' },
        { href: '/dashboard/contratos?status=ACTIVE', icon: FileText, label: 'Contratos Ativos',     desc: 'Listagem de contratos em vigor',          color: 'bg-indigo-50 text-indigo-600' },
        { href: '/dashboard/contratos?status=FINISHED', icon: FileText, label: 'Contratos Encerrados', desc: 'Contratos finalizados ou rescindidos',  color: 'bg-gray-50 text-gray-600' },
        { href: '/dashboard/clientes',                icon: List,     label: 'Todos os Clientes',    desc: 'Listagem geral de todos os clientes',     color: 'bg-yellow-50 text-yellow-600' },
      ].map(item => (
        <Link key={item.href} href={item.href} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <div className={`p-2.5 rounded-lg ${item.color}`}>
            <item.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
            <p className="text-xs text-gray-500">{item.desc}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
        </Link>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RelatoriosPage() {
  const token = useAuthStore(s => s.accessToken)
  const [activeReport, setActiveReport] = useState<string | null>(null)

  const activeCategory = REPORT_CATEGORIES.find(c => c.id === activeReport)

  function renderReport() {
    if (!token) return null
    switch (activeReport) {
      case 'operacional':   return <OperacionalReport token={token} />
      case 'gerencial':     return <GerencialReport token={token} />
      case 'proprietarios': return <ProprietariosReport token={token} />
      case 'contratos':     return <ContratosReport token={token} />
      case 'recibos':       return <RecibosReport token={token} />
      case 'listagens':     return <ListagensReport />
      default:              return null
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/lemosbank" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="p-2 rounded-xl bg-blue-50">
          <BarChart3 className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-500">
            {activeCategory ? activeCategory.title : 'Selecione um relatório para visualizar'}
          </p>
        </div>
      </div>

      {/* Tab strip */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveReport(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
            activeReport === null ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Visão Geral
        </button>
        {REPORT_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveReport(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeReport === cat.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {cat.title.replace('Relatórios ', '')}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeReport === null ? (
        /* Menu grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REPORT_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveReport(cat.id)}
              className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left"
            >
              <div className={`p-3 rounded-xl ${cat.color}`}>
                <cat.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{cat.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{cat.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        /* Report content */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-gray-900 text-lg">{activeCategory?.title}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
            </div>
          </div>
          {renderReport()}
        </div>
      )}
    </div>
  )
}
