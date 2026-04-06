import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin, Building2, Star, Phone, MessageCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

export const metadata: Metadata = {
  title: 'Apartamentos para Alugar em Franca SP | Imobiliária Lemos — CRECI 279051',
  description: 'Encontre apartamentos para alugar em Franca/SP com a Imobiliária Lemos. Kitinetes, studios, apartamentos com 1, 2 e 3 quartos. Próximos à UNESP, centro e principais bairros. CRECI 279051.',
  keywords: [
    'apartamentos para alugar franca sp', 'apartamento para alugar franca', 'aluguel apartamento franca sp',
    'alugar apartamento franca sp', 'apartamentos aluguel franca', 'apartamento aluguel franca sp',
    'kitinete para alugar franca sp', 'studio para alugar franca sp', 'apartamento 1 quarto franca sp',
    'apartamento 2 quartos para alugar franca sp', 'apartamento 3 quartos para alugar franca sp',
    'apartamento próximo unesp franca', 'apartamento centro franca sp', 'apartamento jardim paulista franca',
    'apartamento mobiliado franca sp', 'apartamento para estudante franca sp',
    'imobiliária lemos apartamento aluguel', 'agoraencontrei apartamentos franca',
  ],
  openGraph: {
    title: 'Apartamentos para Alugar em Franca SP | Imobiliária Lemos',
    description: 'Apartamentos para alugar em Franca/SP. Kitinetes, studios e apartamentos com 1, 2 e 3 quartos. Próximos à UNESP e ao centro.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AgoraEncontrei — Imobiliária Lemos',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/apartamentos-para-alugar-franca-sp' },
  robots: { index: true, follow: true },
}

export const revalidate = 300

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SearchResultsPage',
  name: 'Apartamentos para Alugar em Franca SP',
  description: 'Listagem de apartamentos disponíveis para aluguel em Franca, São Paulo. Imobiliária Lemos — CRECI 279051.',
  url: 'https://www.agoraencontrei.com.br/apartamentos-para-alugar-franca-sp',
  provider: { '@type': 'RealEstateAgent', name: 'Imobiliária Lemos', url: 'https://www.agoraencontrei.com.br' },
}

const BAIRROS_DESTAQUE = [
  'Centro', 'Jardim Paulista', 'Jardim Califórnia', 'Vila Flores',
  'Jardim América', 'Parque Universitário', 'Jardim Europa', 'Vila Santos Dumont',
  'Jardim Aeroporto', 'Jardim Piratininga', 'Residencial Florença', 'Vila Lemos',
]

async function fetchApartamentosAluguel() {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/public/properties?type=APARTMENT&purpose=RENT&city=Franca&limit=12&status=ACTIVE&sortBy=createdAt&sortOrder=desc`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return { data: [], meta: { total: 0 } }
    return res.json()
  } catch {
    return { data: [], meta: { total: 0 } }
  }
}

function fmtPrice(p: any) {
  const v = Number(p.priceRent) || Number(p.price) || 0
  if (!v) return 'Consulte'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v) + '/mês'
}

export default async function ApartamentosParaAlugarFrancaSP() {
  const result = await fetchApartamentosAluguel()
  const properties = result.data ?? []
  const total = result.meta?.total ?? 0

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />

      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ color: '#C9A84C' }}>
            <Building2 className="w-3.5 h-3.5" />
            Imobiliária Lemos — 22+ anos em Franca/SP
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Apartamentos para Alugar<br />
            <span style={{ color: '#C9A84C' }}>em Franca/SP</span>
          </h1>
          <p className="text-white/70 text-lg mb-6 max-w-2xl mx-auto">
            {total > 0 ? `${total} apartamentos disponíveis` : 'Dezenas de apartamentos disponíveis'} para locação.
            Kitinetes, studios e apartamentos com 1, 2 e 3 quartos em toda Franca.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/imoveis?type=APARTMENT&purpose=RENT&city=Franca"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              Ver todos os apartamentos <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="https://wa.me/5516981010004?text=Olá! Quero alugar um apartamento em Franca/SP."
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-white">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold mb-4" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          Apartamentos para Alugar por Bairro em Franca
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {BAIRROS_DESTAQUE.map(bairro => {
            const slug = bairro.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            return (
              <Link key={bairro} href={`/imoveis/em/franca/${slug}`}
                className="flex items-center gap-2 p-3 rounded-xl bg-white border border-gray-100 hover:border-[#C9A84C] hover:shadow-sm transition-all text-sm text-gray-700">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C9A84C' }} />
                {bairro}
              </Link>
            )
          })}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            {total > 0 ? `${total} Apartamentos para Alugar em Franca` : 'Apartamentos Disponíveis'}
          </h2>
          <Link href="/imoveis?type=APARTMENT&purpose=RENT&city=Franca"
            className="text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            style={{ color: '#C9A84C' }}>
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {properties.map((p: any) => (
              <Link key={p.id} href={`/imoveis/${p.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:border-transparent transition-all duration-300">
                <div className="relative h-44 overflow-hidden bg-gray-100">
                  {p.coverImage ? (
                    <Image src={p.coverImage} alt={p.title} fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, 25vw" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-4xl" style={{ background: 'linear-gradient(135deg, #1B2B5B15, #C9A84C15)' }}>🏢</div>
                  )}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: '#1B2B5B' }}>Aluguel</div>
                </div>
                <div className="p-4">
                  <p className="font-bold text-base mb-0.5" style={{ color: '#C9A84C' }}>{fmtPrice(p)}</p>
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">{p.title}</p>
                  {p.neighborhood && (
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{p.neighborhood}, Franca/SP
                    </p>
                  )}
                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    {p.bedrooms > 0 && <span>{p.bedrooms} quarto{p.bedrooms > 1 ? 's' : ''}</span>}
                    {p.totalArea > 0 && <span>{p.totalArea}m²</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Link href="/imoveis?type=APARTMENT&purpose=RENT"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: '#1B2B5B' }}>
              Ver todos os apartamentos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
        {total > 12 && (
          <div className="text-center mt-8">
            <Link href="/imoveis?type=APARTMENT&purpose=RENT&city=Franca"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-white transition-all hover:brightness-110"
              style={{ background: '#1B2B5B' }}>
              Ver todos os {total} apartamentos para alugar <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      <section className="bg-white border-t py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Alugar Apartamento em Franca/SP: O que Saber
          </h2>
          <p className="text-gray-600 mb-4">
            Franca possui uma grande variedade de apartamentos para alugar, desde kitinetes e studios para estudantes
            até apartamentos de 3 quartos para famílias. A cidade tem forte presença da UNESP e de empresas do setor
            coureiro-calçadista, gerando demanda constante por locação.
          </p>
          <h3 className="text-lg font-bold mt-6 mb-2" style={{ color: '#1B2B5B' }}>Apartamentos próximos à UNESP Franca</h3>
          <p className="text-gray-600 mb-4">
            Para estudantes da UNESP Franca, os bairros mais procurados são <strong>Jardim Paulista</strong>,
            <strong> Centro</strong> e <strong>Vila Flores</strong>, com fácil acesso ao campus e ao centro da cidade.
            Temos kitinetes e apartamentos a partir de R$ 700/mês.
          </p>
          <h3 className="text-lg font-bold mt-6 mb-2" style={{ color: '#1B2B5B' }}>Valores de aluguel de apartamentos em Franca</h3>
          <p className="text-gray-600">
            Os preços de aluguel de apartamentos em Franca variam de acordo com o bairro, tamanho e acabamento.
            Kitinetes: R$ 600–900/mês. Apartamentos 1 quarto: R$ 800–1.400/mês. Apartamentos 2 quartos: R$ 1.200–2.500/mês.
            Apartamentos 3 quartos: R$ 2.000–4.000/mês.
          </p>
        </div>
      </section>
    </>
  )
}
