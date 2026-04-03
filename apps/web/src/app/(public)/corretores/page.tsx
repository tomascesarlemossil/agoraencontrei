import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Nossa Equipe de Corretores | Imobiliária Lemos — Franca/SP',
  description: 'Conheça a equipe de corretores da Imobiliária Lemos em Franca/SP. Especialistas em compra, venda e locação de imóveis. CRECI 279051.',
}

export const revalidate = 300

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

async function fetchBrokers() {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/brokers`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

const DEFAULT_BROKERS = [
  {
    id: '1',
    name: 'Noêmia Pires Lemos',
    role: 'Diretora | Corretora de Imóveis',
    creciNumber: '279051-F',
    phone: '5516981010004',
    specialties: ['Compra e Venda', 'Locação', 'Avaliação'],
    bio: 'Mais de 20 anos de experiência no mercado imobiliário de Franca/SP.',
  },
  {
    id: '2',
    name: 'Naira Cristina Lemos',
    role: 'Corretora de Imóveis',
    creciNumber: '279051-F',
    phone: '5516981010004',
    specialties: ['Residencial', 'Locação', 'Financiamento'],
    bio: 'Especialista em imóveis residenciais e locação em Franca/SP.',
  },
  {
    id: '3',
    name: 'Nádia Maria Cristina Lemos da Silva',
    role: 'Corretora de Imóveis',
    creciNumber: '61053-F',
    phone: '5516981010004',
    specialties: ['Imóveis Comerciais', 'Compra e Venda'],
    bio: 'Especialista em imóveis comerciais e negociações diferenciadas.',
  },
  {
    id: '4',
    name: 'Gabriel Lemos',
    role: 'Corretor de Imóveis',
    creciNumber: '279051-F',
    phone: '5516981010004',
    specialties: ['Lançamentos', 'Residencial', 'Digital'],
    bio: 'Atendimento moderno e presença digital para encontrar seu imóvel ideal.',
  },
]

function BrokerCard({ broker }: { broker: typeof DEFAULT_BROKERS[number] & { avatarUrl?: string } }) {
  const whatsappMsg = encodeURIComponent(`Olá, ${broker.name.split(' ')[0]}! Gostaria de informações sobre imóveis da Imobiliária Lemos.`)
  const initial = broker.name.charAt(0).toUpperCase()

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border"
      style={{ borderColor: '#ede9df' }}>
      {/* Gradient header */}
      <div className="relative h-48 flex items-end justify-center pb-0"
        style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 70%, #1B2B5B 100%)' }}>
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        {/* Avatar */}
        <div className="relative mb-0 translate-y-1/2">
          {(broker as any).avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={(broker as any).avatarUrl} alt={broker.name}
              className="w-24 h-24 rounded-full object-cover border-4 shadow-xl"
              style={{ borderColor: '#C9A84C' }} />
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-4 shadow-xl"
              style={{ backgroundColor: '#C9A84C', borderColor: 'white', color: '#1B2B5B' }}>
              {initial}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pt-16 pb-6 px-6 text-center">
        <h3 className="text-lg font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          {broker.name}
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">{broker.role}</p>
        <p className="text-xs font-semibold mt-1" style={{ color: '#C9A84C' }}>CRECI {broker.creciNumber}</p>

        {broker.bio && (
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{broker.bio}</p>
        )}

        {/* Specialties */}
        {broker.specialties?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center mt-4">
            {broker.specialties.map(s => (
              <span key={s} className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ backgroundColor: '#f0ece4', color: '#1B2B5B' }}>
                {s}
              </span>
            ))}
          </div>
        )}

        {/* CTA buttons */}
        <div className="mt-5 space-y-2">
          <a
            href={`https://wa.me/${broker.phone}?text=${whatsappMsg}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Falar pelo WhatsApp
          </a>
          <a
            href={`tel:1637230045`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-gray-50 border-2"
            style={{ borderColor: '#ddd9d0', color: '#1B2B5B' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
            </svg>
            (16) 3723-0045
          </a>
        </div>
      </div>
    </div>
  )
}

export default async function CorretoresPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: '#C9A84C' }}>
          Nossa Equipe
        </p>
        <h1 className="text-4xl font-bold mb-4" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          Corretores de Imóveis
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Profissionais especializados prontos para ajudar você a encontrar o imóvel ideal em Franca/SP e região.
        </p>

        {/* WhatsApp CTA */}
        <a
          href="https://wa.me/5516981010004?text=Olá! Gostaria de falar com um corretor da Imobiliária Lemos."
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-bold mt-8 transition-all hover:scale-105 hover:shadow-xl shadow-lg"
          style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white' }}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          Falar com um Corretor agora
        </a>
      </div>

      {/* Brokers grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {DEFAULT_BROKERS.map(broker => (
          <BrokerCard key={broker.id} broker={broker} />
        ))}
      </div>

      {/* Company info */}
      <div className="mt-16 rounded-3xl p-8 text-center"
        style={{ background: 'linear-gradient(135deg, #1B2B5B 0%, #2d4a8a 100%)' }}>
        <div className="absolute inset-0 opacity-5 rounded-3xl"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <p className="text-white font-bold text-xl mb-2" style={{ fontFamily: 'Georgia, serif' }}>
          Imobiliária Lemos
        </p>
        <p className="text-sm mb-1" style={{ color: 'rgba(201,168,76,0.9)' }}>CRECI: 279051 · Franca/SP</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Rua João Ramalho, 1060 — Centro, Franca/SP
        </p>
        <div className="flex items-center justify-center gap-4 mt-6">
          <a href="tel:1637230045"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white transition-all">
            (16) 3723-0045
          </a>
          <a href="https://wa.me/5516981010004" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #e6c96a)', color: '#1B2B5B' }}>
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
