import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  MessageCircle,
  Mail,
  Search,
  Filter,
  Building2,
  User,
  Calendar,
  RefreshCw,
  Edit3,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

type RenewalStatus = 'pendente' | 'contatado' | 'renovado' | 'saiu'
type ContactChannel = 'phone' | 'whatsapp' | 'email'
type InterestType = 'venda' | 'locação'
type IntervalDays = '30' | '60' | '90'

interface Property {
  id: number
  code: string
  title: string
  address: string
  city: string
  thumbnail: string
  owner: string
  ownerPhone: string
  lastContact: string
  lastContactChannel: ContactChannel
  nextContact: string
  interval: IntervalDays
  status: RenewalStatus
  interestType: InterestType
  selected?: boolean
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const properties: Property[] = [
  {
    id: 1,
    code: 'LEM-0042',
    title: 'Apto 3 quartos – Jardim Paulista',
    address: 'R. das Acácias, 220, Jardim Paulista',
    city: 'Franca',
    thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=80&h=60&fit=crop',
    owner: 'Roberto Ferreira',
    ownerPhone: '(16) 98765-4321',
    lastContact: '15/02/2025',
    lastContactChannel: 'whatsapp',
    nextContact: '15/03/2025',
    interval: '30',
    status: 'pendente',
    interestType: 'venda',
  },
  {
    id: 2,
    code: 'LEM-0057',
    title: 'Casa 4 suítes – Jardim Europa',
    address: 'Av. Europa, 1450, Jardim Europa',
    city: 'Franca',
    thumbnail: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=80&h=60&fit=crop',
    owner: 'Márcia Souza',
    ownerPhone: '(16) 99123-4567',
    lastContact: '20/02/2025',
    lastContactChannel: 'phone',
    nextContact: '20/04/2025',
    interval: '60',
    status: 'contatado',
    interestType: 'venda',
  },
  {
    id: 3,
    code: 'LEM-0031',
    title: 'Sala Comercial – Centro',
    address: 'R. Barão de Franca, 88, Centro',
    city: 'Franca',
    thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=80&h=60&fit=crop',
    owner: 'Paulo Mendes',
    ownerPhone: '(16) 97654-3210',
    lastContact: '10/01/2025',
    lastContactChannel: 'email',
    nextContact: '10/04/2025',
    interval: '90',
    status: 'renovado',
    interestType: 'locação',
  },
  {
    id: 4,
    code: 'LEM-0068',
    title: 'Flat Studio – Higienópolis',
    address: 'R. Campos Sales, 340, Higienópolis',
    city: 'Franca',
    thumbnail: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=80&h=60&fit=crop',
    owner: 'Carla Almeida',
    ownerPhone: '(16) 98001-2345',
    lastContact: '05/03/2025',
    lastContactChannel: 'whatsapp',
    nextContact: '05/04/2025',
    interval: '30',
    status: 'pendente',
    interestType: 'locação',
  },
  {
    id: 5,
    code: 'LEM-0014',
    title: 'Casa em Condomínio – Alphaville',
    address: 'Cond. Alphaville, Casa 12',
    city: 'Franca',
    thumbnail: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=80&h=60&fit=crop',
    owner: 'Fernando Lima',
    ownerPhone: '(16) 99876-5432',
    lastContact: '28/01/2025',
    lastContactChannel: 'phone',
    nextContact: '28/03/2025',
    interval: '60',
    status: 'saiu',
    interestType: 'venda',
  },
  {
    id: 6,
    code: 'LEM-0079',
    title: 'Apto 2 quartos – Vila Maria',
    address: 'R. Ipiranga, 560, Vila Maria',
    city: 'Franca',
    thumbnail: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=80&h=60&fit=crop',
    owner: 'Sílvia Rodrigues',
    ownerPhone: '(16) 97001-8899',
    lastContact: '12/03/2025',
    lastContactChannel: 'whatsapp',
    nextContact: '12/04/2025',
    interval: '30',
    status: 'pendente',
    interestType: 'locação',
  },
  {
    id: 7,
    code: 'LEM-0023',
    title: 'Terreno 450m² – Parque Industrial',
    address: 'Av. Dr. Gurgel, 2200',
    city: 'Franca',
    thumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=80&h=60&fit=crop',
    owner: 'João Carlos Pinto',
    ownerPhone: '(16) 98765-1234',
    lastContact: '01/02/2025',
    lastContactChannel: 'email',
    nextContact: '01/05/2025',
    interval: '90',
    status: 'contatado',
    interestType: 'venda',
  },
  {
    id: 8,
    code: 'LEM-0091',
    title: 'Cobertura Duplex – Alto da Boa Vista',
    address: 'R. das Orquídeas, 88, Boa Vista',
    city: 'Franca',
    thumbnail: 'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=80&h=60&fit=crop',
    owner: 'Beatriz Nunes',
    ownerPhone: '(16) 99322-7766',
    lastContact: '22/02/2025',
    lastContactChannel: 'phone',
    nextContact: '22/04/2025',
    interval: '60',
    status: 'pendente',
    interestType: 'venda',
  },
  {
    id: 9,
    code: 'LEM-0055',
    title: 'Loja 80m² – Av. Dr. Gurgel',
    address: 'Av. Dr. Gurgel, 1100, Centro',
    city: 'Franca',
    thumbnail: 'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=80&h=60&fit=crop',
    owner: 'Marcos Vinícius',
    ownerPhone: '(16) 98401-5566',
    lastContact: '18/03/2025',
    lastContactChannel: 'whatsapp',
    nextContact: '18/04/2025',
    interval: '30',
    status: 'pendente',
    interestType: 'locação',
  },
  {
    id: 10,
    code: 'LEM-0033',
    title: 'Casa 3 quartos – Jardim Girassol',
    address: 'R. Girassol, 190, Jardim Girassol',
    city: 'Franca',
    thumbnail: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=80&h=60&fit=crop',
    owner: 'Ana Cláudia Reis',
    ownerPhone: '(16) 99100-4422',
    lastContact: '05/01/2025',
    lastContactChannel: 'phone',
    nextContact: '05/04/2025',
    interval: '90',
    status: 'renovado',
    interestType: 'locação',
  },
  {
    id: 11,
    code: 'LEM-0047',
    title: 'Apto 1 quarto – Vila Aparecida',
    address: 'R. São João, 450, Vila Aparecida',
    city: 'Franca',
    thumbnail: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=80&h=60&fit=crop',
    owner: 'Henrique Barbosa',
    ownerPhone: '(16) 97600-3344',
    lastContact: '10/03/2025',
    lastContactChannel: 'email',
    nextContact: '10/04/2025',
    interval: '30',
    status: 'pendente',
    interestType: 'locação',
  },
  {
    id: 12,
    code: 'LEM-0062',
    title: 'Galpão 1200m² – Distrito Industrial',
    address: 'Rua C, Quadra 7, Distrito Industrial',
    city: 'Franca',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=80&h=60&fit=crop',
    owner: 'Indústrias Franca Ltda.',
    ownerPhone: '(16) 3321-9900',
    lastContact: '15/01/2025',
    lastContactChannel: 'email',
    nextContact: '15/04/2025',
    interval: '90',
    status: 'contatado',
    interestType: 'locação',
  },
  {
    id: 13,
    code: 'LEM-0088',
    title: 'Chácara 5000m² – Zona Rural',
    address: 'Rod. Franca-Ribeirão, Km 12',
    city: 'Franca',
    thumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=80&h=60&fit=crop',
    owner: 'Ricardo Palhares',
    ownerPhone: '(16) 98502-1177',
    lastContact: '20/03/2025',
    lastContactChannel: 'whatsapp',
    nextContact: '20/04/2025',
    interval: '30',
    status: 'pendente',
    interestType: 'venda',
  },
  {
    id: 14,
    code: 'LEM-0019',
    title: 'Apto 4 quartos – Res. Solar',
    address: 'Av. Champagnat, 880, Res. Solar',
    city: 'Franca',
    thumbnail: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=80&h=60&fit=crop',
    owner: 'Luísa Cavalcante',
    ownerPhone: '(16) 99712-0033',
    lastContact: '07/02/2025',
    lastContactChannel: 'phone',
    nextContact: '07/04/2025',
    interval: '60',
    status: 'saiu',
    interestType: 'venda',
  },
  {
    id: 15,
    code: 'LEM-0074',
    title: 'Sobrado 3 quartos – Vila Nova',
    address: 'R. Rui Barbosa, 120, Vila Nova',
    city: 'Franca',
    thumbnail: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=80&h=60&fit=crop',
    owner: 'Gustavo Morais',
    ownerPhone: '(16) 98300-6677',
    lastContact: '25/03/2025',
    lastContactChannel: 'whatsapp',
    nextContact: '25/04/2025',
    interval: '30',
    status: 'pendente',
    interestType: 'venda',
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function parseDate(dateStr: string): Date {
  const [d, m, y] = dateStr.split('/').map(Number)
  return new Date(y, m - 1, d)
}

function nextContactColor(dateStr: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = parseDate(dateStr)
  d.setHours(0, 0, 0, 0)
  if (d < today) return 'text-red-400'
  if (d.getTime() === today.getTime()) return 'text-amber-400'
  return 'text-emerald-400'
}

const statusConfig: Record<RenewalStatus, { label: string; variant: 'warning' | 'info' | 'success' | 'destructive' }> = {
  pendente: { label: 'Pendente', variant: 'warning' },
  contatado: { label: 'Contatado', variant: 'info' },
  renovado: { label: 'Renovado', variant: 'success' },
  saiu: { label: 'Saiu do mercado', variant: 'destructive' },
}

const channelIcons: Record<ContactChannel, React.ReactNode> = {
  phone: <Phone className="h-3.5 w-3.5 text-blue-400" />,
  whatsapp: <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />,
  email: <Mail className="h-3.5 w-3.5 text-purple-400" />,
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function Renewals() {
  const [data, setData] = useState<Property[]>(properties)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [sortField, setSortField] = useState<'nextContact' | 'code'>('nextContact')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Contact modal
  const [contactProp, setContactProp] = useState<Property | null>(null)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [msgTemplate, setMsgTemplate] = useState('')

  // Template editor
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false)
  const [renewalTemplate, setRenewalTemplate] = useState(
    'Olá {nome}! Sou da Imobiliária Lemos. Gostaríamos de confirmar a disponibilidade do imóvel {codigo} - {endereco}. O imóvel ainda está disponível para {tipo}?'
  )

  const openContact = (p: Property) => {
    setContactProp(p)
    const msg = renewalTemplate
      .replace('{nome}', p.owner)
      .replace('{codigo}', p.code)
      .replace('{endereco}', p.address)
      .replace('{tipo}', p.interestType)
    setMsgTemplate(msg)
    setContactModalOpen(true)
  }

  const markRenewed = (id: number) => {
    setData((prev) => prev.map((p) => p.id === id ? { ...p, status: 'renovado' as RenewalStatus } : p))
  }

  const updateInterval = (id: number, val: IntervalDays) => {
    setData((prev) => prev.map((p) => p.id === id ? { ...p, interval: val } : p))
  }

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((p) => p.id)))
    }
  }

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filtered = data
    .filter((p) => {
      const q = search.toLowerCase()
      const matchSearch = !q || p.code.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q) || p.title.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || p.status === statusFilter
      return matchSearch && matchStatus
    })
    .sort((a, b) => {
      if (sortField === 'nextContact') {
        const diff = parseDate(a.nextContact).getTime() - parseDate(b.nextContact).getTime()
        return sortDir === 'asc' ? diff : -diff
      }
      return sortDir === 'asc' ? a.code.localeCompare(b.code) : b.code.localeCompare(a.code)
    })

  const stats = {
    pendente: data.filter((p) => p.status === 'pendente').length,
    contatado: data.filter((p) => p.status === 'contatado').length,
    renovado: data.filter((p) => p.status === 'renovado').length,
    saiu: data.filter((p) => p.status === 'saiu').length,
  }

  const urgentCount = data.filter((p) => {
    if (p.status !== 'pendente') return false
    const today = new Date()
    const d = parseDate(p.nextContact)
    const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    return diff <= 7
  }).length

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    sortField === field
      ? sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      : <ChevronDown className="h-3 w-3 opacity-30" />
  )

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#f8f6f0]">Renovações</h1>
            <p className="text-sm text-foreground/50 mt-0.5 font-sans">Gerencie o contato periódico com proprietários</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setTemplateEditorOpen(true)}
          >
            <Edit3 className="h-3.5 w-3.5" />
            Editar Template
          </Button>
        </div>

        {/* Alert banner */}
        {urgentCount > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/8">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300 font-medium">
              <span className="font-bold">{urgentCount} imóveis</span> precisam de contato nos próximos 7 dias
            </p>
            <Button size="sm" variant="secondary" className="ml-auto border-amber-500/40 text-amber-400 hover:bg-amber-500/10 shrink-0">
              Ver urgentes
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Pendentes', value: stats.pendente, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Contatados este mês', value: stats.contatado, icon: Phone, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
            { label: 'Renovados', value: stats.renovado, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Saíram do mercado', value: stats.saiu, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
          ].map((s) => {
            const Icon = s.icon
            return (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn('p-2.5 rounded-lg border', s.bg)}>
                    <Icon className={cn('h-5 w-5', s.color)} />
                  </div>
                  <div>
                    <p className={cn('text-2xl font-display font-bold', s.color)}>{s.value}</p>
                    <p className="text-xs text-foreground/50 font-sans">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filters + Bulk */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por código ou proprietário..."
              leftIcon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-foreground/40" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="contatado">Contatado</SelectItem>
                <SelectItem value="renovado">Renovado</SelectItem>
                <SelectItem value="saiu">Saiu do mercado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#d4a843]/10 border border-[#d4a843]/30">
              <span className="text-xs text-[#d4a843] font-medium">{selected.size} selecionados</span>
              <Button size="sm" className="h-7 gap-1 text-xs">
                <MessageCircle className="h-3 w-3" />
                WhatsApp em massa
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-navy-800 bg-navy-900/50">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll}
                      className="accent-[#d4a843] cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button className="flex items-center gap-1 text-xs font-semibold text-foreground/40 uppercase tracking-wider hover:text-foreground/70" onClick={() => handleSort('code')}>
                      Imóvel <SortIcon field="code" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider">Proprietário</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider">Último Contato</th>
                  <th className="px-4 py-3 text-left">
                    <button className="flex items-center gap-1 text-xs font-semibold text-foreground/40 uppercase tracking-wider hover:text-foreground/70" onClick={() => handleSort('nextContact')}>
                      Próximo Contato <SortIcon field="nextContact" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider">Intervalo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const sc = statusConfig[p.status]
                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        'border-b border-navy-800/50 hover:bg-navy-800/20 transition-colors',
                        selected.has(p.id) && 'bg-[#d4a843]/5',
                        i % 2 !== 0 && 'bg-navy-900/20'
                      )}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="accent-[#d4a843] cursor-pointer"
                        />
                      </td>

                      {/* Property */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-14 h-10 rounded-md overflow-hidden shrink-0 bg-navy-800">
                            <img
                              src={p.thumbnail}
                              alt={p.title}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-foreground/20" />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-mono font-semibold text-[#d4a843]">{p.code}</p>
                            <p className="text-sm font-medium text-foreground/90 truncate max-w-[160px]">{p.title}</p>
                          </div>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-foreground/30 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground/90">{p.owner}</p>
                            <p className="text-xs text-foreground/50">{p.ownerPhone}</p>
                          </div>
                        </div>
                      </td>

                      {/* Last Contact */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {channelIcons[p.lastContactChannel]}
                          <span className="text-xs text-foreground/60">{p.lastContact}</span>
                        </div>
                      </td>

                      {/* Next Contact */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-foreground/30" />
                          <span className={cn('text-sm font-semibold', nextContactColor(p.nextContact))}>
                            {p.nextContact}
                          </span>
                        </div>
                      </td>

                      {/* Interval */}
                      <td className="px-4 py-3">
                        <Select
                          value={p.interval}
                          onValueChange={(v) => updateInterval(p.id, v as IntervalDays)}
                        >
                          <SelectTrigger className="h-8 w-20 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 dias</SelectItem>
                            <SelectItem value="60">60 dias</SelectItem>
                            <SelectItem value="90">90 dias</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <Badge variant={sc.variant} className="text-xs whitespace-nowrap">{sc.label}</Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            title="WhatsApp"
                            onClick={() => openContact(p)}
                            className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </button>
                          <button
                            title="Ligar"
                            onClick={() => window.open(`tel:${p.ownerPhone.replace(/\D/g, '')}`, '_self')}
                            className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors"
                          >
                            <Phone className="h-3.5 w-3.5" />
                          </button>
                          {p.status !== 'renovado' && (
                            <button
                              title="Marcar como renovado"
                              onClick={() => markRenewed(p.id)}
                              className="p-1.5 rounded-md bg-[#d4a843]/10 border border-[#d4a843]/30 text-[#d4a843] hover:bg-[#d4a843]/20 transition-colors"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-foreground/40">
              <Building2 className="h-8 w-8 mb-2" />
              <p className="text-sm">Nenhum imóvel encontrado</p>
            </div>
          )}
        </Card>

        {/* Contact Modal */}
        <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-emerald-400" />
                Mensagem WhatsApp
              </DialogTitle>
            </DialogHeader>
            {contactProp && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-navy-800/60 border border-navy-700">
                  <User className="h-4 w-4 text-foreground/40" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{contactProp.owner}</p>
                    <p className="text-xs text-foreground/50">{contactProp.ownerPhone} · {contactProp.code}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/70 mb-1.5 block">Mensagem</label>
                  <textarea
                    value={msgTemplate}
                    onChange={(e) => setMsgTemplate(e.target.value)}
                    rows={5}
                    className="w-full rounded-md border border-navy-700 bg-navy-800 px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] resize-none transition-all"
                  />
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setContactModalOpen(false)}>Cancelar</Button>
              <Button
                className="gap-2"
                onClick={() => {
                  if (contactProp) {
                    const phone = contactProp.ownerPhone.replace(/\D/g, '')
                    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(msgTemplate)}`
                    window.open(url, '_blank')
                    setContactModalOpen(false)
                  }
                }}
              >
                <Send className="h-4 w-4" />
                Abrir no WhatsApp
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Template Editor Modal */}
        <Dialog open={templateEditorOpen} onOpenChange={setTemplateEditorOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-[#d4a843]" />
                Template de Renovação
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-xs text-foreground/50">Variáveis disponíveis: <span className="text-[#d4a843] font-mono">{'{nome}'} {'{codigo}'} {'{endereco}'} {'{tipo}'}</span></p>
              <textarea
                value={renewalTemplate}
                onChange={(e) => setRenewalTemplate(e.target.value)}
                rows={5}
                className="w-full rounded-md border border-navy-700 bg-navy-800 px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843] resize-none"
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setTemplateEditorOpen(false)}>Cancelar</Button>
              <Button onClick={() => setTemplateEditorOpen(false)}>Salvar Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
