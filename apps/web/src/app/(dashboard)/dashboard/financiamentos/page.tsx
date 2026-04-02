'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { financingsApi, type Financing, type FinancingStage } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  XCircle,
  Building2,
  ArrowRight,
  ExternalLink,
  Phone,
  Mail,
  ChevronRight,
  Landmark,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SearchInputWithVoice } from '@/components/ui/SearchInputWithVoice'

// ── Stage config ─────────────────────────────────────────────────────────────

const STAGES: { key: FinancingStage; label: string; color: string; bg: string }[] = [
  { key: 'SIMULACAO',         label: 'Simulação',         color: 'text-slate-400',   bg: 'bg-slate-500/10 border-slate-500/20' },
  { key: 'ANALISE_CREDITO',   label: 'Análise de Crédito', color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  { key: 'ANALISE_JURIDICA',  label: 'Análise Jurídica',   color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20' },
  { key: 'EMISSAO_CONTRATO',  label: 'Emissão de Contrato', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
  { key: 'REGISTRO_CONTRATO', label: 'Registro',           color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20' },
  { key: 'CONCLUIDO',         label: 'Concluído',          color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { key: 'CANCELADO',         label: 'Cancelado',          color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
]

const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.key, s]))
const ACTIVE_STAGES = STAGES.filter(s => !['CONCLUIDO', 'CANCELADO'].includes(s.key))

function fmtCurrency(v?: number | null) {
  if (!v) return null
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

// ── Form schema ───────────────────────────────────────────────────────────────

const financingSchema = z.object({
  stage:         z.enum(['SIMULACAO','ANALISE_CREDITO','ANALISE_JURIDICA','EMISSAO_CONTRATO','REGISTRO_CONTRATO','CONCLUIDO','CANCELADO']).default('SIMULACAO'),
  bank:          z.string().max(100).optional().or(z.literal('')),
  clientName:    z.string().max(100).optional().or(z.literal('')),
  clientPhone:   z.string().max(20).optional().or(z.literal('')),
  clientEmail:   z.string().email('E-mail inválido').optional().or(z.literal('')),
  propertyValue: z.coerce.number().positive().optional().or(z.literal('')),
  financedValue: z.coerce.number().positive().optional().or(z.literal('')),
  downPayment:   z.coerce.number().min(0).optional().or(z.literal('')),
  fgtsValue:     z.coerce.number().min(0).optional().or(z.literal('')),
  monthlyPayment:z.coerce.number().positive().optional().or(z.literal('')),
  term:          z.coerce.number().int().min(1).max(420).optional().or(z.literal('')),
  rate:          z.coerce.number().min(0).max(99).optional().or(z.literal('')),
  notes:         z.string().max(2000).optional().or(z.literal('')),
  simulatorLink: z.string().url('URL inválida').optional().or(z.literal('')),
})
type FinancingForm = z.infer<typeof financingSchema>

// ── Card component ────────────────────────────────────────────────────────────

function FinancingCard({
  item,
  onAdvance,
  onClick,
}: {
  item: Financing
  onAdvance?: (id: string, nextStage: FinancingStage) => void
  onClick: (item: Financing) => void
}) {
  const stageIdx = STAGES.findIndex(s => s.key === item.stage)
  const nextStage = ACTIVE_STAGES[stageIdx + 1]?.key as FinancingStage | undefined

  return (
    <div
      className="bg-[#1a1a2e] border border-white/10 rounded-lg p-3 space-y-2 hover:border-white/20 transition-colors cursor-pointer"
      onClick={() => onClick(item)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-white leading-tight line-clamp-1">
          {item.clientName || item.contact?.name || 'Cliente'}
        </p>
        {nextStage && onAdvance && (
          <button
            onClick={e => { e.stopPropagation(); onAdvance(item.id, nextStage) }}
            className="text-white/50 hover:text-blue-400 transition-colors flex-shrink-0"
            title="Avançar etapa"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {item.bank && (
        <div className="flex items-center gap-1 text-xs text-white/50">
          <Landmark className="h-3 w-3" />
          {item.bank}
        </div>
      )}

      {item.property && (
        <p className="text-[11px] text-white/40 line-clamp-1">
          {item.property.reference ? `#${item.property.reference} — ` : ''}{item.property.title}
        </p>
      )}

      <div className="flex items-center justify-between">
        {item.financedValue ? (
          <span className="text-xs font-semibold text-emerald-400">{fmtCurrency(Number(item.financedValue))}</span>
        ) : (
          <span className="text-xs text-white/50">—</span>
        )}
        {item.term && (
          <span className="text-[11px] text-white/40">{item.term} meses</span>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FinanciamentosPage() {
  const { accessToken: token } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState<string>('all')
  const [openDialog, setOpenDialog] = useState(false)
  const [editing, setEditing] = useState<Financing | null>(null)

  const { data: summary } = useQuery({
    queryKey: ['financings-summary'],
    queryFn: () => financingsApi.summary(token!),
    enabled: !!token,
  })

  const { data: listData, isLoading } = useQuery({
    queryKey: ['financings', search, filterStage],
    queryFn: () => financingsApi.list(token!, {
      ...(search && { search }),
      ...(filterStage && filterStage !== 'all' && { stage: filterStage }),
      limit: '200',
    }),
    enabled: !!token,
  })

  const items = listData?.data ?? []

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<FinancingForm>({
    resolver: zodResolver(financingSchema),
    defaultValues: { stage: 'SIMULACAO' },
  })

  const createMutation = useMutation({
    mutationFn: (body: Partial<Financing>) => financingsApi.create(token!, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['financings'] }); qc.invalidateQueries({ queryKey: ['financings-summary'] }); setOpenDialog(false); reset() },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Financing> }) => financingsApi.update(token!, id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['financings'] }); qc.invalidateQueries({ queryKey: ['financings-summary'] }); setOpenDialog(false); setEditing(null); reset() },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financingsApi.delete(token!, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['financings'] }); qc.invalidateQueries({ queryKey: ['financings-summary'] }); setOpenDialog(false); setEditing(null); reset() },
  })

  function openNew() {
    setEditing(null)
    reset({ stage: 'SIMULACAO' })
    setOpenDialog(true)
  }

  function openEdit(item: Financing) {
    setEditing(item)
    reset({
      stage: item.stage,
      bank: item.bank ?? '',
      clientName: item.clientName ?? '',
      clientPhone: item.clientPhone ?? '',
      clientEmail: item.clientEmail ?? '',
      propertyValue: item.propertyValue ? Number(item.propertyValue) : '',
      financedValue: item.financedValue ? Number(item.financedValue) : '',
      downPayment: item.downPayment ? Number(item.downPayment) : '',
      fgtsValue: item.fgtsValue ? Number(item.fgtsValue) : '',
      monthlyPayment: item.monthlyPayment ? Number(item.monthlyPayment) : '',
      term: item.term ?? '',
      rate: item.rate ? Number(item.rate) : '',
      notes: item.notes ?? '',
      simulatorLink: item.simulatorLink ?? '',
    })
    setOpenDialog(true)
  }

  function advanceStage(id: string, nextStage: FinancingStage) {
    updateMutation.mutate({ id, body: { stage: nextStage } })
  }

  function onSubmit(data: FinancingForm) {
    const body: any = {}
    Object.entries(data).forEach(([k, v]) => { if (v !== '' && v !== undefined) body[k] = v })
    if (editing) {
      updateMutation.mutate({ id: editing.id, body })
    } else {
      createMutation.mutate(body)
    }
  }

  // Group items by stage for kanban
  const byStage: Record<string, Financing[]> = {}
  STAGES.forEach(s => { byStage[s.key] = [] })
  items.forEach(item => { byStage[item.stage]?.push(item) })

  const showKanban = filterStage === 'all' && !search

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Financiamentos</h1>
          <p className="text-sm text-white/50 mt-0.5">Pipeline de financiamentos imobiliários</p>
        </div>
        <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          Novo Financiamento
        </Button>
      </div>

      {/* KPI cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
              <TrendingUp className="h-3.5 w-3.5" />
              Total
            </div>
            <p className="text-2xl font-bold text-white">{summary.total}</p>
          </div>
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-blue-400 text-xs mb-2">
              <Building2 className="h-3.5 w-3.5" />
              Ativos
            </div>
            <p className="text-2xl font-bold text-white">{summary.active}</p>
          </div>
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-emerald-400 text-xs mb-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Concluídos
            </div>
            <p className="text-2xl font-bold text-white">{summary.completed}</p>
          </div>
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 text-emerald-400 text-xs mb-2">
              <DollarSign className="h-3.5 w-3.5" />
              Vol. Financiado
            </div>
            <p className="text-lg font-bold text-white">{fmtCurrency(summary.totalFinancedValue) ?? 'R$ 0'}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <SearchInputWithVoice
          placeholder="Buscar por cliente, banco..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onVoiceResult={(t) => setSearch(t)}
          dark
          containerClassName="flex-1 min-w-[200px]"
          className="w-full bg-[#1a1a2e] border border-white/10 text-white placeholder:text-white/40 rounded-md px-3 py-2 text-sm"
        />
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-[180px] bg-[#1a1a2e] border-white/10 text-white">
            <SelectValue placeholder="Todas etapas" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
            <SelectItem value="all">Todas etapas</SelectItem>
            {STAGES.map(s => (
              <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban / List */}
      {isLoading ? (
        <div className="text-center py-12 text-white/40">Carregando...</div>
      ) : showKanban ? (
        /* Kanban board — active stages only */
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4">
            {ACTIVE_STAGES.map(stage => {
              const stageItems = byStage[stage.key] ?? []
              return (
                <div key={stage.key} className={cn('w-64 rounded-xl border p-3 space-y-3', stage.bg)}>
                  <div className="flex items-center justify-between">
                    <span className={cn('text-xs font-semibold uppercase tracking-wide', stage.color)}>{stage.label}</span>
                    <Badge variant="secondary" className="bg-white/10 text-white/60 text-xs px-1.5 py-0">{stageItems.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {stageItems.map(item => (
                      <FinancingCard key={item.id} item={item} onAdvance={advanceStage} onClick={openEdit} />
                    ))}
                    {stageItems.length === 0 && (
                      <p className="text-xs text-white/40 text-center py-4">Nenhum</p>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Concluído + Cancelado stacked */}
            <div className="w-64 space-y-3">
              {['CONCLUIDO', 'CANCELADO'].map(stageKey => {
                const stage = STAGE_MAP[stageKey]
                const stageItems = byStage[stageKey] ?? []
                return (
                  <div key={stageKey} className={cn('rounded-xl border p-3 space-y-3', stage.bg)}>
                    <div className="flex items-center justify-between">
                      <span className={cn('text-xs font-semibold uppercase tracking-wide', stage.color)}>{stage.label}</span>
                      <Badge variant="secondary" className="bg-white/10 text-white/60 text-xs px-1.5 py-0">{stageItems.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {stageItems.slice(0, 3).map(item => (
                        <FinancingCard key={item.id} item={item} onClick={openEdit} />
                      ))}
                      {stageItems.length > 3 && (
                        <button
                          onClick={() => setFilterStage(stageKey)}
                          className="w-full text-xs text-white/40 hover:text-white/60 py-1"
                        >
                          +{stageItems.length - 3} mais
                        </button>
                      )}
                      {stageItems.length === 0 && (
                        <p className="text-xs text-white/40 text-center py-2">Nenhum</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Filtered list view */
        <div className="space-y-2">
          {items.length === 0 ? (
            <div className="text-center py-12 text-white/40">Nenhum financiamento encontrado</div>
          ) : (
            items.map(item => {
              const stage = STAGE_MAP[item.stage]
              return (
                <div
                  key={item.id}
                  className="bg-[#1a1a2e] border border-white/10 rounded-lg p-4 flex items-center gap-4 hover:border-white/20 transition-colors cursor-pointer"
                  onClick={() => openEdit(item)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{item.clientName || item.contact?.name || 'Cliente'}</span>
                      {item.bank && <span className="text-xs text-white/40">{item.bank}</span>}
                    </div>
                    {item.property && (
                      <p className="text-xs text-white/40 truncate">{item.property.title}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {item.financedValue && <p className="text-sm font-semibold text-emerald-400">{fmtCurrency(Number(item.financedValue))}</p>}
                    {item.term && <p className="text-xs text-white/40">{item.term} meses</p>}
                  </div>
                  <Badge className={cn('text-xs', stage?.bg, stage?.color, 'border')}>{stage?.label}</Badge>
                  <ChevronRight className="h-4 w-4 text-white/40" />
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Dialog: Create / Edit */}
      <Dialog open={openDialog} onOpenChange={v => { setOpenDialog(v); if (!v) { setEditing(null); reset() } }}>
        <DialogContent className="bg-[#12122a] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Financiamento' : 'Novo Financiamento'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            {/* Stage */}
            <div className="space-y-1.5">
              <Label>Etapa</Label>
              <Controller
                control={control}
                name="stage"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a2e] border-white/10 text-white">
                      {STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Client info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nome do Cliente</Label>
                <Input {...register('clientName')} placeholder="Nome completo" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input {...register('clientPhone')} placeholder="(00) 00000-0000" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>E-mail</Label>
                <Input {...register('clientEmail')} type="email" placeholder="cliente@email.com" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
                {errors.clientEmail && <p className="text-xs text-red-400">{errors.clientEmail.message}</p>}
              </div>
            </div>

            {/* Bank + Simulator */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Banco</Label>
                <Input {...register('bank')} placeholder="Ex: Caixa, Itaú, Bradesco" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
              </div>
              <div className="space-y-1.5">
                <Label>Link do Simulador</Label>
                <Input {...register('simulatorLink')} placeholder="https://..." className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
                {errors.simulatorLink && <p className="text-xs text-red-400">{errors.simulatorLink.message}</p>}
              </div>
            </div>

            {/* Financial values */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Valor do Imóvel (R$)</Label>
                <Input {...register('propertyValue')} type="number" placeholder="0" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
              </div>
              <div className="space-y-1.5">
                <Label>Valor Financiado (R$)</Label>
                <Input {...register('financedValue')} type="number" placeholder="0" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
              </div>
              <div className="space-y-1.5">
                <Label>Entrada (R$)</Label>
                <Input {...register('downPayment')} type="number" placeholder="0" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
              </div>
              <div className="space-y-1.5">
                <Label>FGTS (R$)</Label>
                <Input {...register('fgtsValue')} type="number" placeholder="0" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
              </div>
              <div className="space-y-1.5">
                <Label>Parcela Mensal (R$)</Label>
                <Input {...register('monthlyPayment')} type="number" placeholder="0" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
              </div>
              <div className="space-y-1.5">
                <Label>Prazo (meses)</Label>
                <Input {...register('term')} type="number" placeholder="360" className="bg-white/5 border-white/10 text-white placeholder:text-white/40" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Taxa de Juros (% a.a.)</Label>
              <Input {...register('rate')} type="number" step="0.01" placeholder="10.99" className="bg-white/5 border-white/10 text-white placeholder:text-white/40 w-40" />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <textarea
                {...register('notes')}
                rows={3}
                placeholder="Observações sobre este financiamento..."
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <DialogFooter className="gap-2 flex-wrap">
              {editing && (
                <Button
                  type="button"
                  variant="destructive"
                  className="mr-auto"
                  onClick={() => { if (confirm('Excluir este financiamento?')) deleteMutation.mutate(editing.id) }}
                >
                  Excluir
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={() => { setOpenDialog(false); setEditing(null); reset() }}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editing ? 'Salvar' : 'Criar Financiamento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
