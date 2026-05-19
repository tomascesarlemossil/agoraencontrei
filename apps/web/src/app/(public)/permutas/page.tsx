'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Repeat, Loader2, CheckCircle2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const OFFER_TYPES = [
  { value: 'vehicle', label: 'Veículo' },
  { value: 'property', label: 'Imóvel' },
  { value: 'land', label: 'Terreno' },
  { value: 'credit', label: 'Carta de crédito' },
  { value: 'machinery', label: 'Máquina / Equipamento' },
  { value: 'other', label: 'Outro' },
]

const PROPERTY_TYPES = ['HOUSE', 'APARTMENT', 'LAND', 'FARM', 'COMMERCIAL', 'STORE']

interface ExchangeProperty {
  id: string; title: string; slug: string | null; coverImage: string | null
  price: number | null; type: string; city: string | null; neighborhood: string | null
}

const brl = (n: number | null) =>
  n != null ? `R$ ${Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : 'Consulte'

export default function PermutasPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    offerType: 'vehicle', offerDescription: '', offerValue: '',
    wantedType: '', wantedCity: '', wantedMaxValue: '',
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [properties, setProperties] = useState<ExchangeProperty[]>([])

  useEffect(() => {
    fetch(`${API_URL}/api/v1/public/exchange/properties?limit=24`)
      .then(r => r.ok ? r.json() : { data: [] })
      .then(j => setProperties(j.data ?? []))
      .catch(() => setProperties([]))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const payload: Record<string, unknown> = {
        name: form.name, email: form.email,
        offerType: form.offerType, offerDescription: form.offerDescription,
      }
      if (form.phone) payload.phone = form.phone
      if (form.offerValue) payload.offerValue = Number(form.offerValue)
      if (form.wantedType) payload.wantedType = form.wantedType
      if (form.wantedCity) payload.wantedCity = form.wantedCity
      if (form.wantedMaxValue) payload.wantedMaxValue = Number(form.wantedMaxValue)

      const res = await fetch(`${API_URL}/api/v1/public/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.message ?? 'Erro ao registrar a permuta')
      setResult(data?.message ?? 'Permuta registrada com sucesso!')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const input = 'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all'

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto max-w-5xl">
        <h1 className="flex items-center gap-2 text-2xl sm:text-3xl font-bold" style={{ color: '#1B2B5B' }}>
          <Repeat className="h-7 w-7" style={{ color: '#C9A84C' }} />
          Central de Permutas
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Tem um carro, terreno, imóvel ou carta de crédito? Ofereça em troca e encontramos imóveis compatíveis.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Form */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            {result ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                <p className="mt-3 font-semibold" style={{ color: '#1B2B5B' }}>{result}</p>
                <button
                  onClick={() => { setResult(null); setForm({ ...form, offerDescription: '' }) }}
                  className="mt-5 rounded-xl px-5 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: '#1B2B5B' }}
                >
                  Registrar outra permuta
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="font-semibold" style={{ color: '#1B2B5B' }}>O que você oferece</h2>
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="Seu nome *" value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })} className={input} />
                  <input required type="email" placeholder="E-mail *" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} />
                </div>
                <input placeholder="Telefone / WhatsApp" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} className={input} />
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.offerType} onChange={(e) => setForm({ ...form, offerType: e.target.value })} className={input}>
                    {OFFER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <input type="number" placeholder="Valor estimado (R$)" value={form.offerValue}
                    onChange={(e) => setForm({ ...form, offerValue: e.target.value })} className={input} />
                </div>
                <textarea required placeholder="Descreva o bem oferecido *" value={form.offerDescription}
                  onChange={(e) => setForm({ ...form, offerDescription: e.target.value })}
                  rows={3} className={input} />

                <h2 className="font-semibold pt-2" style={{ color: '#1B2B5B' }}>O que você procura</h2>
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.wantedType} onChange={(e) => setForm({ ...form, wantedType: e.target.value })} className={input}>
                    <option value="">Qualquer tipo</option>
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input placeholder="Cidade desejada" value={form.wantedCity}
                    onChange={(e) => setForm({ ...form, wantedCity: e.target.value })} className={input} />
                </div>
                <input type="number" placeholder="Valor máximo do imóvel (R$)" value={form.wantedMaxValue}
                  onChange={(e) => setForm({ ...form, wantedMaxValue: e.target.value })} className={input} />

                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
                  style={{ backgroundColor: '#1B2B5B' }}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Registrar permuta
                </button>
              </form>
            )}
          </div>

          {/* Properties accepting exchange */}
          <div>
            <h2 className="font-semibold mb-3" style={{ color: '#1B2B5B' }}>
              Imóveis que aceitam permuta
            </h2>
            {properties.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum imóvel com permuta no momento.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {properties.map(p => (
                  <Link key={p.id} href={`/imoveis/${p.slug ?? p.id}`}
                    className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow">
                    {p.coverImage
                      ? <img src={p.coverImage} alt={p.title} className="h-24 w-full object-cover" />
                      : <div className="h-24 w-full bg-gray-100" />}
                    <div className="p-2.5">
                      <p className="text-xs font-medium line-clamp-2" style={{ color: '#1B2B5B' }}>{p.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                        {[p.neighborhood, p.city].filter(Boolean).join(', ')}
                      </p>
                      <p className="text-xs font-bold mt-1" style={{ color: '#C9A84C' }}>{brl(p.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
