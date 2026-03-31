'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { inboxApi, type Conversation } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import {
  MessageCircle, Phone, Search, Bot, UserCheck, CheckCircle, Clock, Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ComponentType<any> }> = {
  bot:      { label: 'Bot',        color: 'bg-blue-500/20 text-blue-400',    icon: Bot },
  open:     { label: 'Aberto',     color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
  assigned: { label: 'Atribuído',  color: 'bg-emerald-500/20 text-emerald-400', icon: UserCheck },
  resolved: { label: 'Resolvido',  color: 'bg-white/10 text-white/40',       icon: CheckCircle },
}

function fmtTime(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60_000) return 'agora'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}min`
  if (diff < 86_400_000) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function InboxPage() {
  const { getValidToken } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  const params: any = { page, limit: 20 }
  if (statusFilter !== 'all') params.status = statusFilter
  if (search) params.search = search

  const { data, isLoading } = useQuery({
    queryKey: ['inbox', params],
    queryFn: async () => {
      const token = await getValidToken()
      return inboxApi.list(token!, params)
    },
  })

  const { data: stats } = useQuery({
    queryKey: ['inbox-stats'],
    queryFn: async () => {
      const token = await getValidToken()
      return inboxApi.stats(token!)
    },
    refetchInterval: 30_000,
  })

  const conversations = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-emerald-400" />
            Lemos.chat
          </h1>
          <p className="text-white/40 text-sm mt-1">Inbox omnichannel WhatsApp</p>
        </div>
        {stats && (
          <div className="flex items-center gap-4">
            {[
              { label: 'Abertos', value: stats.open, color: 'text-yellow-400' },
              { label: 'Bot', value: stats.bot, color: 'text-blue-400' },
              { label: 'Não lidos', value: stats.unreadTotal, color: 'text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <p className={cn('text-xl font-bold', color)}>{value}</p>
                <p className="text-xs text-white/40">{label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30 w-52" />
        </div>
        <div className="flex gap-1">
          {['all', 'bot', 'open', 'assigned', 'resolved'].map((s) => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                statusFilter === s ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white hover:bg-white/10'
              )}>
              {s === 'all' ? 'Todos' : STATUS_MAP[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-white/40">Carregando...</div>
        ) : !conversations.length ? (
          <div className="py-20 flex flex-col items-center text-center">
            <MessageCircle className="h-14 w-14 text-white/20 mb-3" />
            <p className="text-white/40">Nenhuma conversa encontrada</p>
            <p className="text-white/30 text-xs mt-1">As mensagens do WhatsApp aparecem aqui automaticamente</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {conversations.map((conv: Conversation) => {
              const st = STATUS_MAP[conv.status] ?? STATUS_MAP.open
              const StatusIcon = st.icon
              return (
                <Link key={conv.id} href={`/dashboard/inbox/${conv.id}`}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 transition-colors">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 relative">
                    <Phone className="h-5 w-5 text-emerald-400" />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {conv.contactName ?? conv.phone}
                      </p>
                      <Badge className={cn('border-0 text-xs flex-shrink-0 flex items-center gap-1', st.color)}>
                        <StatusIcon className="h-3 w-3" />{st.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-white/40 truncate mt-0.5">
                      {conv.lastMessage ?? 'Sem mensagens'}
                    </p>
                    {conv.lead && (
                      <p className="text-xs text-blue-400/70 mt-0.5">Lead: {conv.lead.name}</p>
                    )}
                  </div>

                  {/* Right */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-white/30">{fmtTime(conv.lastMessageAt)}</span>
                    {conv.assignedTo && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-white/30" />
                        <span className="text-xs text-white/40">{conv.assignedTo.name}</span>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-white/40">
          <span>Página {meta.page} de {meta.totalPages} · {meta.total} conversas</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="border-white/20 text-white/60 hover:text-white">Anterior</Button>
            <Button variant="outline" size="sm" disabled={page === meta.totalPages} onClick={() => setPage((p) => p + 1)}
              className="border-white/20 text-white/60 hover:text-white">Próximo</Button>
          </div>
        </div>
      )}
    </div>
  )
}
