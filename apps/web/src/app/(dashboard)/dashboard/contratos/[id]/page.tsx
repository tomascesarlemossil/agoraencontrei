'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { financeApi, type LegacyRental } from '@/lib/api'
import Link from 'next/link'
import {
  ArrowLeft, FileText, User, Home, Calendar, DollarSign,
  Phone, Mail, CheckCircle, Clock, AlertCircle,
  Scissors, Building2, Percent, RefreshCw, Link2,
} from 'lucide-react'

const fmt = (v: number | null | undefined) =>
  v == null ? '—'
  : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '—'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE:   { label: 'Ativo',     color: 'text-green-400 bg-green-500/20' },
  FINISHED: { label: 'Encerrado', color: 'text-gray-400 bg-white/10' },
  CANCELED: { label: 'Cancelado', color: 'text-red-400 bg-red-500/20' },
}

const RENTAL_STATUS: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  PAID:      { label: 'Pago',      icon: CheckCircle, color: 'text-green-400' },
  PENDING:   { label: 'Pendente',  icon: Clock,       color: 'text-yellow-400' },
  LATE:      { label: 'Atrasado',  icon: AlertCircle, color: 'text-red-400' },
  PARTIAL:   { label: 'Parcial',   icon: Clock,       color: 'text-orange-400' },
  CANCELLED: { label: 'Cancelado', icon: AlertCircle, color: 'text-gray-400' },
}

export default function ContratoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const token = useAuthStore(s => s.accessToken)

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => financeApi.contract(token!, id),
    enabled: !!token && !!id,
  })

  const qc = useQueryClient()
  const [showRescisao, setShowRescisao] = useState(false)
  const [rescDate, setRescDate] = useState(new Date().toISOString().split('T')[0])
  const [rescType, setRescType] = useState<'FINISHED' | 'CANCELED'>('FINISHED')

  const rescisaoMutation = useMutation({
    mutationFn: () => financeApi.registrarRescisao(token!, id, {
      rescissionDate: rescDate,
      status: rescType,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract', id] })
      qc.invalidateQueries({ queryKey: ['finance-contracts'] })
      qc.invalidateQueries({ queryKey: ['finance-summary'] })
      setShowRescisao(false)
    },
  })

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="p-6 text-center py-20">
        <FileText className="h-10 w-10 text-white/40 mx-auto mb-3" />
        <p className="text-white/40">Contrato não encontrado</p>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[contract.status] ?? STATUS_CONFIG.FINISHED
  const rentals = contract.rentals ?? []
  const paidRentals = rentals.filter(r => r.status === 'PAID')
  const lateRentals = rentals.filter(r => r.status === 'LATE')
  const totalPago = paidRentals.reduce((s, r) => s + (r.paidAmount ?? r.totalAmount ?? 0), 0)

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-white truncate">{contract.propertyAddress ?? 'Contrato'}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>
          {contract.legacyId && <p className="text-xs text-white/40 mt-0.5">Ref. #{contract.legacyId}</p>}
        </div>
        {contract.status === 'ACTIVE' && (
          <button
            onClick={() => setShowRescisao(s => !s)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-medium transition-colors"
          >
            <Scissors className="h-3.5 w-3.5" />
            Rescisão
          </button>
        )}
      </div>

      {showRescisao && contract.status === 'ACTIVE' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <Scissors className="h-4 w-4" /> Registrar Rescisão
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 block mb-1">Data da Rescisão</label>
              <input
                type="date"
                value={rescDate}
                onChange={e => setRescDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Tipo</label>
              <select
                value={rescType}
                onChange={e => setRescType(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              >
                <option value="FINISHED">Encerrado (amigável)</option>
                <option value="CANCELED">Cancelado (judicial)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => rescisaoMutation.mutate()}
              disabled={rescisaoMutation.isPending}
              className="px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50"
            >
              {rescisaoMutation.isPending ? 'Registrando...' : 'Confirmar Rescisão'}
            </button>
            <button onClick={() => setShowRescisao(false)} className="px-4 py-2 bg-white/5 text-white/60 text-sm rounded-lg hover:bg-white/10">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Imóvel */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Home className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Imóvel</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-white/40 text-xs">Endereço</p>
              <p className="text-white">{contract.propertyAddress ?? '—'}</p>
            </div>
            {contract.iptuCode && (
              <div>
                <p className="text-white/40 text-xs">IPTU</p>
                <p className="text-white">{contract.iptuCode}</p>
              </div>
            )}
          </div>
        </div>

        {/* Datas e Valores */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">Período e Valores</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-white/40 text-xs">Início</p>
              <p className="text-white">{fmtDate(contract.startDate)}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Duração</p>
              <p className="text-white">{contract.duration ? `${contract.duration} meses` : '—'}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Aluguel</p>
              <p className="text-lg font-bold text-blue-400">{fmt(contract.rentValue as unknown as number)}</p>
            </div>
            {contract.tenantDueDay && (
              <div>
                <p className="text-white/40 text-xs">Venc. Inquilino</p>
                <p className="text-white">Dia {contract.tenantDueDay}</p>
              </div>
            )}
            {contract.adjustmentIndex && (
              <div className="col-span-2">
                <p className="text-white/40 text-xs">Índice de Reajuste</p>
                <p className="text-white">{contract.adjustmentIndex}</p>
              </div>
            )}
            {contract.landlordDueDay && (
              <div>
                <p className="text-white/40 text-xs">Venc. Proprietário</p>
                <p className="text-white">Dia {contract.landlordDueDay}</p>
              </div>
            )}
            {contract.commission != null && Number(contract.commission) > 0 && (
              <div>
                <p className="text-white/40 text-xs">Comissão Adm.</p>
                <p className="text-white">{Number(contract.commission)}%</p>
              </div>
            )}
            {contract.penalty != null && Number(contract.penalty) > 0 && (
              <div>
                <p className="text-white/40 text-xs">Multa</p>
                <p className="text-white">{Number(contract.penalty)}%</p>
              </div>
            )}
            {contract.adjustmentPercent != null && Number(contract.adjustmentPercent) > 0 && (
              <div>
                <p className="text-white/40 text-xs">% Reajuste</p>
                <p className="text-white">{Number(contract.adjustmentPercent)}%</p>
              </div>
            )}
            {contract.initialValue != null && Number(contract.initialValue) > 0 && (
              <div>
                <p className="text-white/40 text-xs">Valor Inicial</p>
                <p className="text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(contract.initialValue))}</p>
              </div>
            )}
            {contract.rescissionDate && (
              <div className="col-span-2">
                <p className="text-white/40 text-xs">Data de Rescisão</p>
                <p className="text-red-400 font-medium">{new Date(contract.rescissionDate).toLocaleDateString('pt-BR')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Inquilino */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Inquilino</h2>
          </div>
          {contract.tenant ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-white">{contract.tenant.name}</p>
              <Link href={`/dashboard/clientes/${contract.tenant.id}`} className="text-xs text-blue-400 hover:underline">
                Ver perfil completo
              </Link>
              {contract.tenant.document && <p className="text-white/40 text-xs">Doc: {contract.tenant.document}</p>}
              {contract.tenant.phone && (
                <div className="flex items-center gap-1.5 text-white/60">
                  <Phone className="h-3 w-3" />{contract.tenant.phone}
                </div>
              )}
              {contract.tenant.email && (
                <div className="flex items-center gap-1.5 text-white/60">
                  <Mail className="h-3 w-3" />{contract.tenant.email}
                </div>
              )}
            </div>
          ) : (
            <p className="text-white/40 text-sm">{contract.tenantName ?? '—'}</p>
          )}
        </div>

        {/* Proprietário */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-4 w-4 text-yellow-400" />
            <h2 className="text-sm font-semibold text-white">Proprietário</h2>
          </div>
          {contract.landlord ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-white">{contract.landlord.name}</p>
              <Link href={`/dashboard/clientes/${contract.landlord.id}`} className="text-xs text-blue-400 hover:underline">
                Ver perfil completo
              </Link>
              {contract.landlord.document && <p className="text-white/40 text-xs">Doc: {contract.landlord.document}</p>}
              {contract.landlord.phone && (
                <div className="flex items-center gap-1.5 text-white/60">
                  <Phone className="h-3 w-3" />{contract.landlord.phone}
                </div>
              )}
              {contract.landlord.email && (
                <div className="flex items-center gap-1.5 text-white/60">
                  <Mail className="h-3 w-3" />{contract.landlord.email}
                </div>
              )}
            </div>
          ) : (
            <p className="text-white/40 text-sm">{contract.landlordName ?? '—'}</p>
          )}
        </div>
      </div>

      {/* Resumo financeiro */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 text-center">
          <DollarSign className="h-5 w-5 text-green-400 mx-auto mb-1" />
          <p className="text-xs text-white/50">Total Pago</p>
          <p className="text-sm font-bold text-green-400">{fmt(totalPago)}</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 text-center">
          <Clock className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
          <p className="text-xs text-white/50">Em Aberto</p>
          <p className="text-sm font-bold text-yellow-400">
            {rentals.filter(r => r.status === 'PENDING').length} parcela(s)
          </p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
          <AlertCircle className="h-5 w-5 text-red-400 mx-auto mb-1" />
          <p className="text-xs text-white/50">Atrasadas</p>
          <p className="text-sm font-bold text-red-400">{lateRentals.length} parcela(s)</p>
        </div>
      </div>

      {/* Histórico de aluguéis */}
      {rentals.length > 0 && (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">Histórico de Aluguéis</h2>
            <p className="text-xs text-white/40">{rentals.length} registros</p>
          </div>
          <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
            {rentals.map((r: LegacyRental) => {
              const rCfg = RENTAL_STATUS[r.status] ?? RENTAL_STATUS.PENDING
              const RIcon = rCfg.icon
              return (
                <div key={r.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <RIcon className={`h-4 w-4 ${rCfg.color} flex-shrink-0`} />
                    <div>
                      <p className="text-sm text-white">Venc. {fmtDate(r.dueDate)}</p>
                      {r.paymentDate && <p className="text-xs text-white/40">Pago em {fmtDate(r.paymentDate)}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${rCfg.color}`}>{fmt(r.paidAmount ?? r.totalAmount ?? r.rentAmount)}</p>
                    <p className={`text-xs ${rCfg.color} opacity-70`}>{rCfg.label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
