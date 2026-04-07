import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Building2, Plus, Search, Grid, List, Edit, Globe, Copy, EyeOff, Trash2,
  ChevronLeft, ChevronRight, MapPin, Bed, Bath, Car, Upload, Image,
  CheckSquare,
} from 'lucide-react'

const properties = [
  { id: 1, code: 'LEM-0087', title: 'Apartamento 3 Quartos Jardins', type: 'Apartamento', purpose: 'Venda', price: 890000, neighborhood: 'Jardins', city: 'São Paulo', status: 'Ativo', portals: ['VivaReal', 'ZAP'], owner: 'Maria Souza', beds: 3, baths: 2, area: 112, parking: 2 },
  { id: 2, code: 'LEM-0088', title: 'Casa Alto Padrão Alphaville', type: 'Casa', purpose: 'Venda', price: 1850000, neighborhood: 'Alphaville', city: 'Barueri', status: 'Ativo', portals: ['VivaReal', 'ZAP', 'OLX'], owner: 'João Lima', beds: 4, baths: 3, area: 280, parking: 3 },
  { id: 3, code: 'LEM-0089', title: 'Cobertura Duplex Centro', type: 'Cobertura', purpose: 'Venda', price: 2200000, neighborhood: 'Centro', city: 'São Paulo', status: 'Em análise', portals: [], owner: 'Carlos Ramos', beds: 4, baths: 4, area: 350, parking: 4 },
  { id: 4, code: 'LEM-0090', title: 'Flat Executivo Moema', type: 'Apartamento', purpose: 'Locação', price: 4500, neighborhood: 'Moema', city: 'São Paulo', status: 'Ativo', portals: ['VivaReal'], owner: 'Patricia Neves', beds: 1, baths: 1, area: 45, parking: 1 },
  { id: 5, code: 'LEM-0091', title: 'Terreno Industrial Osasco', type: 'Terreno', purpose: 'Venda', price: 650000, neighborhood: 'Centro', city: 'Osasco', status: 'Inativo', portals: [], owner: 'Roberto Faria', beds: 0, baths: 0, area: 500, parking: 0 },
  { id: 6, code: 'LEM-0092', title: 'Casa de Temporada Litoral', type: 'Casa', purpose: 'Temporada', price: 1200, neighborhood: 'Riviera', city: 'Bertioga', status: 'Ativo', portals: ['OLX'], owner: 'Sandra Costa', beds: 3, baths: 2, area: 160, parking: 2 },
  { id: 7, code: 'LEM-0093', title: 'Sala Comercial Paulista', type: 'Comercial', purpose: 'Locação', price: 8500, neighborhood: 'Bela Vista', city: 'São Paulo', status: 'Ativo', portals: ['ZAP'], owner: 'Grupo Invest', beds: 0, baths: 1, area: 85, parking: 2 },
  { id: 8, code: 'LEM-0094', title: 'Chácara com Lago Interior', type: 'Chácara', purpose: 'Venda', price: 980000, neighborhood: 'Zona Rural', city: 'Mairinque', status: 'Vendido', portals: [], owner: 'Fermino Barbosa', beds: 3, baths: 2, area: 5000, parking: 4 },
]

const statusColors: Record<string, any> = { 'Ativo': 'success', 'Inativo': 'secondary', 'Em análise': 'warning', 'Vendido': 'info' }
const purposeColors: Record<string, string> = {
  'Venda': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'Locação': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'Temporada': 'bg-purple-500/15 text-purple-300 border-purple-500/30',
}
const amenities = ['Piscina','Academia','Churrasqueira','Salão de Festas','Portaria 24h','Playground','Quadra de Tênis','Sauna','Spa','Elevador','Gerador','Energia Solar','Jardim','Varanda','Terraço','Ar Condicionado','Aquecimento Central','Lareira','Closet','Despensa','Lavanderia','Escritório','Home Theater','Câmeras CCTV','Interfone','Portão Eletrônico','Cerca Elétrica','Alarme','Depósito','Bike Storage','Pet Friendly','Área Gourmet','Deck','Lago','Pomar','Horta','Poço Artesiano','Cisterna','Heliponto']

function PropertyFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState('basico')
  const [checkedAmenities, setCheckedAmenities] = useState<Set<string>>(new Set())
  const toggle = (a: string) => setCheckedAmenities(prev => { const n = new Set(prev); n.has(a) ? n.delete(a) : n.add(a); return n })

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Novo Imóvel</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1 p-1">
            {[['basico','Dados Básicos'],['endereco','Endereço'],['caracteristicas','Características'],['fotos','Fotos'],['seo','SEO'],['publicacao','Publicação']].map(([v,l]) => (
              <TabsTrigger key={v} value={v} className="text-xs">{l}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="basico" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Input label="Título" placeholder="Ex: Apartamento 3 quartos no Jardins" /></div>
              <div>
                <label className="text-xs font-medium text-foreground/70 block mb-1.5">Tipo</label>
                <select className="w-full h-10 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]">
                  {['Casa','Apartamento','Terreno','Chácara','Comercial','Cobertura','Flat'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground/70 block mb-1.5">Finalidade</label>
                <select className="w-full h-10 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]">
                  {['Venda','Locação','Temporada'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div><Input label="Preço (R$)" type="number" placeholder="0,00" /></div>
              <div><Input label="Código" placeholder="LEM-0000" /></div>
              <div>
                <label className="text-xs font-medium text-foreground/70 block mb-1.5">Status</label>
                <select className="w-full h-10 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]">
                  {['Ativo','Inativo','Em análise'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div><Input label="Proprietário" placeholder="Nome" /></div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-foreground/70 block mb-1.5">Descrição</label>
                <textarea className="w-full h-28 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-[#d4a843] resize-none" placeholder="Descreva o imóvel..." />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="endereco" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex gap-2 items-end"><Input label="CEP" placeholder="00000-000" /><Button size="sm" variant="secondary" className="shrink-0">Buscar</Button></div>
              <div><Input label="Rua" placeholder="Nome da rua" /></div>
              <div><Input label="Número" placeholder="123" /></div>
              <div><Input label="Complemento" placeholder="Apto, Bloco..." /></div>
              <div><Input label="Bairro" placeholder="Bairro" /></div>
              <div><Input label="Cidade" placeholder="Cidade" /></div>
              <div>
                <label className="text-xs font-medium text-foreground/70 block mb-1.5">Estado</label>
                <select className="w-full h-10 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]">
                  {['SP','RJ','MG','RS','SC','PR','BA','DF'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div><Input label="Nome do Condomínio" placeholder="Opcional" /></div>
            </div>
          </TabsContent>

          <TabsContent value="caracteristicas" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              {['Área Total (m²)','Área Construída (m²)','Quartos','Suítes','Banheiros','Vagas','Andar','Total Andares'].map(l => (
                <div key={l}><Input label={l} type="number" placeholder="0" /></div>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/80 mb-3">Amenidades</p>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {amenities.map(a => (
                  <label key={a} className="flex items-center gap-2 cursor-pointer group" onClick={() => toggle(a)}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${checkedAmenities.has(a) ? 'bg-[#d4a843] border-[#d4a843]' : 'border-[#1a2035] group-hover:border-[#d4a843]/50'}`}>
                      {checkedAmenities.has(a) && <CheckSquare className="h-3 w-3 text-[#0a0e1a]" />}
                    </div>
                    <span className="text-xs text-foreground/70">{a}</span>
                  </label>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fotos" className="space-y-4 mt-4">
            <div className="border-2 border-dashed border-[#1a2035] hover:border-[#d4a843]/50 rounded-lg p-8 text-center cursor-pointer transition-colors">
              <Upload className="h-10 w-10 mx-auto text-foreground/30 mb-3" />
              <p className="text-sm text-foreground/60">Arraste e solte fotos aqui</p>
              <p className="text-xs text-foreground/40 mt-1">PNG, JPG até 10MB</p>
              <Button size="sm" variant="secondary" className="mt-4">Selecionar Arquivos</Button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="aspect-square rounded-lg bg-[#1a2035] border border-[#1a2035] flex items-center justify-center relative hover:border-[#d4a843]/40 cursor-pointer transition-colors">
                  <Image className="h-8 w-8 text-foreground/20" />
                  {i === 1 && <span className="absolute top-1 left-1 text-[10px] bg-[#d4a843] text-[#0a0e1a] font-bold px-1.5 py-0.5 rounded">Principal</span>}
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4 mt-4">
            <Input label="Meta Title" placeholder="Título para SEO (max 60 chars)" />
            <div>
              <label className="text-xs font-medium text-foreground/70 block mb-1.5">Meta Description</label>
              <textarea className="w-full h-20 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-[#d4a843] resize-none" placeholder="Descrição para motores de busca (max 160 chars)" />
            </div>
            <Input label="Keywords" placeholder="apartamento, jardins, 3 quartos" />
            <Input label="Slug" placeholder="apartamento-3-quartos-jardins" />
            <div className="p-3 rounded-lg bg-[#0a0e1a] border border-[#1a2035]">
              <p className="text-xs text-foreground/40 mb-1">Preview Google</p>
              <p className="text-sm text-blue-400">Apartamento 3 Quartos Jardins SP | Lemos Imobiliária</p>
              <p className="text-xs text-emerald-400">imobiliarialemos.com.br/imoveis/apartamento-3-quartos-jardins</p>
              <p className="text-xs text-foreground/60 mt-1">Apartamento moderno no Jardins, 3 quartos, 2 banheiros, 112m²...</p>
            </div>
          </TabsContent>

          <TabsContent value="publicacao" className="space-y-4 mt-4">
            <p className="text-sm text-foreground/60">Configure a publicação em portais</p>
            {[['VivaReal','text-blue-400',true],['ZAP Imóveis','text-orange-400',true],['OLX','text-purple-400',false],['Site Próprio','text-[#d4a843]',true]].map(([name, color, active]) => (
              <div key={String(name)} className="flex items-center justify-between p-3 rounded-lg border border-[#1a2035] bg-[#0a0e1a]/60">
                <div className="flex items-center gap-3">
                  <Globe className={`h-5 w-5 ${color}`} />
                  <span className="text-sm font-medium">{String(name)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Input placeholder="Comissão %" className="w-28 h-8 text-xs" defaultValue="6" />
                  <div className={`w-10 h-5 rounded-full flex items-center cursor-pointer ${active ? 'bg-[#d4a843]' : 'bg-[#1a2035]'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow mx-0.5 transition-transform ${active ? 'translate-x-5' : ''}`} />
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-2 border-t border-[#1a2035]">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <div className="flex gap-2">
            <Button variant="secondary">Salvar Rascunho</Button>
            <Button>Publicar Imóvel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function DashboardProperties() {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('Todos')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  const filtered = properties.filter(p =>
    (filterStatus === 'Todos' || p.status === filterStatus) &&
    (p.title.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase()))
  )
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const stats = {
    total: properties.length,
    ativo: properties.filter(p => p.status === 'Ativo').length,
    inativo: properties.filter(p => p.status === 'Inativo').length,
    analise: properties.filter(p => p.status === 'Em análise').length,
    vendido: properties.filter(p => p.status === 'Vendido').length,
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#f8f6f0]">Imóveis</h1>
            <p className="text-sm text-foreground/50 mt-0.5">Gerencie seu portfólio</p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />Novo Imóvel</Button>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {[['Total', stats.total, 'text-foreground/90'],['Ativos', stats.ativo, 'text-emerald-400'],['Inativos', stats.inativo, 'text-foreground/50'],['Em Análise', stats.analise, 'text-amber-400'],['Vendidos', stats.vendido, 'text-blue-400']].map(([l,v,c]) => (
            <Card key={String(l)}>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold font-display ${c}`}>{v}</p>
                <p className="text-xs text-foreground/50 mt-0.5">{String(l)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48">
            <Input placeholder="Buscar por título ou código..." leftIcon={<Search className="h-4 w-4" />} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="h-10 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            {['Todos','Ativo','Inativo','Em análise','Vendido'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select className="h-10 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]">
            {['Tipo: Todos','Casa','Apartamento','Terreno','Comercial'].map(o => <option key={o}>{o}</option>)}
          </select>
          <select className="h-10 rounded-md border border-[#1a2035] bg-[#1a2035] px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#d4a843]">
            {['Finalidade: Todos','Venda','Locação','Temporada'].map(o => <option key={o}>{o}</option>)}
          </select>
          <div className="flex items-center gap-1 border border-[#1a2035] rounded-md p-0.5">
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-[#d4a843]/20 text-[#d4a843]' : 'text-foreground/40'}`}><List className="h-4 w-4" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-[#d4a843]/20 text-[#d4a843]' : 'text-foreground/40'}`}><Grid className="h-4 w-4" /></button>
          </div>
        </div>

        {viewMode === 'table' ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1a2035]">
                    {['Código','Imóvel','Tipo','Finalidade','Preço','Bairro','Status','Portais','Ações'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-foreground/50 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2035]">
                  {paginated.map(p => (
                    <tr key={p.id} className="hover:bg-[#1a2035]/40 transition-colors">
                      <td className="px-4 py-3 text-xs text-[#d4a843] font-mono font-semibold">{p.code}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-[#1a2035] flex items-center justify-center shrink-0">
                            <Building2 className="h-5 w-5 text-foreground/30" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground/90 max-w-44 truncate">{p.title}</p>
                            <p className="text-[10px] text-foreground/40 mt-0.5">{p.area}m² · {p.beds > 0 ? `${p.beds} qts` : ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground/70">{p.type}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${purposeColors[p.purpose]}`}>{p.purpose}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#f8f6f0]">
                        {p.purpose !== 'Venda' ? `R$ ${p.price.toLocaleString('pt-BR')}/mês` : `R$ ${(p.price/1000).toFixed(0)}k`}
                      </td>
                      <td className="px-4 py-3 text-xs text-foreground/60">
                        <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.neighborhood}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusColors[p.status]}>{p.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {p.portals.length === 0 ? <span className="text-[10px] text-foreground/30">—</span> :
                          <div className="flex gap-1">{p.portals.map(por => <span key={por} className="text-[9px] px-1.5 py-0.5 rounded bg-[#1a2035] text-foreground/60">{por}</span>)}</div>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded hover:bg-[#1a2035] transition-colors"><Edit className="h-3.5 w-3.5 text-foreground/50 hover:text-[#d4a843]" /></button>
                          <button className="p-1.5 rounded hover:bg-[#1a2035] transition-colors"><Globe className="h-3.5 w-3.5 text-foreground/50 hover:text-blue-400" /></button>
                          <button className="p-1.5 rounded hover:bg-[#1a2035] transition-colors"><Copy className="h-3.5 w-3.5 text-foreground/50" /></button>
                          <button className="p-1.5 rounded hover:bg-[#1a2035] transition-colors"><EyeOff className="h-3.5 w-3.5 text-foreground/50 hover:text-amber-400" /></button>
                          <button className="p-1.5 rounded hover:bg-[#1a2035] transition-colors"><Trash2 className="h-3.5 w-3.5 text-foreground/50 hover:text-red-400" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#1a2035]">
              <p className="text-xs text-foreground/50">Mostrando {(currentPage-1)*itemsPerPage+1}–{Math.min(currentPage*itemsPerPage, filtered.length)} de {filtered.length}</p>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1}><ChevronLeft className="h-4 w-4" /></Button>
                {Array.from({length: totalPages}, (_,i) => i+1).map(page => (
                  <Button key={page} variant={currentPage===page ? 'default' : 'ghost'} size="sm" className="w-8 h-8 p-0 text-xs" onClick={() => setCurrentPage(page)}>{page}</Button>
                ))}
                <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginated.map(p => (
              <Card key={p.id} className="overflow-hidden">
                <div className="h-40 bg-[#1a2035] flex items-center justify-center relative">
                  <Building2 className="h-16 w-16 text-foreground/10" />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge variant={statusColors[p.status]} className="text-[10px]">{p.status}</Badge>
                  </div>
                  <span className="absolute top-2 right-2 text-[10px] text-[#d4a843] font-mono bg-[#0a0e1a]/80 px-1.5 py-0.5 rounded">{p.code}</span>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm font-semibold truncate">{p.title}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-foreground/50"><MapPin className="h-3 w-3" />{p.neighborhood}, {p.city}</div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-foreground/60">
                    {p.beds > 0 && <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{p.beds}</span>}
                    {p.baths > 0 && <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{p.baths}</span>}
                    {p.parking > 0 && <span className="flex items-center gap-1"><Car className="h-3 w-3" />{p.parking}</span>}
                    <span>{p.area}m²</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-base font-bold text-[#d4a843]">
                      {p.purpose === 'Venda' ? `R$ ${(p.price/1000).toFixed(0)}k` : `R$ ${p.price.toLocaleString()}/mês`}
                    </p>
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded hover:bg-[#1a2035]"><Edit className="h-3.5 w-3.5 text-foreground/50" /></button>
                      <button className="p-1.5 rounded hover:bg-[#1a2035]"><Globe className="h-3.5 w-3.5 text-foreground/50" /></button>
                      <button className="p-1.5 rounded hover:bg-[#1a2035]"><Trash2 className="h-3.5 w-3.5 text-foreground/50 hover:text-red-400" /></button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <PropertyFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </DashboardLayout>
  )
}
