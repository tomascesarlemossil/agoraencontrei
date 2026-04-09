'use client'

import { useState, useCallback } from 'react'
import { CheckCircle, Loader2, Sparkles, Calculator, CreditCard, ShieldCheck, Lock } from 'lucide-react'
import { ValuationResults } from '@/components/ValuationResults'
import {
  runValuation, calculateSimilarity,
  type PropertyInput, type Comparable, type ValuationResult,
} from '@/lib/valuation-engine'

const PROPERTY_TYPES = [
  { value: 'HOUSE', label: 'Casa' },
  { value: 'APARTMENT', label: 'Apartamento' },
  { value: 'LAND', label: 'Terreno' },
  { value: 'STORE', label: 'Comercial' },
  { value: 'FARM', label: 'Chácara / Sítio' },
  { value: 'WAREHOUSE', label: 'Galpão' },
]

const PURPOSES = [
  { value: 'SALE', label: 'Quero vender' },
  { value: 'RENT', label: 'Quero alugar' },
  { value: 'BOTH', label: 'Vender ou alugar' },
  { value: 'INFO', label: 'Só quero saber o valor' },
]

const CONDITIONS = [
  { value: 'EXCELLENT', label: 'Excelente' },
  { value: 'GOOD', label: 'Bom' },
  { value: 'REGULAR', label: 'Regular' },
  { value: 'POOR', label: 'Precisa reforma' },
]

const STANDARDS = [
  { value: 'LUXURY', label: 'Luxo' },
  { value: 'HIGH', label: 'Alto padrão' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'SIMPLE', label: 'Simples' },
]

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function AvaliacaoForm() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [valuationResult, setValuationResult] = useState<ValuationResult | null>(null)
  const [valuationLoading, setValuationLoading] = useState(false)

  // CPF & payment state
  const [cpfChecking, setCpfChecking] = useState(false)
  const [cpfStatus, setCpfStatus] = useState<{ freeAvailable: boolean; valuationCount: number } | null>(null)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)
  const [checkingPayment, setCheckingPayment] = useState(false)

  const [form, setForm] = useState({
    type: '',
    purpose: '',
    address: '',
    neighborhood: '',
    city: 'Franca',
    state: 'SP',
    area: '',
    bedrooms: '',
    bathrooms: '',
    parking: '',
    yearBuilt: '',
    condition: 'GOOD',
    standard: 'NORMAL',
    hasClosedCondo: false,
    condoFee: '',
    monthlyRent: '',
    currentPrice: '',
    cpf: '',
    name: '',
    email: '',
    phone: '',
    notes: '',
  })

  function set(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Run instant valuation using property data from the database
  const runInstantValuation = useCallback(async () => {
    if (!form.area || !form.type || !form.city) return

    setValuationLoading(true)
    try {
      // Fetch comparables from API
      const params = new URLSearchParams({
        city: form.city,
        ...(form.type && { type: form.type }),
        ...(form.area && { area: form.area }),
        ...(form.neighborhood && { neighborhood: form.neighborhood }),
      })

      let comparables: Comparable[] = []

      try {
        const res = await fetch(`${API_URL}/api/v1/public/properties?${params}&limit=50&sortBy=createdAt&sortOrder=desc`)
        if (res.ok) {
          const data = await res.json()
          const items = data.data || data.items || data || []

          // Map API response to Comparable format and calculate similarity
          comparables = items
            .filter((p: any) => p.price && p.price > 0 && p.totalArea && p.totalArea > 0)
            .map((p: any) => {
              const similarity = calculateSimilarity(
                {
                  type: form.type as any,
                  city: form.city,
                  neighborhood: form.neighborhood,
                  state: form.state,
                  area: Number(form.area),
                  bedrooms: Number(form.bedrooms) || 0,
                  bathrooms: Number(form.bathrooms) || 0,
                  parkingSpaces: Number(form.parking) || 0,
                  yearBuilt: Number(form.yearBuilt) || 2010,
                  condition: form.condition as any,
                  standard: form.standard as any,
                  hasClosedCondo: form.hasClosedCondo,
                  condoFee: Number(form.condoFee) || 0,
                  monthlyRent: Number(form.monthlyRent) || 0,
                  currentPrice: Number(form.currentPrice) || 0,
                },
                {
                  area: p.totalArea || p.area || 100,
                  bedrooms: p.bedrooms || 0,
                  neighborhood: p.neighborhood || p.bairro || '',
                  type: p.type || p.propertyType || 'HOUSE',
                  city: p.city || p.cidade || form.city,
                },
              )

              return {
                id: p.id || p.slug || String(Math.random()),
                title: p.title || `${p.type || 'Imóvel'} em ${p.neighborhood || p.city}`,
                city: p.city || form.city,
                neighborhood: p.neighborhood || '',
                price: p.price,
                pricePerM2: p.totalArea > 0 ? Math.round(p.price / p.totalArea) : 0,
                area: p.totalArea || p.area || 0,
                bedrooms: p.bedrooms || 0,
                status: (p.status === 'SOLD' ? 'SOLD' : p.status === 'RENTED' ? 'RENTED' : 'ACTIVE') as Comparable['status'],
                publishedAt: p.publishedAt || p.createdAt || new Date().toISOString(),
                similarity,
              }
            })
            .filter((c: Comparable) => c.similarity >= 40)
            .sort((a: Comparable, b: Comparable) => b.similarity - a.similarity)
            .slice(0, 50)
        }
      } catch {
        // API unavailable — will use cost + income methods only
      }

      // Build PropertyInput
      const propertyInput: PropertyInput = {
        type: (form.type || 'HOUSE') as PropertyInput['type'],
        city: form.city || 'Franca',
        neighborhood: form.neighborhood || '',
        state: form.state || 'SP',
        area: Number(form.area) || 100,
        bedrooms: Number(form.bedrooms) || 2,
        bathrooms: Number(form.bathrooms) || 1,
        parkingSpaces: Number(form.parking) || 1,
        yearBuilt: Number(form.yearBuilt) || 2010,
        condition: (form.condition || 'GOOD') as PropertyInput['condition'],
        standard: (form.standard || 'NORMAL') as PropertyInput['standard'],
        hasClosedCondo: form.hasClosedCondo,
        condoFee: Number(form.condoFee) || 0,
        monthlyRent: Number(form.monthlyRent) || 0,
        currentPrice: Number(form.currentPrice) || 0,
      }

      const result = runValuation(propertyInput, comparables)
      setValuationResult(result)
    } catch {
      // Valuation failed silently — user can still submit lead
    } finally {
      setValuationLoading(false)
    }
  }, [form])

  // Check if CPF has free valuation available
  async function checkCPF() {
    const cpfDigits = form.cpf.replace(/\D/g, '')
    if (cpfDigits.length !== 11) return
    setCpfChecking(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/public/valuation/check-cpf?cpf=${cpfDigits}`)
      if (res.ok) {
        const data = await res.json()
        setCpfStatus(data)
      }
    } catch {
      // API unavailable - allow free
      setCpfStatus({ freeAvailable: true, valuationCount: 0 })
    } finally {
      setCpfChecking(false)
    }
  }

  // Create Asaas charge for paid valuation
  async function createPayment(billingType: 'PIX' | 'BOLETO') {
    setPaymentLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/public/valuation/create-charge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: form.cpf.replace(/\D/g, ''),
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          billingType,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setPaymentData(data)
      }
    } catch {
      // silently fail
    } finally {
      setPaymentLoading(false)
    }
  }

  // Poll Asaas for payment confirmation
  async function checkPaymentStatus() {
    if (!paymentData?.chargeId) return
    setCheckingPayment(true)
    try {
      const res = await fetch(`${API_URL}/api/v1/public/valuation/check-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chargeId: paymentData.chargeId }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.isPaid) {
          setPaymentConfirmed(true)
        }
      }
    } catch { /* retry later */ }
    finally { setCheckingPayment(false) }
  }

  // Register free valuation usage
  async function registerFreeValuation() {
    try {
      await fetch(`${API_URL}/api/v1/public/valuation/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: form.cpf.replace(/\D/g, ''),
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          propertyCity: form.city,
          propertyType: form.type,
        }),
      })
    } catch { /* non-blocking */ }
  }

  async function handleSubmit() {
    if (honeypot) return
    setLoading(true)
    // Register free valuation usage if applicable
    if (cpfStatus?.freeAvailable && form.cpf.replace(/\D/g, '').length === 11) {
      await registerFreeValuation()
    }
    try {
      const valuationSummary = valuationResult
        ? `\n\n--- AVALIAÇÃO AUTOMÁTICA ---\nValor de Mercado: R$ ${valuationResult.marketValue.toLocaleString('pt-BR')}\nValor Bancário: R$ ${valuationResult.bankValue.toLocaleString('pt-BR')}\nValor Venda Rápida: R$ ${valuationResult.realisticValue.toLocaleString('pt-BR')}\nConfiança: ${valuationResult.confidence}/100\nComparáveis: ${valuationResult.comparablesCount}`
        : ''

      await fetch(`${API_URL}/api/v1/public/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email || undefined,
          phone: form.phone,
          message: `AVALIAÇÃO SOLICITADA\nTipo: ${form.type} | Objetivo: ${form.purpose}\nEndereço: ${form.address}, ${form.neighborhood} — ${form.city}/${form.state}\nÁrea: ${form.area}m² | ${form.bedrooms} dorms | ${form.bathrooms} banh | ${form.parking} vagas\nAno: ${form.yearBuilt} | Padrão: ${form.standard} | Estado: ${form.condition}\nCondomínio: ${form.hasClosedCondo ? 'Sim' : 'Não'} | Taxa: R$${form.condoFee}\nAluguel atual: R$${form.monthlyRent} | Preço pedido: R$${form.currentPrice}\nObs: ${form.notes}${valuationSummary}`,
        }),
      })
      setSubmitted(true)
    } catch {
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 px-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6" style={{ backgroundColor: 'rgba(201,168,76,0.15)' }}>
            <CheckCircle className="w-8 h-8" style={{ color: '#C9A84C' }} />
          </div>
          <h3 className="text-xl font-bold mb-3" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Solicitação enviada com sucesso!
          </h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
            Um especialista entrará em contato em até 24 horas com uma avaliação detalhada e personalizada.
          </p>
          <a
            href={`https://wa.me/5516981010004?text=Olá! Solicitei uma avaliação pelo site. Meu nome é ${encodeURIComponent(form.name)}.`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
            style={{ backgroundColor: '#25D366', color: '#fff' }}
          >
            Confirmar pelo WhatsApp
          </a>
        </div>

        {/* Show valuation result below the success message */}
        {valuationResult && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-[#C9A84C]" />
              <h3 className="text-lg font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                Avaliação Inteligente (Prévia)
              </h3>
            </div>
            <ValuationResults result={valuationResult} propertyArea={Number(form.area) || 100} />
            <p className="text-[10px] text-gray-400 mt-4 text-center">
              *Valores estimados por algoritmo com base em dados do mercado. A avaliação presencial do especialista pode refinar estes valores.
            </p>
          </div>
        )}
      </div>
    )
  }

  const totalSteps = 5
  const progress = (step / totalSteps) * 100

  return (
    <div>
      {/* Honeypot */}
      <div className="absolute opacity-0 -z-10 h-0 overflow-hidden" aria-hidden="true" tabIndex={-1}>
        <label htmlFor="website_url">Website</label>
        <input id="website_url" name="website_url" type="text" value={honeypot} onChange={e => setHoneypot(e.target.value)} autoComplete="off" tabIndex={-1} />
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Etapa {step} de {totalSteps}</span>
          <span>{Math.round(progress)}% concluído</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: '#C9A84C' }} />
        </div>
      </div>

      {/* Step 1 — Type & Purpose */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo do imóvel</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROPERTY_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => set('type', t.value)}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all"
                  style={{ borderColor: form.type === t.value ? '#C9A84C' : '#e5e7eb', backgroundColor: form.type === t.value ? 'rgba(201,168,76,0.08)' : '#fff', color: form.type === t.value ? '#1B2B5B' : '#6b7280' }}
                >{t.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">O que deseja fazer?</label>
            <div className="grid grid-cols-2 gap-2">
              {PURPOSES.map(p => (
                <button key={p.value} type="button" onClick={() => set('purpose', p.value)}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all"
                  style={{ borderColor: form.purpose === p.value ? '#1B2B5B' : '#e5e7eb', backgroundColor: form.purpose === p.value ? 'rgba(27,43,91,0.06)' : '#fff', color: form.purpose === p.value ? '#1B2B5B' : '#6b7280' }}
                >{p.label}</button>
              ))}
            </div>
          </div>
          <button type="button" disabled={!form.type || !form.purpose} onClick={() => setStep(2)}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#1B2B5B', color: '#fff' }}
          >Próximo →</button>
        </div>
      )}

      {/* Step 2 — Location + Specs */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Endereço / Rua</label>
              <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Ex: Rua Maranhão, 320"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Bairro</label>
              <input value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} placeholder="Ex: Centro"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Cidade</label>
              <input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Ex: Franca"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 transition-colors" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { field: 'area', label: 'Área (m²)', placeholder: '120' },
              { field: 'bedrooms', label: 'Dormitórios', placeholder: '3' },
              { field: 'bathrooms', label: 'Banheiros', placeholder: '2' },
              { field: 'parking', label: 'Vagas', placeholder: '1' },
            ].map(f => (
              <div key={f.field}>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">{f.label}</label>
                <input type="number" value={(form as any)[f.field]} onChange={e => set(f.field, e.target.value)} placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 transition-colors" />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-all" style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>← Voltar</button>
            <button type="button" onClick={() => setStep(3)} className="flex-[2] py-3 rounded-xl text-sm font-semibold transition-all" style={{ backgroundColor: '#1B2B5B', color: '#fff' }}>Próximo →</button>
          </div>
        </div>
      )}

      {/* Step 3 — Details (NEW: condition, standard, year, rent, condo) */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Ano de construção</label>
              <input type="number" value={form.yearBuilt} onChange={e => set('yearBuilt', e.target.value)} placeholder="2015"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Aluguel atual (R$/mês)</label>
              <input type="number" value={form.monthlyRent} onChange={e => set('monthlyRent', e.target.value)} placeholder="0 se não alugado"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Estado de conservação</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CONDITIONS.map(c => (
                <button key={c.value} type="button" onClick={() => set('condition', c.value)}
                  className="px-3 py-2 rounded-xl text-xs font-medium border-2 transition-all"
                  style={{ borderColor: form.condition === c.value ? '#C9A84C' : '#e5e7eb', backgroundColor: form.condition === c.value ? 'rgba(201,168,76,0.08)' : '#fff', color: form.condition === c.value ? '#1B2B5B' : '#6b7280' }}
                >{c.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Padrão construtivo</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STANDARDS.map(s => (
                <button key={s.value} type="button" onClick={() => set('standard', s.value)}
                  className="px-3 py-2 rounded-xl text-xs font-medium border-2 transition-all"
                  style={{ borderColor: form.standard === s.value ? '#1B2B5B' : '#e5e7eb', backgroundColor: form.standard === s.value ? 'rgba(27,43,91,0.06)' : '#fff', color: form.standard === s.value ? '#1B2B5B' : '#6b7280' }}
                >{s.label}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Preço pedido (R$, opcional)</label>
              <input type="number" value={form.currentPrice} onChange={e => set('currentPrice', e.target.value)} placeholder="Deixe em branco se não definido"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Condomínio (R$/mês)</label>
              <input type="number" value={form.condoFee} onChange={e => set('condoFee', e.target.value)} placeholder="0"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 transition-colors" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={form.hasClosedCondo} onChange={e => set('hasClosedCondo', e.target.checked)}
              className="rounded border-gray-300" />
            Condomínio fechado
          </label>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Observações (opcional)</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Reformas recentes, diferenciais..."
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 transition-colors resize-none" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-all" style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>← Voltar</button>
            <button type="button" onClick={() => setStep(4)}
              className="flex-[2] py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ backgroundColor: '#1B2B5B', color: '#fff' }}
            >Próximo →</button>
          </div>
        </div>
      )}

      {/* Step 4 — CPF + Identity Verification */}
      {step === 4 && (
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-[#1B2B5B]/5 to-[#C9A84C]/5 rounded-xl p-5 border border-[#C9A84C]/20">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-[#C9A84C]" />
              <h3 className="text-sm font-bold" style={{ color: '#1B2B5B' }}>Dados pessoais</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Informe seu CPF para gerar a avaliação. A <strong>primeira avaliação é gratuita</strong> por CPF.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">CPF *</label>
                <input
                  value={form.cpf}
                  onChange={e => {
                    set('cpf', formatCPF(e.target.value))
                    setCpfStatus(null)
                    setPaymentData(null)
                    setPaymentConfirmed(false)
                  }}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Seu nome *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome completo"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 transition-colors" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">WhatsApp / Telefone *</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(16) 99999-9999"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">E-mail (opcional)</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="seu@email.com"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 transition-colors" />
                </div>
              </div>
            </div>
          </div>

          {/* CPF check result */}
          {cpfStatus && !cpfStatus.freeAvailable && !paymentConfirmed && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">Avaliação paga (R$ 200,00)</span>
              </div>
              <p className="text-xs text-amber-700 mb-3">
                Você já utilizou sua avaliação gratuita. Para continuar, selecione a forma de pagamento:
              </p>

              {!paymentData && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => createPayment('PIX')} disabled={paymentLoading}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1">
                    {paymentLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    PIX (instantâneo)
                  </button>
                  <button type="button" onClick={() => createPayment('BOLETO')} disabled={paymentLoading}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    Boleto
                  </button>
                </div>
              )}

              {paymentData && !paymentConfirmed && (
                <div className="mt-3 space-y-3">
                  {paymentData.pixCode && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">
                        {paymentData.pixKeyType === 'static' ? 'Chave PIX:' : 'PIX Copia e Cola:'}
                      </p>
                      <div className="bg-white border rounded-lg p-2 text-xs break-all text-gray-700 cursor-pointer hover:bg-gray-50"
                        onClick={() => { navigator.clipboard.writeText(paymentData.pixCode); alert('Chave PIX copiada!') }}>
                        {paymentData.pixCode}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">Clique para copiar · Valor: R$ 200,00</p>
                      {paymentData.pixQrCodeUrl && (
                        <img src={paymentData.pixQrCodeUrl} alt="QR Code PIX" className="mt-2 mx-auto w-40 h-40 rounded-lg" />
                      )}
                    </div>
                  )}
                  {paymentData.invoiceUrl && (
                    <a href={paymentData.invoiceUrl} target="_blank" rel="noreferrer"
                      className="block text-center py-2 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                      Abrir página de pagamento
                    </a>
                  )}
                  <button type="button" onClick={checkPaymentStatus} disabled={checkingPayment}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold bg-[#C9A84C] text-[#1B2B5B] hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                    {checkingPayment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    {checkingPayment ? 'Verificando...' : 'Já paguei — Verificar'}
                  </button>
                </div>
              )}
            </div>
          )}

          {paymentConfirmed && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <span className="text-sm font-medium text-green-800">Pagamento confirmado! Prossiga para ver sua avaliação.</span>
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(3)} className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-all" style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>← Voltar</button>
            <button
              type="button"
              disabled={!form.name || !form.phone || form.cpf.replace(/\D/g, '').length !== 11 || cpfChecking || (!cpfStatus && true)}
              onClick={() => {
                if (!cpfStatus) { checkCPF(); return }
                if (cpfStatus.freeAvailable || paymentConfirmed) {
                  runInstantValuation()
                  setStep(5)
                }
              }}
              className="flex-[2] py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ backgroundColor: cpfStatus ? '#C9A84C' : '#1B2B5B', color: cpfStatus ? '#1B2B5B' : '#fff' }}
            >
              {cpfChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {!cpfStatus ? 'Verificar CPF' : (cpfStatus.freeAvailable || paymentConfirmed) ? 'Ver Avaliação Inteligente' : 'Pague para continuar'}
            </button>
          </div>

          <p className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            Seus dados estão protegidos e não serão compartilhados.
          </p>
        </div>
      )}

      {/* Step 5 — Results + Final Submit */}
      {step === 5 && (
        <div className="space-y-6">
          {valuationLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#C9A84C] mr-2" />
              <span className="text-sm text-gray-500">Calculando avaliação inteligente...</span>
            </div>
          )}

          {valuationResult && !valuationLoading && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="w-5 h-5 text-[#C9A84C]" />
                <h3 className="text-lg font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
                  Avaliação Inteligente
                </h3>
              </div>
              <ValuationResults result={valuationResult} propertyArea={Number(form.area) || 100} />
              <p className="text-[10px] text-gray-400 mt-3 text-center">
                *Valores estimados por algoritmo. Para uma avaliação presencial, clique abaixo.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(4)} className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-all" style={{ borderColor: '#e5e7eb', color: '#6b7280' }}>← Voltar</button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="flex-[2] py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Enviando...' : 'Solicitar Avaliação Presencial'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
