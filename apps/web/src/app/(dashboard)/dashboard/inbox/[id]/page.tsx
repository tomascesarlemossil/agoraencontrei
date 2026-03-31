'use client'

import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { inboxApi, usersApi, type Message, type Conversation } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft, Send, Bot, UserCheck, CheckCircle, Clock, Phone,
  User, Briefcase, Link as LinkIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

const STATUS_MAP: Record<string, string> = {
  bot:      'bg-blue-500/20 text-blue-400',
  open:     'bg-yellow-500/20 text-yellow-400',
  assigned: 'bg-emerald-500/20 text-emerald-400',
  resolved: 'bg-white/10 text-white/40',
}
const STATUS_LABELS: Record<string, string> = {
  bot: 'Bot', open: 'Aberto', assigned: 'Atribuído', resolved: 'Resolvido',
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

function MessageBubble({ msg }: { msg: Message }) {
  const isOut = msg.direction === 'outbound'
  return (
    <div className={cn('flex', isOut ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm',
        isOut
          ? 'bg-emerald-600 text-white rounded-br-sm'
          : 'bg-white/10 text-white rounded-bl-sm'
      )}>
        {msg.type === 'audio' && (
          <p className="text-xs text-white/50 italic mb-1">🎤 Áudio</p>
        )}
        {msg.type === 'image' && (
          <p className="text-xs text-white/50 italic mb-1">📷 Imagem</p>
        )}
        {msg.type === 'document' && (
          <p className="text-xs text-white/50 italic mb-1">📄 Documento</p>
        )}
        <p className="leading-relaxed whitespace-pre-wrap">{msg.content || '—'}</p>
        <p className={cn('text-xs mt-1', isOut ? 'text-white/60 text-right' : 'text-white/30')}>
          {fmtTime(msg.createdAt)}
          {isOut && msg.status === 'read' && ' ✓✓'}
          {isOut && msg.status === 'delivered' && ' ✓✓'}
          {isOut && msg.status === 'sent' && ' ✓'}
        </p>
      </div>
    </div>
  )
}

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const { getValidToken, user } = useAuth()
  const [text, setText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: conversation, isLoading } = useQuery({
    queryKey: ['conversation', id],
    queryFn: async () => {
      const token = await getValidToken()
      return inboxApi.get(token!, id)
    },
    refetchInterval: 10_000,
  })

  const { data: teamUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const token = await getValidToken()
      return usersApi.list(token!)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (body: { status?: string; assignedToId?: string | null }) => {
      const token = await getValidToken()
      return inboxApi.update(token!, id, body)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversation', id] }),
  })

  const sendMutation = useMutation({
    mutationFn: async () => {
      const token = await getValidToken()
      return inboxApi.send(token!, {
        to: conversation!.phone,
        text,
        conversationId: id,
      })
    },
    onSuccess: () => {
      setText('')
      qc.invalidateQueries({ queryKey: ['conversation', id] })
    },
  })

  // Group messages by date
  const messages = conversation?.messages ?? []
  const grouped = messages.reduce<{ date: string; messages: Message[] }[]>((acc, msg) => {
    const date = fmtDate(msg.createdAt)
    const last = acc[acc.length - 1]
    if (last?.date === date) {
      last.messages.push(msg)
    } else {
      acc.push({ date, messages: [msg] })
    }
    return acc
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (isLoading) return <div className="p-6 text-white/40 text-center py-20">Carregando...</div>
  if (!conversation) return <div className="p-6 text-red-400 text-center py-20">Conversa não encontrada</div>

  return (
    <div className="flex h-[calc(100vh-0px)] max-h-screen">
      {/* Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5 flex-shrink-0">
          <Link href="/dashboard/inbox">
            <Button variant="ghost" size="icon" className="text-white/60 hover:text-white h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="h-9 w-9 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <Phone className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">{conversation.contactName ?? conversation.phone}</p>
            <p className="text-xs text-white/40">{conversation.phone}</p>
          </div>
          <Badge className={cn('border-0 text-xs', STATUS_MAP[conversation.status] ?? 'bg-white/10 text-white/40')}>
            {STATUS_LABELS[conversation.status] ?? conversation.status}
          </Badge>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {grouped.map(({ date, messages: msgs }) => (
            <div key={date}>
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-xs text-white/30 flex-shrink-0">{date}</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <div className="space-y-1.5">
                {msgs.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-white/30">
              <p className="text-sm">Nenhuma mensagem ainda</p>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10 flex-shrink-0">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            onKeyDown={(e) => e.key === 'Enter' && text.trim() && sendMutation.mutate()}
          />
          <Button
            size="icon"
            disabled={!text.trim() || sendMutation.isPending}
            onClick={() => sendMutation.mutate()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-72 border-l border-white/10 flex flex-col bg-white/3 flex-shrink-0 overflow-y-auto p-4 space-y-4">
        {/* Status */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Status</p>
          <Select value={conversation.status} onValueChange={(v) => updateMutation.mutate({ status: v })}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bot">Bot</SelectItem>
              <SelectItem value="open">Aberto</SelectItem>
              <SelectItem value="assigned">Atribuído</SelectItem>
              <SelectItem value="resolved">Resolvido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assign */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Corretor</p>
          <Select
            value={conversation.assignedToId ?? 'unassigned'}
            onValueChange={(v) => updateMutation.mutate({ assignedToId: v === 'unassigned' ? null : v })}
          >
            <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Não atribuído</SelectItem>
              {teamUsers?.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Linked lead */}
        {conversation.lead && (
          <div className="bg-white/5 rounded-xl border border-white/10 p-3 space-y-1">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Lead</p>
            <Link href={`/dashboard/leads/${conversation.lead.id}`}
              className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
              <User className="h-3.5 w-3.5 text-white/30" />
              {conversation.lead.name}
              <LinkIcon className="h-3 w-3 text-white/30 ml-auto" />
            </Link>
          </div>
        )}

        {/* Linked contact */}
        {conversation.contact && (
          <div className="bg-white/5 rounded-xl border border-white/10 p-3 space-y-1">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Contato</p>
            <Link href={`/dashboard/contacts/${conversation.contact.id}`}
              className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
              <User className="h-3.5 w-3.5 text-white/30" />
              {conversation.contact.name}
              <LinkIcon className="h-3 w-3 text-white/30 ml-auto" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
