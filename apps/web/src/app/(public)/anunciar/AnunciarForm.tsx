'use client'

import { useState } from 'react'
import { CheckCircle, Loader2, Upload } from 'lucide-react'

const PROPERTY_TYPES = [
  { value: 'HOUSE', label: 'Casa' },
  { value: 'APARTMENT', label: 'Apartamento' },
  { value: 'LAND', label: 'Terreno' },
  { value: 'STORE', label: 'Comercial / Loja' },
  { value: 'FARM', label: 'Chácara / Sítio' },
  { value: 'WAREHOUSE', label: 'Galpão' },
  { value: 'OFFICE', label: 'Escritório' },
  { value: 'PENTHOUSE', label: 'Cobertura' },
]

const PURPOSES = [
  { value: 'SALE', label: 'Quero vender' },
  { value: 'RENT', label: 'Quero alugar' },
  { value: 'BOTH', label: 'Vender ou alugar' },
]

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

export function AnunciarForm() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [photoCount, setPhotoCount] = useState(0)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
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
    price: '',
    videoUrl: '',
    wantsEvaluation: false,
    notes: '',
  })

  function set(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.phone || !form.type || !form.purpose) return
    setLoading(true)
    try {
      const typeLabel = PROPERTY_TYPES.find(t => t.value === form.type)?.label ?? form.type
      const purposeLabel = PURPOSES.find(p => p.value === form.purpose)?.label ?? form.purpose

      const notes = [
        `📋 ANÚNCIO DE IMÓVEL`,
        `Tipo: ${typeLabel} | Objetivo: ${purposeLabel}`,
        form.address ? `Endereço: ${form.address}` : '',
        form.neighborhood ? `Bairro: ${form.neighborhood}` : '',
        `Cidade: ${form.city}/${form.state}`,
        form.area ? `Área: ${form.area}m²` : '',
        form.bedrooms ? `Dormitórios: ${form.bedrooms}` : '',
        form.bathrooms ? `Banheiros: ${form.bathrooms}` : '',
        form.parking ? `Vagas: ${form.parking}` : '',
        form.price ? `Valor pretendido: R$ ${form.price}` : '',
        form.videoUrl ? `Vídeo/tour: ${form.videoUrl}` : '',
        photoCount > 0 ? `Fotos informadas: ${photoCount}` : '',
        form.wantsEvaluation ? `✅ Quer avaliação gratuita` : '',
        form.notes ? `Obs: ${form.notes}` : '',
      ].filter(Boolean).join('\n')

      await fetch(`${API_URL}/api/v1/public/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email || undefined,
          phone: form.phone,
          source: 'WEBSITE',
          notes,
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
      <div className="text-center py-12 px-6 bg-white rounded-3xl border shadow-sm" style={{ borderColor: '#e8e4dc' }}>
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
          style={{ backgroundColor: 'rgba(201,168,76,0.15)' }}
        >
          <CheckCircle className="w-8 h-8" style={{ color: '#C9A84C' }} />
        </div>
        <h3 className="text-xl font-bold mb-2" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          Solicitação recebida!
        </h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
          Recebemos seu pedido. Um corretor da Imobiliária Lemos entrará em contato em breve para avançar com o anúncio do seu imóvel.
        </p>
        <a
          href="https://wa.me/5516981010004?text=Olá!%20Acabei%20de%20enviar%20meu%20imóvel%20para%20anúncio%20pelo%20site."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
          style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          Confirmar pelo WhatsApp
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border shadow-sm overflow-hidden" style={{ borderColor: '#e8e4dc' }}>
      {/* Header */}
      <div className="px-6 py-5 border-b" style={{ borderColor: '#ede9df', backgroundColor: '#fafaf8' }}>
        <h2 className="text-lg font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          Dados do seu Imóvel
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">Preencha as informações e entraremos em contato em até 24h</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Type + Purpose */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2B5B' }}>
              Tipo de imóvel <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PROPERTY_TYPES.map(t => (
                <label key={t.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value={t.value}
                    checked={form.type === t.value}
                    onChange={() => set('type', t.value)}
                    className="sr-only"
                  />
                  <span
                    className="block text-center text-xs py-2 px-1 rounded-xl border-2 transition-all font-medium"
                    style={{
                      borderColor: form.type === t.value ? '#1B2B5B' : '#e0dbd0',
                      backgroundColor: form.type === t.value ? '#1B2B5B' : 'white',
                      color: form.type === t.value ? 'white' : '#374151',
                    }}
                  >
                    {t.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2B5B' }}>
              Objetivo <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {PURPOSES.map(p => (
                <label key={p.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="purpose"
                    value={p.value}
                    checked={form.purpose === p.value}
                    onChange={() => set('purpose', p.value)}
                    className="sr-only"
                  />
                  <span
                    className="block text-center text-sm py-2.5 px-3 rounded-xl border-2 transition-all font-medium"
                    style={{
                      borderColor: form.purpose === p.value ? '#C9A84C' : '#e0dbd0',
                      backgroundColor: form.purpose === p.value ? 'rgba(201,168,76,0.08)' : 'white',
                      color: form.purpose === p.value ? '#1B2B5B' : '#374151',
                    }}
                  >
                    {p.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Evaluation toggle */}
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.wantsEvaluation}
                onChange={e => set('wantsEvaluation', e.target.checked)}
                className="w-4 h-4 rounded accent-[#C9A84C]"
              />
              <span className="text-sm font-medium text-gray-700">Quero avaliação gratuita</span>
            </label>
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2B5B' }}>Localização</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Endereço (rua, número)"
              value={form.address}
              onChange={e => set('address', e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#1B2B5B] text-gray-800"
              style={{ borderColor: '#e0dbd0' }}
            />
            <input
              type="text"
              placeholder="Bairro"
              value={form.neighborhood}
              onChange={e => set('neighborhood', e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#1B2B5B] text-gray-800"
              style={{ borderColor: '#e0dbd0' }}
            />
            <input
              type="text"
              placeholder="Cidade"
              value={form.city}
              onChange={e => set('city', e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#1B2B5B] text-gray-800"
              style={{ borderColor: '#e0dbd0' }}
            />
            <select
              value={form.state}
              onChange={e => set('state', e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border focus:outline-none text-gray-800 appearance-none"
              style={{ borderColor: '#e0dbd0' }}
            >
              {['SP','MG','RJ','RS','PR','SC','BA','GO','DF','MS','MT','RO','PA','AM','CE','PE','ES','RN','PB','AL','SE','PI','MA','AC','AP','RR','TO'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Characteristics */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2B5B' }}>Características</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Área (m²)</p>
              <input
                type="number"
                placeholder="Ex: 120"
                value={form.area}
                onChange={e => set('area', e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none text-gray-800"
                style={{ borderColor: '#e0dbd0' }}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Dormitórios</p>
              <input
                type="number"
                min="0"
                placeholder="Ex: 3"
                value={form.bedrooms}
                onChange={e => set('bedrooms', e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none text-gray-800"
                style={{ borderColor: '#e0dbd0' }}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Banheiros</p>
              <input
                type="number"
                min="0"
                placeholder="Ex: 2"
                value={form.bathrooms}
                onChange={e => set('bathrooms', e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none text-gray-800"
                style={{ borderColor: '#e0dbd0' }}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Vagas</p>
              <input
                type="number"
                min="0"
                placeholder="Ex: 2"
                value={form.parking}
                onChange={e => set('parking', e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border focus:outline-none text-gray-800"
                style={{ borderColor: '#e0dbd0' }}
              />
            </div>
          </div>
        </div>

        {/* Price + Media */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2B5B' }}>Valor pretendido (R$)</label>
            <input
              type="text"
              placeholder="Ex: 350.000 ou deixe em branco para avaliação"
              value={form.price}
              onChange={e => set('price', e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border focus:outline-none text-gray-800"
              style={{ borderColor: '#e0dbd0' }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2B5B' }}>Link de vídeo / tour virtual</label>
            <input
              type="url"
              placeholder="YouTube, Google Drive, etc."
              value={form.videoUrl}
              onChange={e => set('videoUrl', e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border focus:outline-none text-gray-800"
              style={{ borderColor: '#e0dbd0' }}
            />
          </div>
        </div>

        {/* Photos notice */}
        <div
          className="rounded-xl p-4 border flex items-start gap-3"
          style={{ borderColor: '#C9A84C30', backgroundColor: 'rgba(201,168,76,0.05)' }}
        >
          <Upload className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#C9A84C' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#1B2B5B' }}>Fotos do imóvel</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Quantas fotos você tem disponíveis para envio?
            </p>
            <div className="flex items-center gap-3 mt-2">
              {[0, 5, 10, 15, 20].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPhotoCount(n)}
                  className="text-xs px-3 py-1 rounded-full border-2 font-medium transition-all"
                  style={{
                    borderColor: photoCount === n ? '#C9A84C' : '#e0dbd0',
                    backgroundColor: photoCount === n ? 'rgba(201,168,76,0.1)' : 'white',
                    color: photoCount === n ? '#1B2B5B' : '#6b7280',
                  }}
                >
                  {n === 0 ? 'Nenhuma' : `${n}+`}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              As fotos serão enviadas por WhatsApp após o contato inicial do corretor.
            </p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2B5B' }}>Informações adicionais</label>
          <textarea
            rows={3}
            placeholder="Reformas recentes, diferenciais, motivo da venda, etc."
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            className="w-full px-4 py-3 text-sm rounded-xl border focus:outline-none resize-none text-gray-800"
            style={{ borderColor: '#e0dbd0' }}
          />
        </div>

        {/* Separator */}
        <div className="border-t" style={{ borderColor: '#ede9df' }} />

        {/* Contact */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#1B2B5B' }}>Seus dados de contato</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Nome completo *"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
              className="w-full px-4 py-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#1B2B5B] text-gray-800"
              style={{ borderColor: '#e0dbd0' }}
            />
            <input
              type="tel"
              placeholder="WhatsApp / Telefone *"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              required
              className="w-full px-4 py-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#1B2B5B] text-gray-800"
              style={{ borderColor: '#e0dbd0' }}
            />
            <input
              type="email"
              placeholder="E-mail (opcional)"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              className="w-full px-4 py-3 text-sm rounded-xl border focus:outline-none text-gray-800"
              style={{ borderColor: '#e0dbd0' }}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !form.name || !form.phone || !form.type || !form.purpose}
          className="w-full py-4 rounded-2xl text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 100%)', color: 'white' }}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
          ) : (
            'Quero anunciar meu imóvel'
          )}
        </button>

        <p className="text-center text-xs text-gray-500">
          Ao enviar, você concorda em receber contato de um corretor da Imobiliária Lemos.
        </p>
      </div>
    </form>
  )
}
