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
  Scissors, Building2, Percent, RefreshCw, Link2, Download,
  History, TrendingUp, RotateCcw,
} from 'lucide-react'

const fmt = (v: number | null | undefined) =>
  v == null ? '—'
  : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '—'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE:         { label: 'Ativo',          color: 'text-green-400 bg-green-500/20' },
  FINISHED:       { label: 'Encerrado',      color: 'text-gray-400 bg-white/10' },
  CANCELED:       { label: 'Cancelado',      color: 'text-red-400 bg-red-500/20' },
  IN_RENEWAL:     { label: 'Em Renovação',   color: 'text-blue-400 bg-blue-500/20' },
  EXPIRED:        { label: 'Vencido',        color: 'text-orange-400 bg-orange-500/20' },
  IN_NEGOTIATION: { label: 'Em Negociação',  color: 'text-purple-400 bg-purple-500/20' },
}

const RENTAL_STATUS: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
  PAID:      { label: 'Pago',      icon: CheckCircle, color: 'text-green-400' },
  PENDING:   { label: 'Pendente',  icon: Clock,       color: 'text-yellow-400' },
  LATE:      { label: 'Atrasado',  icon: AlertCircle, color: 'text-red-400' },
  PARTIAL:   { label: 'Parcial',   icon: Clock,       color: 'text-orange-400' },
  CANCELLED: { label: 'Cancelado', icon: AlertCircle, color: 'text-gray-400' },
}

const ADJUSTMENT_INDICES = ['IGPM', 'IPCA', 'INPC', 'IGP-M', 'FIXO']

export default function ContratoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const token = useAuthStore(s => s.accessToken)

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => financeApi.contract(token!, id),
    enabled: !!token && !!id,
  })

  const { data: historyData } = useQuery({
    queryKey: ['contract-history', id],
    queryFn: () => financeApi.historicoContrato(token!, id),
    enabled: !!token && !!id,
  })

  const qc = useQueryClient()
  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['contract', id] })
    qc.invalidateQueries({ queryKey: ['contract-history', id] })
    qc.invalidateQueries({ queryKey: ['finance-contracts'] })
    qc.invalidateQueries({ queryKey: ['finance-summary'] })
  }

  // ── Rescisão state ──
  const [showRescisao, setShowRescisao] = useState(false)
  const [rescDate, setRescDate] = useState(new Date().toISOString().split('T')[0])
  const [rescType, setRescType] = useState<'FINISHED' | 'CANCELED'>('FINISHED')
  const [rescReason, setRescReason] = useState('')
  const [rescFine, setRescFine] = useState('')
  const [rescRefund, setRescRefund] = useState('')
  const [rescNotes, setRescNotes] = useState('')

  // ── Renovação state ──
  const [showRenovacao, setShowRenovacao] = useState(false)
  const [renNewValue, setRenNewValue] = useState('')
  const [renDuration, setRenDuration] = useState('12')
  const [renStartDate, setRenStartDate] = useState(new Date().toISOString().split('T')[0])
  const [renIndex, setRenIndex] = useState('IGPM')
  const [renPercent, setRenPercent] = useState('')

  // ── Reajuste state ──
  const [showReajuste, setShowReajuste] = useState(false)
  const [reajIndex, setReajIndex] = useState('IGPM')
  const [reajPercent, setReajPercent] = useState('')
  const [reajNewValue, setReajNewValue] = useState('')

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<'alugueis' | 'historico' | 'documentos'>('alugueis')

  const rescisaoMutation = useMutation({
    mutationFn: () => financeApi.registrarRescisao(token!, id, {
      rescissionDate: rescDate,
      status: rescType,
      reason: rescReason || undefined,
      fine: rescFine ? Number(rescFine) : undefined,
      refund: rescRefund ? Number(rescRefund) : undefined,
      notes: rescNotes || undefined,
    }),
    onSuccess: () => { invalidateAll(); setShowRescisao(false) },
  })

  const renovacaoMutation = useMutation({
    mutationFn: () => financeApi.renovarContrato(token!, id, {
      newRentValue: Number(renNewValue),
      newDuration: Number(renDuration),
      newStartDate: renStartDate,
      adjustmentIndex: renIndex,
      adjustmentPercent: renPercent ? Number(renPercent) : undefined,
    }),
    onSuccess: (data: any) => {
      invalidateAll()
      setShowRenovacao(false)
      router.push(`/dashboard/contratos/${data.id}`)
    },
  })

  const reajusteMutation = useMutation({
    mutationFn: () => financeApi.reajustarContrato(token!, id, {
      index: reajIndex,
      percent: Number(reajPercent),
      newValue: Number(reajNewValue),
    }),
    onSuccess: () => { invalidateAll(); setShowReajuste(false) },
  })

  // Auto-calculate adjustment value
  const calcReajuste = () => {
    if (!contract || !reajPercent) return
    const current = Number(contract.rentValue ?? 0)
    const pct = Number(reajPercent)
    setReajNewValue((current * (1 + pct / 100)).toFixed(2))
  }

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
  const history = historyData?.data ?? []

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
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => { setShowReajuste(s => !s); setShowRescisao(false); setShowRenovacao(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-xs font-medium transition-colors"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Reajuste
            </button>
            <button
              onClick={() => { setShowRenovacao(s => !s); setShowRescisao(false); setShowReajuste(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-xs font-medium transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Renovar
            </button>
            <button
              onClick={() => { setShowRescisao(s => !s); setShowRenovacao(false); setShowReajuste(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs font-medium transition-colors"
            >
              <Scissors className="h-3.5 w-3.5" />
              Rescisão
            </button>
          </div>
        )}
      </div>

      {/* ── Modal Reajuste ── */}
      {showReajuste && contract.status === 'ACTIVE' && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Aplicar Reajuste
          </h3>
          <p className="text-xs text-white/50">Valor atual: {fmt(contract.rentValue as unknown as number)}</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-white/50 block mb-1">Índice</label>
              <select
                value={reajIndex}
                onChange={e => setReajIndex(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              >
                {ADJUSTMENT_INDICES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Percentual (%)</label>
              <input
                type="number" step="0.01" value={reajPercent}
                onChange={e => setReajPercent(e.target.value)}
                onBlur={calcReajuste}
                placeholder="4.52"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Novo Valor (R$)</label>
              <input
                type="number" step="0.01" value={reajNewValue}
                onChange={e => setReajNewValue(e.target.value)}
                placeholder="1.880,00"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => reajusteMutation.mutate()}
              disabled={reajusteMutation.isPending || !reajPercent || !reajNewValue}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {reajusteMutation.isPending ? 'Aplicando...' : 'Confirmar Reajuste'}
            </button>
            <button onClick={() => setShowReajuste(false)} className="px-4 py-2 bg-white/5 text-white/60 text-sm rounded-lg hover:bg-white/10">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Modal Renovação ── */}
      {showRenovacao && contract.status === 'ACTIVE' && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-green-400 flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Renovar Contrato
          </h3>
          <p className="text-xs text-white/50">Será criado um novo contrato e o atual será encerrado</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-white/50 block mb-1">Novo Valor (R$)</label>
              <input
                type="number" step="0.01" value={renNewValue}
                onChange={e => setRenNewValue(e.target.value)}
                placeholder={String(contract.rentValue ?? '')}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Duração (meses)</label>
              <input
                type="number" value={renDuration}
                onChange={e => setRenDuration(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Início</label>
              <input
                type="date" value={renStartDate}
                onChange={e => setRenStartDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Índice</label>
              <select
                value={renIndex}
                onChange={e => setRenIndex(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              >
                {ADJUSTMENT_INDICES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-xs text-white/50 block mb-1">Percentual de Reajuste (%)</label>
              <input
                type="number" step="0.01" value={renPercent}
                onChange={e => setRenPercent(e.target.value)}
                placeholder="Ex: 4.52"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => renovacaoMutation.mutate()}
              disabled={renovacaoMutation.isPending || !renNewValue || !renDuration}
              className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {renovacaoMutation.isPending ? 'Renovando...' : 'Confirmar Renovação'}
            </button>
            <button onClick={() => setShowRenovacao(false)} className="px-4 py-2 bg-white/5 text-white/60 text-sm rounded-lg hover:bg-white/10">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Modal Rescisão (expandido) ── */}
      {showRescisao && contract.status === 'ACTIVE' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
            <Scissors className="h-4 w-4" /> Registrar Rescisão
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 block mb-1">Data da Rescisão</label>
              <input
                type="date" value={rescDate}
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
            <div className="col-span-2">
              <label className="text-xs text-white/50 block mb-1">Motivo</label>
              <input
                type="text" value={rescReason}
                onChange={e => setRescReason(e.target.value)}
                placeholder="Ex: Mudança do inquilino, inadimplência..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Multa Rescisória (R$)</label>
              <input
                type="number" step="0.01" value={rescFine}
                onChange={e => setRescFine(e.target.value)}
                placeholder="0,00"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Devolução Caução (R$)</label>
              <input
                type="number" step="0.01" value={rescRefund}
                onChange={e => setRescRefund(e.target.value)}
                placeholder="0,00"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-white/50 block mb-1">Observações</label>
              <textarea
                value={rescNotes}
                onChange={e => setRescNotes(e.target.value)}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white resize-none"
              />
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
            {(contract as any).property && (
              <Link
                href={`/dashboard/properties/${(contract as any).property.id}`}
                className="ml-auto text-xs text-blue-400 hover:underline"
              >
                Ver imóvel →
              </Link>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-white/40 text-xs">Endereço</p>
              <p className="text-white">{contract.propertyAddress ?? '—'}</p>
            </div>
            {(contract as any).property?.reference && (
              <div>
                <p className="text-white/40 text-xs">Referência no Sistema</p>
                <p className="text-blue-400 font-mono font-medium">{(contract as any).property.reference}</p>
              </div>
            )}
            {(contract as any).property?.type && (
              <div>
                <p className="text-white/40 text-xs">Tipo de Imóvel</p>
                <p className="text-white">
                  {(contract as any).property.type === 'HOUSE' ? 'Casa' :
                   (contract as any).property.type === 'APARTMENT' ? 'Apartamento' :
                   (contract as any).property.type === 'LAND' ? 'Terreno' :
                   (contract as any).property.type === 'STORE' ? 'Comercial' :
                   (contract as any).property.type}
                </p>
              </div>
            )}
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
              <div>
                <p className="text-white/40 text-xs">Índice de Reajuste</p>
                <p className="text-white">{contract.adjustmentIndex} {contract.adjustmentPercent != null && Number(contract.adjustmentPercent) > 0 ? `(${Number(contract.adjustmentPercent)}%)` : ''}</p>
              </div>
            )}
            {(contract as any).adjustmentMonth && (
              <div>
                <p className="text-white/40 text-xs">Mês do Reajuste</p>
                <p className="text-white">{['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][(contract as any).adjustmentMonth]}</p>
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
            {(contract as any).iptuAnnual != null && Number((contract as any).iptuAnnual) > 0 && (
              <div>
                <p className="text-white/40 text-xs">IPTU Anual</p>
                <p className="text-white">{fmt(Number((contract as any).iptuAnnual))} ({(contract as any).iptuParcels ?? 8}x)</p>
              </div>
            )}
            {(contract as any).bankFee != null && Number((contract as any).bankFee) > 0 && (
              <div>
                <p className="text-white/40 text-xs">Taxa Bancária</p>
                <p className="text-white">{fmt(Number((contract as any).bankFee))}</p>
              </div>
            )}
            {contract.penalty != null && Number(contract.penalty) > 0 && (
              <div>
                <p className="text-white/40 text-xs">Multa</p>
                <p className="text-white">{Number(contract.penalty)}%</p>
              </div>
            )}
            {contract.initialValue != null && Number(contract.initialValue) > 0 && (
              <div>
                <p className="text-white/40 text-xs">Valor Inicial</p>
                <p className="text-white">{fmt(Number(contract.initialValue))}</p>
              </div>
            )}
            {contract.rescissionDate && (
              <div className="col-span-2">
                <p className="text-white/40 text-xs">Data de Rescisão</p>
                <p className="text-red-400 font-medium">{fmtDate(contract.rescissionDate)}</p>
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

      {/* Tabs: Aluguéis | Histórico | Documentos */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1">
        {([
          { key: 'alugueis', label: 'Aluguéis', icon: DollarSign },
          { key: 'historico', label: 'Histórico', icon: History },
          { key: 'documentos', label: 'Documentos', icon: FileText },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.key ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Aluguéis */}
      {activeTab === 'alugueis' && rentals.length > 0 && (
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

      {/* Tab: Histórico de alterações */}
      {activeTab === 'historico' && (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white">Histórico de Alterações</h2>
            <p className="text-xs text-white/40">{history.length} registro(s)</p>
          </div>
          {history.length === 0 ? (
            <div className="p-8 text-center">
              <History className="h-8 w-8 text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/40">Nenhuma alteração registrada</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
              {history.map((h: any) => {
                const actionColors: Record<string, string> = {
                  REAJUSTE: 'text-blue-400 bg-blue-500/10',
                  RENOVACAO: 'text-green-400 bg-green-500/10',
                  RESCISAO: 'text-red-400 bg-red-500/10',
                  ALTERACAO: 'text-yellow-400 bg-yellow-500/10',
                  CRIACAO: 'text-purple-400 bg-purple-500/10',
                }
                const color = actionColors[h.action] ?? 'text-white/60 bg-white/10'
                return (
                  <div key={h.id} className="px-5 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${color}`}>
                        {h.action}
                      </span>
                      <span className="text-xs text-white/40">{new Date(h.createdAt).toLocaleString('pt-BR')}</span>
                      {h.userName && <span className="text-xs text-white/30">por {h.userName}</span>}
                    </div>
                    <p className="text-sm text-white/80">{h.description}</p>
                    {h.field && h.oldValue && (
                      <p className="text-xs text-white/40 mt-0.5">
                        {h.field}: <span className="text-red-400 line-through">{h.oldValue}</span> → <span className="text-green-400">{h.newValue}</span>
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Documentos */}
      {activeTab === 'documentos' && (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Documentos Vinculados</h2>
              <p className="text-xs text-white/40">{(contract as any).documents?.length ?? 0} arquivo(s)</p>
            </div>
            <Link2 className="h-4 w-4 text-white/30" />
          </div>
          {(contract as any).documents?.length > 0 ? (
            <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
              {(contract as any).documents.map((doc: any) => {
                const typeColors: Record<string, string> = {
                  BOLETO: 'text-orange-400 bg-orange-500/10',
                  EXTRATO: 'text-blue-400 bg-blue-500/10',
                  REAJUSTE: 'text-yellow-400 bg-yellow-500/10',
                  FINANCEIRO: 'text-green-400 bg-green-500/10',
                  CONTRATO: 'text-purple-400 bg-purple-500/10',
                }
                const color = typeColors[doc.type] ?? 'text-white/60 bg-white/10'
                return (
                  <div key={doc.id} className="flex items-center justify-between px-5 py-3 group hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium shrink-0 ${color}`}>
                        {doc.type}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">{doc.name}</p>
                        {(doc.month || doc.year) && (
                          <p className="text-xs text-white/40">
                            {doc.month ? `${String(doc.month).padStart(2, '0')}/` : ''}{doc.year ?? ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <a
                      href={`/api/v1/documents/${doc.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 p-1.5 text-white/30 hover:text-white hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      onClick={e => e.stopPropagation()}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <FileText className="h-8 w-8 text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/40">Nenhum documento vinculado</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
