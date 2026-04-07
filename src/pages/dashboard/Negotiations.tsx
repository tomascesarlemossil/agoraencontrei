import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Plus, Phone, MessageSquare, Calendar, Edit, DollarSign,
  TrendingUp, Percent, Clock, Flag, Home, User, ChevronDown, Filter,
} from 'lucide-react'

const columns = [
  { id: 'lead', label: 'Novo Lead', color: 'border-emerald-500/40', dot: 'bg-emerald-400', textColor: 'text-emerald-400' },
  { id: 'qualification', label: 'Qualificação', color: 'border-blue-500/40', dot: 'bg-blue-400', textColor: 'text-blue-400' },
  { id: 'visit', label: 'Visita Agendada', color: 'border-purple-500/40', dot: 'bg-purple-400', textColor: 'text-purple-400' },
  { id: 'proposal', label: 'Proposta', color: 'border-amber-500/40', dot: 'bg-amber-400', textColor: 'text-amber-400' },
  { id: 'docs', label: 'Documentação', color: 'border-orange-500/40', dot: 'bg-orange-400', textColor: 'text-orange-400' },
  { id: 'closing', label: 'Fechamento', color: 'border-[#d4a843]/40', dot: 'bg-[#d4a843]', textColor: 'text-[#d4a843]' },
]

const cards: Record<string, any[]> = {
  lead: [
    { id: 1, client: 'Carlos Mendes', property: 'Apto 3q Jardins', propertyCode: 'LEM-0087', value: 890000, days: 1, priority: 'alta', nextAction: '28/01', corretor: 'CL', corretorName: 'Carlos L.' },
    { id: 2, client: 'Ana Paula Lima', property: 'Casa Alphaville', propertyCode: 'LEM-0088', value: 1850000, days: 2, priority: 'média', nextAction: '29/01', corretor: 'MS', corretorName: 'Mariana S.' },
    { id: 3, client: 'Roberto Silva', property: 'Cobertura Centro', propertyCode: 'LEM-0089', value: 2200000, days: 1, priority: 'alta', nextAction: '27/01', corretor: 'CL', corretorName: 'Carlos L.' },
  ],
  qualification: [
    { id: 4, client: 'Fernanda Costa', property: 'Apto Vila Madalena', propertyCode: 'LEM-0090', value: 380000, days: 4, priority: 'baixa', nextAction: '30/01', corretor: 'MS', corretorName: 'Mariana S.' },
    { id: 5, client: 'Marcos Oliveira', property: 'Casa Morumbi', propertyCode: 'LEM-0088', value: 720000, days: 5, priority: 'média', nextAction: '28/01', corretor: 'CL', corretorName: 'Carlos L.' },
  ],
  visit: [
    { id: 6, client: 'Juliana Rocha', property: 'Apto 4q Jardim Europa', propertyCode: 'LEM-0087', value: 950000, days: 7, priority: 'alta', nextAction: '27/01', corretor: 'MS', corretorName: 'Mariana S.' },
    { id: 7, client: 'Pedro Almeida', property: 'Casa Granja Viana', propertyCode: 'LEM-0092', value: 650000, days: 6, priority: 'média', nextAction: '28/01', corretor: 'CL', corretorName: 'Carlos L.' },
  ],
  proposal: [
    { id: 8, client: 'Luciana Ferreira', property: 'Flat Moema', propertyCode: 'LEM-0090', value: 450000, days: 12, priority: 'alta', nextAction: '28/01', corretor: 'MS', corretorName: 'Mariana S.' },
    { id: 9, client: 'André Santos', property: 'Apto 3q Pinheiros', propertyCode: 'LEM-0087', value: 680000, days: 10, priority: 'média', nextAction: '29/01', corretor: 'CL', corretorName: 'Carlos L.' },
  ],
  docs: [
    { id: 10, client: 'Sandra Costa', property: 'Casa Riviera', propertyCode: 'LEM-0092', value: 980000, days: 15, priority: 'alta', nextAction: '27/01', corretor: 'MS', corretorName: 'Mariana S.' },
  ],
  closing: [
    { id: 11, client: 'Beatriz Nunes', property: 'Casa Cotia', propertyCode: 'LEM-0094', value: 580000, days: 18, priority: 'alta', nextAction: '28/01', corretor: 'CL', corretorName: 'Carlos L.' },
  ],
}

const priorityColors: Record<string, string> = {
  'alta': 'text-red-400',
  'média': 'text-amber-400',
  'baixa': 'text-blue-400',
}

const timeline = [
  { date: '26/01 14:00', text: 'Proposta enviada: R$ 870.000', type: 'proposal' },
  { date: '25/01 10:00', text: 'Visita realizada com o cliente', type: 'visit' },
  { date: '23/01 09:00', text: 'Ligação: cliente confirmou interesse', type: 'call' },
  { date: '20/01 08:00', text: 'Lead criado via Portal Imóveis', type: 'lead' },
]

function NegotiationDetailModal({ card, open, onClose }: { card: any; open: boolean; onClose: () => void }) {
  if (!card) return null
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Detalhes da Negociação</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#0a0e1a] border border-[#1a2035]">
              <p className="text-xs text-foreground/50 mb-1">Cliente</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#d4a843]/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#d4a843]">{card.corretor}</span>
                </div>
                <p className="text-sm font-semibold">{card.client}</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#0a0e1a] border border-[#1a2035]">
              <p className="text-xs text-foreground/50 mb-1">Imóvel</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#1a2035] flex items-center justify-center">
                  <Home className="h-4 w-4 text-foreground/30" />
                </div>
                <div>
                  <p className="text-sm font-semibold truncate">{card.property}</p>
                  <p className="text-[10px] text-[#d4a843]">{card.propertyCode}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#0a0e1a] border border-[#1a2035]">
              <p className="text-xs text-foreground/50 mb-1">Valor</p>
              <p className="text-xl font-bold text-[#d4a843]">R$ {card.value.toLocaleString('pt-BR')}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#0a0e1a] border border-[#1a2035]">
              <p className="text-xs text-foreground/50 mb-1">Dias no estágio</p>
              <p className="text-xl font-bold text-foreground/90">{card.days} dias</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="secondary" className="gap-1.5 flex-1"><Phone className="h-3.5 w-3.5" />Ligar</Button>
            <Button size="sm" variant="secondary" className="gap-1.5 flex-1"><MessageSquare className="h-3.5 w-3.5" />WhatsApp</Button>
            <Button size="sm" variant="secondary" className="gap-1.5 flex-1"><Calendar className="h-3.5 w-3.5" />Agendar Visita</Button>
            <Button size="sm" className="gap-1.5 flex-1"><Edit className="h-3.5 w-3.5" />Editar</Button>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground/80 mb-3">Linha do Tempo</p>
            <div className="relative pl-4 border-l border-[#1a2035] space-y-4">
              {timeline.map((t, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[17px] w-3 h-3 rounded-full bg-[#d4a843] border-2 border-[#0f1525]" />
                  <p className="text-xs text-foreground/40 mb-0.5">{t.date}</p>
                  <p className="text-sm text-foreground/80">{t.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground/80 mb-2">Avançar Estágio</p>
            <div className="flex flex-wrap gap-2">
              {columns.map(col => (
                <button key={col.id} className={`text-xs px-3 py-1.5 rounded-lg border ${col.color} ${col.textColor} bg-transparent hover:bg-[#1a2035] transition-colors`}>
                  {col.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function DashboardNegotiations() {
  const [selectedCard, setSelectedCard] = useState<any>(null)

  const totalValue = Object.values(cards).flat().reduce((s, c) => s + c.value, 0)
  const closingValue = (cards.closing || []).reduce((s: number, c: any) => s + c.value, 0)
  const totalCards = Object.values(cards).flat().length

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#f8f6f0]">Negociações</h1>
            <p className="text-sm text-foreground/50 mt-0.5">Pipeline Kanban</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="gap-1.5"><Filter className="h-3.5 w-3.5" />Filtros</Button>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" />Nova Negociação</Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Pipeline', value: `R$ ${(totalValue/1000000).toFixed(1)}M`, icon: DollarSign, color: 'text-[#d4a843]' },
            { label: 'Negociações', value: String(totalCards), icon: TrendingUp, color: 'text-blue-400' },
            { label: 'Em Fechamento', value: `R$ ${(closingValue/1000).toFixed(0)}k`, icon: Percent, color: 'text-emerald-400' },
            { label: 'Ticket Médio', value: `R$ ${(totalValue/totalCards/1000).toFixed(0)}k`, icon: Clock, color: 'text-purple-400' },
          ].map(s => {
            const Icon = s.icon
            return (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-foreground/50">{s.label}</p>
                      <p className={`text-xl font-bold font-display mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                    <Icon className={`h-6 w-6 ${s.color} opacity-60`} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex gap-2 items-center">
          <select className="h-8 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]">
            {['Corretor: Todos','Carlos L.','Mariana S.'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select className="h-8 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]">
            {['Data: Todos','Esta semana','Este mês'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select className="h-8 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]">
            {['Tipo: Todos','Venda','Locação'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        {/* Kanban */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {columns.map(col => {
              const colCards = cards[col.id] || []
              const colValue = colCards.reduce((s: number, c: any) => s + c.value, 0)
              return (
                <div key={col.id} className={`w-64 rounded-xl border ${col.color} bg-[#0a0e1a]/40 flex flex-col`}>
                  {/* Column Header */}
                  <div className="p-3 border-b border-[#1a2035]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                        <span className={`text-xs font-semibold ${col.textColor}`}>{col.label}</span>
                      </div>
                      <span className="text-xs text-foreground/50 bg-[#1a2035] rounded-full px-2 py-0.5">{colCards.length}</span>
                    </div>
                    <p className="text-xs text-foreground/40 mt-1">R$ {(colValue/1000).toFixed(0)}k</p>
                  </div>

                  {/* Cards */}
                  <div className="p-2 space-y-2 flex-1 min-h-32">
                    {colCards.map((card: any) => (
                      <div
                        key={card.id}
                        className="p-3 rounded-lg bg-[#0f1525] border border-[#1a2035] hover:border-[#d4a843]/30 transition-all cursor-pointer group"
                        onClick={() => setSelectedCard(card)}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-semibold text-foreground/90 leading-tight">{card.client}</p>
                          <Flag className={`h-3 w-3 shrink-0 ${priorityColors[card.priority]}`} />
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Home className="h-3 w-3 text-foreground/30" />
                          <p className="text-[10px] text-foreground/50 truncate">{card.property}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs font-bold text-[#d4a843]">R$ {(card.value/1000).toFixed(0)}k</p>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-foreground/30" />
                            <span className="text-[10px] text-foreground/40">{card.days}d</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1a2035]">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-foreground/30" />
                            <span className="text-[10px] text-foreground/40">{card.nextAction}</span>
                          </div>
                          <div className="w-5 h-5 rounded-full bg-[#d4a843]/20 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-[#d4a843]">{card.corretor}</span>
                          </div>
                        </div>
                        {/* Hover actions */}
                        <div className="hidden group-hover:flex items-center gap-1 mt-2 pt-2 border-t border-[#1a2035]">
                          <button className="p-1 rounded hover:bg-[#1a2035]" onClick={e => e.stopPropagation()}><Phone className="h-3 w-3 text-foreground/50" /></button>
                          <button className="p-1 rounded hover:bg-[#1a2035]" onClick={e => e.stopPropagation()}><MessageSquare className="h-3 w-3 text-foreground/50" /></button>
                          <button className="p-1 rounded hover:bg-[#1a2035]" onClick={e => e.stopPropagation()}><Calendar className="h-3 w-3 text-foreground/50" /></button>
                          <button className="p-1 rounded hover:bg-[#1a2035]" onClick={e => e.stopPropagation()}><Edit className="h-3 w-3 text-foreground/50" /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add button */}
                  <div className="p-2 border-t border-[#1a2035]">
                    <button className="w-full py-1.5 rounded-lg text-xs text-foreground/40 hover:text-foreground/70 hover:bg-[#1a2035] transition-colors flex items-center justify-center gap-1">
                      <Plus className="h-3 w-3" />
                      Adicionar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <NegotiationDetailModal card={selectedCard} open={!!selectedCard} onClose={() => setSelectedCard(null)} />
    </DashboardLayout>
  )
}
