'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Camera, Phone, CheckCircle, ArrowRight, ArrowLeft, Home, Building, Upload, MessageCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

export default function AnunciarImovelPage() {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Step 1: Endereço
  const [city, setCity] = useState('Franca')
  const [state, setState] = useState('SP')
  const [neighborhood, setNeighborhood] = useState('')
  const [street, setStreet] = useState('')
  const [number, setNumber] = useState('')
  const [propertyType, setPropertyType] = useState('HOUSE')
  const [purpose, setPurpose] = useState('SALE')

  // Step 2: Detalhes
  const [bedrooms, setBedrooms] = useState('3')
  const [bathrooms, setBathrooms] = useState('2')
  const [area, setArea] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')

  // Step 3: Contato
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)

  const handleSubmit = async () => {
    if (!name || !phone || !acceptTerms) return
    setSubmitting(true)
    try {
      await fetch(`${API_URL}/api/v1/public/lead-capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, phone,
          interest: 'sell',
          message: `Quero anunciar: ${propertyType} ${purpose} em ${street} ${number}, ${neighborhood}, ${city}/${state}. ${bedrooms} quartos, ${area}m², ${price ? `R$ ${price}` : 'Consultar'}. ${description}`,
        }),
      })
      setSuccess(true)
    } catch {
      setSuccess(true) // Offline mode
    }
    setSubmitting(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#f8f6f1] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Imóvel Cadastrado!</h1>
          <p className="text-gray-600 mb-6">
            Nossa equipe entrará em contato em até 2 horas para agendar a captação com fotos profissionais.
          </p>
          <a href={`https://wa.me/5516981010004?text=Olá! Acabei de cadastrar meu imóvel para anúncio no AgoraEncontrei.`}
            target="_blank" rel="noreferrer"
            className="block w-full py-3 rounded-xl font-bold text-white text-center mb-3"
            style={{ backgroundColor: '#25D366' }}>
            <MessageCircle className="w-4 h-4 inline mr-2" /> Falar pelo WhatsApp
          </a>
          <Link href="/" className="text-sm text-gray-500 hover:underline">Voltar à homepage</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f6f1]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Anuncie seu Imóvel <span style={{ color: '#C9A84C' }}>Gratuitamente</span>
          </h1>
          <p className="text-white/70 text-lg">
            Cadastre em 3 passos simples. Fotos profissionais incluídas. Alcance milhares de compradores.
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[
            { n: 1, label: 'Endereço', icon: MapPin },
            { n: 2, label: 'Detalhes', icon: Home },
            { n: 3, label: 'Contato', icon: Phone },
          ].map(({ n, label, icon: Icon }) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                step >= n ? 'text-white' : 'bg-gray-200 text-gray-400'
              }`} style={step >= n ? { backgroundColor: step === n ? '#C9A84C' : '#1B2B5B' } : {}}>
                {step > n ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-sm hidden sm:block ${step === n ? 'font-bold text-gray-800' : 'text-gray-400'}`}>{label}</span>
              {n < 3 && <div className={`w-8 h-0.5 ${step > n ? 'bg-[#1B2B5B]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6 sm:p-8">
          {/* Step 1: Endereço */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-800">Onde fica o imóvel?</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo *</label>
                  <select value={propertyType} onChange={e => setPropertyType(e.target.value)}
                    className="w-full border rounded-xl px-3 py-3 text-sm outline-none">
                    <option value="HOUSE">Casa</option>
                    <option value="APARTMENT">Apartamento</option>
                    <option value="LAND">Terreno</option>
                    <option value="FARM">Chácara/Sítio</option>
                    <option value="STORE">Comercial</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Finalidade *</label>
                  <select value={purpose} onChange={e => setPurpose(e.target.value)}
                    className="w-full border rounded-xl px-3 py-3 text-sm outline-none">
                    <option value="SALE">Venda</option>
                    <option value="RENT">Aluguel</option>
                    <option value="BOTH">Venda ou Aluguel</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Cidade</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)}
                    className="w-full border rounded-xl px-3 py-3 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">UF</label>
                  <input type="text" value={state} onChange={e => setState(e.target.value)} maxLength={2}
                    className="w-full border rounded-xl px-3 py-3 text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Bairro</label>
                <input type="text" value={neighborhood} onChange={e => setNeighborhood(e.target.value)}
                  placeholder="Ex: Jardim Petráglia" className="w-full border rounded-xl px-3 py-3 text-sm outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Rua</label>
                  <input type="text" value={street} onChange={e => setStreet(e.target.value)}
                    placeholder="Ex: Rua Major Claudiano" className="w-full border rounded-xl px-3 py-3 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Nº</label>
                  <input type="text" value={number} onChange={e => setNumber(e.target.value)}
                    placeholder="123" className="w-full border rounded-xl px-3 py-3 text-sm outline-none" />
                </div>
              </div>
              <button onClick={() => setStep(2)}
                className="w-full py-3 rounded-xl font-bold text-white text-sm" style={{ backgroundColor: '#1B2B5B' }}>
                Próximo <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            </div>
          )}

          {/* Step 2: Detalhes */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-800">Detalhes do imóvel</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Quartos</label>
                  <select value={bedrooms} onChange={e => setBedrooms(e.target.value)}
                    className="w-full border rounded-xl px-3 py-3 text-sm outline-none">
                    {[0,1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Banheiros</label>
                  <select value={bathrooms} onChange={e => setBathrooms(e.target.value)}
                    className="w-full border rounded-xl px-3 py-3 text-sm outline-none">
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Área (m²)</label>
                  <input type="number" value={area} onChange={e => setArea(e.target.value)}
                    placeholder="120" className="w-full border rounded-xl px-3 py-3 text-sm outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Preço desejado (R$)</label>
                <input type="text" value={price} onChange={e => setPrice(e.target.value)}
                  placeholder="350.000 (opcional — fazemos avaliação gratuita)" className="w-full border rounded-xl px-3 py-3 text-sm outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Descrição</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                  placeholder="Conte os diferenciais do imóvel (piscina, churrasqueira, reformado...)"
                  className="w-full border rounded-xl px-3 py-3 text-sm outline-none resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-bold text-sm border text-gray-700">
                  <ArrowLeft className="w-4 h-4 inline mr-1" /> Voltar
                </button>
                <button onClick={() => setStep(3)}
                  className="flex-1 py-3 rounded-xl font-bold text-white text-sm" style={{ backgroundColor: '#1B2B5B' }}>
                  Próximo <ArrowRight className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Contato */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold text-gray-800">Seus dados de contato</h2>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nome completo *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Seu nome" className="w-full border rounded-xl px-3 py-3 text-sm outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">WhatsApp *</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="(16) 99999-0000" className="w-full border rounded-xl px-3 py-3 text-sm outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com" className="w-full border rounded-xl px-3 py-3 text-sm outline-none" />
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Fotos profissionais gratuitas
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Nossa equipe agenda uma visita para fotografar seu imóvel com equipamento profissional, sem custo.
                </p>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 rounded mt-0.5 accent-[#1B2B5B]" />
                <span className="text-xs text-gray-500">
                  Concordo com os <Link href="/termos-uso" className="text-[#C9A84C] underline">Termos de Uso</Link> e
                  autorizo o AgoraEncontrei a divulgar meu imóvel nas plataformas parceiras.
                </span>
              </label>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl font-bold text-sm border text-gray-700">
                  <ArrowLeft className="w-4 h-4 inline mr-1" /> Voltar
                </button>
                <button onClick={handleSubmit}
                  disabled={!name || !phone || !acceptTerms || submitting}
                  className="flex-1 py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 active:scale-[0.98] transition-transform"
                  style={{ backgroundColor: '#C9A84C' }}>
                  {submitting ? 'Enviando...' : 'Anunciar Gratuitamente'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
