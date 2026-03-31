import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  Sparkles,
  MapPin,
  Home,
  BedDouble,
  Bath,
  Car,
  Waves,
  Trees,
  Dumbbell,
  Zap,
  Download,
  Share2,
  Eye,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Star,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { cn } from '@/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────

type PropertyType = 'apartamento' | 'casa' | 'sala_comercial' | 'terreno' | 'galpao' | 'chacara'

interface ValuationForm {
  cep: string
  rua: string
  numero: string
  bairro: string
  cidade: string
  type: PropertyType | ''
  areaTotal: string
  areaConstruida: string
  quartos: string
  banheiros: string
  vagas: string
  amenidades: string[]
}

interface Comparable {
  address: string
  area: number
  price: number
  pricePerM2: number
  date: string
  status: 'vendido' | 'listado'
}

interface ValuationResult {
  address: string
  type: string
  priceMin: number
  priceMax: number
  recommended: number
  pricePerM2: number
  area: number
  comparables: Comparable[]
  analysis: string
  confidence: 'alta' | 'média' | 'baixa'
}

interface PastValuation {
  id: number
  address: string
  type: string
  date: string
  priceMin: number
  priceMax: number
  status: 'completo' | 'pendente'
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const mockComparables: Comparable[] = [
  { address: 'R. das Acácias, 145, Jardim Paulista', area: 145, price: 492000, pricePerM2: 3393, date: 'Jan/2025', status: 'vendido' },
  { address: 'R. das Flores, 78, Jardim Paulista', area: 138, price: 455000, pricePerM2: 3297, date: 'Fev/2025', status: 'vendido' },
  { address: 'Av. Champagnat, 320, Jardim Paulista', area: 152, price: 510000, pricePerM2: 3355, date: 'Mar/2025', status: 'listado' },
  { address: 'R. Orquídeas, 220, Jardim Paulista', area: 141, price: 478000, pricePerM2: 3390, date: 'Dez/2024', status: 'vendido' },
  { address: 'R. Acácias, 302, Jardim Paulista', area: 148, price: 499000, pricePerM2: 3372, date: 'Mar/2025', status: 'listado' },
]

const mockResult: ValuationResult = {
  address: 'R. das Rosas, 150, Jardim Paulista, Franca – SP',
  type: 'Apartamento',
  priceMin: 465000,
  priceMax: 510000,
  recommended: 487500,
  pricePerM2: 3250,
  area: 150,
  comparables: mockComparables,
  analysis: 'O imóvel está localizado no Jardim Paulista, bairro de alta demanda em Franca com valorização consistente de 12% ao ano. A análise de 5 comparáveis recentes indica forte liquidez para imóveis desta tipologia na região. O mercado local apresenta escassez de oferta, com imóveis similares sendo absorvidos em média em 45 dias. A proximidade de escolas, supermercados e o Franca Shopping contribuem positivamente para o valor. Recomendamos precificar próximo ao valor central de R$ 487.500 para máxima velocidade de venda sem perda de valor.',
  confidence: 'alta',
}

const pastValuations: PastValuation[] = [
  { id: 1, address: 'Av. Dr. Gurgel, 1200, Centro', type: 'Sala Comercial', date: '15/03/2025', priceMin: 280000, priceMax: 320000, status: 'completo' },
  { id: 2, address: 'R. Rui Barbosa, 88, Vila Nova', type: 'Casa', date: '10/03/2025', priceMin: 380000, priceMax: 420000, status: 'completo' },
  { id: 3, address: 'Av. Champagnat, 500, Jardim Europa', type: 'Apartamento', date: '05/03/2025', priceMin: 620000, priceMax: 680000, status: 'completo' },
  { id: 4, address: 'Rod. Franca-Ribeirão, Km 8', type: 'Chácara', date: '28/02/2025', priceMin: 750000, priceMax: 900000, status: 'completo' },
  { id: 5, address: 'R. São João, 300, Vila Aparecida', type: 'Apartamento', date: '20/02/2025', priceMin: 245000, priceMax: 280000, status: 'completo' },
]

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'casa', label: 'Casa' },
  { value: 'sala_comercial', label: 'Sala Comercial' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'galpao', label: 'Galpão' },
  { value: 'chacara', label: 'Chácara' },
]

const amenidadesList = [
  { value: 'piscina', label: 'Piscina', icon: Waves },
  { value: 'garagem', label: 'Garagem Coberta', icon: Car },
  { value: 'jardim', label: 'Jardim/Quintal', icon: Trees },
  { value: 'academia', label: 'Academia', icon: Dumbbell },
  { value: 'solar', label: 'Energia Solar', icon: Zap },
  { value: 'portaria', label: 'Portaria 24h', icon: Star },
]

const aiSteps = [
  'Analisando localização...',
  'Buscando comparáveis de mercado...',
  'Calculando estimativa de valor...',
  'Gerando relatório completo...',
]

// ── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f1525] border border-[#1a2035] rounded-lg p-3 shadow-xl">
        <p className="text-xs text-foreground/60 mb-1 max-w-[140px] truncate">{label}</p>
        <p className="text-xs font-medium text-[#d4a843]">R$ {payload[0].value.toLocaleString('pt-BR')}/m²</p>
      </div>
    )
  }
  return null
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function Valuations() {
  const [form, setForm] = useState<ValuationForm>({
    cep: '', rua: '', numero: '', bairro: '', cidade: 'Franca',
    type: '', areaTotal: '', areaConstruida: '', quartos: '', banheiros: '', vagas: '',
    amenidades: [],
  })
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [result, setResult] = useState<ValuationResult | null>(null)
  const [showAllComparables, setShowAllComparables] = useState(false)

  const updateForm = (field: keyof ValuationForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleAmenidade = (value: string) => {
    setForm((prev) => ({
      ...prev,
      amenidades: prev.amenidades.includes(value)
        ? prev.amenidades.filter((a) => a !== value)
        : [...prev.amenidades, value],
    }))
  }

  const handleCEP = (cep: string) => {
    updateForm('cep', cep)
    if (cep.replace(/\D/g, '').length === 8) {
      // Mock auto-fill
      setTimeout(() => {
        setForm((prev) => ({
          ...prev,
          cep,
          rua: 'R. das Rosas',
          bairro: 'Jardim Paulista',
          cidade: 'Franca',
        }))
      }, 400)
    }
  }

  const handleEvaluate = () => {
    setLoading(true)
    setLoadingStep(0)
    setResult(null)
    let step = 0
    const interval = setInterval(() => {
      step++
      setLoadingStep(step)
      if (step >= aiSteps.length - 1) {
        clearInterval(interval)
        setTimeout(() => {
          setLoading(false)
          setResult(mockResult)
        }, 700)
      }
    }, 800)
  }

  const chartData = [
    { label: 'Este imóvel', value: mockResult.pricePerM2, isSubject: true },
    ...mockComparables.map((c, i) => ({
      label: `Comp. ${i + 1}`,
      value: c.pricePerM2,
      isSubject: false,
    })),
  ]

  const confidenceConfig = {
    alta: { label: 'Alta confiança', variant: 'success' as const },
    média: { label: 'Média confiança', variant: 'warning' as const },
    baixa: { label: 'Baixa confiança', variant: 'destructive' as const },
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-[#f8f6f0] flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-[#d4a843]" />
              Avaliação de Imóveis com IA
            </h1>
            <p className="text-sm text-foreground/50 mt-0.5 font-sans">
              Precifique imóveis com precisão usando comparativos de mercado em tempo real
            </p>
          </div>
          <Badge variant="default" className="gap-1.5">
            <Zap className="h-3 w-3" />
            IA Ativa
          </Badge>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-sans font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#d4a843]" />
              Nova Avaliação
            </CardTitle>
            <CardDescription>Preencha os dados do imóvel para obter uma estimativa precisa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Address */}
            <div>
              <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-3 flex items-center gap-1.5"><MapPin className="h-3 w-3" />Endereço</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Input
                  label="CEP"
                  placeholder="14400-000"
                  value={form.cep}
                  onChange={(e) => handleCEP(e.target.value)}
                  className="font-mono"
                />
                <div className="lg:col-span-2">
                  <Input label="Rua" placeholder="Nome da rua" value={form.rua} onChange={(e) => updateForm('rua', e.target.value)} />
                </div>
                <Input label="Número" placeholder="150" value={form.numero} onChange={(e) => updateForm('numero', e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <Input label="Bairro" placeholder="Ex: Jardim Paulista" value={form.bairro} onChange={(e) => updateForm('bairro', e.target.value)} />
                <Input label="Cidade" placeholder="Franca" value={form.cidade} onChange={(e) => updateForm('cidade', e.target.value)} />
              </div>
            </div>

            {/* Property Details */}
            <div>
              <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Home className="h-3 w-3" />Características</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground/80 mb-1.5 block font-sans">Tipo de imóvel</label>
                  <Select value={form.type} onValueChange={(v) => updateForm('type', v)}>
                    <SelectTrigger><SelectValue placeholder="Selecionar tipo..." /></SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input label="Área Total (m²)" placeholder="Ex: 150" type="number" value={form.areaTotal} onChange={(e) => updateForm('areaTotal', e.target.value)} />
                <Input label="Área Construída (m²)" placeholder="Ex: 140" type="number" value={form.areaConstruida} onChange={(e) => updateForm('areaConstruida', e.target.value)} />
              </div>
            </div>

            {/* Rooms */}
            <div>
              <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-3">Cômodos</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground/70 mb-1.5 flex items-center gap-1.5 block"><BedDouble className="h-3.5 w-3.5" />Quartos</label>
                  <Select value={form.quartos} onValueChange={(v) => updateForm('quartos', v)}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {['1', '2', '3', '4', '5+'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/70 mb-1.5 flex items-center gap-1.5 block"><Bath className="h-3.5 w-3.5" />Banheiros</label>
                  <Select value={form.banheiros} onValueChange={(v) => updateForm('banheiros', v)}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {['1', '2', '3', '4', '5+'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground/70 mb-1.5 flex items-center gap-1.5 block"><Car className="h-3.5 w-3.5" />Vagas</label>
                  <Select value={form.vagas} onValueChange={(v) => updateForm('vagas', v)}>
                    <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {['0', '1', '2', '3', '4+'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Amenidades */}
            <div>
              <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-3">Amenidades</p>
              <div className="flex flex-wrap gap-2">
                {amenidadesList.map((a) => {
                  const Icon = a.icon
                  const active = form.amenidades.includes(a.value)
                  return (
                    <button
                      key={a.value}
                      onClick={() => toggleAmenidade(a.value)}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all',
                        active
                          ? 'border-[#d4a843]/50 bg-[#d4a843]/10 text-[#d4a843]'
                          : 'border-navy-700 text-foreground/50 hover:border-navy-600 hover:text-foreground/70'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {a.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Evaluate Button */}
            <button
              onClick={handleEvaluate}
              disabled={loading}
              className="w-full h-13 rounded-xl font-display text-base font-semibold text-navy-950 bg-gradient-to-r from-[#f5d97a] via-[#d4a017] to-[#b8860b] hover:brightness-110 hover:shadow-lg hover:shadow-[#d4a843]/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 py-3.5"
              style={{ height: '52px' }}
            >
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin" />Avaliando com IA...</>
              ) : (
                <><Sparkles className="h-5 w-5" />Avaliar com IA</>
              )}
            </button>

            {/* Loading steps */}
            {loading && (
              <div className="space-y-2">
                {aiSteps.map((step, i) => (
                  <div key={step} className={cn('flex items-center gap-2.5 transition-all duration-500', i > loadingStep ? 'opacity-30' : 'opacity-100')}>
                    {i < loadingStep ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : i === loadingStep ? (
                      <Loader2 className="h-4 w-4 text-[#d4a843] animate-spin shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-navy-700 shrink-0" />
                    )}
                    <span className={cn('text-sm', i <= loadingStep ? 'text-foreground/80' : 'text-foreground/30')}>{step}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Card */}
        {result && (
          <div className="space-y-4 animate-fade-in-up">
            {/* Price Result */}
            <Card className="border-[#d4a843]/30 bg-gradient-to-br from-navy-900 to-navy-950">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-foreground/50 font-sans uppercase tracking-wider mb-1">Resultado da Avaliação</p>
                    <p className="text-sm text-foreground/70 font-sans">{result.address}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={confidenceConfig[result.confidence].variant}>
                      {confidenceConfig[result.confidence].label}
                    </Badge>
                    <Button variant="outline" size="sm" className="gap-1.5 h-8"><Share2 className="h-3.5 w-3.5" />Compartilhar</Button>
                    <Button variant="outline" size="sm" className="gap-1.5 h-8"><Download className="h-3.5 w-3.5" />Exportar PDF</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Price range */}
                <div className="text-center py-6">
                  <p className="text-xs text-foreground/50 uppercase tracking-wider mb-2 font-sans">Faixa estimada de valor</p>
                  <p
                    className="text-4xl font-display font-bold mb-3"
                    style={{ background: 'linear-gradient(90deg, #f5d97a, #d4a017)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                  >
                    {formatCurrency(result.priceMin)} — {formatCurrency(result.priceMax)}
                  </p>
                  <div className="flex items-center justify-center gap-6 mb-2">
                    <div className="text-center">
                      <p className="text-xs text-foreground/50">Valor recomendado</p>
                      <p className="text-2xl font-display font-bold text-[#d4a843]">{formatCurrency(result.recommended)}</p>
                    </div>
                    <div className="w-px h-10 bg-navy-700" />
                    <div className="text-center">
                      <p className="text-xs text-foreground/50">Preço por m²</p>
                      <p className="text-2xl font-display font-bold text-foreground/90">R$ {result.pricePerM2.toLocaleString('pt-BR')}/m²</p>
                    </div>
                    <div className="w-px h-10 bg-navy-700" />
                    <div className="text-center">
                      <p className="text-xs text-foreground/50">Área avaliada</p>
                      <p className="text-2xl font-display font-bold text-foreground/90">{result.area} m²</p>
                    </div>
                  </div>

                  {/* Range bar */}
                  <div className="max-w-sm mx-auto mt-4">
                    <div className="h-2 rounded-full bg-navy-800 relative">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#b8860b] via-[#d4a843] to-[#f5d97a]" style={{ left: '10%', right: '10%' }} />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#d4a843] border-2 border-navy-950 shadow"
                        style={{ left: '50%', transform: 'translate(-50%, -50%)' }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-foreground/40 mt-1">
                      <span>{formatCurrency(result.priceMin)}</span>
                      <span className="text-[#d4a843]">{formatCurrency(result.recommended)} ★</span>
                      <span>{formatCurrency(result.priceMax)}</span>
                    </div>
                  </div>
                </div>

                {/* Market analysis */}
                <div className="p-4 rounded-xl bg-navy-800/50 border border-navy-700 mb-5">
                  <p className="text-xs font-semibold text-foreground/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-[#d4a843]" />Análise de Mercado
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{result.analysis}</p>
                </div>

                {/* Comparables */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5"><BarChart2 className="h-4 w-4 text-[#d4a843]" />Imóveis Comparáveis</p>
                    <button
                      onClick={() => setShowAllComparables(!showAllComparables)}
                      className="text-xs text-[#d4a843] flex items-center gap-1 hover:underline"
                    >
                      {showAllComparables ? 'Mostrar menos' : 'Ver todos'}
                      {showAllComparables ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-navy-700">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead>
                        <tr className="bg-navy-800/50 border-b border-navy-700">
                          {['Endereço', 'Área', 'Valor', 'R$/m²', 'Data', 'Status'].map((h) => (
                            <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(showAllComparables ? result.comparables : result.comparables.slice(0, 3)).map((c, i) => {
                          const diff = ((c.pricePerM2 - result.pricePerM2) / result.pricePerM2 * 100)
                          return (
                            <tr key={i} className={cn('border-b border-navy-800/50 hover:bg-navy-800/20 transition-colors', i % 2 !== 0 && 'bg-navy-900/20')}>
                              <td className="px-4 py-2.5 text-foreground/80 max-w-[180px]">
                                <p className="truncate text-xs">{c.address}</p>
                              </td>
                              <td className="px-4 py-2.5 text-foreground/70 text-xs">{c.area} m²</td>
                              <td className="px-4 py-2.5 font-semibold text-foreground/90 text-xs">{formatCurrency(c.price)}</td>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-semibold text-foreground/90">R$ {c.pricePerM2.toLocaleString('pt-BR')}</span>
                                  {Math.abs(diff) > 0.5 && (
                                    diff > 0
                                      ? <TrendingUp className="h-3 w-3 text-emerald-400" />
                                      : <TrendingDown className="h-3 w-3 text-red-400" />
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-2.5 text-foreground/50 text-xs">{c.date}</td>
                              <td className="px-4 py-2.5">
                                <Badge
                                  variant={c.status === 'vendido' ? 'success' : 'info'}
                                  className="text-[10px] capitalize"
                                >
                                  {c.status}
                                </Badge>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Chart */}
                <div className="mt-5">
                  <p className="text-sm font-semibold text-foreground/80 mb-3 flex items-center gap-1.5"><BarChart2 className="h-4 w-4 text-[#d4a843]" />Comparativo de Preço por m²</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a2035" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.isSubject ? '#d4a843' : '#1a4d7c'} fillOpacity={entry.isSubject ? 1 : 0.7} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 justify-center mt-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-[#d4a843]" />
                      <span className="text-[10px] text-foreground/50">Este imóvel</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-[#1a4d7c]" />
                      <span className="text-[10px] text-foreground/50">Comparáveis</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* History */}
        <Card>
          <CardHeader className="pb-4 flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-sans font-semibold">Histórico de Avaliações</CardTitle>
              <CardDescription>{pastValuations.length} avaliações realizadas</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-800 bg-navy-900/30">
                    {['Endereço', 'Tipo', 'Data', 'Faixa de Valor', 'Status', 'Ações'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-foreground/40 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pastValuations.map((v, i) => (
                    <tr
                      key={v.id}
                      className={cn(
                        'border-b border-navy-800/50 hover:bg-navy-800/20 transition-colors',
                        i % 2 !== 0 && 'bg-navy-900/20'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-foreground/30 shrink-0" />
                          <p className="text-sm text-foreground/90 max-w-[180px] truncate">{v.address}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary" className="text-xs">{v.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-foreground/60 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          {v.date}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[#d4a843] text-xs">
                          {formatCurrency(v.priceMin)} — {formatCurrency(v.priceMax)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={v.status === 'completo' ? 'success' : 'warning'} className="text-xs">
                          {v.status === 'completo' ? 'Completo' : 'Pendente'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs h-7 text-[#d4a843] hover:text-[#d4a843]"
                          onClick={() => setResult(mockResult)}
                        >
                          <Eye className="h-3 w-3" />
                          Ver resultado
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
