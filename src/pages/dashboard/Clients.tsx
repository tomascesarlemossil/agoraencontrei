import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users, Plus, Search, Edit, Trash2, Phone, Mail, MessageSquare,
  ChevronRight, MapPin, DollarSign, Star, Clock, Home, Sparkles,
  User, Grid, List,
} from 'lucide-react'

const clients = [
  { id: 1, name: 'Carlos Mendes', phone: '(11) 99234-5678', email: 'carlos.mendes@email.com', interest: 'Comprar', budget: 700000, status: 'Ativo', origin: 'Portal', lastActivity: '2h atrás', city: 'São Paulo' },
  { id: 2, name: 'Ana Paula Lima', phone: '(11) 97654-3210', email: 'ana.lima@email.com', interest: 'Comprar', budget: 1200000, status: 'Ativo', origin: 'Indicação', lastActivity: '5h atrás', city: 'São Paulo' },
  { id: 3, name: 'Fernanda Costa', phone: '(11) 96543-2109', email: 'fernanda.costa@email.com', interest: 'Alugar', budget: 5000, status: 'Ativo', origin: 'WhatsApp', lastActivity: 'Ontem', city: 'São Paulo' },
  { id: 4, name: 'Marcos Oliveira', phone: '(11) 95432-1098', email: 'marcos.oliveira@email.com', interest: 'Comprar', budget: 800000, status: 'Convertido', origin: 'Instagram', lastActivity: '3 dias', city: 'Barueri' },
  { id: 5, name: 'Juliana Rocha', phone: '(11) 94321-0987', email: 'juliana.rocha@email.com', interest: 'Comprar', budget: 950000, status: 'Ativo', origin: 'Site', lastActivity: '1h atrás', city: 'São Paulo' },
  { id: 6, name: 'Pedro Almeida', phone: '(11) 93210-9876', email: 'pedro.almeida@email.com', interest: 'Comprar', budget: 600000, status: 'Ativo', origin: 'Portal', lastActivity: '30 min', city: 'Osasco' },
  { id: 7, name: 'Luciana Ferreira', phone: '(11) 92109-8765', email: 'luciana.ferreira@email.com', interest: 'Alugar', budget: 3500, status: 'Inativo', origin: 'WhatsApp', lastActivity: '1 semana', city: 'São Paulo' },
  { id: 8, name: 'André Santos', phone: '(11) 91098-7654', email: 'andre.santos@email.com', interest: 'Comprar', budget: 680000, status: 'Ativo', origin: 'Indicação', lastActivity: '4h atrás', city: 'São Paulo' },
  { id: 9, name: 'Beatriz Nunes', phone: '(11) 90987-6543', email: 'beatriz.nunes@email.com', interest: 'Comprar', budget: 550000, status: 'Convertido', origin: 'Portal', lastActivity: '2 dias', city: 'Cotia' },
  { id: 10, name: 'Roberto Silva', phone: '(11) 99876-5432', email: 'roberto.silva@email.com', interest: 'Alugar', budget: 8000, status: 'Desistente', origin: 'Instagram', lastActivity: '2 semanas', city: 'São Paulo' },
]

const statusColors: Record<string, any> = { 'Ativo': 'success', 'Convertido': 'info', 'Inativo': 'secondary', 'Desistente': 'destructive' }
const originColors: Record<string, string> = {
  'Portal': 'bg-blue-500/15 text-blue-300',
  'Indicação': 'bg-emerald-500/15 text-emerald-300',
  'WhatsApp': 'bg-green-500/15 text-green-300',
  'Instagram': 'bg-pink-500/15 text-pink-300',
  'Site': 'bg-purple-500/15 text-purple-300',
}

const timeline = [
  { date: '26/01 14:32', text: 'Visita realizada no Apto 3q Jardins', type: 'visit' },
  { date: '25/01 10:15', text: 'WhatsApp: Perguntou sobre imóvel LEM-0087', type: 'message' },
  { date: '23/01 16:00', text: 'Proposta enviada: R$ 870.000', type: 'proposal' },
  { date: '20/01 09:00', text: 'Lead criado via Portal Imóveis', type: 'lead' },
]

function ClientModal({ client, open, onClose }: { client: typeof clients[0] | null; open: boolean; onClose: () => void }) {
  if (!client) return null
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Perfil do Cliente</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Contact header */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0a0e1a] border border-[#1a2035]">
            <div className="w-14 h-14 rounded-full bg-[#d4a843]/20 border border-[#d4a843]/30 flex items-center justify-center">
              <span className="text-xl font-bold text-[#d4a843]">{client.name.split(' ').map(n => n[0]).join('').slice(0,2)}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-foreground">{client.name}</h3>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant={statusColors[client.status]}>{client.status}</Badge>
                <span className={`text-xs px-2 py-0.5 rounded-full ${originColors[client.origin]}`}>{client.origin}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" className="gap-1.5"><Phone className="h-3.5 w-3.5" />Ligar</Button>
              <Button size="sm" variant="secondary" className="gap-1.5"><MessageSquare className="h-3.5 w-3.5" />WhatsApp</Button>
              <Button size="sm" variant="secondary" className="gap-1.5"><Mail className="h-3.5 w-3.5" />Email</Button>
            </div>
          </div>

          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="preferences">Preferências</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="match">Imóveis Compatíveis</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Input label="Nome Completo" defaultValue={client.name} /></div>
                <div><Input label="CPF" placeholder="000.000.000-00" /></div>
                <div><Input label="Email" defaultValue={client.email} /></div>
                <div><Input label="Telefone" defaultValue={client.phone} /></div>
                <div><Input label="WhatsApp" defaultValue={client.phone} /></div>
                <div><Input label="Cidade" defaultValue={client.city} /></div>
                <div>
                  <label className="text-xs font-medium text-foreground/70 block mb-1.5">Status</label>
                  <select className="w-full h-10 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]" defaultValue={client.status}>
                    {['Ativo','Inativo','Convertido','Desistente'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/70 block mb-1.5">Origem</label>
                  <select className="w-full h-10 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]" defaultValue={client.origin}>
                    {['Site','WhatsApp','Indicação','Portal','Instagram','Outros'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/70 block mb-1.5">Observações</label>
                <textarea className="w-full h-20 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-[#d4a843] resize-none" placeholder="Notas sobre o cliente..." />
              </div>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground/70 block mb-1.5">Interesse</label>
                  <select className="w-full h-10 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]" defaultValue={client.interest}>
                    {['Comprar','Alugar'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/70 block mb-1.5">Tipo de Imóvel</label>
                  <select className="w-full h-10 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]">
                    {['Apartamento','Casa','Comercial','Qualquer'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><Input label="Orçamento Mínimo (R$)" type="number" /></div>
                <div><Input label="Orçamento Máximo (R$)" type="number" defaultValue={String(client.budget)} /></div>
                <div><Input label="Quartos Mínimos" type="number" placeholder="0" /></div>
                <div><Input label="Cidades Preferidas" placeholder="Ex: São Paulo, Barueri" /></div>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/70 block mb-1.5">Amenidades desejadas</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Piscina','Academia','Garagem','Portaria 24h','Área Gourmet','Playground'].map(a => (
                    <label key={a} className="flex items-center gap-2 cursor-pointer">
                      <div className="w-4 h-4 rounded border border-[#1a2035] hover:border-[#d4a843]/50 bg-[#0a0e1a]" />
                      <span className="text-xs text-foreground/70">{a}</span>
                    </label>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-3 mt-4">
              <div className="relative pl-4 border-l border-[#1a2035] space-y-4">
                {timeline.map((t, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[17px] w-3 h-3 rounded-full bg-[#d4a843] border-2 border-[#0f1525]" />
                    <p className="text-xs text-foreground/40 mb-0.5">{t.date}</p>
                    <p className="text-sm text-foreground/80">{t.text}</p>
                  </div>
                ))}
              </div>
              <Button variant="secondary" size="sm" className="w-full gap-2 mt-2">
                <Plus className="h-3.5 w-3.5" />
                Adicionar Nota
              </Button>
            </TabsContent>

            <TabsContent value="match" className="space-y-3 mt-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[#d4a843]/10 border border-[#d4a843]/20">
                <Sparkles className="h-4 w-4 text-[#d4a843]" />
                <p className="text-xs text-foreground/70">IA encontrou <span className="text-[#d4a843] font-semibold">8 imóveis</span> compatíveis com o perfil deste cliente</p>
              </div>
              <div className="space-y-2">
                {[
                  { code: 'LEM-0087', title: 'Apartamento 3 Quartos Jardins', price: 890000, match: 94 },
                  { code: 'LEM-0088', title: 'Casa Alto Padrão Alphaville', price: 1850000, match: 78 },
                  { code: 'LEM-0092', title: 'Casa de Temporada Litoral', price: 1200000, match: 65 },
                ].map(prop => (
                  <div key={prop.code} className="flex items-center gap-3 p-3 rounded-lg border border-[#1a2035] hover:border-[#d4a843]/30 transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-lg bg-[#1a2035] flex items-center justify-center shrink-0">
                      <Home className="h-5 w-5 text-foreground/30" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{prop.title}</p>
                      <p className="text-xs text-[#d4a843]">R$ {(prop.price/1000).toFixed(0)}k · {prop.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-400">{prop.match}%</p>
                      <p className="text-[10px] text-foreground/40">match</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#1a2035]">
            <Button variant="ghost" onClick={onClose}>Fechar</Button>
            <Button>Salvar Alterações</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function DashboardClients() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [filterInterest, setFilterInterest] = useState('Todos')
  const [selectedClient, setSelectedClient] = useState<typeof clients[0] | null>(null)
  const [newClientOpen, setNewClientOpen] = useState(false)

  const filtered = clients.filter(c =>
    (filterStatus === 'Todos' || c.status === filterStatus) &&
    (filterInterest === 'Todos' || c.interest === filterInterest) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#f8f6f0]">Clientes</h1>
            <p className="text-sm text-foreground/50 mt-0.5">{clients.length} clientes cadastrados</p>
          </div>
          <Button onClick={() => setNewClientOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Novo Cliente</Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            ['Total', clients.length, 'text-foreground/90'],
            ['Ativos', clients.filter(c=>c.status==='Ativo').length, 'text-emerald-400'],
            ['Convertidos', clients.filter(c=>c.status==='Convertido').length, 'text-blue-400'],
            ['Compradores', clients.filter(c=>c.interest==='Comprar').length, 'text-[#d4a843]'],
          ].map(([l,v,c]) => (
            <Card key={String(l)}><CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold font-display ${c}`}>{v}</p>
              <p className="text-xs text-foreground/50 mt-0.5">{String(l)}</p>
            </CardContent></Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48">
            <Input placeholder="Buscar cliente..." leftIcon={<Search className="h-4 w-4" />} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="h-10 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            {['Todos','Ativo','Convertido','Inativo','Desistente'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select className="h-10 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]" value={filterInterest} onChange={e => setFilterInterest(e.target.value)}>
            {['Todos','Comprar','Alugar'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select className="h-10 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]">
            {['Origem: Todos','Portal','WhatsApp','Indicação','Instagram','Site'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a2035]">
                  {['Cliente','Contato','Interesse','Orçamento','Status','Origem','Última Atividade','Ações'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2035]">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-[#1a2035]/40 transition-colors cursor-pointer" onClick={() => setSelectedClient(c)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#d4a843]/20 border border-[#d4a843]/30 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-[#d4a843]">{c.name.split(' ').map(n=>n[0]).join('').slice(0,2)}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground/90">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-xs text-foreground/60"><Phone className="h-3 w-3" />{c.phone}</div>
                        <div className="flex items-center gap-1 text-xs text-foreground/40"><Mail className="h-3 w-3" />{c.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.interest === 'Comprar' ? 'bg-blue-500/15 text-blue-300' : 'bg-emerald-500/15 text-emerald-300'}`}>{c.interest}</span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-[#d4a843]">
                      {c.budget >= 10000 ? `R$ ${(c.budget/1000).toFixed(0)}k` : `R$ ${c.budget.toLocaleString()}/mês`}
                    </td>
                    <td className="px-4 py-3"><Badge variant={statusColors[c.status]}>{c.status}</Badge></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${originColors[c.origin]}`}>{c.origin}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground/50">
                      <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{c.lastActivity}</div>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded hover:bg-[#1a2035]"><Phone className="h-3.5 w-3.5 text-foreground/50 hover:text-emerald-400" /></button>
                        <button className="p-1.5 rounded hover:bg-[#1a2035]"><MessageSquare className="h-3.5 w-3.5 text-foreground/50 hover:text-green-400" /></button>
                        <button className="p-1.5 rounded hover:bg-[#1a2035]" onClick={() => setSelectedClient(c)}><Edit className="h-3.5 w-3.5 text-foreground/50 hover:text-[#d4a843]" /></button>
                        <button className="p-1.5 rounded hover:bg-[#1a2035]"><Trash2 className="h-3.5 w-3.5 text-foreground/50 hover:text-red-400" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[#1a2035]">
            <p className="text-xs text-foreground/50">{filtered.length} clientes encontrados</p>
          </div>
        </Card>
      </div>

      <ClientModal client={selectedClient} open={!!selectedClient} onClose={() => setSelectedClient(null)} />

      <Dialog open={newClientOpen} onOpenChange={v => !v && setNewClientOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Input label="Nome Completo" placeholder="Nome do cliente" /></div>
            <div><Input label="Email" placeholder="email@exemplo.com" type="email" /></div>
            <div><Input label="Telefone / WhatsApp" placeholder="(11) 99999-9999" /></div>
            <div>
              <label className="text-xs font-medium text-foreground/70 block mb-1.5">Interesse</label>
              <select className="w-full h-10 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]">
                {['Comprar','Alugar'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div><Input label="Orçamento (R$)" type="number" placeholder="0" /></div>
            <div>
              <label className="text-xs font-medium text-foreground/70 block mb-1.5">Origem</label>
              <select className="w-full h-10 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]">
                {['Site','WhatsApp','Indicação','Portal','Instagram','Outros'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-foreground/70 block mb-1.5">Observações</label>
              <textarea className="w-full h-20 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-[#d4a843] resize-none" placeholder="Notas iniciais..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-[#1a2035]">
            <Button variant="ghost" onClick={() => setNewClientOpen(false)}>Cancelar</Button>
            <Button>Salvar Cliente</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
