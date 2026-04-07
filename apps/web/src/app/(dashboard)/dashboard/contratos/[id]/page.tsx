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
  TrendingUp, History, Shield, Edit3, ChevronDown, ChevronUp,
  UserCheck, PlusCircle,
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

  // Rescisão
  const [showRescisao, setShowRescisao] = useState(false)
  const [rescDate, setRescDate] = useState(new Date().toISOString().split('T')[0])
  const [rescType, setRescType] = useState<'FINISHED' | 'CANCELED'>('FINISHED')
  const [rescMotivo, setRescMotivo] = useState('')
  const [rescMulta, setRescMulta] = useState('')

  // Renovação
  const [showRenovacao, setShowRenovacao] = useState(false)
  const [renovDuration, setRenovDuration] = useState('12')
  const [renovNovoValor, setRenovNovoValor] = useState('')
  const [renovIndice, setRenovIndice] = useState('IGPM')

  // Reajuste Manual
  const [showReajuste, setShowReajuste] = useState(false)
  const [reajustePercent, setReajustePercent] = useState('')
  const [reajusteMotivo, setReajusteMotivo] = useState('')
  const [reajusteData, setReajusteData] = useState(new Date().toISOString().split('T')[0])

  // Histórico expandido
  const [showHistorico, setShowHistorico] = useState(false)

  const rescisaoMutation = useMutation({
    mutationFn: () => financeApi.registrarRescisao(token!, id, {
      rescissionDate: rescDate,
      status: rescType,
      motivo: rescMotivo || undefined,
      multaRescisao: rescMulta ? Number(rescMulta) : undefined,
    } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract', id] })
      qc.invalidateQueries({ queryKey: ['finance-contracts'] })
      qc.invalidateQueries({ queryKey: ['finance-summary'] })
      setShowRescisao(false)
    },
  })

  const renovacaoMutation = useMutation({
    mutationFn: () => financeApi.renovarContrato(token!, id, {
      duration: Number(renovDuration),
      novoValor: renovNovoValor ? Number(renovNovoValor) : undefined,
      indiceReajuste: renovIndice,
    } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract', id] })
      qc.invalidateQueries({ queryKey: ['finance-contracts'] })
      setShowRenovacao(false)
    },
  })

  const reajusteMutation = useMutation({
    mutationFn: () => financeApi.aplicarReajuste(token!, id, {
      percentual: Number(reajustePercent),
      motivo: reajusteMotivo || undefined,
      dataAplicacao: reajusteData,
    } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contract', id] })
      setShowReajuste(false)
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
  const contractHistory = (contract as any).history ?? (contract as any).contractHistory ?? []

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
        {/* Ações rápidas */}
        {contract.status === 'ACTIVE' && (
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => { setShowReajuste(s => !s); setShowRescisao(false); setShowRenovacao(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-lg text-xs font-medium transition-colors"
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Reajuste
            </button>
            <button
              onClick={() => { setShowRenovacao(s => !s); setShowRescisao(false); setShowReajuste(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-xs font-medium transition-colors"
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

      {/* Painel de Reajuste Manual */}
      {showReajuste && contract.status === 'ACTIVE' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-yellow-400 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Aplicar Reajuste Manual
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-white/50 block mb-1">Percentual (%)</label>
              <input
                type="number" step="0.01" min="0" max="100"
                value={reajustePercent}
                onChange={e => setReajustePercent(e.target.value)}
                placeholder="Ex: 5.93"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Data de Aplicação</label>
              <input
                type="date"
                value={reajusteData}
                onChange={e => setReajusteData(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Motivo</label>
              <input
                type="text"
                value={reajusteMotivo}
                onChange={e => setReajusteMotivo(e.target.value)}
                placeholder="Ex: Reajuste anual IGPM"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
          </div>
          {reajustePercent && (
            <div className="bg-white/5 rounded-lg p-3 text-sm text-white/70">
              Valor atual: <span className="text-white font-medium">{fmt(contract.rentValue as unknown as number)}</span>
              {' → '}Novo valor: <span className="text-yellow-400 font-bold">
                {fmt(Number(contract.rentValue) * (1 + Number(reajustePercent) / 100))}
              </span>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => reajusteMutation.mutate()}
              disabled={reajusteMutation.isPending || !reajustePercent}
              className="px-4 py-2 bg-yellow-500 text-white text-sm rounded-lg hover:bg-yellow-600 disabled:opacity-50"
            >
              {reajusteMutation.isPending ? 'Aplicando...' : 'Aplicar Reajuste'}
            </button>
            <button onClick={() => setShowReajuste(false)} className="px-4 py-2 bg-white/5 text-white/60 text-sm rounded-lg hover:bg-white/10">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Painel de Renovação */}
      {showRenovacao && contract.status === 'ACTIVE' && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Renovar Contrato
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-white/50 block mb-1">Duração (meses)</label>
              <input
                type="number" min="1" max="120"
                value={renovDuration}
                onChange={e => setRenovDuration(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Novo Valor Aluguel (R$)</label>
              <input
                type="number" step="0.01" min="0"
                value={renovNovoValor}
                onChange={e => setRenovNovoValor(e.target.value)}
                placeholder="Deixe em branco para manter"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Índice de Reajuste</label>
              <select
                value={renovIndice}
                onChange={e => setRenovIndice(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              >
                <option value="IGPM">IGP-M</option>
                <option value="IPCA">IPCA</option>
                <option value="INPC">INPC</option>
                <option value="FIXO">Fixo</option>
                <option value="LIVRE">Livre Negociação</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => renovacaoMutation.mutate()}
              disabled={renovacaoMutation.isPending}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {renovacaoMutation.isPending ? 'Renovando...' : 'Confirmar Renovação'}
            </button>
            <button onClick={() => setShowRenovacao(false)} className="px-4 py-2 bg-white/5 text-white/60 text-sm rounded-lg hover:bg-white/10">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Painel de Rescisão */}
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
            <div>
              <label className="text-xs text-white/50 block mb-1">Multa Rescisória (R$)</label>
              <input
                type="number" step="0.01" min="0"
                value={rescMulta}
                onChange={e => setRescMulta(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Motivo</label>
              <input
                type="text"
                value={rescMotivo}
                onChange={e => setRescMotivo(e.target.value)}
                placeholder="Motivo da rescisão"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
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
                <p className="text-white">{contract.adjustmentIndex}</p>
              </div>
            )}
            {(contract as any).adjustmentPercent != null && Number((contract as any).adjustmentPercent) > 0 && (
              <div>
                <p className="text-white/40 text-xs">% Reajuste</p>
                <p className="text-white">{Number((contract as any).adjustmentPercent)}%</p>
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
            {contract.initialValue != null && Number(contract.initialValue) > 0 && (
              <div>
                <p className="text-white/40 text-xs">Valor Inicial</p>
                <p className="text-white">{fmt(Number(contract.initialValue))}</p>
              </div>
            )}
            {(contract as any).caucaoValue != null && Number((contract as any).caucaoValue) > 0 && (
              <div>
                <p className="text-white/40 text-xs">Caução</p>
                <p className="text-white">{fmt(Number((contract as any).caucaoValue))}</p>
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

        {/* Fiador (se existir) */}
        {((contract as any).guarantor || (contract as any).guarantorName) && (
          <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-purple-400" />
              <h2 className="text-sm font-semibold text-white">Fiador / Garantidor</h2>
            </div>
            {(contract as any).guarantor ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-white">{(contract as any).guarantor.name}</p>
                <Link href={`/dashboard/clientes/${(contract as any).guarantor.id}`} className="text-xs text-blue-400 hover:underline">
                  Ver perfil completo
                </Link>
                {(contract as any).guarantor.document && <p className="text-white/40 text-xs">Doc: {(contract as any).guarantor.document}</p>}
                {(contract as any).guarantor.phone && (
                  <div className="flex items-center gap-1.5 text-white/60">
                    <Phone className="h-3 w-3" />{(contract as any).guarantor.phone}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-white/40 text-sm">{(contract as any).guarantorName}</p>
            )}
          </div>
        )}

        {/* Seguro Incêndio (se existir) */}
        {(contract as any).fireInsurance && (
          <div className="bg-amber-500/10 rounded-2xl border border-amber-500/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Seguro Incêndio</h2>
            </div>
            <div className="space-y-1 text-sm">
              <p className="text-white/60">Ativo: <span className="text-amber-400 font-medium">Sim</span></p>
              {(contract as any).fireInsuranceValue && (
                <p className="text-white/60">Valor: <span className="text-white">{fmt(Number((contract as any).fireInsuranceValue))}/ano</span></p>
              )}
            </div>
          </div>
        )}
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

      {/* Histórico de Alterações do Contrato */}
      {contractHistory.length > 0 && (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <button
            onClick={() => setShowHistorico(s => !s)}
            className="w-full px-5 py-4 border-b border-white/10 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-white/40" />
              <h2 className="text-sm font-semibold text-white">Histórico de Alterações</h2>
              <span className="text-xs text-white/40">({contractHistory.length} registros)</span>
            </div>
            {showHistorico ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
          </button>
          {showHistorico && (
            <div className="divide-y divide-white/5 max-h-72 overflow-y-auto">
              {contractHistory.map((h: any) => (
                <div key={h.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{h.description ?? h.action}</p>
                    {h.changedBy && <p className="text-xs text-white/40 mt-0.5">Por: {h.changedBy}</p>}
                  </div>
                  <p className="text-xs text-white/30 shrink-0">{fmtDate(h.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Documentos vinculados */}
      {(contract as any).documents?.length > 0 && (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Documentos Vinculados</h2>
              <p className="text-xs text-white/40">{(contract as any).documents.length} arquivo(s)</p>
            </div>
            <Link2 className="h-4 w-4 text-white/30" />
          </div>
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
        </div>
      )}

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
                      {(r as any).paymentMethod && <p className="text-xs text-white/30">{(r as any).paymentMethod}</p>}
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
