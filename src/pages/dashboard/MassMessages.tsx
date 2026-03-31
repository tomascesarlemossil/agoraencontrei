import { useState, useRef } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Mail,
  MessageCircle,
  Phone,
  Users,
  Send,
  Clock,
  Calendar,
  ChevronDown,
  Eye,
  BookOpen,
  Tag,
  BarChart2,
  CheckCircle2,
  XCircle,
  Filter,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

interface Campaign {
  id: number
  name: string
  channel: 'email' | 'whatsapp' | 'sms'
  recipients: number
  sent: number
  opens: number
  clicks: number
  date: string
  status: 'enviado' | 'agendado' | 'rascunho' | 'falha'
}

interface Template {
  id: number
  title: string
  channel: 'email' | 'whatsapp' | 'sms' | 'all'
  subject?: string
  body: string
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const campaigns: Campaign[] = [
  {
    id: 1,
    name: 'Boas-vindas Novos Leads – Março',
    channel: 'email',
    recipients: 142,
    sent: 138,
    opens: 89,
    clicks: 34,
    date: '20/03/2025',
    status: 'enviado',
  },
  {
    id: 2,
    name: 'Lançamento Residencial Vila Verde',
    channel: 'whatsapp',
    recipients: 210,
    sent: 210,
    opens: 198,
    clicks: 112,
    date: '15/03/2025',
    status: 'enviado',
  },
  {
    id: 3,
    name: 'Promoção Temporada – Locação de Verão',
    channel: 'email',
    recipients: 320,
    sent: 317,
    opens: 145,
    clicks: 58,
    date: '10/03/2025',
    status: 'enviado',
  },
  {
    id: 4,
    name: 'Follow-up Clientes Inativos',
    channel: 'sms',
    recipients: 85,
    sent: 85,
    opens: 62,
    clicks: 0,
    date: '25/03/2025',
    status: 'agendado',
  },
  {
    id: 5,
    name: 'Newsletter Mensal – Tendências Imobiliárias',
    channel: 'email',
    recipients: 512,
    sent: 0,
    opens: 0,
    clicks: 0,
    date: '01/04/2025',
    status: 'rascunho',
  },
]

const templates: Template[] = [
  {
    id: 1,
    title: 'Boas-vindas ao Novo Lead',
    channel: 'all',
    subject: 'Bem-vindo à Imobiliária Lemos, {nome}!',
    body: 'Olá {nome}, seja bem-vindo à Imobiliária Lemos! Somos especialistas em imóveis em Franca e região. Nosso corretor {corretor} está à disposição para encontrar o imóvel ideal para você. 🏠',
  },
  {
    id: 2,
    title: 'Novo Imóvel Disponível',
    channel: 'all',
    subject: 'Novo imóvel: {imovel} por {preco}',
    body: 'Olá {nome}! Temos um novo imóvel que pode ser do seu interesse: {imovel} por apenas {preco}. Entre em contato com {corretor} para agendar uma visita.',
  },
  {
    id: 3,
    title: 'Lembrete de Visita',
    channel: 'whatsapp',
    body: 'Oi {nome}! 👋 Passando para confirmar sua visita ao imóvel {imovel} amanhã. Nosso corretor {corretor} estará esperando por você. Qualquer dúvida, é só responder essa mensagem!',
  },
  {
    id: 4,
    title: 'Proposta Enviada',
    channel: 'email',
    subject: 'Sua proposta para {imovel} foi enviada',
    body: 'Olá {nome}, recebemos sua proposta para o imóvel {imovel} no valor de {preco}. Nossa equipe está analisando e retornaremos em breve. Corretor responsável: {corretor}.',
  },
  {
    id: 5,
    title: 'Reativação de Clientes',
    channel: 'all',
    subject: 'Sentimos sua falta, {nome}! Novas opções disponíveis',
    body: 'Olá {nome}! Faz um tempo que não falamos. Temos novidades imperdíveis no mercado imobiliário de Franca. Que tal conversarmos? {corretor} pode te atualizar sobre as melhores oportunidades.',
  },
  {
    id: 6,
    title: 'Parabéns pelo Aniversário',
    channel: 'whatsapp',
    body: '🎉 Feliz aniversário, {nome}! A equipe da Imobiliária Lemos deseja um dia especial para você. Obrigado por confiar em nós na sua jornada imobiliária! 🏠✨',
  },
]

// ── Sub-components ─────────────────────────────────────────────────────────

const channelIcon = {
  email: <Mail className="h-3.5 w-3.5" />,
  whatsapp: <MessageCircle className="h-3.5 w-3.5" />,
  sms: <Phone className="h-3.5 w-3.5" />,
}

const channelColor: Record<Campaign['channel'], string> = {
  email: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  whatsapp: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  sms: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
}

const statusBadge: Record<Campaign['status'], { label: string; variant: 'success' | 'warning' | 'secondary' | 'destructive' }> = {
  enviado: { label: 'Enviado', variant: 'success' },
  agendado: { label: 'Agendado', variant: 'warning' },
  rascunho: { label: 'Rascunho', variant: 'secondary' },
  falha: { label: 'Falha', variant: 'destructive' },
}

function TemplateLibraryModal({ onSelect }: { onSelect: (t: Template) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Biblioteca de Templates</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {templates.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-lg border border-navy-700 bg-navy-800/50 hover:border-[#d4a843]/40 hover:bg-navy-800 transition-all cursor-pointer group"
              onClick={() => { onSelect(t); setOpen(false) }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-sm font-semibold text-foreground group-hover:text-[#d4a843] transition-colors">{t.title}</p>
                    <span className={cn('inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium', channelColor[t.channel === 'all' ? 'email' : t.channel])}>
                      {t.channel === 'all' ? 'Todos' : t.channel}
                    </span>
                  </div>
                  {t.subject && <p className="text-xs text-foreground/50 mb-1">Assunto: {t.subject}</p>}
                  <p className="text-xs text-foreground/60 line-clamp-2">{t.body}</p>
                </div>
                <Button size="sm" variant="ghost" className="shrink-0 text-xs">Usar</Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PreviewModal({ channel, subject, body }: { channel: string; subject: string; body: string }) {
  const [open, setOpen] = useState(false)
  const previewBody = body
    .replace(/\{nome\}/g, 'Maria Silva')
    .replace(/\{imovel\}/g, 'Apto 3q Jardim Paulista')
    .replace(/\{preco\}/g, 'R$ 480.000')
    .replace(/\{corretor\}/g, 'Carlos Lemos')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Eye className="h-3.5 w-3.5" />
          Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pré-visualização da Mensagem</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          {channel === 'email' ? (
            <div className="border border-navy-700 rounded-lg overflow-hidden">
              <div className="bg-navy-800 px-4 py-3 border-b border-navy-700">
                <p className="text-xs text-foreground/50">De: <span className="text-foreground/80">Imobiliária Lemos &lt;contato@imobiliarialemos.com.br&gt;</span></p>
                <p className="text-xs text-foreground/50 mt-1">Para: <span className="text-foreground/80">Maria Silva &lt;maria@email.com&gt;</span></p>
                {subject && <p className="text-xs text-foreground/50 mt-1">Assunto: <span className="text-foreground font-medium">{subject.replace(/\{nome\}/g, 'Maria Silva')}</span></p>}
              </div>
              <div className="p-4 bg-navy-900">
                <div className="mb-4 pb-3 border-b border-navy-700">
                  <span className="font-display text-base font-bold text-[#d4a843]">LEMOS</span>
                  <span className="text-[8px] font-semibold tracking-[0.3em] text-foreground/40 uppercase ml-2">IMOBILIÁRIA</span>
                </div>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{previewBody}</p>
                <div className="mt-4 pt-3 border-t border-navy-700 text-[10px] text-foreground/30">
                  Imobiliária Lemos · Franca, SP · (16) 3000-0000
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#0a3d2b] rounded-2xl p-4 max-w-xs mx-auto">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#d4a843] flex items-center justify-center text-navy-950 font-bold text-xs">IL</div>
                <div>
                  <p className="text-xs font-semibold text-white">Imobiliária Lemos</p>
                  <p className="text-[10px] text-emerald-400">Online agora</p>
                </div>
              </div>
              <div className="bg-[#1a4d3a] rounded-xl rounded-tl-sm px-3 py-2.5">
                <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{previewBody}</p>
                <p className="text-[10px] text-emerald-300/60 text-right mt-1">10:42 ✓✓</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function MassMessages() {
  const [channel, setChannel] = useState<'email' | 'whatsapp' | 'sms'>('email')
  const [segment, setSegment] = useState('todos')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const audienceCount: Record<string, number> = {
    todos: 142,
    compradores: 58,
    locatarios: 34,
    leads: 31,
    cidade: 75,
    personalizado: 0,
  }

  const insertVariable = (variable: string) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const newBody = body.slice(0, start) + variable + body.slice(end)
    setBody(newBody)
    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = start + variable.length
      ta.focus()
    }, 0)
  }

  const handleSend = () => {
    setSending(true)
    setTimeout(() => {
      setSending(false)
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    }, 1800)
  }

  const maxChars = channel === 'sms' ? 160 : channel === 'whatsapp' ? 1000 : 5000

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#f8f6f0]">Mensagens em Massa</h1>
            <p className="text-sm text-foreground/50 mt-0.5 font-sans">Alcance seus clientes e leads em escala</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info" className="gap-1.5">
              <BarChart2 className="h-3 w-3" />
              5 campanhas ativas
            </Badge>
          </div>
        </div>

        {/* Channel Tabs */}
        <Tabs value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
          <TabsList className="w-auto">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-3.5 w-3.5" />Email
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2">
              <MessageCircle className="h-3.5 w-3.5" />WhatsApp
            </TabsTrigger>
            <TabsTrigger value="sms" className="gap-2">
              <Phone className="h-3.5 w-3.5" />SMS
            </TabsTrigger>
          </TabsList>

          {(['email', 'whatsapp', 'sms'] as const).map((ch) => (
            <TabsContent key={ch} value={ch}>
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-2">
                {/* Audience Builder */}
                <Card className="xl:col-span-1">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-sans font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 text-[#d4a843]" />
                      Audiência
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-foreground/70 mb-1.5 block">Segmento</label>
                      <Select value={segment} onValueChange={setSegment}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os clientes</SelectItem>
                          <SelectItem value="compradores">Compradores</SelectItem>
                          <SelectItem value="locatarios">Locatários</SelectItem>
                          <SelectItem value="leads">Leads ativos</SelectItem>
                          <SelectItem value="cidade">Por cidade</SelectItem>
                          <SelectItem value="personalizado">Filtro personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {segment === 'cidade' && (
                      <Input label="Cidade" placeholder="Ex: Franca" />
                    )}

                    {segment === 'personalizado' && (
                      <div className="space-y-3 p-3 rounded-lg bg-navy-800/60 border border-navy-700">
                        <p className="text-xs font-semibold text-foreground/60 flex items-center gap-1.5"><Filter className="h-3 w-3" />Filtros</p>
                        <Select>
                          <SelectTrigger><SelectValue placeholder="Cidade" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="franca">Franca</SelectItem>
                            <SelectItem value="ribeirao">Ribeirão Preto</SelectItem>
                            <SelectItem value="sp">São Paulo</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select>
                          <SelectTrigger><SelectValue placeholder="Interesse" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compra">Compra</SelectItem>
                            <SelectItem value="locacao">Locação</SelectItem>
                            <SelectItem value="ambos">Ambos</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select>
                          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ativo">Ativo</SelectItem>
                            <SelectItem value="inativo">Inativo</SelectItem>
                            <SelectItem value="negociando">Em negociação</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Audience counter */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#d4a843]/5 border border-[#d4a843]/20">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#d4a843]" />
                        <span className="text-sm font-semibold text-[#d4a843]">
                          {audienceCount[segment] || 0} destinatários
                        </span>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-[#d4a843]/60" />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Email', value: '87%', color: 'text-blue-400' },
                        { label: 'WhatsApp', value: '94%', color: 'text-emerald-400' },
                        { label: 'SMS', value: '78%', color: 'text-purple-400' },
                      ].map((s) => (
                        <div key={s.label} className="text-center p-2 rounded-md bg-navy-800/50">
                          <p className={cn('text-sm font-bold', s.color)}>{s.value}</p>
                          <p className="text-[10px] text-foreground/40">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Composer */}
                <Card className="xl:col-span-2">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-sans font-semibold flex items-center gap-2">
                        <span className={cn('inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border', channelColor[ch])}>
                          {channelIcon[ch]}
                          {ch === 'email' ? 'Email' : ch === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                        </span>
                        Composer
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <TemplateLibraryModal onSelect={(t) => { setBody(t.body); if (t.subject) setSubject(t.subject) }} />
                        <PreviewModal channel={ch} subject={subject} body={body} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {ch === 'email' && (
                      <Input
                        label="Assunto"
                        placeholder="Ex: Novo imóvel disponível em Franca, {nome}!"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      />
                    )}

                    {/* Variable buttons */}
                    <div>
                      <label className="text-xs font-medium text-foreground/70 mb-2 block">Inserir variável</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['{nome}', '{imovel}', '{preco}', '{corretor}'].map((v) => (
                          <button
                            key={v}
                            onClick={() => insertVariable(v)}
                            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-[#d4a843]/10 border border-[#d4a843]/30 text-[#d4a843] hover:bg-[#d4a843]/20 transition-colors font-mono"
                          >
                            <Tag className="h-3 w-3" />{v}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message body */}
                    <div>
                      <label className="text-xs font-medium text-foreground/70 mb-1.5 block">Mensagem</label>
                      <div className="relative">
                        <textarea
                          ref={textareaRef}
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          maxLength={maxChars}
                          placeholder={`Escreva sua mensagem aqui... Use as variáveis acima para personalizar.\n\nEx: Olá {nome}, temos um imóvel especial para você!`}
                          rows={6}
                          className="w-full rounded-md border border-navy-700 bg-navy-800 px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] focus-visible:border-[#d4a843]/50 resize-none transition-all duration-200 hover:border-navy-600"
                        />
                        <div className="absolute bottom-2 right-3">
                          <span className={cn('text-[10px]', body.length > maxChars * 0.9 ? 'text-amber-400' : 'text-foreground/30')}>
                            {body.length}/{maxChars}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Schedule */}
                    <div className="p-4 rounded-lg bg-navy-800/40 border border-navy-700 space-y-3">
                      <p className="text-xs font-semibold text-foreground/70 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Envio</p>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="schedule"
                            value="now"
                            checked={scheduleMode === 'now'}
                            onChange={() => setScheduleMode('now')}
                            className="accent-[#d4a843]"
                          />
                          <span className="text-sm text-foreground/80">Enviar agora</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="schedule"
                            value="later"
                            checked={scheduleMode === 'later'}
                            onChange={() => setScheduleMode('later')}
                            className="accent-[#d4a843]"
                          />
                          <span className="text-sm text-foreground/80">Agendar para depois</span>
                        </label>
                      </div>
                      {scheduleMode === 'later' && (
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="text-xs text-foreground/50 mb-1 block flex items-center gap-1"><Calendar className="h-3 w-3" />Data</label>
                            <input
                              type="date"
                              value={scheduleDate}
                              onChange={(e) => setScheduleDate(e.target.value)}
                              className="w-full h-10 rounded-md border border-navy-700 bg-navy-800 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843] focus:border-[#d4a843]/50"
                            />
                          </div>
                          <div className="w-32">
                            <label className="text-xs text-foreground/50 mb-1 block flex items-center gap-1"><Clock className="h-3 w-3" />Hora</label>
                            <input
                              type="time"
                              value={scheduleTime}
                              onChange={(e) => setScheduleTime(e.target.value)}
                              className="w-full h-10 rounded-md border border-navy-700 bg-navy-800 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843] focus:border-[#d4a843]/50"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Send button */}
                    <button
                      onClick={handleSend}
                      disabled={sending || !body.trim()}
                      className={cn(
                        'w-full h-12 rounded-lg font-semibold text-sm font-sans transition-all duration-200 flex items-center justify-center gap-2.5',
                        'bg-gradient-to-r from-[#f5d97a] via-[#d4a017] to-[#b8860b] text-navy-950',
                        'hover:shadow-lg hover:shadow-[#d4a843]/25 hover:brightness-110',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        sent && 'from-emerald-500 via-emerald-600 to-emerald-700 text-white'
                      )}
                    >
                      {sending ? (
                        <><Loader2 className="h-4 w-4 animate-spin" />Enviando...</>
                      ) : sent ? (
                        <><CheckCircle2 className="h-4 w-4" />Campanha enviada com sucesso!</>
                      ) : (
                        <><Send className="h-4 w-4" />{scheduleMode === 'now' ? `Enviar para ${audienceCount[segment] || 0} destinatários` : 'Agendar Campanha'}</>
                      )}
                    </button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Campaign History */}
        <Card>
          <CardHeader className="pb-4 flex-row items-center justify-between">
            <CardTitle className="text-base font-sans font-semibold">Histórico de Campanhas</CardTitle>
            <Badge variant="secondary">{campaigns.length} campanhas</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-800">
                    {['Nome', 'Canal', 'Destinatários', 'Enviados', 'Abertos', 'Clicados', 'Data', 'Status'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, i) => {
                    const openRate = c.sent > 0 ? ((c.opens / c.sent) * 100).toFixed(0) : '—'
                    const clickRate = c.sent > 0 ? ((c.clicks / c.sent) * 100).toFixed(0) : '—'
                    const sb = statusBadge[c.status]
                    return (
                      <tr
                        key={c.id}
                        className={cn(
                          'border-b border-navy-800/50 hover:bg-navy-800/30 transition-colors',
                          i % 2 === 0 ? 'bg-transparent' : 'bg-navy-900/20'
                        )}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground/90 max-w-[200px] truncate">{c.name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border', channelColor[c.channel])}>
                            {channelIcon[c.channel]}
                            <span className="capitalize">{c.channel}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground/70">{c.recipients.toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-3 text-foreground/70">{c.sent > 0 ? c.sent.toLocaleString('pt-BR') : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={cn('font-medium', Number(openRate) > 50 ? 'text-emerald-400' : Number(openRate) > 30 ? 'text-amber-400' : 'text-foreground/60')}>
                            {openRate !== '—' ? `${openRate}%` : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('font-medium', Number(clickRate) > 20 ? 'text-emerald-400' : 'text-foreground/60')}>
                            {clickRate !== '—' ? `${clickRate}%` : '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground/60 text-xs">{c.date}</td>
                        <td className="px-4 py-3">
                          <Badge variant={sb.variant} className="text-xs">{sb.label}</Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
