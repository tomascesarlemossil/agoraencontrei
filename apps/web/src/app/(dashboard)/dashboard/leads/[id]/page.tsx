'use client'

import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { leadsApi, activitiesApi, type Activity } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Phone, Mail, DollarSign, MessageCircle, PhoneCall, Mail as MailIcon, MapPin, Calendar, CheckCircle, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const STATUS_MAP: Record<string, string> = {
  NEW:'bg-blue-500/20 text-blue-400', CONTACTED:'bg-yellow-500/20 text-yellow-400',
  QUALIFIED:'bg-purple-500/20 text-purple-400', VISITING:'bg-orange-500/20 text-orange-400',
  PROPOSAL:'bg-indigo-500/20 text-indigo-400', NEGOTIATING:'bg-pink-500/20 text-pink-400',
  WON:'bg-emerald-500/20 text-emerald-400', LOST:'bg-red-500/20 text-red-400', ARCHIVED:'bg-gray-500/20 text-gray-400',
}
const STATUS_LABELS: Record<string, string> = {
  NEW:'Novo', CONTACTED:'Contatado', QUALIFIED:'Qualificado', VISITING:'Visitando',
  PROPOSAL:'Proposta', NEGOTIATING:'Negociando', WON:'Ganho', LOST:'Perdido', ARCHIVED:'Arquivado',
}
const STATUSES = Object.entries(STATUS_LABELS)

const ACTIVITY_ICONS: Record<string, React.ComponentType<any>> = {
  note: MessageCircle, call: PhoneCall, email: MailIcon,
  visit: MapPin, whatsapp: MessageCircle, task: Calendar,
  status_change: CheckCircle, system: CheckCircle,
}

function fmt(v?: number | null) {
  if (!v) return null
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function fmtMoney(v: unknown): string | null {
  if (v == null) return null
  const n = typeof v === 'string' ? Number(v) : (v as number)
  if (!Number.isFinite(n) || n === 0) return null
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

interface Recommendation {
  id: string
  title: string
  slug: string | null
  type: string
  purpose: string
  city: string | null
  neighborhood: string | null
  price: string | null
  priceRent: string | null
  bedrooms: number
  coverImage: string | null
  matchScore: number
  matchReasons: string[]
}

function TimelineItem({ activity }: { activity: Activity }) {
  const Icon = ACTIVITY_ICONS[activity.type] ?? MessageCircle
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
          <p className="text-sm font-medium text-white">{activity.title}</p>
          <time className="text-xs text-white/50 flex-shrink-0">
            {new Date(activity.createdAt).toLocaleDateString('pt-BR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
          </time>
        </div>
        {activity.description && <p className="text-xs text-white/50 mt-0.5">{activity.description}</p>}
        {activity.user && <p className="text-xs text-white/50 mt-0.5">por {activity.user.name}</p>}
      </div>
    </div>
  )
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const { getValidToken } = useAuth()
  const [newNote, setNewNote] = useState('')
  const [newActivityType, setNewActivityType] = useState('note')

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const token = await getValidToken()
      return leadsApi.get(token!, id)
    },
  })

  const { data: activities } = useQuery({
    queryKey: ['activities', 'lead', id],
    queryFn: async () => {
      const token = await getValidToken()
      return activitiesApi.list(token!, { leadId: id, limit: 50 })
    },
  })

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
  const { data: recs } = useQuery({
    queryKey: ['lead-recommendations', id],
    queryFn: async () => {
      const token = await getValidToken()
      const res = await fetch(`${API_URL}/api/v1/leads/${id}/recommendations`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return { data: [] as Recommendation[] }
      return res.json() as Promise<{ data: Recommendation[] }>
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const token = await getValidToken()
      return leadsApi.update(token!, id, { status })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lead', id] }),
  })

  const addActivityMutation = useMutation({
    mutationFn: async () => {
      const token = await getValidToken()
      return activitiesApi.create(token!, {
        type: newActivityType,
        title: newNote,
        leadId: id,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['activities', 'lead', id] })
      setNewNote('')
    },
  })

  // Registra a recomendação enviada no timeline (silencioso, fail-soft).
  async function logRecommendationSent(propertyTitle: string) {
    try {
      const token = await getValidToken()
      await activitiesApi.create(token!, {
        type: 'whatsapp',
        title: `Recomendação enviada: ${propertyTitle}`,
        leadId: id,
      })
      qc.invalidateQueries({ queryKey: ['activities', 'lead', id] })
    } catch { /* non-fatal */ }
  }

  if (isLoading) return <div className="p-6 text-white/40 text-center py-20">Carregando...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/leads">
          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-white">{lead?.name ?? 'Lead'}</h1>
            {lead && (
              <Badge className={cn('border-0 text-xs', STATUS_MAP[lead.status] ?? 'bg-white/10 text-white/40')}>
                {STATUS_LABELS[lead.status] ?? lead.status}
              </Badge>
            )}
          </div>
          <p className="text-white/40 text-sm mt-0.5">
            {lead?.source ? `Via ${lead.source}` : ''}{lead?.interest ? ` · ${lead.interest === 'buy' ? 'Compra' : 'Aluguel'}` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: info + status */}
        <div className="space-y-4">
          {/* Contact info */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Contato</h3>
            {lead?.phone && (
              <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                <Phone className="h-4 w-4 text-white/50" /> {lead.phone}
              </a>
            )}
            {lead?.email && (
              <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
                <Mail className="h-4 w-4 text-white/50" /> {lead.email}
              </a>
            )}
            {lead?.budget && (
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <DollarSign className="h-4 w-4" /> Orçamento: {fmt(lead.budget)}
              </div>
            )}
          </div>

          {/* Score */}
          {lead && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-4">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Score</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white/10 rounded-full h-2">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${lead.score}%` }} />
                </div>
                <span className="text-sm font-bold text-white">{lead.score}</span>
              </div>
            </div>
          )}

          {/* Recomendações */}
          {(recs?.data?.length ?? 0) > 0 && (
            <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Imóveis recomendados</h3>
                <span className="text-[10px] text-amber-400">✨ IA</span>
              </div>
              {recs!.data.map(r => {
                const price = r.purpose === 'RENT' ? fmtMoney(r.priceRent) : fmtMoney(r.price)
                const phoneClean = lead?.phone?.replace(/\D/g, '') ?? ''
                const publicUrl = `https://www.agoraencontrei.com.br/imoveis/${r.slug ?? r.id}`
                const firstName = (lead?.name ?? '').split(' ')[0] || ''
                const waText = encodeURIComponent(
                  `${firstName ? `Olá ${firstName}! ` : ''}Achei este imóvel pra você:\n\n🏠 ${r.title}${price ? `\n💰 ${price}` : ''}${r.neighborhood ? `\n📍 ${r.neighborhood}${r.city ? `, ${r.city}` : ''}` : ''}\n\nVeja todas as fotos e detalhes: ${publicUrl}`
                )
                const waHref = phoneClean ? `https://wa.me/55${phoneClean}?text=${waText}` : `https://wa.me/?text=${waText}`

                return (
                  <div key={r.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5">
                    <Link href={`/dashboard/properties/${r.id}`}
                      className="block hover:opacity-80 transition-opacity">
                      <div className="flex gap-2.5">
                        {r.coverImage && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={r.coverImage} alt={r.title}
                            className="h-14 w-14 flex-shrink-0 rounded-md object-cover" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-semibold text-white truncate">{r.title}</p>
                            <span className="text-[10px] font-bold text-amber-400 flex-shrink-0">{r.matchScore}%</span>
                          </div>
                          {(r.neighborhood || r.city) && (
                            <p className="text-[10px] text-white/40 truncate">
                              {[r.neighborhood, r.city].filter(Boolean).join(' · ')}
                            </p>
                          )}
                          {price && <p className="text-xs font-medium text-emerald-300 mt-0.5">{price}</p>}
                          {r.matchReasons[0] && (
                            <p className="text-[10px] italic text-white/40 mt-0.5 truncate">→ {r.matchReasons[0]}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                    <a href={waHref} target="_blank" rel="noopener noreferrer"
                      onClick={() => logRecommendationSent(r.title)}
                      className="mt-2 flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors">
                      <MessageCircle className="h-3 w-3" />
                      {phoneClean ? 'Enviar via WhatsApp' : 'Compartilhar via WhatsApp'}
                    </a>
                  </div>
                )
              })}
            </div>
          )}

          {/* Status */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-2">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Atualizar Status</h3>
            <Select
              value={lead?.status}
              onValueChange={(v: string) => updateStatusMutation.mutate(v)}
              disabled={updateStatusMutation.isPending}
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right: timeline */}
        <div className="lg:col-span-2 space-y-4">
          {/* Add activity */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Registrar Atividade</h3>
            <div className="flex gap-2">
              <Select value={newActivityType} onValueChange={setNewActivityType}>
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
                className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && newNote.trim() && addActivityMutation.mutate()}
              />
              <Button
                size="sm"
                disabled={!newNote.trim() || addActivityMutation.isPending}
                onClick={() => addActivityMutation.mutate()}
                className="gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Timeline</h3>
            {!activities?.data.length ? (
              <p className="text-white/50 text-sm text-center py-8">Nenhuma atividade registrada</p>
            ) : (
              <div>
                {activities.data.map((a) => <TimelineItem key={a.id} activity={a} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
