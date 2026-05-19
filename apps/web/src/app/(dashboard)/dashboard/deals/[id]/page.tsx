'use client'

import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { dealsApi, activitiesApi, type DealDetail, type Activity } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, DollarSign, User, TrendingUp, Plus, MessageCircle, PhoneCall, MapPin, Calendar, CheckCircle, Banknote } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const PAYMENT_STATUS: Record<string, string> = {
  pending:   'bg-yellow-500/20 text-yellow-400',
  received:  'bg-emerald-500/20 text-emerald-400',
  overdue:   'bg-red-500/20 text-red-400',
  refunded:  'bg-white/10 text-white/50',
  cancelled: 'bg-white/10 text-white/50',
}

const NOTARIAL_STATUS: [string, string][] = [
  ['preparing', 'Preparando dossiê'],
  ['at_notary', 'No tabelionato'],
  ['deed_signed', 'Escritura assinada'],
  ['at_registry', 'No registro'],
  ['registered', 'Registrado'],
]
const NOTARIAL_DOCS: [string, string][] = [
  ['matricula', 'Matrícula atualizada'],
  ['certidoes_partes', 'Certidões das partes'],
  ['certidao_onus', 'Certidão de ônus reais'],
  ['itbi', 'ITBI recolhido'],
  ['minuta', 'Minuta conferida'],
]

const STATUS_MAP: Record<string, string> = {
  OPEN:        'bg-white/10 text-white/60',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-400',
  PROPOSAL:    'bg-yellow-500/20 text-yellow-400',
  CONTRACT:    'bg-emerald-500/20 text-emerald-400',
  CLOSED_WON:  'bg-green-500/20 text-green-400',
  CLOSED_LOST: 'bg-red-500/20 text-red-400',
}
const STATUS_LABELS: Record<string, string> = {
  OPEN:'Aberto', IN_PROGRESS:'Em Andamento', PROPOSAL:'Proposta',
  CONTRACT:'Contrato', CLOSED_WON:'Fechado (Ganho)', CLOSED_LOST:'Perdido',
}
const STATUSES = Object.entries(STATUS_LABELS)

// Transaction Hub — pipeline completo da negociação, do lead ao registro.
// Cada etapa tem um checklist; a etapa atual fica em metadata.transaction.stage.
const TRANSACTION_STAGES: { key: string; label: string; items: string[] }[] = [
  { key: 'lead',       label: 'Lead',       items: ['Lead recebido', 'Primeiro contato', 'Cliente qualificado'] },
  { key: 'proposta',   label: 'Proposta',   items: ['Proposta enviada', 'Proposta negociada', 'Proposta aceita'] },
  { key: 'kyc',        label: 'KYC',        items: ['Documentos do comprador recebidos', 'Identidade verificada'] },
  { key: 'sinal',      label: 'Sinal',      items: ['Cobrança do sinal gerada', 'Sinal pago'] },
  { key: 'contrato',   label: 'Contrato',   items: ['Contrato gerado', 'Cláusulas revisadas'] },
  { key: 'assinatura', label: 'Assinatura', items: ['Enviado para assinatura', 'Assinado por todas as partes'] },
  { key: 'escritura',  label: 'Escritura',  items: ['Dossiê para escritura montado', 'Escritura lavrada'] },
  { key: 'registro',   label: 'Registro',   items: ['Protocolo de registro', 'Registro concluído'] },
  { key: 'posse',      label: 'Posse',      items: ['Chaves entregues'] },
  { key: 'concluido',  label: 'Concluído',  items: ['Pós-venda concluído'] },
]

const COMM_STATUS: Record<string, string> = {
  PENDING:   'bg-yellow-500/20 text-yellow-400',
  PARTIAL:   'bg-blue-500/20 text-blue-400',
  PAID:      'bg-emerald-500/20 text-emerald-400',
  CANCELLED: 'bg-red-500/20 text-red-400',
}

const ACTIVITY_ICONS: Record<string, React.ComponentType<any>> = {
  note: MessageCircle, call: PhoneCall, visit: MapPin, task: Calendar,
  status_change: CheckCircle, system: CheckCircle, email: MessageCircle, whatsapp: MessageCircle,
}

function fmt(v?: number | null) {
  if (!v) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v))
}

function TimelineItem({ a }: { a: Activity }) {
  const Icon = ACTIVITY_ICONS[a.type] ?? MessageCircle
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
          <Icon className="h-3.5 w-3.5 text-white/50" />
        </div>
        <div className="w-px flex-1 bg-white/10 mt-1" />
      </div>
      <div className="pb-4 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-white">{a.title}</p>
          <time className="text-xs text-white/50 flex-shrink-0">
            {new Date(a.createdAt).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
          </time>
        </div>
        {a.description && <p className="text-xs text-white/50 mt-0.5">{a.description}</p>}
        {a.user && <p className="text-xs text-white/50 mt-0.5">por {a.user.name}</p>}
      </div>
    </div>
  )
}

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const { getValidToken, user } = useAuth()
  const [newNote, setNewNote] = useState('')
  const [newActType, setNewActType] = useState('note')
  const [showCommForm, setShowCommForm] = useState(false)
  const [commRate, setCommRate] = useState('6')
  const [commSplit, setCommSplit] = useState('100')
  const [signalAmount, setSignalAmount] = useState('')
  const [signalType, setSignalType] = useState('PIX')
  const [notarialDraft, setNotarialDraft] = useState<Record<string, any> | null>(null)

  const canManageComm = ['SUPER_ADMIN','ADMIN','MANAGER','FINANCIAL'].includes(user?.role ?? '')

  const { data: deal, isLoading } = useQuery<DealDetail>({
    queryKey: ['deal', id],
    queryFn: async () => {
      const token = await getValidToken()
      return dealsApi.get(token!, id)
    },
  })

  const { data: activities } = useQuery({
    queryKey: ['activities', 'deal', id],
    queryFn: async () => {
      const token = await getValidToken()
      return activitiesApi.list(token!, { dealId: id, limit: 50 })
    },
  })

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const token = await getValidToken()
      return dealsApi.update(token!, id, { status })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deal', id] }),
  })

  const checklistMutation = useMutation({
    mutationFn: async (next: Record<string, boolean>) => {
      const token = await getValidToken()
      return dealsApi.update(token!, id, {
        metadata: { ...(deal?.metadata ?? {}), checklist: next },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deal', id] }),
  })

  const paymentsQuery = useQuery({
    queryKey: ['deal-payments', id],
    queryFn: async () => {
      const token = await getValidToken()
      const res = await fetch(`${API_URL}/api/v1/deals/${id}/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return { data: [] as any[] }
      return res.json() as Promise<{ data: any[] }>
    },
  })

  const signalMutation = useMutation({
    mutationFn: async (vars: { amount: number; billingType: string }) => {
      const token = await getValidToken()
      const res = await fetch(`${API_URL}/api/v1/deals/${id}/payments/signal`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(vars),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.message || 'Falha ao gerar cobrança')
      return j
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deal-payments', id] })
      setSignalAmount('')
    },
  })

  const notarialQuery = useQuery({
    queryKey: ['deal-notarial', id],
    queryFn: async () => {
      const token = await getValidToken()
      const res = await fetch(`${API_URL}/api/v1/deals/${id}/notarial`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return { data: null }
      return res.json() as Promise<{ data: Record<string, any> | null }>
    },
  })

  const notarialMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const token = await getValidToken()
      const res = await fetch(`${API_URL}/api/v1/deals/${id}/notarial`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Falha ao salvar')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deal-notarial', id] })
      setNotarialDraft(null)
    },
  })

  const stageMutation = useMutation({
    mutationFn: async (stage: string) => {
      const token = await getValidToken()
      const meta = (deal?.metadata ?? {}) as Record<string, unknown>
      return dealsApi.update(token!, id, {
        metadata: { ...meta, transaction: { ...(meta.transaction as object ?? {}), stage } },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deal', id] }),
  })

  const addActivityMutation = useMutation({
    mutationFn: async () => {
      const token = await getValidToken()
      return activitiesApi.create(token!, { type: newActType, title: newNote, dealId: id })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities', 'deal', id] })
      setNewNote('')
    },
  })

  const createCommMutation = useMutation({
    mutationFn: async () => {
      const token = await getValidToken()
      return dealsApi.createCommission(token!, id, {
        commissionRate: Number(commRate),
        splitRate: Number(commSplit),
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deal', id] })
      setShowCommForm(false)
    },
  })

  if (isLoading) return <div className="p-6 text-white/40 text-center py-20">Carregando...</div>
  if (!deal) return <div className="p-6 text-red-400 text-center py-20">Negócio não encontrado</div>

  const checklist = (((deal.metadata as any)?.checklist) ?? {}) as Record<string, boolean>
  const toggleChecklist = (key: string) =>
    checklistMutation.mutate({ ...checklist, [key]: !checklist[key] })

  // Transaction Hub — etapa atual da jornada da negociação.
  const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role ?? '')
  const currentStageKey = ((deal.metadata as any)?.transaction?.stage as string) ?? 'lead'
  const currentStageIdx = Math.max(0, TRANSACTION_STAGES.findIndex(s => s.key === currentStageKey))
  const currentStage = TRANSACTION_STAGES[currentStageIdx]
  const currentItems = currentStage.items.map((label, i) => ({ key: `${currentStage.key}-${i}`, label }))
  const currentDone = currentItems.every(it => checklist[it.key])

  // Cartório & Registro — formulário derivado da query, editável via draft.
  const NOTARIAL_DEFAULTS: Record<string, any> = {
    actType: 'ESCRITURA_COMPRA_VENDA', notaryOffice: '', registryOffice: '',
    status: 'preparing', deedFileUrl: '', registryProtocol: '', checklist: {},
  }
  const nf = notarialDraft ?? notarialQuery.data?.data ?? NOTARIAL_DEFAULTS
  const setNf = (patch: Record<string, unknown>) => setNotarialDraft({ ...nf, ...patch })
  const nfChecklist: Record<string, boolean> = nf.checklist ?? {}

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/dashboard/deals">
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-white">{deal.title}</h1>
            <Badge className={cn('border-0 text-xs', STATUS_MAP[deal.status] ?? 'bg-white/10')}>
              {STATUS_LABELS[deal.status] ?? deal.status}
            </Badge>
            <Badge className="border-white/20 text-white/50 text-xs" variant="outline">
              {deal.type === 'RENT' ? 'Locação' : 'Venda'}
            </Badge>
          </div>
          {deal.broker && (
            <p className="text-white/40 text-sm mt-0.5">Corretor: {deal.broker.name}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel */}
        <div className="space-y-4">
          {/* Value */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Valor</h3>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <p className="text-xl font-bold text-white">{fmt(deal.value)}</p>
            </div>
            {deal.commission && (
              <p className="text-xs text-white/40 mt-1">Comissão: {deal.commission}%</p>
            )}
          </div>

          {/* Contact */}
          {deal.contact && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Contato</h3>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-white/50" />
                <p className="text-sm text-white">{deal.contact.name}</p>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-2">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Atualizar Status</h3>
            <Select value={deal.status} onValueChange={(v: string) => statusMutation.mutate(v)}
              disabled={statusMutation.isPending}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Hub — pipeline da negociação */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
              Transaction Hub
            </h3>

            {/* Stepper */}
            <div className="flex flex-wrap gap-1">
              {TRANSACTION_STAGES.map((stage, i) => (
                <div
                  key={stage.key}
                  title={stage.label}
                  className={cn(
                    'h-1.5 flex-1 min-w-[18px] rounded-full',
                    i < currentStageIdx ? 'bg-emerald-500'
                      : i === currentStageIdx ? 'bg-yellow-500'
                      : 'bg-white/10',
                  )}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">
                {currentStageIdx + 1}. {currentStage.label}
              </span>
              <span className="text-[10px] text-white/40">
                Etapa {currentStageIdx + 1} de {TRANSACTION_STAGES.length}
              </span>
            </div>

            {/* Current stage checklist */}
            <div className="mt-2 space-y-1">
              {currentItems.map((it) => (
                <label key={it.key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!checklist[it.key]}
                    onChange={() => toggleChecklist(it.key)}
                    disabled={checklistMutation.isPending}
                    className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-yellow-500"
                  />
                  <span className={cn(
                    'text-xs',
                    checklist[it.key] ? 'text-white/40 line-through' : 'text-white/70',
                  )}>
                    {it.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Stage controls */}
            <div className="mt-3 flex items-center gap-2">
              {currentStageIdx > 0 && (
                <Button
                  size="sm" variant="ghost"
                  className="text-white/50 hover:text-white text-xs h-7"
                  disabled={stageMutation.isPending}
                  onClick={() => stageMutation.mutate(TRANSACTION_STAGES[currentStageIdx - 1].key)}
                >
                  Voltar etapa
                </Button>
              )}
              {currentStageIdx < TRANSACTION_STAGES.length - 1 && (
                <Button
                  size="sm"
                  className="text-xs h-7 gap-1"
                  disabled={stageMutation.isPending || (!currentDone && !isAdmin)}
                  onClick={() => stageMutation.mutate(TRANSACTION_STAGES[currentStageIdx + 1].key)}
                >
                  Avançar: {TRANSACTION_STAGES[currentStageIdx + 1].label}
                </Button>
              )}
            </div>
            {!currentDone && currentStageIdx < TRANSACTION_STAGES.length - 1 && (
              <p className="mt-1.5 text-[10px] text-white/40">
                {isAdmin
                  ? 'Conclua o checklist ou avance manualmente (admin).'
                  : 'Conclua o checklist desta etapa para avançar.'}
              </p>
            )}
          </div>

          {/* Pagamentos / Sinal */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Pagamentos
            </h3>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs text-white/50">Valor do sinal (R$)</Label>
                <Input
                  value={signalAmount} onChange={(e) => setSignalAmount(e.target.value)}
                  type="number" placeholder="Ex: 25000"
                  className="bg-white/5 border-white/10 text-white text-sm h-8"
                />
              </div>
              <Select value={signalType} onValueChange={setSignalType}>
                <SelectTrigger className="w-24 bg-white/5 border-white/10 text-white text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[['PIX', 'Pix'], ['BOLETO', 'Boleto'], ['CREDIT_CARD', 'Cartão']].map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm" className="h-8 text-xs"
                disabled={!signalAmount || Number(signalAmount) <= 0 || signalMutation.isPending}
                onClick={() => signalMutation.mutate({ amount: Number(signalAmount), billingType: signalType })}
              >
                Gerar cobrança
              </Button>
            </div>
            {signalMutation.isError && (
              <p className="mt-1 text-xs text-red-400">{(signalMutation.error as Error).message}</p>
            )}

            <div className="mt-3 space-y-1.5">
              {(paymentsQuery.data?.data ?? []).length === 0 && (
                <p className="text-xs text-white/40">Nenhuma cobrança gerada.</p>
              )}
              {(paymentsQuery.data?.data ?? []).map((pay: any) => (
                <div key={pay.id} className="flex items-center justify-between border-t border-white/5 pt-1.5">
                  <div>
                    <p className="text-sm text-white">{fmt(Number(pay.amount))}</p>
                    <p className="text-[10px] text-white/40">{pay.billingType} · {pay.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {pay.invoiceUrl && (
                      <a href={pay.invoiceUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-yellow-400 hover:underline">cobrança</a>
                    )}
                    <Badge className={cn('border-0 text-xs', PAYMENT_STATUS[pay.status] ?? 'bg-white/10')}>
                      {pay.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cartório & Registro */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
              Cartório &amp; Registro
            </h3>

            <div className="space-y-2">
              <div>
                <Label className="text-xs text-white/50">Status</Label>
                <Select value={nf.status} onValueChange={(v: string) => setNf({ status: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTARIAL_STATUS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-white/50">Tabelionato</Label>
                <Input value={nf.notaryOffice ?? ''} onChange={(e) => setNf({ notaryOffice: e.target.value })}
                  placeholder="Tabelionato de notas" className="bg-white/5 border-white/10 text-white text-sm h-8" />
              </div>
              <div>
                <Label className="text-xs text-white/50">Cartório de Registro de Imóveis</Label>
                <Input value={nf.registryOffice ?? ''} onChange={(e) => setNf({ registryOffice: e.target.value })}
                  placeholder="Ex: 1º RI de Franca/SP" className="bg-white/5 border-white/10 text-white text-sm h-8" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-white/50">Protocolo de registro</Label>
                  <Input value={nf.registryProtocol ?? ''} onChange={(e) => setNf({ registryProtocol: e.target.value })}
                    className="bg-white/5 border-white/10 text-white text-sm h-8" />
                </div>
                <div>
                  <Label className="text-xs text-white/50">URL da escritura</Label>
                  <Input value={nf.deedFileUrl ?? ''} onChange={(e) => setNf({ deedFileUrl: e.target.value })}
                    className="bg-white/5 border-white/10 text-white text-sm h-8" />
                </div>
              </div>
            </div>

            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">Dossiê documental</p>
            <div className="mt-1 space-y-1">
              {NOTARIAL_DOCS.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!nfChecklist[key]}
                    onChange={() => setNf({ checklist: { ...nfChecklist, [key]: !nfChecklist[key] } })}
                    className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-yellow-500"
                  />
                  <span className={cn('text-xs', nfChecklist[key] ? 'text-white/40 line-through' : 'text-white/70')}>
                    {label}
                  </span>
                </label>
              ))}
            </div>

            <Button
              size="sm" className="mt-3 w-full text-xs h-8"
              disabled={!notarialDraft || notarialMutation.isPending}
              onClick={() => notarialMutation.mutate({
                actType: nf.actType, notaryOffice: nf.notaryOffice, registryOffice: nf.registryOffice,
                status: nf.status, deedFileUrl: nf.deedFileUrl, registryProtocol: nf.registryProtocol,
                checklist: nfChecklist,
              })}
            >
              {notarialMutation.isPending ? 'Salvando...' : 'Salvar processo cartorial'}
            </Button>
            <p className="mt-1.5 text-[10px] text-white/40">
              Fluxo assistido — integração com e-Notariado / RI Digital depende de convênio.
            </p>
          </div>

          {/* Properties */}
          {deal.properties?.length > 0 && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Imóveis</h3>
              <div className="space-y-2">
                {deal.properties.map((dp: any) => (
                  <Link key={dp.property.id} href={`/dashboard/properties/${dp.property.id}`}
                    className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                    <TrendingUp className="h-3.5 w-3.5 text-white/50" />
                    {dp.property.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Commissions */}
          {canManageComm && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Comissões</h3>
                {!showCommForm && (
                  <Button variant="ghost" size="sm" onClick={() => setShowCommForm(true)}
                    className="h-6 text-xs text-white/50 hover:text-white gap-1 px-2">
                    <Plus className="h-3 w-3" /> Gerar
                  </Button>
                )}
              </div>
              {showCommForm && (
                <div className="space-y-2 mb-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-white/50">Taxa (%)</Label>
                      <Input value={commRate} onChange={(e) => setCommRate(e.target.value)} type="number"
                        className="bg-white/5 border-white/10 text-white text-sm h-8" />
                    </div>
                    <div>
                      <Label className="text-xs text-white/50">Split (%)</Label>
                      <Input value={commSplit} onChange={(e) => setCommSplit(e.target.value)} type="number"
                        className="bg-white/5 border-white/10 text-white text-sm h-8" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 text-xs" onClick={() => createCommMutation.mutate()}
                      disabled={createCommMutation.isPending}>Gerar</Button>
                    <Button size="sm" variant="ghost" className="text-white/50" onClick={() => setShowCommForm(false)}>✕</Button>
                  </div>
                </div>
              )}
              {deal.commissions?.length === 0 && !showCommForm && (
                <p className="text-xs text-white/50 text-center py-2">Nenhuma comissão</p>
              )}
              {deal.commissions?.map((c) => (
                <div key={c.id} className="border-t border-white/5 pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{fmt(c.netValue)}</p>
                    <Badge className={cn('border-0 text-xs', COMM_STATUS[c.status] ?? 'bg-white/10')}>
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-white/40">{c.commissionRate}% · split {c.splitRate}%</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Registrar Atividade</h3>
            <div className="flex gap-2">
              <Select value={newActType} onValueChange={setNewActType}>
                <SelectTrigger className="w-36 bg-white/5 border-white/10 text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[['note','Nota'],['call','Ligação'],['email','E-mail'],['visit','Visita'],['whatsapp','WhatsApp']].map(([v,l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input value={newNote} onChange={(e) => setNewNote(e.target.value)}
                placeholder="Descreva a atividade..."
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && newNote.trim() && addActivityMutation.mutate()} />
              <Button size="sm" disabled={!newNote.trim() || addActivityMutation.isPending}
                onClick={() => addActivityMutation.mutate()} className="gap-1">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Timeline</h3>
            {!activities?.data.length ? (
              <p className="text-white/50 text-sm text-center py-8">Nenhuma atividade registrada</p>
            ) : (
              <div>{activities.data.map((a) => <TimelineItem key={a.id} a={a} />)}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
