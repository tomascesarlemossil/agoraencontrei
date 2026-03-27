import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  UserPlus, Search, Phone, Mail, MessageSquare, Star, Flame,
  TrendingUp, Clock, Tag, ChevronRight, Sparkles, Filter,
  BarChart2, Target, Zap,
} from 'lucide-react'
import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const leads = [
  { id: 1, name: 'Carlos Mendes', phone: '(11) 99234-5678', email: 'carlos@email.com', score: 87, temperature: 'hot', origin: 'Portal Imóveis', utm: 'portal_imoveis_sp', interest: 'Casa 3q Centro', lastActivity: '5 min', tags: ['comprador','urgente','centro','piscina'], breakdown: { intencao: 90, perfil: 85, orcamento: 88, urgencia: 85 }, summary: 'Lead com alto potencial. Busca casa 3 quartos no centro com piscina. Budget ~R$600k. Alta urgência: mencionou prazo de 30 dias.' },
  { id: 2, name: 'Ana Paula Lima', phone: '(11) 97654-3210', email: 'ana@email.com', score: 72, temperature: 'warm', origin: 'Instagram', utm: 'ig_feed_sp', interest: 'Apto 2q Jardins', lastActivity: '1h', tags: ['compradora','jardins','apartamento'], breakdown: { intencao: 75, perfil: 70, orcamento: 72, urgencia: 71 }, summary: 'Perfil compradora qualificada. Interesse em apartamento nos Jardins. Budget flexível até R$900k.' },
  { id: 3, name: 'Roberto Silva', phone: '(11) 96543-2109', email: 'roberto@email.com', score: 45, temperature: 'cold', origin: 'Google Ads', utm: 'google_cpc_sp', interest: 'Cobertura', lastActivity: '3h', tags: ['cobertura','pesquisa'], breakdown: { intencao: 50, perfil: 40, orcamento: 45, urgencia: 45 }, summary: 'Lead em fase de pesquisa. Interesse genérico em coberturas. Sem urgência definida.' },
  { id: 4, name: 'Fernanda Costa', phone: '(11) 95432-1098', email: 'fernanda@email.com', score: 91, temperature: 'hot', origin: 'WhatsApp', utm: 'whatsapp_direct', interest: 'Casa 4q Alphaville', lastActivity: '10 min', tags: ['compradora','alphaville','urgente','alto-padrão'], breakdown: { intencao: 95, perfil: 90, orcamento: 88, urgencia: 91 }, summary: 'Lead quente. Precisa se mudar em 45 dias. Busca casa 4q em Alphaville ou Tamboré. Budget R$1.5M.' },
  { id: 5, name: 'Marcos Oliveira', phone: '(11) 94321-0987', email: 'marcos@email.com', score: 63, temperature: 'warm', origin: 'Site', utm: 'organic_search', interest: 'Apto 3q Pinheiros', lastActivity: '2h', tags: ['comprador','pinheiros'], breakdown: { intencao: 65, perfil: 62, orcamento: 60, urgencia: 65 }, summary: 'Interessado em Pinheiros ou Vila Madalena. Preferência por imóvel sem reformas.' },
  { id: 6, name: 'Juliana Rocha', phone: '(11) 93210-9876', email: 'juliana@email.com', score: 78, temperature: 'hot', origin: 'Indicação', utm: 'referral_organic', interest: 'Townhouse Morumbi', lastActivity: '45 min', tags: ['compradora','morumbi','townhouse','família'], breakdown: { intencao: 80, perfil: 78, orcamento: 76, urgencia: 78 }, summary: 'Indicação de cliente antigo. Busca townhouse ou casa de vila no Morumbi. Budget R$850k.' },
]

const funnelData = [
  { value: 145, name: 'Total Leads', fill: '#1a2035' },
  { value: 98, name: 'Qualificados', fill: '#243050' },
  { value: 62, name: 'Visitaram', fill: '#d4a843' },
  { value: 31, name: 'Proposta', fill: '#f0c84a' },
  { value: 12, name: 'Fechados', fill: '#22c55e' },
]

const temperatureConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  hot: { label: 'Quente', color: 'text-red-300', bg: 'bg-red-500/15 border-red-400/40', icon: Flame },
  warm: { label: 'Morno', color: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-400/40', icon: TrendingUp },
  cold: { label: 'Frio', color: 'text-blue-300', bg: 'bg-blue-500/15 border-blue-400/40', icon: Clock },
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f1525] border border-[#1a2035] rounded-lg p-2 shadow-xl">
        <p className="text-xs text-foreground/60">{payload[0].payload.name}</p>
        <p className="text-sm font-bold text-[#d4a843]">{payload[0].value} leads</p>
      </div>
    )
  }
  return null
}

export default function DashboardLeads() {
  const [search, setSearch] = useState('')
  const [filterTemp, setFilterTemp] = useState('Todos')
  const [selectedLead, setSelectedLead] = useState<typeof leads[0] | null>(null)

  const filtered = leads.filter(l =>
    (filterTemp === 'Todos' || l.temperature === filterTemp.toLowerCase()) &&
    (l.name.toLowerCase().includes(search.toLowerCase()) || l.interest.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <DashboardLayout>
      <div className="flex gap-5 h-[calc(100vh-9rem)]">
        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-5 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-[#f8f6f0]">Leads</h1>
              <p className="text-sm text-foreground/50 mt-0.5">Gestão de leads com IA</p>
            </div>
            <Button className="gap-2"><UserPlus className="h-4 w-4" />Novo Lead</Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total Leads', value: '47', color: 'text-foreground/90' },
              { label: 'Quentes', value: String(leads.filter(l=>l.temperature==='hot').length), color: 'text-red-400' },
              { label: 'Score Médio', value: String(Math.round(leads.reduce((s,l)=>s+l.score,0)/leads.length)), color: 'text-[#d4a843]' },
              { label: 'Convertidos', value: '12', color: 'text-emerald-400' },
            ].map(s => (
              <Card key={s.label}><CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
                <p className="text-xs text-foreground/50 mt-0.5">{s.label}</p>
              </CardContent></Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-48">
              <Input placeholder="Buscar lead..." leftIcon={<Search className="h-4 w-4" />} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="h-10 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]" value={filterTemp} onChange={e => setFilterTemp(e.target.value)}>
              {['Todos','Hot','Warm','Cold'].map(o => <option key={o}>{o}</option>)}
            </select>
            <select className="h-10 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]">
              {['Score: Todos','Score 70+','Score 50-70','Score <50'].map(o => <option key={o}>{o}</option>)}
            </select>
            <select className="h-10 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]">
              {['Origem: Todos','Portal','WhatsApp','Instagram','Site','Indicação'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          {/* Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1a2035]">
                    {['Nome','Contato','Score IA','Temperatura','Origem','Interesse','Última Atividade','Ações'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2035]">
                  {filtered.map(lead => {
                    const temp = temperatureConfig[lead.temperature]
                    const TempIcon = temp.icon
                    return (
                      <tr key={lead.id} className="hover:bg-[#1a2035]/40 cursor-pointer transition-colors" onClick={() => setSelectedLead(lead)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#d4a843]/20 flex items-center justify-center">
                              <span className="text-xs font-bold text-[#d4a843]">{lead.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</span>
                            </div>
                            <span className="text-sm font-medium">{lead.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-xs text-foreground/60"><Phone className="h-3 w-3" />{lead.phone}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#d4a843] w-8">{lead.score}</span>
                            <div className="flex-1 h-2 rounded-full bg-[#1a2035] w-20">
                              <div className={`h-2 rounded-full ${lead.score >= 70 ? 'bg-emerald-400' : lead.score >= 50 ? 'bg-amber-400' : 'bg-blue-400'}`} style={{ width: `${lead.score}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 w-fit ${temp.bg} ${temp.color}`}>
                            <TempIcon className="h-3 w-3" />{temp.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-foreground/60">{lead.origin}</td>
                        <td className="px-4 py-3 text-sm text-foreground/80">{lead.interest}</td>
                        <td className="px-4 py-3 text-xs text-foreground/50">
                          <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{lead.lastActivity}</div>
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <button className="p-1.5 rounded hover:bg-[#1a2035]"><Phone className="h-3.5 w-3.5 text-foreground/50 hover:text-emerald-400" /></button>
                            <button className="p-1.5 rounded hover:bg-[#1a2035]"><MessageSquare className="h-3.5 w-3.5 text-foreground/50 hover:text-green-400" /></button>
                            <button className="p-1.5 rounded hover:bg-[#1a2035]"><ChevronRight className="h-3.5 w-3.5 text-foreground/50 hover:text-[#d4a843]" /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right panel */}
        <div className="w-80 shrink-0 space-y-4 overflow-y-auto">
          {/* Funnel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold font-sans">Funil de Leads</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="space-y-2">
                {funnelData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="flex-1 h-7 rounded flex items-center px-2" style={{ background: item.fill, width: `${(item.value / funnelData[0].value) * 100}%`, minWidth: '60%' }}>
                      <span className="text-xs font-medium text-foreground/80">{item.name}</span>
                    </div>
                    <span className="text-xs text-foreground/60 w-8 text-right">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lead Detail */}
          {selectedLead ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold font-sans flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#d4a843]" />
                  Análise IA do Lead
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#d4a843]/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-[#d4a843]">{selectedLead.name.split(' ').map((n: string)=>n[0]).join('').slice(0,2)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{selectedLead.name}</p>
                    <p className="text-xs text-[#d4a843]">Score: {selectedLead.score}/100</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#0a0e1a] border border-[#d4a843]/20">
                  <p className="text-xs text-foreground/70 leading-relaxed">{selectedLead.summary}</p>
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'Intenção', value: selectedLead.breakdown.intencao },
                    { label: 'Perfil', value: selectedLead.breakdown.perfil },
                    { label: 'Orçamento', value: selectedLead.breakdown.orcamento },
                    { label: 'Urgência', value: selectedLead.breakdown.urgencia },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-foreground/60">{item.label}</span>
                        <span className="text-xs text-[#d4a843] font-semibold">{item.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#1a2035]">
                        <div className="h-1.5 rounded-full bg-[#d4a843]" style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1">
                  {selectedLead.tags.map((tag: string) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4a843]/10 text-[#d4a843] border border-[#d4a843]/20">#{tag}</span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" className="flex-1 gap-1.5"><Phone className="h-3.5 w-3.5" />Ligar</Button>
                  <Button size="sm" className="flex-1 gap-1.5"><Target className="h-3.5 w-3.5" />Follow-up</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Sparkles className="h-10 w-10 mx-auto text-foreground/20 mb-3" />
                <p className="text-sm text-foreground/50">Selecione um lead para ver a análise de IA</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
