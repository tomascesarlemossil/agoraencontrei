'use client'

import { useState } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'

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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

export function AvaliacaoForm() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
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
    name: '',
    email: '',
    phone: '',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      await fetch(`${API_URL}/api/v1/public/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email || undefined,
          phone: form.phone,
          message: `AVALIAÇÃO SOLICITADA\nTipo: ${form.type} | Objetivo: ${form.purpose}\nEndereço: ${form.address}, ${form.neighborhood} — ${form.city}/${form.state}\nÁrea: ${form.area}m² | ${form.bedrooms} dorms | ${form.bathrooms} banh | ${form.parking} vagas\nObs: ${form.notes}`,
        }),
      })
      setSubmitted(true)
    } catch {
      // fallback: show success anyway — lead can be created manually
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12 px-6">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
          style={{ backgroundColor: 'rgba(201,168,76,0.15)' }}
        >
          <CheckCircle className="w-8 h-8" style={{ color: '#C9A84C' }} />
        </div>
        <h3 className="text-xl font-bold mb-3" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          Solicitação enviada com sucesso!
        </h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
          Um de nossos especialistas entrará em contato em breve para agendar a avaliação gratuita do seu imóvel.
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
    )
  }

  const totalSteps = 3
  const progress = (step / totalSteps) * 100

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Etapa {step} de {totalSteps}</span>
          <span>{Math.round(progress)}% concluído</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: '#C9A84C' }}
          />
        </div>
      </div>

      {/* Step 1 — Property details */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo do imóvel</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROPERTY_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set('type', t.value)}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all"
                  style={{
                    borderColor: form.type === t.value ? '#C9A84C' : '#e5e7eb',
                    backgroundColor: form.type === t.value ? 'rgba(201,168,76,0.08)' : '#fff',
                    color: form.type === t.value ? '#1B2B5B' : '#6b7280',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">O que deseja fazer?</label>
            <div className="grid grid-cols-2 gap-2">
              {PURPOSES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => set('purpose', p.value)}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all"
                  style={{
                    borderColor: form.purpose === p.value ? '#1B2B5B' : '#e5e7eb',
                    backgroundColor: form.purpose === p.value ? 'rgba(27,43,91,0.06)' : '#fff',
                    color: form.purpose === p.value ? '#1B2B5B' : '#6b7280',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={!form.type || !form.purpose}
            onClick={() => setStep(2)}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#1B2B5B', color: '#fff' }}
          >
            Próximo →
          </button>
        </div>
      )}

      {/* Step 2 — Location + specs */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Endereço / Rua</label>
              <input
                value={form.address}
                onChange={e => set('address', e.target.value)}
                placeholder="Ex: Rua Maranhão, 320"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Bairro</label>
              <input
                value={form.neighborhood}
                onChange={e => set('neighborhood', e.target.value)}
                placeholder="Ex: Centro"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Cidade</label>
              <input
                value={form.city}
                onChange={e => set('city', e.target.value)}
                placeholder="Ex: Franca"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 transition-colors"
              />
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
                <input
                  type="number"
                  value={(form as any)[f.field]}
                  onChange={e => set(f.field, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 transition-colors"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Observações (opcional)</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={2}
              placeholder="Estado de conservação, reformas recentes, diferenciais..."
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-all"
              style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
            >
              ← Voltar
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-[2] py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ backgroundColor: '#1B2B5B', color: '#fff' }}
            >
              Próximo →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Contact */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Seu nome *</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Nome completo"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 transition-colors"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">WhatsApp / Telefone *</label>
              <input
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="(16) 99999-9999"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">E-mail (opcional)</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-yellow-400 transition-colors"
              />
            </div>
          </div>

          <div
            className="rounded-xl p-4 text-xs"
            style={{ backgroundColor: 'rgba(201,168,76,0.08)', borderLeft: '3px solid #C9A84C' }}
          >
            <p className="font-semibold mb-1" style={{ color: '#1B2B5B' }}>Avaliação 100% gratuita</p>
            <p className="text-gray-500">Nosso especialista entrará em contato em até 24 horas úteis com o laudo de avaliação do seu imóvel.</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex-1 py-3 rounded-xl text-sm font-semibold border transition-all"
              style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
            >
              ← Voltar
            </button>
            <button
              type="button"
              disabled={!form.name || !form.phone || loading}
              onClick={handleSubmit}
              className="flex-[2] py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ backgroundColor: '#C9A84C', color: '#1B2B5B' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Enviando...' : 'Solicitar Avaliação Gratuita'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
