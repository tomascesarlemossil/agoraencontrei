'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth.store'
import { saasFinanceApi } from '@/lib/api'
import {
  Landmark, TrendingUp, DollarSign, Clock, AlertTriangle,
  ArrowUpRight, ArrowDownRight, CreditCard, QrCode, FileText,
  RefreshCw, Filter, Calendar,
} from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  paid:     'bg-green-100 text-green-700',
  pending:  'bg-yellow-100 text-yellow-700',
  overdue:  'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-gray-100 text-gray-400',
}

const STATUS_LABELS: Record<string, string> = {
  paid: 'Pago', pending: 'Pendente', overdue: 'Vencido', refunded: 'Estornado', cancelled: 'Cancelado',
}

const TYPE_LABELS: Record<string, string> = {
  subscription: 'Assinatura', module: 'M\u00f3dulo', service: 'Servi\u00e7o', commission: 'Comiss\u00e3o', refund: 'Estorno',
}

const BILLING_ICONS: Record<string, typeof QrCode> = {
  PIX: QrCode, BOLETO: FileText, CREDIT_CARD: CreditCard,
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function SaasFinanceiroPage() {
  const token = useAuthStore(s => s.accessToken)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  const { data: summary } = useQuery({
    queryKey: ['saas-finance-summary'],
    queryFn: () => saasFinanceApi.summary(token!),
    enabled: !!token,
  })

  const { data: txData, isLoading } = useQuery({
    queryKey: ['saas-finance-transactions', statusFilter, typeFilter],
    queryFn: () => saasFinanceApi.transactions(token!, {
      status: statusFilter !== 'all' ? statusFilter : undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
    }),
    enabled: !!token,
  })

  const transactions = txData?.data ?? []

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Landmark className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600 shrink-0" />
            Financeiro SaaS
          </h1>
          <p className="text-sm text-gray-500 truncate">Transa&ccedil;&otilde;es da plataforma — cobran&ccedil;as, comiss&otilde;es, MRR</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: 'MRR', value: summary?.mrr ?? 0, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Recebido (m\u00eas)', value: summary?.monthReceived ?? 0, icon: ArrowUpRight, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pendente', value: summary?.totalPending ?? 0, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Vencido', value: summary?.totalOverdue ?? 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border border-gray-200 p-3 sm:p-4 ${s.bg}`}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-gray-500">{s.label}</span>
            </div>
            <p className={`text-lg sm:text-2xl font-bold ${s.color}`}>{formatCurrency(s.value)}</p>
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: 'ARR', value: formatCurrency(summary?.arr ?? 0) },
          { label: 'Total Recebido', value: formatCurrency(summary?.totalReceived ?? 0) },
          { label: 'Hoje', value: formatCurrency(summary?.todayReceived ?? 0) },
          { label: 'Pendente (m\u00eas)', value: formatCurrency(summary?.monthPending ?? 0) },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-sm sm:text-base font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="h-4 w-4 text-gray-400 shrink-0" />
          {['all', 'paid', 'pending', 'overdue'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                statusFilter === s
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === 'all' ? 'Todos' : STATUS_LABELS[s] ?? s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['all', 'subscription', 'module', 'service', 'commission'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                typeFilter === t
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t === 'all' ? 'Tipos' : TYPE_LABELS[t] ?? t}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-emerald-600 border-t-transparent rounded-full" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Landmark className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma transa&ccedil;&atilde;o encontrada</p>
          <p className="text-sm text-gray-400">As cobran&ccedil;as ser&atilde;o sincronizadas automaticamente via Asaas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((tx: any) => {
            const BillingIcon = tx.billingType ? (BILLING_ICONS[tx.billingType] ?? DollarSign) : DollarSign

            return (
              <div key={tx.id} className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_COLORS[tx.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABELS[tx.status] ?? tx.status}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        {TYPE_LABELS[tx.type] ?? tx.type}
                      </span>
                      {tx.billingType && (
                        <BillingIcon className="h-3.5 w-3.5 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-700 truncate">{tx.description || tx.externalRef || tx.asaasId || '—'}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{formatDate(tx.createdAt)}</span>
                      {tx.dueDate && <span>Venc: {formatDate(tx.dueDate)}</span>}
                      {tx.paidAt && <span className="text-green-600">Pago: {formatDate(tx.paidAt)}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm sm:text-base font-bold ${tx.status === 'paid' ? 'text-green-600' : tx.status === 'overdue' ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatCurrency(Number(tx.amount))}
                    </p>
                    {tx.commissionAmount && (
                      <p className="text-xs text-purple-500">Comiss\u00e3o: {formatCurrency(Number(tx.commissionAmount))}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
