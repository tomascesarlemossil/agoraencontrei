'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { dealsApi, type Deal } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, TrendingUp, DollarSign, User, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const COLUMNS: { key: string; label: string; color: string }[] = [
  { key: 'OPEN',        label: 'Aberto',     color: 'bg-white/10' },
  { key: 'IN_PROGRESS', label: 'Em Andamento', color: 'bg-blue-500/10' },
  { key: 'PROPOSAL',    label: 'Proposta',   color: 'bg-yellow-500/10' },
  { key: 'CONTRACT',    label: 'Contrato',   color: 'bg-emerald-500/10' },
]

const STATUS_BADGE: Record<string, string> = {
  OPEN:        'bg-white/10 text-white/60',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-400',
  PROPOSAL:    'bg-yellow-500/20 text-yellow-400',
  CONTRACT:    'bg-emerald-500/20 text-emerald-400',
  CLOSED_WON:  'bg-green-500/20 text-green-400',
  CLOSED_LOST: 'bg-red-500/20 text-red-400',
}

const dealSchema = z.object({
  title:  z.string().min(2, 'Título obrigatório'),
  type:   z.enum(['SALE', 'RENT']),
  value:  z.coerce.number().positive().optional().or(z.literal('')),
  notes:  z.string().optional(),
})
type DealForm = z.infer<typeof dealSchema>

function formatCurrency(v?: number) {
  if (!v) return null
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function DealCard({ deal, onMove }: { deal: Deal; onMove: (id: string, status: string) => void }) {
  const nextStatus: Record<string, string> = {
    OPEN: 'IN_PROGRESS', IN_PROGRESS: 'PROPOSAL', PROPOSAL: 'CONTRACT', CONTRACT: 'CLOSED_WON',
  }
  const next = nextStatus[deal.status]

  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-lg p-3 space-y-2 hover:border-white/20 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-white leading-tight">{deal.title}</p>
        {next && (
          <button
            onClick={() => onMove(deal.id, next)}
            className="text-white/50 hover:text-blue-400 transition-colors flex-shrink-0"
            title={`Mover para ${next}`}
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {deal.value && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <DollarSign className="h-3 w-3" />
          {formatCurrency(deal.value)}
        </div>
      )}

      {deal.contact && (
        <div className="flex items-center gap-1.5 text-xs text-white/40">
          <User className="h-3 w-3" />
          {deal.contact.name}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <Badge className={cn('text-xs border-0', STATUS_BADGE[deal.status] ?? 'bg-white/10 text-white/50')}>
          {deal.type === 'RENT' ? 'Locação' : 'Venda'}
        </Badge>
        {deal.broker && (
          <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {deal.broker.name.charAt(0)}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DealsPage() {
  const { getValidToken } = useAuth()
  const qc = useQueryClient()
  const [view, setView] = useState<'pipeline' | 'list'>('pipeline')
  const [showCreate, setShowCreate] = useState(false)

  const { data: pipeline, isLoading: pipelineLoading } = useQuery({
    queryKey: ['deals-pipeline'],
    queryFn: async () => {
      const token = await getValidToken()
      return dealsApi.pipeline(token!)
    },
    enabled: view === 'pipeline',
  })

  const { data: list, isLoading: listLoading } = useQuery({
    queryKey: ['deals-list'],
    queryFn: async () => {
      const token = await getValidToken()
      return dealsApi.list(token!, { limit: 50 })
    },
    enabled: view === 'list',
  })

  const moveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const token = await getValidToken()
      return dealsApi.update(token!, id, { status })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deals'] }),
  })

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<DealForm>({
    resolver: zodResolver(dealSchema),
    defaultValues: { type: 'SALE' },
  })

  const createMutation = useMutation({
    mutationFn: async (body: DealForm) => {
      const token = await getValidToken()
      return dealsApi.create(token!, { ...body, value: body.value ? Number(body.value) : undefined })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] })
      setShowCreate(false)
      reset()
    },
  })

  const totalOpen = pipeline
    ? Object.values(pipeline).reduce((s, col) => s + (col as Deal[]).length, 0)
    : (list?.meta.total ?? 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Negócios</h1>
          <p className="text-white/50 text-sm mt-1">{totalOpen} negociaç{totalOpen !== 1 ? 'ões' : 'ão'} ativa{totalOpen !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            <button
              onClick={() => setView('pipeline')}
              className={cn('px-3 py-1.5 text-xs font-medium transition-colors', view === 'pipeline' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white')}
            >Pipeline</button>
            <button
              onClick={() => setView('list')}
              className={cn('px-3 py-1.5 text-xs font-medium transition-colors', view === 'list' ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white')}
            >Lista</button>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Negócio
          </Button>
        </div>
      </div>

      {/* Pipeline View */}
      {view === 'pipeline' && (
        pipelineLoading ? (
          <div className="py-20 text-center text-white/40">Carregando pipeline...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto">
            {COLUMNS.map(({ key, label, color }) => {
              const cards = (pipeline?.[key] ?? []) as Deal[]
              const colValue = cards.reduce((s, d) => s + (Number(d.value) || 0), 0)
              return (
                <div key={key} className={cn('rounded-xl p-4 space-y-3 min-w-[240px]', color, 'border border-white/10')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-white/60 uppercase tracking-wider">{label}</p>
                      <p className="text-lg font-bold text-white mt-0.5">{cards.length}</p>
                    </div>
                    {colValue > 0 && (
                      <p className="text-xs text-white/40">{formatCurrency(colValue)}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    {cards.map((deal) => (
                      <DealCard
                        key={deal.id}
                        deal={deal}
                        onMove={(id, status) => moveMutation.mutate({ id, status })}
                      />
                    ))}
                    {!cards.length && (
                      <p className="text-xs text-white/40 text-center py-4">Nenhum negócio</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {/* List View */}
      {view === 'list' && (
        listLoading ? (
          <div className="py-20 text-center text-white/40">Carregando...</div>
        ) : (
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            {!list?.data.length ? (
              <div className="py-20 text-center">
                <TrendingUp className="h-12 w-12 text-white/40 mx-auto mb-3" />
                <p className="text-white/40">Nenhum negócio cadastrado</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Negócio</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden md:table-cell">Valor</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden lg:table-cell">Contato</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider hidden lg:table-cell">Corretor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {list.data.map((d: Deal) => (
                    <tr key={d.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-white">{d.title}</p>
                        <p className="text-xs text-white/40">{d.type === 'RENT' ? 'Locação' : 'Venda'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn('text-xs border-0', STATUS_BADGE[d.status] ?? 'bg-white/10 text-white/50')}>
                          {d.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-sm text-white/70">
                        {formatCurrency(d.value) ?? '—'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-white/50">
                        {d.contact?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-white/50">
                        {d.broker?.name ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Negócio</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input {...register('title')} className="bg-white/5 border-white/10 text-white" placeholder="Ex: Venda Apto Rua das Flores" />
              {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tipo</Label>
                <Select defaultValue="SALE" onValueChange={(v: string) => setValue('type', v as 'SALE' | 'RENT')}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALE">Venda</SelectItem>
                    <SelectItem value="RENT">Locação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Valor (R$)</Label>
                <Input {...register('value')} type="number" className="bg-white/5 border-white/10 text-white" placeholder="0,00" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Input {...register('notes')} className="bg-white/5 border-white/10 text-white" />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}
                className="text-white/60 hover:text-white">Cancelar</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Criando...' : 'Criar Negócio'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
