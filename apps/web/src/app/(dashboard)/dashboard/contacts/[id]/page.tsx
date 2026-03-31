'use client'

import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { contactsApi, activitiesApi, type Activity } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft, Phone, Mail, MapPin, User, Building2,
  MessageCircle, PhoneCall, Calendar, CheckCircle, Plus,
  Briefcase, Home, CreditCard,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const ACTIVITY_ICONS: Record<string, React.ComponentType<any>> = {
  note: MessageCircle, call: PhoneCall, email: MessageCircle,
  visit: MapPin, whatsapp: MessageCircle, task: Calendar,
  status_change: CheckCircle, system: CheckCircle,
}

const DEAL_STATUS_MAP: Record<string, string> = {
  OPEN: 'bg-white/10 text-white/60',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-400',
  PROPOSAL: 'bg-yellow-500/20 text-yellow-400',
  CONTRACT: 'bg-emerald-500/20 text-emerald-400',
  CLOSED_WON: 'bg-green-500/20 text-green-400',
  CLOSED_LOST: 'bg-red-500/20 text-red-400',
}
const DEAL_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Aberto', IN_PROGRESS: 'Em Andamento', PROPOSAL: 'Proposta',
  CONTRACT: 'Contrato', CLOSED_WON: 'Fechado', CLOSED_LOST: 'Perdido',
}

const LEAD_STATUS_MAP: Record<string, string> = {
  NEW: 'bg-blue-500/20 text-blue-400',
  CONTACTED: 'bg-yellow-500/20 text-yellow-400',
  QUALIFIED: 'bg-purple-500/20 text-purple-400',
  WON: 'bg-emerald-500/20 text-emerald-400',
  LOST: 'bg-red-500/20 text-red-400',
}
const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: 'Novo', CONTACTED: 'Contatado', QUALIFIED: 'Qualificado',
  VISITING: 'Visitando', PROPOSAL: 'Proposta', NEGOTIATING: 'Negociando',
  WON: 'Ganho', LOST: 'Perdido', ARCHIVED: 'Arquivado',
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
          <time className="text-xs text-white/30 flex-shrink-0">
            {new Date(a.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </time>
        </div>
        {a.description && <p className="text-xs text-white/50 mt-0.5">{a.description}</p>}
        {a.user && <p className="text-xs text-white/30 mt-0.5">por {a.user.name}</p>}
      </div>
    </div>
  )
}

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const { getValidToken } = useAuth()
  const [newNote, setNewNote] = useState('')
  const [newActType, setNewActType] = useState('note')

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      const token = await getValidToken()
      return contactsApi.get(token!, id)
    },
  })

  const { data: activities } = useQuery({
    queryKey: ['activities', 'contact', id],
    queryFn: async () => {
      const token = await getValidToken()
      return activitiesApi.list(token!, { contactId: id, limit: 50 })
    },
  })

  const addActivityMutation = useMutation({
    mutationFn: async () => {
      const token = await getValidToken()
      return activitiesApi.create(token!, { type: newActType, title: newNote, contactId: id })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities', 'contact', id] })
      setNewNote('')
    },
  })

  if (isLoading) return <div className="p-6 text-white/40 text-center py-20">Carregando...</div>
  if (!contact) return <div className="p-6 text-red-400 text-center py-20">Contato não encontrado</div>

  const TypeIcon = contact.type === 'COMPANY' ? Building2 : User

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/dashboard/contacts">
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <TypeIcon className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-white">{contact.name}</h1>
              <Badge variant="outline" className="border-white/20 text-white/50 text-xs">
                {contact.type === 'COMPANY' ? 'Empresa' : 'Pessoa Física'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {contact.isOwner && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">
                  <Home className="h-3 w-3 mr-1" />Proprietário
                </Badge>
              )}
              {contact.isTenant && (
                <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">
                  <CreditCard className="h-3 w-3 mr-1" />Inquilino
                </Badge>
              )}
              {contact.tags?.map((t) => (
                <Badge key={t} variant="outline" className="border-white/20 text-white/40 text-xs">{t}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel */}
        <div className="space-y-4">
          {/* Contact info */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Informações</h3>
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                <Phone className="h-4 w-4 text-white/30" /> {contact.phone}
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                <Mail className="h-4 w-4 text-white/30" /> {contact.email}
              </a>
            )}
            {(contact.city || contact.state) && (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <MapPin className="h-4 w-4 text-white/30" />
                {[contact.city, contact.state].filter(Boolean).join(', ')}
              </div>
            )}
            {contact.cpf && (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <User className="h-4 w-4 text-white/30" /> CPF: {contact.cpf}
              </div>
            )}
            {contact.cnpj && (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Building2 className="h-4 w-4 text-white/30" /> CNPJ: {contact.cnpj}
              </div>
            )}
          </div>

          {/* Leads */}
          {contact.leads?.length > 0 && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Leads</h3>
              <div className="space-y-2">
                {contact.leads.map((lead: any) => (
                  <Link key={lead.id} href={`/dashboard/leads/${lead.id}`}
                    className="flex items-center justify-between gap-2 hover:bg-white/5 rounded-lg p-1.5 -mx-1.5 transition-colors">
                    <span className="text-sm text-white/70 truncate">{lead.name}</span>
                    <Badge className={cn('border-0 text-xs flex-shrink-0', LEAD_STATUS_MAP[lead.status] ?? 'bg-white/10 text-white/40')}>
                      {LEAD_STATUS_LABELS[lead.status] ?? lead.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Deals */}
          {contact.deals?.length > 0 && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Negócios</h3>
              <div className="space-y-2">
                {contact.deals.map((deal: any) => (
                  <Link key={deal.id} href={`/dashboard/deals/${deal.id}`}
                    className="block hover:bg-white/5 rounded-lg p-1.5 -mx-1.5 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-white/70 truncate">{deal.title}</span>
                      <Badge className={cn('border-0 text-xs flex-shrink-0', DEAL_STATUS_MAP[deal.status] ?? 'bg-white/10 text-white/40')}>
                        {DEAL_STATUS_LABELS[deal.status] ?? deal.status}
                      </Badge>
                    </div>
                    {deal.value && (
                      <p className="text-xs text-emerald-400 mt-0.5">{fmt(deal.value)}</p>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Add activity */}
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
              <Input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Descreva a atividade..."
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && newNote.trim() && addActivityMutation.mutate()}
              />
              <Button size="sm" disabled={!newNote.trim() || addActivityMutation.isPending}
                onClick={() => addActivityMutation.mutate()} className="gap-1">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Timeline</h3>
            {!activities?.data.length ? (
              <p className="text-white/30 text-sm text-center py-8">Nenhuma atividade registrada</p>
            ) : (
              <div>{activities.data.map((a) => <TimelineItem key={a.id} a={a} />)}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
