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
