'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

/* ------------------------------------------------------------------ */
/*  SEO — exported from a separate file would be cleaner, but Next.js */
/*  allows metadata exports only from server components.  We use a    */
/*  <head> approach via next/head is not available in app-router, so  */
/*  we place metadata in a layout or generate it via generateMetadata */
/*  in a wrapper.  For now we set <title> directly.                   */
/* ------------------------------------------------------------------ */

// ---- helpers -------------------------------------------------------

function fmt(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function fmtInt(value: number): string {
  return Math.round(value).toLocaleString('pt-BR')
}

function toBRLInput(cents: number): string {
  if (cents === 0) return ''
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// ---- calculation ---------------------------------------------------

interface SimResult {
  firstInstallment: number
  lastInstallment: number
  totalPaid: number
  totalInterest: number
  financedAmount: number
  months: number
  installments: number[] // monthly installment values for chart
}

function calcSAC(principal: number, months: number, annualRate: number): SimResult {
  const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1
  const amort = principal / months
  const installments: number[] = []
  let totalPaid = 0
  let balance = principal

  for (let i = 0; i < months; i++) {
    const interest = balance * monthlyRate
    const pmt = amort + interest
    installments.push(pmt)
    totalPaid += pmt
    balance -= amort
  }

  return {
    firstInstallment: installments[0],
    lastInstallment: installments[installments.length - 1],
    totalPaid,
    totalInterest: totalPaid - principal,
    financedAmount: principal,
    months,
    installments,
  }
}

function calcPRICE(principal: number, months: number, annualRate: number): SimResult {
  const monthlyRate = Math.pow(1 + annualRate / 100, 1 / 12) - 1
  const pmt = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
  const installments = Array(months).fill(pmt) as number[]
  const totalPaid = pmt * months

  return {
    firstInstallment: pmt,
    lastInstallment: pmt,
    totalPaid,
    totalInterest: totalPaid - principal,
    financedAmount: principal,
    months,
    installments,
  }
}

// ---- bank simulators -----------------------------------------------

const BANK_LINKS = [
  { name: 'Caixa', href: 'https://simuladorhabitacao.caixa.gov.br/home', color: '#1565C0' },
  { name: 'Banco do Brasil', href: 'https://cim-simulador-imovelproprio.apps.bb.com.br/simulacao-imobiliario/sobre-imovel', color: '#003F87' },
  { name: 'Itau', href: 'https://www.itau.com.br/emprestimos-financiamentos/credito-imobiliario#section-5', color: '#F06400' },
  { name: 'Bradesco', href: 'https://banco.bradesco/html/classic/produtos-servicos/emprestimo-e-financiamento/encontre-seu-credito/simuladores-imoveis.shtm#box1-comprar', color: '#CC0000' },
]

// ---- page ----------------------------------------------------------

export default function SimuladorPage() {
  // input state (cents for currency fields)
  const [valorImovelCents, setValorImovelCents] = useState(50000000) // R$ 500.000
  const [entradaCents, setEntradaCents] = useState(10000000)         // R$ 100.000
  const [prazo, setPrazo] = useState(360)
  const [taxa, setTaxa] = useState('10.49')
  const [sistema, setSistema] = useState<'SAC' | 'PRICE'>('SAC')

  const valorImovel = valorImovelCents / 100
  const entrada = entradaCents / 100
  const principal = Math.max(valorImovel - entrada, 0)
  const annualRate = parseFloat(taxa.replace(',', '.')) || 0

  const result = useMemo<SimResult | null>(() => {
    if (principal <= 0 || prazo <= 0 || annualRate <= 0) return null
    return sistema === 'SAC'
      ? calcSAC(principal, prazo, annualRate)
      : calcPRICE(principal, prazo, annualRate)
  }, [principal, prazo, annualRate, sistema])

  // chart: sample ~40 bars max
  const chartBars = useMemo(() => {
    if (!result) return []
    const inst = result.installments
    const step = Math.max(1, Math.floor(inst.length / 40))
    const sampled: number[] = []
    for (let i = 0; i < inst.length; i += step) {
      sampled.push(inst[i])
    }
    return sampled
  }, [result])

  const maxBar = chartBars.length > 0 ? Math.max(...chartBars) : 1

  // handlers
  function handleCurrency(setter: (v: number) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, '')
      setter(digits ? parseInt(digits, 10) : 0)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f9f7f4' }}>
        {/* Hero */}
        <div className="py-14 px-4 text-center" style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 100%)' }}>
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
            Simulador
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Simulador de Financiamento
          </h1>
          <p className="text-white/70 text-base max-w-2xl mx-auto">
            Calcule suas parcelas em tempo real. Compare os sistemas SAC e PRICE e planeje a compra do seu imovel.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
          {/* Form + Results grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* ---- INPUT CARD ---- */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border shadow-sm" style={{ borderColor: '#e8e4dc' }}>
              <h2 className="text-lg font-bold mb-5" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                Dados do financiamento
              </h2>

              {/* Valor do imovel */}
              <label className="block mb-4">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor do imovel (R$)</span>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={toBRLInput(valorImovelCents)}
                    onChange={handleCurrency(setValorImovelCents)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: '#e8e4dc', focusRingColor: '#C9A84C' } as React.CSSProperties}
                  />
                </div>
              </label>

              {/* Entrada */}
              <label className="block mb-4">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor da entrada (R$)</span>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={toBRLInput(entradaCents)}
                    onChange={handleCurrency(setEntradaCents)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: '#e8e4dc' }}
                  />
                </div>
                {entrada > 0 && valorImovel > 0 && (
                  <span className="text-xs text-gray-400 mt-1 block">
                    {((entrada / valorImovel) * 100).toFixed(1)}% do valor do imovel
                  </span>
                )}
              </label>

              {/* Prazo */}
              <label className="block mb-4">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Prazo: {prazo} meses ({(prazo / 12).toFixed(1)} anos)
                </span>
                <input
                  type="range"
                  min={60}
                  max={420}
                  step={12}
                  value={prazo}
                  onChange={(e) => setPrazo(Number(e.target.value))}
                  className="w-full mt-2 accent-[#C9A84C]"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>60 meses</span>
                  <span>420 meses</span>
                </div>
              </label>

              {/* Taxa */}
              <label className="block mb-5">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Taxa de juros anual (%)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={taxa}
                  onChange={(e) => setTaxa(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
                  style={{ borderColor: '#e8e4dc' }}
                />
              </label>

              {/* Sistema */}
              <div className="mb-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Sistema de amortizacao</span>
                <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: '#e8e4dc' }}>
                  {(['SAC', 'PRICE'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSistema(s)}
                      className="flex-1 py-2.5 text-sm font-semibold transition-all"
                      style={{
                        backgroundColor: sistema === s ? '#1B2B5B' : 'transparent',
                        color: sistema === s ? 'white' : '#1B2B5B',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {sistema === 'SAC'
                    ? 'Parcelas decrescentes. Amortizacao fixa, juros sobre saldo devedor.'
                    : 'Parcelas fixas. Calculo pela formula PMT (Price).'}
                </p>
              </div>
            </div>

            {/* ---- RESULTS ---- */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              {result ? (
                <>
                  {/* Big number */}
                  <div
                    className="rounded-3xl p-6 text-center"
                    style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 100%)' }}
                  >
                    <p className="text-sm font-semibold uppercase tracking-widest mb-1" style={{ color: '#C9A84C' }}>
                      Parcela inicial
                    </p>
                    <p className="text-4xl sm:text-5xl font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>
                      R$ {fmt(result.firstInstallment)}
                    </p>
                    {sistema === 'SAC' && (
                      <p className="text-white/60 text-sm mt-2">
                        Ultima parcela: R$ {fmt(result.lastInstallment)}
                      </p>
                    )}
                  </div>

                  {/* Summary cards */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Valor Financiado', value: `R$ ${fmtInt(result.financedAmount)}` },
                      { label: 'Total de Juros', value: `R$ ${fmtInt(result.totalInterest)}` },
                      { label: 'Total Pago', value: `R$ ${fmtInt(result.totalPaid)}` },
                      { label: 'Prazo', value: `${result.months} meses` },
                    ].map((card) => (
                      <div
                        key={card.label}
                        className="bg-white rounded-2xl p-4 border shadow-sm"
                        style={{ borderColor: '#e8e4dc' }}
                      >
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{card.label}</p>
                        <p className="text-lg font-bold" style={{ color: '#1B2B5B' }}>{card.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Bar chart */}
                  <div className="bg-white rounded-3xl p-6 border shadow-sm" style={{ borderColor: '#e8e4dc' }}>
                    <h3 className="text-sm font-bold mb-4" style={{ color: '#1B2B5B' }}>
                      Evolucao das parcelas
                    </h3>
                    <div className="flex items-end gap-[2px]" style={{ height: 120 }}>
                      {chartBars.map((val, i) => {
                        const h = Math.max(4, (val / maxBar) * 100)
                        return (
                          <div
                            key={i}
                            className="flex-1 rounded-t-sm transition-all"
                            style={{
                              height: `${h}%`,
                              backgroundColor: i === 0 ? '#C9A84C' : '#1B2B5B',
                              opacity: 0.7 + 0.3 * (1 - i / chartBars.length),
                            }}
                            title={`Parcela ~${i * Math.max(1, Math.floor(result.months / 40)) + 1}: R$ ${fmt(val)}`}
                          />
                        )
                      })}
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>Mes 1</span>
                      <span>Mes {result.months}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-3xl p-10 border shadow-sm text-center" style={{ borderColor: '#e8e4dc' }}>
                  <p className="text-gray-400 text-sm">
                    Preencha os campos ao lado para ver o resultado da simulacao.
                  </p>
                </div>
              )}

              {/* CTAs */}
              <div className="bg-white rounded-3xl p-6 border shadow-sm" style={{ borderColor: '#e8e4dc' }}>
                <h3 className="text-base font-bold mb-4" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                  Proximo passo
                </h3>
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <a
                    href="https://wa.me/5516981010004?text=Ol%C3%A1!%20Fiz%20uma%20simula%C3%A7%C3%A3o%20de%20financiamento%20e%20gostaria%20de%20falar%20com%20um%20especialista."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] shadow-md flex-1"
                    style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    Falar com Especialista
                  </a>
                  <Link
                    href="/financiamentos"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:brightness-110 border-2 flex-1"
                    style={{ borderColor: '#1B2B5B', color: '#1B2B5B' }}
                  >
                    Voltar para financiamentos
                  </Link>
                </div>

                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Simular em outro banco</p>
                <div className="flex flex-wrap gap-2">
                  {BANK_LINKS.map((bank) => (
                    <a
                      key={bank.name}
                      href={bank.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                      style={{ backgroundColor: bank.color + '12', color: bank.color, border: `1px solid ${bank.color}30` }}
                    >
                      {bank.name}
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 text-center mt-10 max-w-2xl mx-auto leading-relaxed">
            * Esta simulacao tem carater informativo e nao representa proposta de credito.
            As condicoes efetivas de financiamento dependem de analise de credito e podem variar conforme
            a instituicao financeira. Consulte um especialista para obter valores exatos.
          </p>
        </div>
      </div>
  )
}
