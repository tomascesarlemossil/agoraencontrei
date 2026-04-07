import React, { useState, useMemo, useEffect, useRef } from 'react'
import { TrendingUp, Home, Calculator, ChevronRight, Sparkles, DollarSign, Clock, Percent } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// Animated counter hook
function useAnimatedNumber(target: number, duration = 600) {
  const [current, setCurrent] = useState(target)
  const prevTarget = useRef(target)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const start = prevTarget.current
    const end = target
    const diff = end - start
    if (diff === 0) return

    const startTime = performance.now()
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3) // ease out cubic
      setCurrent(Math.round(start + diff * ease))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        prevTarget.current = end
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return current
}

interface SimulationResult {
  monthlyPayment: number
  totalAmount: number
  totalInterest: number
  financedAmount: number
  entryAmount: number
}

function calculateFinancing(
  propertyValue: number,
  entryPercent: number,
  termYears: number,
  annualRate: number
): SimulationResult {
  const entryAmount = propertyValue * (entryPercent / 100)
  const financedAmount = propertyValue - entryAmount
  const monthlyRate = annualRate / 100 / 12
  const months = termYears * 12

  let monthlyPayment: number
  if (monthlyRate === 0) {
    monthlyPayment = financedAmount / months
  } else {
    monthlyPayment =
      (financedAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1)
  }

  const totalAmount = monthlyPayment * months + entryAmount
  const totalInterest = totalAmount - propertyValue

  return {
    monthlyPayment,
    totalAmount,
    totalInterest,
    financedAmount,
    entryAmount,
  }
}

const MCMV_FAIXAS = [
  { label: 'Faixa 1 (até R$ 2.640)', rate: 4.75, subsidy: 55000 },
  { label: 'Faixa 1.5 (até R$ 4.400)', rate: 5.0, subsidy: 29000 },
  { label: 'Faixa 2 (até R$ 8.000)', rate: 6.5, subsidy: 0 },
]

type SimMode = 'convencional' | 'mcmv' | 'caixa'

interface ResultCardProps {
  icon: React.ElementType
  label: string
  value: number
  accent?: boolean
  monthly?: boolean
}

function ResultCard({ icon: Icon, label, value, accent, monthly }: ResultCardProps) {
  const animated = useAnimatedNumber(value)
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 p-4 rounded-xl border transition-all duration-200',
        accent
          ? 'bg-gold-500/10 border-gold-500/25'
          : 'bg-navy-900 border-navy-800'
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', accent ? 'text-gold-400' : 'text-foreground/40')} />
        <span className="text-xs text-foreground/55 font-sans">{label}</span>
      </div>
      <span className={cn(
        'text-xl font-display font-bold',
        accent ? 'text-gold-400' : 'text-foreground'
      )}>
        {formatCurrency(animated)}
        {monthly && <span className="text-sm font-sans font-normal text-foreground/50">/mês</span>}
      </span>
    </div>
  )
}

interface SliderFieldProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
  suffix?: string
}

function SliderField({ label, value, min, max, step, format, onChange }: SliderFieldProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground/70 font-sans">{label}</span>
        <span className="text-sm font-semibold text-gold-400 font-sans bg-gold-500/10 px-2.5 py-0.5 rounded-full border border-gold-500/20">
          {format(value)}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
      />
      <div className="flex justify-between text-xs text-foreground/30 font-sans">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  )
}

export function InvestmentSimulator() {
  const [mode, setMode] = useState<SimMode>('convencional')

  // Convencional state
  const [convPropertyValue, setConvPropertyValue] = useState(450000)
  const [convEntry, setConvEntry] = useState(20)
  const [convTerm, setConvTerm] = useState(20)
  const [convRate, setConvRate] = useState(10.5)

  // MCMV state
  const [mcmvPropertyValue, setMcmvPropertyValue] = useState(250000)
  const [mcmvEntry, setMcmvEntry] = useState(15)
  const [mcmvTerm, setMcmvTerm] = useState(30)
  const [mcmvFaixa, setMcmvFaixa] = useState(0)

  // Caixa state
  const [caixaPropertyValue, setCaixaPropertyValue] = useState(600000)
  const [caixaEntry, setCaixaEntry] = useState(25)
  const [caixaTerm, setCaixaTerm] = useState(25)
  const [caixaRate] = useState(9.8)

  // Rent income simulator
  const [rentYield, setRentYield] = useState(0.5)

  const convResult = useMemo(
    () => calculateFinancing(convPropertyValue, convEntry, convTerm, convRate),
    [convPropertyValue, convEntry, convTerm, convRate]
  )

  const mcmvSubsidy = MCMV_FAIXAS[mcmvFaixa].subsidy
  const mcmvRate = MCMV_FAIXAS[mcmvFaixa].rate
  const mcmvEffectiveValue = Math.max(0, mcmvPropertyValue - mcmvSubsidy)
  const mcmvResult = useMemo(
    () => calculateFinancing(mcmvEffectiveValue, mcmvEntry, mcmvTerm, mcmvRate),
    [mcmvEffectiveValue, mcmvEntry, mcmvTerm, mcmvRate]
  )

  const caixaResult = useMemo(
    () => calculateFinancing(caixaPropertyValue, caixaEntry, caixaTerm, caixaRate),
    [caixaPropertyValue, caixaEntry, caixaTerm, caixaRate]
  )

  const currentPropertyValue =
    mode === 'convencional' ? convPropertyValue : mode === 'mcmv' ? mcmvPropertyValue : caixaPropertyValue
  const rentMonthly = (currentPropertyValue * rentYield) / 100
  const rentROI = (rentMonthly * 12 / currentPropertyValue) * 100
  const rentPayback = currentPropertyValue / (rentMonthly * 12)

  const whatsappUrl = `https://wa.me/5516981010004?text=${encodeURIComponent(
    'Olá! Fiz uma simulação de financiamento e gostaria de conversar com um especialista.'
  )}`

  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <Badge variant="default" className="mb-4 gap-1.5">
            <Sparkles className="h-3 w-3" />
            Simulador Inteligente
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Simule seu{' '}
            <span className="text-gold-400">Financiamento</span>
          </h2>
          <p className="text-foreground/60 font-sans max-w-xl mx-auto">
            Calcule parcelas, compare modalidades e descubra o melhor caminho para realizar
            o sonho do imóvel próprio.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left Panel - Inputs */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-gold-400" />
                  Parâmetros da Simulação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <Tabs value={mode} onValueChange={(v) => setMode(v as SimMode)}>
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="convencional" className="text-xs">Convencional</TabsTrigger>
                    <TabsTrigger value="mcmv" className="text-xs">Minha Casa</TabsTrigger>
                    <TabsTrigger value="caixa" className="text-xs">Caixa CEF</TabsTrigger>
                  </TabsList>

                  {/* Convencional Tab */}
                  <TabsContent value="convencional" className="space-y-6 mt-6">
                    <SliderField
                      label="Valor do imóvel"
                      value={convPropertyValue}
                      min={100000}
                      max={5000000}
                      step={10000}
                      format={(v) => formatCurrency(v)}
                      onChange={setConvPropertyValue}
                    />
                    <SliderField
                      label="Entrada"
                      value={convEntry}
                      min={10}
                      max={80}
                      step={1}
                      format={(v) => `${v}% — ${formatCurrency((convPropertyValue * v) / 100)}`}
                      onChange={setConvEntry}
                    />
                    <SliderField
                      label="Prazo"
                      value={convTerm}
                      min={5}
                      max={35}
                      step={1}
                      format={(v) => `${v} anos`}
                      onChange={setConvTerm}
                    />
                    <SliderField
                      label="Taxa de juros (a.a.)"
                      value={convRate}
                      min={6}
                      max={18}
                      step={0.1}
                      format={(v) => `${v.toFixed(1)}%`}
                      onChange={setConvRate}
                    />
                  </TabsContent>

                  {/* MCMV Tab */}
                  <TabsContent value="mcmv" className="space-y-6 mt-6">
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-sans">
                      Programa Minha Casa Minha Vida — taxas subsidiadas pelo governo federal.
                    </div>

                    {/* Faixa selector */}
                    <div className="space-y-2">
                      <span className="text-sm text-foreground/70 font-sans">Faixa de renda</span>
                      <div className="space-y-2">
                        {MCMV_FAIXAS.map((f, i) => (
                          <button
                            key={i}
                            onClick={() => setMcmvFaixa(i)}
                            className={cn(
                              'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all duration-150 font-sans',
                              mcmvFaixa === i
                                ? 'bg-gold-500/10 border-gold-500/30 text-gold-400'
                                : 'bg-navy-900 border-navy-700 text-foreground/60 hover:border-navy-600 hover:text-foreground'
                            )}
                          >
                            <span>{f.label}</span>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-foreground/40">{f.rate}% a.a.</span>
                              {f.subsidy > 0 && (
                                <Badge variant="success" className="text-[10px]">
                                  -{formatCurrency(f.subsidy)} subsídio
                                </Badge>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <SliderField
                      label="Valor do imóvel"
                      value={mcmvPropertyValue}
                      min={100000}
                      max={350000}
                      step={5000}
                      format={(v) => formatCurrency(v)}
                      onChange={setMcmvPropertyValue}
                    />
                    {mcmvSubsidy > 0 && (
                      <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <span className="text-xs text-emerald-300 font-sans">Valor após subsídio</span>
                        <span className="text-sm font-bold text-emerald-400 font-display">
                          {formatCurrency(mcmvEffectiveValue)}
                        </span>
                      </div>
                    )}
                    <SliderField
                      label="Entrada"
                      value={mcmvEntry}
                      min={5}
                      max={50}
                      step={1}
                      format={(v) => `${v}% — ${formatCurrency((mcmvPropertyValue * v) / 100)}`}
                      onChange={setMcmvEntry}
                    />
                    <SliderField
                      label="Prazo"
                      value={mcmvTerm}
                      min={10}
                      max={35}
                      step={1}
                      format={(v) => `${v} anos`}
                      onChange={setMcmvTerm}
                    />
                  </TabsContent>

                  {/* Caixa CEF Tab */}
                  <TabsContent value="caixa" className="space-y-6 mt-6">
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 font-sans">
                      Financiamento Caixa Econômica Federal — Sistema de Amortização Constante (SAC).
                    </div>
                    <div className="flex items-center justify-between p-3 bg-navy-900 rounded-lg border border-navy-800">
                      <span className="text-sm text-foreground/60 font-sans">Taxa Caixa (a.a.)</span>
                      <span className="text-sm font-bold text-gold-400 font-display">{caixaRate}%</span>
                    </div>
                    <SliderField
                      label="Valor do imóvel"
                      value={caixaPropertyValue}
                      min={100000}
                      max={5000000}
                      step={10000}
                      format={(v) => formatCurrency(v)}
                      onChange={setCaixaPropertyValue}
                    />
                    <SliderField
                      label="Entrada"
                      value={caixaEntry}
                      min={20}
                      max={80}
                      step={1}
                      format={(v) => `${v}% — ${formatCurrency((caixaPropertyValue * v) / 100)}`}
                      onChange={setCaixaEntry}
                    />
                    <SliderField
                      label="Prazo"
                      value={caixaTerm}
                      min={5}
                      max={35}
                      step={1}
                      format={(v) => `${v} anos`}
                      onChange={setCaixaTerm}
                    />
                  </TabsContent>
                </Tabs>

                <Separator gold />

                {/* Rent Income Simulator */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gold-400" />
                    <span className="text-sm font-semibold text-foreground font-sans">
                      Rendimento por Aluguel
                    </span>
                  </div>
                  <SliderField
                    label="Taxa de rendimento aluguel"
                    value={rentYield}
                    min={0.3}
                    max={1.5}
                    step={0.05}
                    format={(v) => `${v.toFixed(2)}%/mês`}
                    onChange={setRentYield}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 bg-navy-900 rounded-lg border border-navy-800 text-center">
                      <p className="text-xs text-foreground/40 font-sans">Aluguel est.</p>
                      <p className="text-sm font-bold text-emerald-400 font-sans mt-0.5">
                        {formatCurrency(rentMonthly)}/mês
                      </p>
                    </div>
                    <div className="p-2.5 bg-navy-900 rounded-lg border border-navy-800 text-center">
                      <p className="text-xs text-foreground/40 font-sans">ROI anual</p>
                      <p className="text-sm font-bold text-gold-400 font-sans mt-0.5">
                        {rentROI.toFixed(2)}%
                      </p>
                    </div>
                    <div className="p-2.5 bg-navy-900 rounded-lg border border-navy-800 text-center">
                      <p className="text-xs text-foreground/40 font-sans">Payback</p>
                      <p className="text-sm font-bold text-foreground font-sans mt-0.5">
                        {rentPayback.toFixed(1)} anos
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-gold-500/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Home className="h-4 w-4 text-gold-400" />
                  Resultado da Simulação
                </CardTitle>
                <CardDescription>
                  {mode === 'convencional' && 'Financiamento Convencional'}
                  {mode === 'mcmv' && `MCMV — ${MCMV_FAIXAS[mcmvFaixa].label}`}
                  {mode === 'caixa' && 'Caixa Econômica Federal'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Main results */}
                {mode === 'convencional' && (
                  <>
                    <ResultCard icon={DollarSign} label="Parcela mensal estimada" value={convResult.monthlyPayment} accent monthly />
                    <ResultCard icon={DollarSign} label="Total financiado" value={convResult.financedAmount} />
                    <ResultCard icon={DollarSign} label="Total a pagar" value={convResult.totalAmount} />
                    <ResultCard icon={Percent} label="Total em juros" value={convResult.totalInterest} />
                  </>
                )}
                {mode === 'mcmv' && (
                  <>
                    <ResultCard icon={DollarSign} label="Parcela mensal estimada" value={mcmvResult.monthlyPayment} accent monthly />
                    <ResultCard icon={DollarSign} label="Total financiado" value={mcmvResult.financedAmount} />
                    <ResultCard icon={DollarSign} label="Total a pagar" value={mcmvResult.totalAmount} />
                    <ResultCard icon={Percent} label="Total em juros" value={mcmvResult.totalInterest} />
                    {mcmvSubsidy > 0 && (
                      <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <p className="text-xs text-emerald-300 font-sans text-center">
                          Economia com subsídio:{' '}
                          <span className="font-bold">{formatCurrency(mcmvSubsidy)}</span>
                        </p>
                      </div>
                    )}
                  </>
                )}
                {mode === 'caixa' && (
                  <>
                    <ResultCard icon={DollarSign} label="Parcela mensal estimada" value={caixaResult.monthlyPayment} accent monthly />
                    <ResultCard icon={DollarSign} label="Total financiado" value={caixaResult.financedAmount} />
                    <ResultCard icon={DollarSign} label="Total a pagar" value={caixaResult.totalAmount} />
                    <ResultCard icon={Percent} label="Total em juros" value={caixaResult.totalInterest} />
                  </>
                )}

                <div className="pt-1 space-y-1.5">
                  <p className="text-xs text-foreground/30 font-sans text-center leading-relaxed">
                    * Valores estimados pelo sistema Price. Consulte um especialista para simulação completa.
                  </p>
                </div>

                <Button className="w-full gap-2 mt-2" asChild>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    Simular Financiamento Completo
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Quick stats */}
            <div className="p-4 bg-navy-900/50 rounded-xl border border-navy-800/60 space-y-2.5">
              <p className="text-xs font-semibold text-foreground/40 uppercase tracking-wider font-sans">
                Por que financiar com a Lemos?
              </p>
              {[
                'Parceria com os principais bancos',
                'Assessoria completa e gratuita',
                'Aprovação rápida em até 5 dias',
                'Documentação facilitada',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-gold-400 shrink-0" />
                  <span className="text-xs text-foreground/60 font-sans">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
