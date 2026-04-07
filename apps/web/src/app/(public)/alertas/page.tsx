'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const CITIES = [
  'Franca',
  'Ribeirão Preto',
  'São Paulo',
  'Campinas',
  'Batatais',
  'Patrocínio Paulista',
  'Restinga',
  'Cristais Paulista',
]

const PROPERTY_TYPES = [
  { value: 'casa', label: 'Casa' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'terreno', label: 'Terreno' },
]

const PURPOSES = [
  { value: 'venda', label: 'Venda' },
  { value: 'aluguel', label: 'Aluguel' },
]

export default function AlertasPage() {
  const [form, setForm] = useState({
    email: '',
    city: '',
    type: '',
    purpose: '',
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload: Record<string, unknown> = { email: form.email }
      if (form.city) payload.city = form.city
      if (form.type) payload.type = form.type
      if (form.purpose) payload.purpose = form.purpose
      if (form.minPrice) payload.minPrice = Number(form.minPrice)
      if (form.maxPrice) payload.maxPrice = Number(form.maxPrice)
      if (form.bedrooms) payload.bedrooms = Number(form.bedrooms)

      const res = await fetch(`${API_URL}/api/v1/public/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message ?? 'Erro ao criar alerta')
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message ?? 'Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all'

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#f9f7f4' }}>
      {/* Hero */}
      <section
        className="py-16 text-white text-center"
        style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 60%, #1B2B5B 100%)' }}
      >
        <div className="max-w-4xl mx-auto px-4">
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-3"
            style={{ color: '#C9A84C' }}
          >
            Imobiliária Lemos — Franca/SP
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Alertas de Imóveis
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Receba notificações quando novos imóveis compatíveis com o que você busca forem cadastrados.
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl shadow-sm p-8">
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}
          >
            Criar Alerta
          </h2>

          {submitted ? (
            <div className="text-center py-12">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#25D36622' }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#25D366">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: '#1B2B5B' }}>
                Alerta criado!
              </h3>
              <p className="text-gray-600">
                Você receberá emails quando novos imóveis forem cadastrados.
              </p>
              <button
                onClick={() => {
                  setForm({ email: '', city: '', type: '', purpose: '', minPrice: '', maxPrice: '', bedrooms: '' })
                  setSubmitted(false)
                }}
                className="mt-6 px-6 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#1B2B5B' }}
              >
                Criar outro alerta
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5B' }}>
                  E-mail *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass}
                  placeholder="seu@email.com"
                />
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5B' }}>
                  Cidade
                </label>
                <select
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Todas as cidades</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Type & Purpose row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5B' }}>
                    Tipo de imóvel
                  </label>
                  <select
                    id="type"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">Todos</option>
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="purpose" className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5B' }}>
                    Finalidade
                  </label>
                  <select
                    id="purpose"
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">Todas</option>
                    {PURPOSES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="minPrice" className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5B' }}>
                    Preço mínimo (R$)
                  </label>
                  <input
                    id="minPrice"
                    type="number"
                    min="0"
                    value={form.minPrice}
                    onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
                    className={inputClass}
                    placeholder="Ex: 200000"
                  />
                </div>
                <div>
                  <label htmlFor="maxPrice" className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5B' }}>
                    Preço máximo (R$)
                  </label>
                  <input
                    id="maxPrice"
                    type="number"
                    min="0"
                    value={form.maxPrice}
                    onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
                    className={inputClass}
                    placeholder="Ex: 500000"
                  />
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <label htmlFor="bedrooms" className="block text-sm font-medium mb-1.5" style={{ color: '#1B2B5B' }}>
                  Quartos (mínimo)
                </label>
                <select
                  id="bedrooms"
                  value={form.bedrooms}
                  onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Qualquer</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-semibold transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 100%)' }}
              >
                {loading ? 'Criando alerta...' : 'Criar Alerta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
