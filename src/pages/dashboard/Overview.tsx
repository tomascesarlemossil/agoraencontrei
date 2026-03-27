import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Building2, Users, Handshake, DollarSign, TrendingUp,
  Plus, MessageSquare, Clock, MapPin, Phone, ChevronRight,
  UserPlus, Send, Eye, CheckCircle, AlertCircle, Star, Activity,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const monthlyData = [
  { month: 'Mar', negociacoes: 12, fechamentos: 4 },
  { month: 'Abr', negociacoes: 18, fechamentos: 6 },
  { month: 'Mai', negociacoes: 15, fechamentos: 5 },
  { month: 'Jun', negociacoes: 22, fechamentos: 8 },
  { month: 'Jul', negociacoes: 19, fechamentos: 7 },
  { month: 'Ago', negociacoes: 28, fechamentos: 10 },
  { month: 'Set', negociacoes: 24, fechamentos: 9 },
  { month: 'Out', negociacoes: 31, fechamentos: 12 },
  { month: 'Nov', negociacoes: 27, fechamentos: 10 },
  { month: 'Dez', negociacoes: 35, fechamentos: 14 },
  { month: 'Jan', negociacoes: 29, fechamentos: 11 },
  { month: 'Fev', negociacoes: 38, fechamentos: 15 },
]

const leadOriginData = [
  { origem: 'Portal', leads: 45 },
  { origem: 'WhatsApp', leads: 32 },
  { origem: 'Indicação', leads: 28 },
  { origem: 'Instagram', leads: 22 },
  { origem: 'Site', leads: 18 },
]

const kanbanData: Record<string, { id: number; client: string; property: string; value: number; days: number }[]> = {
  'Novo Lead': [
    { id: 1, client: 'Carlos Mendes', property: 'Apto 3q Jardins', value: 520000, days: 1 },
    { id: 2, client: 'Ana Paula Lima', property: 'Casa Alphaville', value: 890000, days: 2 },
    { id: 3, client: 'Roberto Silva', property: 'Cobertura Centro', value: 1200000, days: 1 },
  ],
  'Qualificação': [
    { id: 4, client: 'Fernanda Costa', property: 'Apto 2q Vila Madalena', value: 380000, days: 4 },
    { id: 5, client: 'Marcos Oliveira', property: 'Casa Morumbi', value: 720000, days: 5 },
  ],
  'Visita Agendada': [
    { id: 6, client: 'Juliana Rocha', property: 'Apto 4q Jardim Europa', value: 950000, days: 7 },
    { id: 7, client: 'Pedro Almeida', property: 'Casa Granja Viana', value: 650000, days: 6 },
  ],
  'Proposta': [
    { id: 8, client: 'Luciana Ferreira', property: 'Flat Moema', value: 450000, days: 12 },
    { id: 9, client: 'André Santos', property: 'Apto 3q Pinheiros', value: 680000, days: 10 },
  ],
  'Fechamento': [
    { id: 10, client: 'Beatriz Nunes', property: 'Casa Cotia', value: 580000, days: 18 },
  ],
}

const recentActivities = [
  { id: 1, icon: UserPlus, color: 'text-emerald-400', text: 'Novo lead: Carlos Mendes via Portal Imóveis', time: '5 min' },
  { id: 2, icon: Eye, color: 'text-blue-400', text: 'Visita realizada: Apto 3q Jardins com Fernanda Costa', time: '23 min' },
  { id: 3, icon: Handshake, color: 'text-[#d4a843]', text: 'Proposta enviada para Pedro Almeida — R$ 650.000', time: '1h' },
  { id: 4, icon: MessageSquare, color: 'text-purple-400', text: 'Mensagem de WhatsApp de Juliana Rocha', time: '1h 30min' },
  { id: 5, icon: CheckCircle, color: 'text-emerald-400', text: 'Negociação fechada: Casa Morumbi — R$ 720.000', time: '2h' },
  { id: 6, icon: AlertCircle, color: 'text-amber-400', text: 'Imóvel Cod. 0042 com renovação pendente', time: '3h' },
  { id: 7, icon: Building2, color: 'text-[#d4a843]', text: 'Novo imóvel cadastrado: Cobertura Centro — Cod. 0087', time: '4h' },
]

const todayAgenda = [
  { id: 1, time: '09:00', type: 'Visita', client: 'Fernanda Costa', address: 'R. Aspicuelta, 234', corretor: 'Carlos L.' },
  { id: 2, time: '11:30', type: 'Reunião', client: 'Pedro Almeida', address: 'R. das Flores, 80', corretor: 'Mariana S.' },
  { id: 3, time: '14:00', type: 'Assinatura', client: 'Beatriz Nunes', address: 'Escritório', corretor: 'Carlos L.' },
  { id: 4, time: '16:30', type: 'Visita', client: 'Marcos Oliveira', address: 'Av. Morumbi, 5500', corretor: 'Mariana S.' },
]

const stageColors: Record<string, string> = {
  'Novo Lead': 'border-emerald-500/40 bg-emerald-500/5',
  'Qualificação': 'border-blue-500/40 bg-blue-500/5',
  'Visita Agendada': 'border-purple-500/40 bg-purple-500/5',
  'Proposta': 'border-amber-500/40 bg-amber-500/5',
  'Fechamento': 'border-[#d4a843]/40 bg-[#d4a843]/5',
}

const stageDots: Record<string, string> = {
  'Novo Lead': 'bg-emerald-400',
  'Qualificação': 'bg-blue-400',
  'Visita Agendada': 'bg-purple-400',
  'Proposta': 'bg-amber-400',
  'Fechamento': 'bg-[#d4a843]',
}

const apptColors: Record<string, string> = {
  'Visita': 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  'Reunião': 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
  'Assinatura': 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f1525] border border-[#1a2035] rounded-lg p-3 shadow-xl">
        <p className="text-xs text-foreground/60 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs font-medium" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardOverview() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#f8f6f0]">Visão Geral</h1>
            <p className="text-sm text-foreground/50 mt-0.5 font-sans">Bem-vindo de volta, Corretor Lemos</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground/40 font-sans">
            <Clock className="h-3.5 w-3.5" />
            <span>Atualizado agora</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />Novo Imóvel</Button>
          <Button size="sm" variant="secondary" className="gap-1.5"><UserPlus className="h-3.5 w-3.5" />Novo Cliente</Button>
          <Button size="sm" variant="secondary" className="gap-1.5"><Handshake className="h-3.5 w-3.5" />Nova Negociação</Button>
          <Button size="sm" variant="secondary" className="gap-1.5"><Send className="h-3.5 w-3.5" />Enviar Mensagem</Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Imóveis Ativos', value: '234', trend: '+12% este mês', icon: Building2, iconBg: 'bg-[#d4a843]/10 border-[#d4a843]/20', iconColor: 'text-[#d4a843]', barColor: 'bg-[#d4a843]/60', barWidth: 'w-3/4' },
            { label: 'Novos Leads', value: '47', trend: '+8% este mês', icon: UserPlus, iconBg: 'bg-emerald-500/10 border-emerald-500/20', iconColor: 'text-emerald-400', barColor: 'bg-emerald-400/60', barWidth: 'w-1/2' },
            { label: 'Em Negociação', value: '23', trend: '5 em proposta', icon: Handshake, iconBg: 'bg-blue-500/10 border-blue-500/20', iconColor: 'text-blue-400', barColor: 'bg-blue-400/60', barWidth: 'w-2/5' },
            { label: 'Receita do Mês', value: 'R$ 142k', trend: '+18% vs anterior', icon: DollarSign, iconBg: 'bg-[#d4a843]/10 border-[#d4a843]/20', iconColor: 'text-[#d4a843]', barColor: 'bg-[#d4a843]/60', barWidth: 'w-4/5' },
          ].map((kpi) => {
            const Icon = kpi.icon
            return (
              <Card key={kpi.label}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-foreground/50 font-sans uppercase tracking-wider">{kpi.label}</p>
                      <p className="text-3xl font-display font-bold text-[#f8f6f0] mt-1">{kpi.value}</p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                        <span className="text-xs text-emerald-400 font-sans">{kpi.trend}</span>
                      </div>
                    </div>
                    <div className={`p-2.5 rounded-lg border ${kpi.iconBg}`}>
                      <Icon className={`h-5 w-5 ${kpi.iconColor}`} />
                    </div>
                  </div>
                  <div className="mt-3 h-1 rounded-full bg-[#1a2035]">
                    <div className={`h-1 rounded-full ${kpi.barColor} ${kpi.barWidth}`} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-sans font-semibold">Negociações por Mês</CardTitle>
              <p className="text-xs text-foreground/50">Últimos 12 meses</p>
            </CardHeader>
            <CardContent className="pb-4">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2035" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} formatter={(v) => <span style={{ color: '#9ca3af' }}>{v}</span>} />
                  <Line type="monotone" dataKey="negociacoes" name="Negociações" stroke="#d4a843" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="fechamentos" name="Fechamentos" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-sans font-semibold">Leads por Origem</CardTitle>
              <p className="text-xs text-foreground/50">Distribuição do mês</p>
            </CardHeader>
            <CardContent className="pb-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={leadOriginData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a2035" vertical={false} />
                  <XAxis dataKey="origem" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="leads" name="Leads" fill="#d4a843" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Preview + Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <Card>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-base font-sans font-semibold">Pipeline de Negociações</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-[#d4a843] gap-1">Ver tudo <ChevronRight className="h-3 w-3" /></Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(kanbanData).map(([stage, cards]) => (
                    <div key={stage} className={`rounded-lg border p-2 ${stageColors[stage]}`}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className={`w-2 h-2 rounded-full ${stageDots[stage]}`} />
                        <span className="text-[10px] font-semibold text-foreground/70 leading-tight">{stage}</span>
                        <span className="ml-auto text-[10px] text-foreground/50">{cards.length}</span>
                      </div>
                      <div className="space-y-1.5">
                        {cards.slice(0, 3).map((card) => (
                          <div key={card.id} className="p-1.5 rounded bg-[#0a0e1a]/60 border border-[#1a2035] hover:border-[#d4a843]/30 transition-colors cursor-pointer">
                            <p className="text-[9px] font-semibold text-foreground/90 truncate">{card.client}</p>
                            <p className="text-[8px] text-foreground/50 truncate mt-0.5">{card.property}</p>
                            <p className="text-[9px] text-[#d4a843] font-semibold mt-1">{(card.value / 1000).toFixed(0)}k</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-base font-sans font-semibold">Atividade Recente</CardTitle>
              <Badge variant="secondary" className="text-[10px]">Hoje</Badge>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-3">
                {recentActivities.map((a) => {
                  const Icon = a.icon
                  return (
                    <div key={a.id} className="flex items-start gap-2.5">
                      <div className={`mt-0.5 p-1 rounded-md bg-[#0a0e1a] border border-[#1a2035] ${a.color}`}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground/80 leading-snug">{a.text}</p>
                        <p className="text-[10px] text-foreground/40 mt-0.5">{a.time} atrás</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Agenda + Performance */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-base font-sans font-semibold">Agenda de Hoje</CardTitle>
              <Button variant="secondary" size="sm" className="gap-1.5 text-xs"><Plus className="h-3 w-3" />Agendar</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todayAgenda.map((appt) => (
                  <div key={appt.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#0a0e1a]/60 border border-[#1a2035] hover:border-[#d4a843]/20 transition-colors">
                    <div className="text-center min-w-[40px]">
                      <p className="text-sm font-bold text-[#d4a843]">{appt.time}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${apptColors[appt.type]}`}>{appt.type}</span>
                        <span className="text-xs text-foreground/50">{appt.corretor}</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground/90 mt-1">{appt.client}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-foreground/40" />
                        <p className="text-xs text-foreground/50 truncate">{appt.address}</p>
                      </div>
                    </div>
                    <button className="p-1.5 rounded-md hover:bg-[#1a2035] transition-colors">
                      <Phone className="h-3.5 w-3.5 text-foreground/40 hover:text-[#d4a843]" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-sans font-semibold">Performance do Mês</CardTitle>
              <p className="text-xs text-foreground/50">Fevereiro 2025</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Meta de Vendas', current: 7, target: 10, color: 'bg-[#d4a843]' },
                  { label: 'Leads Convertidos', current: 12, target: 20, color: 'bg-emerald-400' },
                  { label: 'Visitas Realizadas', current: 28, target: 35, color: 'bg-blue-400' },
                  { label: 'Contratos Assinados', current: 5, target: 8, color: 'bg-purple-400' },
                ].map((item) => {
                  const pct = Math.round((item.current / item.target) * 100)
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-foreground/80">{item.label}</span>
                        <span className="text-xs text-foreground/50">{item.current}/{item.target}</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#1a2035]">
                        <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-foreground/40 mt-1">{pct}% da meta</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
