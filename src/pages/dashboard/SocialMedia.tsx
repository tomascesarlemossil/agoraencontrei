import { useState } from 'react'
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
  Instagram,
  Facebook,
  Linkedin,
  Plus,
  Link2,
  Sparkles,
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  MessageSquare,
  Eye,
  Image,
  Hash,
  Send,
  Loader2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Filter,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

type Network = 'instagram' | 'facebook' | 'linkedin'
type PostStatus = 'published' | 'scheduled' | 'draft'

interface Post {
  id: number
  network: Network
  caption: string
  imageUrl: string
  date: string
  status: PostStatus
  likes: number
  comments: number
  reach: number
  dayOfMonth?: number
}

interface Property {
  id: number
  code: string
  title: string
  imageUrl: string
}

interface ContentTemplate {
  id: number
  title: string
  emoji: string
  caption: string
  hashtags: string[]
  color: string
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const posts: Post[] = [
  { id: 1, network: 'instagram', caption: '✨ Novo imóvel! Apto 3 quartos no Jardim Paulista. 142m², piscina e 2 vagas. R$ 480.000. Entre em contato!', imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=400&fit=crop', date: '27/03/2025', status: 'published', likes: 142, comments: 23, reach: 1840, dayOfMonth: 27 },
  { id: 2, network: 'facebook', caption: 'Realizamos mais um sonho! 🎉 Nossa cliente Beatriz acaba de receber as chaves de seu novo lar. É muito bom poder fazer parte desse momento!', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop', date: '25/03/2025', status: 'published', likes: 218, comments: 45, reach: 3200, dayOfMonth: 25 },
  { id: 3, network: 'instagram', caption: '💡 Dica do dia: antes de comprar um imóvel, sempre verifique a documentação, o histórico do vendedor e faça uma vistoria detalhada!', imageUrl: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=400&fit=crop', date: '22/03/2025', status: 'published', likes: 87, comments: 12, reach: 1120, dayOfMonth: 22 },
  { id: 4, network: 'linkedin', caption: 'O mercado imobiliário de Franca cresceu 18% em 2024. Nossa análise completa sobre as tendências do setor para 2025 está disponível.', imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&h=400&fit=crop', date: '20/03/2025', status: 'published', likes: 54, comments: 8, reach: 890, dayOfMonth: 20 },
  { id: 5, network: 'instagram', caption: '🏡 Casa em condomínio fechado no Alphaville Franca. 280m², 4 suítes, piscina aquecida e churrasqueira. R$ 950.000. Agende sua visita!', imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=400&fit=crop', date: '02/04/2025', status: 'scheduled', likes: 0, comments: 0, reach: 0, dayOfMonth: 2 },
  { id: 6, network: 'facebook', caption: 'Nova sala comercial disponível no Centro de Franca. 80m², 2 banheiros e estacionamento. Ideal para sua empresa!', imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=400&fit=crop', date: '05/04/2025', status: 'scheduled', likes: 0, comments: 0, reach: 0, dayOfMonth: 5 },
  { id: 7, network: 'instagram', caption: 'Depoimento: "A equipe da Lemos foi incrível! Me ajudaram a encontrar o apê perfeito em tempo récorde." — Maria C.', imageUrl: 'https://images.unsplash.com/photo-1543269664-56d93c1b41a6?w=400&h=400&fit=crop', date: '18/03/2025', status: 'published', likes: 198, comments: 34, reach: 2650, dayOfMonth: 18 },
  { id: 8, network: 'linkedin', caption: 'Temos vagas para corretores experientes em Franca e região. Venha fazer parte do time Imobiliária Lemos!', imageUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&h=400&fit=crop', date: '15/03/2025', status: 'published', likes: 76, comments: 19, reach: 1450, dayOfMonth: 15 },
  { id: 9, network: 'instagram', caption: '🎯 Procurando imóvel para investimento? Temos oportunidades únicas com alto potencial de valorização em Franca!', imageUrl: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=400&h=400&fit=crop', date: '10/04/2025', status: 'draft', likes: 0, comments: 0, reach: 0, dayOfMonth: 10 },
  { id: 10, network: 'facebook', caption: '📊 Relatório Imobiliário: os bairros que mais valorizaram em Franca no último trimestre. Confira!', imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop', date: '12/03/2025', status: 'published', likes: 112, comments: 28, reach: 1980, dayOfMonth: 12 },
]

const mockProperties: Property[] = [
  { id: 1, code: 'LEM-0042', title: 'Apto 3q – Jardim Paulista', imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200&h=150&fit=crop' },
  { id: 2, code: 'LEM-0057', title: 'Casa 4 suítes – Jardim Europa', imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=200&h=150&fit=crop' },
  { id: 3, code: 'LEM-0091', title: 'Cobertura – Alto da Boa Vista', imageUrl: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=200&h=150&fit=crop' },
  { id: 4, code: 'LEM-0014', title: 'Casa – Alphaville Franca', imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=200&h=150&fit=crop' },
  { id: 5, code: 'LEM-0031', title: 'Sala Comercial – Centro', imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=150&fit=crop' },
  { id: 6, code: 'LEM-0068', title: 'Flat Studio – Higienópolis', imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200&h=150&fit=crop' },
]

const hashtagSuggestions = [
  '#imoveisfranca', '#francasp', '#imobiliarialemos', '#comprarimóvel',
  '#locação', '#mercadoimobiliario', '#investimento', '#novoimóvel',
  '#apartamento', '#casa', '#condomínio', '#imóveisSP',
  '#francanacidade', '#corretorimóveis', '#comprafácil',
]

const contentTemplates: ContentTemplate[] = [
  {
    id: 1, title: 'Novo Imóvel', emoji: '🏠',
    caption: '✨ Novo imóvel disponível! {titulo} por {preco}. {quartos} quartos, {area}m² no coração de Franca. Agende sua visita agora mesmo!',
    hashtags: ['#novoimóvel', '#imoveisfranca', '#imobiliarialemos', '#comprarimóvel'],
    color: 'border-emerald-500/30 bg-emerald-500/8 text-emerald-400',
  },
  {
    id: 2, title: 'Imóvel Vendido', emoji: '🎉',
    caption: '🎉 Mais um sonho realizado! Hoje entregamos as chaves do {titulo} para nossa cliente. Parabéns pela conquista! É muito gratificante fazer parte desse momento.',
    hashtags: ['#vendido', '#sonhorealizado', '#imobiliarialemos', '#francanacidade'],
    color: 'border-[#d4a843]/30 bg-[#d4a843]/8 text-[#d4a843]',
  },
  {
    id: 3, title: 'Dica do Dia', emoji: '💡',
    caption: '💡 Dica da Imobiliária Lemos: Antes de assinar qualquer contrato, verifique toda a documentação do imóvel e consulte um corretor de confiança. Sua segurança é nossa prioridade!',
    hashtags: ['#dicadoimovel', '#mercadoimobiliario', '#imobiliarialemos', '#imoveisfranca'],
    color: 'border-blue-500/30 bg-blue-500/8 text-blue-400',
  },
  {
    id: 4, title: 'Depoimento de Cliente', emoji: '⭐',
    caption: '⭐ O que nossos clientes dizem sobre a Imobiliária Lemos:\n\n"{depoimento}"\n— {cliente}\n\nSua satisfação é nossa maior recompensa!',
    hashtags: ['#depoimento', '#clientessatisfeitos', '#imobiliarialemos', '#confiance'],
    color: 'border-purple-500/30 bg-purple-500/8 text-purple-400',
  },
  {
    id: 5, title: 'Promoção Especial', emoji: '🔥',
    caption: '🔥 OPORTUNIDADE IMPERDÍVEL! Imóveis selecionados com condições especiais este mês. Entre em contato e saiba mais! Não deixe passar essa chance.',
    hashtags: ['#promoção', '#oportunidade', '#imoveisfranca', '#imobiliarialemos'],
    color: 'border-red-500/30 bg-red-500/8 text-red-400',
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────

const networkConfig: Record<Network, { label: string; icon: React.ElementType; color: string; dotColor: string; charLimit: number }> = {
  instagram: { label: 'Instagram', icon: Instagram, color: 'text-pink-400', dotColor: 'bg-pink-500', charLimit: 2200 },
  facebook: { label: 'Facebook', icon: Facebook, color: 'text-blue-400', dotColor: 'bg-blue-500', charLimit: 63206 },
  linkedin: { label: 'LinkedIn', icon: Linkedin, color: 'text-sky-400', dotColor: 'bg-sky-500', charLimit: 3000 },
}

const statusConfig: Record<PostStatus, { label: string; variant: 'success' | 'warning' | 'secondary' }> = {
  published: { label: 'Publicado', variant: 'success' },
  scheduled: { label: 'Agendado', variant: 'warning' },
  draft: { label: 'Rascunho', variant: 'secondary' },
}

const MONTH_DAYS = 30
const currentMonth = 'Março 2025'

// ── Calendar Grid ──────────────────────────────────────────────────────────

function CalendarGrid({ posts, onDayClick }: { posts: Post[]; onDayClick: (day: number, posts: Post[]) => void }) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const days = Array.from({ length: MONTH_DAYS }, (_, i) => i + 1)
  const firstDayOffset = 5 // March 1 = Saturday (index 5, starting Monday)

  const postsByDay: Record<number, Post[]> = {}
  posts.forEach((p) => {
    if (p.dayOfMonth) {
      if (!postsByDay[p.dayOfMonth]) postsByDay[p.dayOfMonth] = []
      postsByDay[p.dayOfMonth].push(p)
    }
  })

  const handleDay = (day: number) => {
    setSelectedDay(day)
    onDayClick(day, postsByDay[day] || [])
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-foreground/40 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`offset-${i}`} className="h-16 rounded-lg" />
        ))}
        {days.map((day) => {
          const dayPosts = postsByDay[day] || []
          const isSelected = selectedDay === day
          const today = 27 // mock "today"
          const isToday = day === today
          return (
            <div
              key={day}
              onClick={() => handleDay(day)}
              className={cn(
                'h-16 rounded-lg border p-1.5 cursor-pointer transition-all',
                isSelected ? 'border-[#d4a843]/50 bg-[#d4a843]/8' : 'border-navy-800 hover:border-navy-700 hover:bg-navy-800/40',
                isToday && !isSelected && 'border-[#d4a843]/30'
              )}
            >
              <div className={cn('text-[11px] font-semibold mb-1', isToday ? 'text-[#d4a843]' : 'text-foreground/60')}>{day}</div>
              <div className="flex flex-wrap gap-0.5">
                {dayPosts.map((p) => (
                  <span
                    key={p.id}
                    className={cn('w-2 h-2 rounded-full', networkConfig[p.network].dotColor, p.status === 'scheduled' && 'opacity-50')}
                    title={`${networkConfig[p.network].label} – ${p.status}`}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-4 mt-3">
        {Object.entries(networkConfig).map(([key, nc]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={cn('w-2 h-2 rounded-full', nc.dotColor)} />
            <span className="text-xs text-foreground/50">{nc.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-navy-600 border border-navy-500" />
          <span className="text-xs text-foreground/50">Agendado</span>
        </div>
      </div>
    </div>
  )
}

// ── Social Post Preview ────────────────────────────────────────────────────

function PostPreview({ network, caption, imageUrl }: { network: Network; caption: string; imageUrl?: string }) {
  const nc = networkConfig[network]
  const Icon = nc.icon

  if (network === 'instagram') {
    return (
      <div className="w-full max-w-[280px] bg-[#0a0e1a] border border-navy-700 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-navy-800">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#d4a843] to-[#b8860b] flex items-center justify-center text-navy-950 font-bold text-[10px]">IL</div>
          <div>
            <p className="text-xs font-semibold text-foreground">imobiliarialemos</p>
            <p className="text-[10px] text-foreground/40">Franca, SP</p>
          </div>
          <Icon className={cn('ml-auto h-4 w-4', nc.color)} />
        </div>
        {imageUrl && <img src={imageUrl} alt="" className="w-full aspect-square object-cover" />}
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-4 w-4 text-foreground/60" />
            <MessageSquare className="h-4 w-4 text-foreground/60" />
            <Send className="h-4 w-4 text-foreground/60" />
          </div>
          <p className="text-[11px] text-foreground/80 line-clamp-3">{caption || <span className="text-foreground/30 italic">Escreva uma legenda...</span>}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[280px] bg-[#0a0e1a] border border-navy-700 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-navy-800">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#d4a843] to-[#b8860b] flex items-center justify-center text-navy-950 font-bold text-[10px]">IL</div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-foreground">Imobiliária Lemos</p>
          <p className="text-[10px] text-foreground/40">Agora</p>
        </div>
        <Icon className={cn('h-4 w-4', nc.color)} />
      </div>
      <div className="px-3 py-2.5">
        <p className="text-[11px] text-foreground/80 mb-2 line-clamp-3">{caption || <span className="text-foreground/30 italic">Escreva uma legenda...</span>}</p>
      </div>
      {imageUrl && <img src={imageUrl} alt="" className="w-full aspect-video object-cover" />}
      <div className="flex items-center gap-4 px-3 py-2 border-t border-navy-800">
        <button className="flex items-center gap-1 text-[10px] text-foreground/50 hover:text-foreground/80"><Heart className="h-3 w-3" />Curtir</button>
        <button className="flex items-center gap-1 text-[10px] text-foreground/50 hover:text-foreground/80"><MessageSquare className="h-3 w-3" />Comentar</button>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function SocialMedia() {
  const calendarPosts = posts
  const [selectedDayPosts, setSelectedDayPosts] = useState<Post[]>([])
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  // Composer state
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [selectedNetworks, setSelectedNetworks] = useState<Set<Network>>(new Set(['instagram']))
  const [caption, setCaption] = useState('')
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([])
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('later')
  const [generatingAI, setGeneratingAI] = useState(false)
  const [networkFilter, setNetworkFilter] = useState<Network | 'all'>('all')

  const toggleNetwork = (n: Network) => {
    setSelectedNetworks((prev) => {
      const next = new Set(prev)
      next.has(n) ? next.delete(n) : next.add(n)
      return next
    })
  }

  const toggleHashtag = (tag: string) => {
    setSelectedHashtags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const generateAI = () => {
    setGeneratingAI(true)
    const prop = mockProperties.find((p) => p.code === selectedProperty)
    setTimeout(() => {
      setGeneratingAI(false)
      setCaption(
        `✨ ${prop ? `Novo imóvel exclusivo: ${prop.title}` : 'Novo imóvel disponível'}!\n\nLocalizado em uma das áreas mais valorizadas de Franca, este imóvel reúne conforto, sofisticação e excelente localização. Entre em contato com nossa equipe e agende uma visita hoje mesmo!\n\n📍 Franca, SP\n📞 (16) 3000-0000`
      )
      setSelectedHashtags(['#imoveisfranca', '#imobiliarialemos', '#novoimóvel', '#francasp'])
    }, 1800)
  }

  const handlePropertySelect = (code: string) => {
    setSelectedProperty(code)
    const prop = mockProperties.find((p) => p.code === code)
    if (prop) setSelectedImage(prop.imageUrl)
  }

  const handleDayClick = (day: number, dayPosts: Post[]) => {
    setSelectedDay(day)
    setSelectedDayPosts(dayPosts)
  }

  const filteredPublished = posts.filter((p) => {
    const matchNet = networkFilter === 'all' || p.network === networkFilter
    const matchStatus = p.status === 'published'
    return matchNet && matchStatus
  })

  const stats = {
    totalReach: posts.filter(p => p.status === 'published').reduce((s, p) => s + p.reach, 0),
    totalLikes: posts.filter(p => p.status === 'published').reduce((s, p) => s + p.likes, 0),
    totalPosts: posts.filter(p => p.status === 'published').length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#f8f6f0]">Redes Sociais</h1>
            <p className="text-sm text-foreground/50 mt-0.5 font-sans">Gerencie sua presença digital em um só lugar</p>
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="flex flex-wrap gap-3">
          {[
            { network: 'instagram' as Network, username: '@imobiliarialemos', followers: '4.2k', connected: true },
            { network: 'facebook' as Network, username: 'Imobiliária Lemos', followers: '8.7k', connected: true },
            { network: 'linkedin' as Network, username: 'Imobiliária Lemos Ltda.', followers: '1.1k', connected: false },
          ].map((account) => {
            const nc = networkConfig[account.network]
            const Icon = nc.icon
            return (
              <div key={account.network} className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all',
                account.connected ? 'border-navy-700 bg-navy-900/50' : 'border-navy-800/60 bg-navy-950/50'
              )}>
                <div className={cn('p-2 rounded-lg', account.connected ? 'bg-navy-800' : 'bg-navy-900')}>
                  <Icon className={cn('h-5 w-5', account.connected ? nc.color : 'text-foreground/30')} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className={cn('text-sm font-semibold', account.connected ? 'text-foreground' : 'text-foreground/40')}>{nc.label}</p>
                    {account.connected
                      ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      : <span className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
                    }
                  </div>
                  <p className="text-xs text-foreground/50">{account.connected ? `${account.username} · ${account.followers} seguidores` : 'Não conectado'}</p>
                </div>
                {!account.connected && (
                  <Button size="sm" variant="secondary" className="ml-2 gap-1 text-xs h-7">
                    <Link2 className="h-3 w-3" />Conectar
                  </Button>
                )}
              </div>
            )
          })}

          {/* Quick stats */}
          <div className="ml-auto flex items-center gap-3">
            {[
              { label: 'Alcance Total', value: stats.totalReach.toLocaleString('pt-BR'), icon: Eye },
              { label: 'Curtidas', value: stats.totalLikes.toLocaleString('pt-BR'), icon: Heart },
              { label: 'Agendados', value: stats.scheduled, icon: Calendar },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div key={s.label} className="text-center px-4 py-2 rounded-lg bg-navy-900/50 border border-navy-800">
                  <div className="flex items-center justify-center gap-1 mb-0.5">
                    <Icon className="h-3 w-3 text-[#d4a843]" />
                    <p className="text-sm font-bold text-[#d4a843]">{s.value}</p>
                  </div>
                  <p className="text-[10px] text-foreground/40">{s.label}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="calendar">
          <TabsList>
            <TabsTrigger value="calendar" className="gap-2"><Calendar className="h-3.5 w-3.5" />Calendário</TabsTrigger>
            <TabsTrigger value="composer" className="gap-2"><Plus className="h-3.5 w-3.5" />Criar Post</TabsTrigger>
            <TabsTrigger value="published" className="gap-2"><LayoutGrid className="h-3.5 w-3.5" />Publicados</TabsTrigger>
            <TabsTrigger value="templates" className="gap-2"><Zap className="h-3.5 w-3.5" />Templates</TabsTrigger>
          </TabsList>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mt-2">
              <Card className="xl:col-span-2">
                <CardHeader className="pb-4 flex-row items-center justify-between">
                  <CardTitle className="text-base font-sans font-semibold">{currentMonth}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <CalendarGrid posts={calendarPosts} onDayClick={handleDayClick} />
                </CardContent>
              </Card>
              <div className="space-y-4">
                {selectedDay ? (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-sans font-semibold text-foreground/80">
                        Posts em {selectedDay}/03/2025
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedDayPosts.length === 0 ? (
                        <div className="text-center py-6">
                          <Calendar className="h-6 w-6 text-foreground/20 mx-auto mb-2" />
                          <p className="text-xs text-foreground/40">Nenhum post neste dia</p>
                          <Button size="sm" variant="secondary" className="mt-3 gap-1 text-xs">
                            <Plus className="h-3 w-3" />Criar post
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedDayPosts.map((p) => {
                            const nc = networkConfig[p.network]
                            const Icon = nc.icon
                            const sc = statusConfig[p.status]
                            return (
                              <div key={p.id} className="p-3 rounded-lg border border-navy-700 bg-navy-800/40">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <Icon className={cn('h-3.5 w-3.5', nc.color)} />
                                  <span className="text-xs font-semibold text-foreground/80">{nc.label}</span>
                                  <Badge variant={sc.variant} className="text-[10px] ml-auto">{sc.label}</Badge>
                                </div>
                                <p className="text-xs text-foreground/60 line-clamp-2">{p.caption}</p>
                                {p.status === 'published' && (
                                  <div className="flex items-center gap-3 mt-2 text-[10px] text-foreground/40">
                                    <span className="flex items-center gap-1"><Heart className="h-2.5 w-2.5" />{p.likes}</span>
                                    <span className="flex items-center gap-1"><Eye className="h-2.5 w-2.5" />{p.reach.toLocaleString('pt-BR')}</span>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Calendar className="h-8 w-8 text-foreground/20 mx-auto mb-2" />
                      <p className="text-sm text-foreground/40">Clique em um dia para ver os posts</p>
                    </CardContent>
                  </Card>
                )}

                {/* Upcoming */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-sans font-semibold text-foreground/80">Próximos Agendamentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {posts.filter(p => p.status === 'scheduled').map((p) => {
                        const nc = networkConfig[p.network]
                        const Icon = nc.icon
                        return (
                          <div key={p.id} className="flex items-center gap-2 p-2 rounded-md bg-navy-800/40">
                            <Icon className={cn('h-3.5 w-3.5 shrink-0', nc.color)} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-foreground/80 truncate">{p.caption.slice(0, 40)}...</p>
                              <p className="text-[10px] text-foreground/40">{p.date}</p>
                            </div>
                            <Clock className="h-3 w-3 text-amber-400 shrink-0" />
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Composer Tab */}
          <TabsContent value="composer">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mt-2">
              {/* Left: Form */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-sans font-semibold">Criar Nova Publicação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Property selector */}
                    <div>
                      <label className="text-xs font-medium text-foreground/70 mb-1.5 block">Imóvel (opcional)</label>
                      <Select value={selectedProperty} onValueChange={handlePropertySelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar imóvel..." />
                        </SelectTrigger>
                        <SelectContent>
                          {mockProperties.map((p) => (
                            <SelectItem key={p.code} value={p.code}>
                              {p.code} – {p.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Networks */}
                    <div>
                      <label className="text-xs font-medium text-foreground/70 mb-2 block">Publicar em</label>
                      <div className="flex gap-2">
                        {(Object.keys(networkConfig) as Network[]).map((n) => {
                          const nc = networkConfig[n]
                          const Icon = nc.icon
                          const active = selectedNetworks.has(n)
                          return (
                            <button
                              key={n}
                              onClick={() => toggleNetwork(n)}
                              className={cn(
                                'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                                active
                                  ? `border-current ${nc.color} bg-current/10`
                                  : 'border-navy-700 text-foreground/40 hover:border-navy-600 hover:text-foreground/60'
                              )}
                            >
                              <Icon className="h-4 w-4" />
                              <span className="hidden sm:block">{nc.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* AI Caption */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-foreground/70">Legenda</label>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 gap-1.5 text-xs border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                          onClick={generateAI}
                          disabled={generatingAI}
                        >
                          {generatingAI
                            ? <><Loader2 className="h-3 w-3 animate-spin" />Gerando...</>
                            : <><Sparkles className="h-3 w-3" />Gerar com IA</>
                          }
                        </Button>
                      </div>
                      <div className="relative">
                        <textarea
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          rows={5}
                          placeholder="Escreva ou gere uma legenda com IA..."
                          className="w-full rounded-md border border-navy-700 bg-navy-800 px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] resize-none transition-all hover:border-navy-600"
                        />
                        {selectedNetworks.size > 0 && (
                          <div className="absolute bottom-2 right-3 flex gap-2">
                            {[...selectedNetworks].map((n) => {
                              const nc = networkConfig[n]
                              const over = caption.length > nc.charLimit
                              return (
                                <span key={n} className={cn('text-[10px]', over ? 'text-red-400' : 'text-foreground/30')}>
                                  {nc.label[0]}: {caption.length}/{nc.charLimit}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hashtags */}
                    <div>
                      <label className="text-xs font-medium text-foreground/70 mb-2 flex items-center gap-1.5 block"><Hash className="h-3 w-3" />Hashtags sugeridas</label>
                      <div className="flex flex-wrap gap-1.5">
                        {hashtagSuggestions.map((tag) => {
                          const active = selectedHashtags.includes(tag)
                          return (
                            <button
                              key={tag}
                              onClick={() => toggleHashtag(tag)}
                              className={cn(
                                'text-xs px-2.5 py-1 rounded-full border font-mono transition-all',
                                active
                                  ? 'bg-[#d4a843]/15 border-[#d4a843]/40 text-[#d4a843]'
                                  : 'bg-navy-800 border-navy-700 text-foreground/50 hover:border-navy-600 hover:text-foreground/70'
                              )}
                            >
                              {tag}
                            </button>
                          )
                        })}
                      </div>
                      {selectedHashtags.length > 0 && (
                        <p className="text-xs text-foreground/40 mt-2">{selectedHashtags.join(' ')}</p>
                      )}
                    </div>

                    {/* Image selector */}
                    {selectedProperty && (
                      <div>
                        <label className="text-xs font-medium text-foreground/70 mb-2 flex items-center gap-1.5 block"><Image className="h-3 w-3" />Fotos do imóvel</label>
                        <div className="grid grid-cols-3 gap-2">
                          {mockProperties.map((p) => (
                            <button
                              key={p.code}
                              onClick={() => setSelectedImage(p.imageUrl)}
                              className={cn(
                                'relative rounded-lg overflow-hidden aspect-square border-2 transition-all',
                                selectedImage === p.imageUrl ? 'border-[#d4a843]' : 'border-transparent opacity-60 hover:opacity-90'
                              )}
                            >
                              <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                              {selectedImage === p.imageUrl && (
                                <div className="absolute inset-0 bg-[#d4a843]/20 flex items-center justify-center">
                                  <CheckCircle2 className="h-5 w-5 text-[#d4a843]" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Schedule */}
                    <div className="flex items-center gap-4 p-3 rounded-lg bg-navy-800/40 border border-navy-700">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="postSchedule" value="later" checked={scheduleMode === 'later'} onChange={() => setScheduleMode('later')} className="accent-[#d4a843]" />
                        <span className="text-sm text-foreground/80">Agendar</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="postSchedule" value="now" checked={scheduleMode === 'now'} onChange={() => setScheduleMode('now')} className="accent-[#d4a843]" />
                        <span className="text-sm text-foreground/80">Publicar agora</span>
                      </label>
                      {scheduleMode === 'later' && (
                        <input type="datetime-local" className="ml-auto h-8 rounded-md border border-navy-700 bg-navy-800 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#d4a843]" />
                      )}
                    </div>

                    <button className="w-full h-11 rounded-lg font-semibold text-sm font-sans bg-gradient-to-r from-[#f5d97a] via-[#d4a017] to-[#b8860b] text-navy-950 hover:shadow-lg hover:shadow-[#d4a843]/25 hover:brightness-110 transition-all flex items-center justify-center gap-2">
                      <Send className="h-4 w-4" />
                      {scheduleMode === 'now' ? 'Publicar Agora' : 'Agendar Post'}
                    </button>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Preview */}
              <div>
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-sans font-semibold">Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 justify-center">
                      {[...selectedNetworks].map((n) => (
                        <div key={n}>
                          <p className={cn('text-xs font-semibold mb-2 text-center', networkConfig[n].color)}>
                            {networkConfig[n].label}
                          </p>
                          <PostPreview network={n} caption={caption + (selectedHashtags.length ? '\n\n' + selectedHashtags.join(' ') : '')} imageUrl={selectedImage} />
                        </div>
                      ))}
                      {selectedNetworks.size === 0 && (
                        <div className="text-center py-8 text-foreground/30">
                          <Eye className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">Selecione uma rede para ver o preview</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Published Tab */}
          <TabsContent value="published">
            <div className="mt-2 space-y-4">
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-foreground/40" />
                <div className="flex gap-1.5">
                  {(['all', 'instagram', 'facebook', 'linkedin'] as const).map((n) => {
                    const isAll = n === 'all'
                    const nc = isAll ? null : networkConfig[n]
                    const Icon = isAll ? null : nc!.icon
                    return (
                      <button
                        key={n}
                        onClick={() => setNetworkFilter(n)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all',
                          networkFilter === n
                            ? isAll ? 'border-[#d4a843]/40 bg-[#d4a843]/10 text-[#d4a843]' : `border-current ${nc!.color} bg-current/10`
                            : 'border-navy-700 text-foreground/50 hover:border-navy-600'
                        )}
                      >
                        {Icon && <Icon className="h-3 w-3" />}
                        {isAll ? 'Todos' : nc!.label}
                      </button>
                    )
                  })}
                </div>
                <Badge variant="secondary" className="ml-auto">{filteredPublished.length} posts</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPublished.map((p) => {
                  const nc = networkConfig[p.network]
                  const Icon = nc.icon
                  return (
                    <Card key={p.id} className="overflow-hidden">
                      <div className="relative aspect-square bg-navy-800">
                        <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2">
                          <span className={cn('flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-black/70 border border-white/10', nc.color)}>
                            <Icon className="h-2.5 w-2.5" />
                            {nc.label}
                          </span>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <p className="text-xs text-foreground/70 line-clamp-2 mb-2">{p.caption}</p>
                        <div className="flex items-center justify-between text-[10px] text-foreground/40">
                          <span className="flex items-center gap-1"><Heart className="h-2.5 w-2.5 text-red-400" />{p.likes}</span>
                          <span className="flex items-center gap-1"><MessageSquare className="h-2.5 w-2.5 text-blue-400" />{p.comments}</span>
                          <span className="flex items-center gap-1"><Eye className="h-2.5 w-2.5 text-emerald-400" />{p.reach.toLocaleString('pt-BR')}</span>
                          <span className="text-foreground/30">{p.date}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {contentTemplates.map((t) => (
                <Card key={t.id} className="group cursor-pointer hover:border-[#d4a843]/40 transition-all">
                  <CardContent className="p-5">
                    <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-3', t.color)}>
                      <span className="text-lg">{t.emoji}</span>
                      <span className="text-sm font-semibold">{t.title}</span>
                    </div>
                    <p className="text-xs text-foreground/60 line-clamp-3 mb-3">{t.caption}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {t.hashtags.map((tag) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-navy-800 border border-navy-700 text-foreground/50 font-mono">{tag}</span>
                      ))}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full text-xs gap-1.5 group-hover:border-[#d4a843]/40 group-hover:text-[#d4a843]"
                      onClick={() => setCaption(t.caption)}
                    >
                      <Zap className="h-3 w-3" />
                      Usar este template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
