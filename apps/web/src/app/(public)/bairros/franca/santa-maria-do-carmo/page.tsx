import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin, Home, MessageCircle, Phone, Star } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
export const revalidate = 600

export const metadata: Metadata = {
  title: 'Imóveis no SANTA MARIA DO CARMO, Franca/SP | Imobiliária Lemos — CRECI 279051',
  description: 'Casas à venda e para alugar no SANTA MARIA DO CARMO em Franca/SP. Imobiliária Lemos — 22 anos de tradição. CRECI 279051. Encontre o imóvel ideal no SANTA MARIA DO CARMO com atendimento personalizado.',
  keywords: [
    'imóveis santa maria do carmo franca sp', 'casas santa maria do carmo franca', 'apartamentos santa maria do carmo franca',
    'comprar casa santa maria do carmo franca sp', 'alugar santa maria do carmo franca sp',
    'terrenos santa maria do carmo franca', 'imóveis franca sp santa maria do carmo',
    'imobiliária lemos santa maria do carmo', 'santa maria do carmo franca sp imóveis',
    'casas à venda santa maria do carmo', 'apartamentos aluguel santa maria do carmo',
  ],
  openGraph: {
    title: 'Imóveis no SANTA MARIA DO CARMO, Franca/SP | Imobiliária Lemos',
    description: 'Encontre casas, apartamentos e terrenos no SANTA MARIA DO CARMO em Franca/SP com a Imobiliária Lemos.',
    type: 'website', locale: 'pt_BR', siteName: 'AgoraEncontrei — Imobiliária Lemos',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/bairros/franca/santa-maria-do-carmo' },
  robots: { index: true, follow: true },
}

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SearchResultsPage',
  name: 'Imóveis no SANTA MARIA DO CARMO, Franca/SP',
  description: 'Imóveis disponíveis no SANTA MARIA DO CARMO em Franca, São Paulo. Imobiliária Lemos — CRECI 279051.',
  url: 'https://www.agoraencontrei.com.br/bairros/franca/santa-maria-do-carmo',
  provider: {
    '@type': 'RealEstateAgent', name: 'Imobiliária Lemos',
    url: 'https://www.agoraencontrei.com.br', telephone: '+55-16-3723-0045',
    address: { '@type': 'PostalAddress', addressLocality: 'Franca', addressRegion: 'SP', addressCountry: 'BR' },
  },
}

async function fetchProperties() {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/public/properties?city=Franca&neighborhood=SANTA MARIA DO CARMO=${encodeURIComponent('SANTA MARIA DO CARMO')}&limit=12&status=ACTIVE&sortBy=createdAt&sortOrder=desc`,
      { next: { revalidate: 600 } }
    )
    if (!res.ok) return { data: [], meta: { total: 0 } }
    return res.json()
  } catch { return { data: [], meta: { total: 0 } } }
}

function fmtPrice(p: any) {
  const v = Number(p.priceRent) || Number(p.price) || 0
  if (!v) return 'Consulte'
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
  return p.purpose === 'RENT' ? fmt + '/mês' : fmt
}

export default async function BairroPage() {
  const result = await fetchProperties()
  const properties = result.data ?? []
  const total = result.meta?.total ?? 0

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="text-xs text-blue-200 mb-4 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-white">Início</Link>
            <span>/</span>
            <Link href="/imoveis" className="hover:text-white">Imóveis</Link>
            <span>/</span>
            <Link href="/imoveis/em/franca" className="hover:text-white">Franca</Link>
            <span>/</span>
            <span className="text-white">SANTA MARIA DO CARMO</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Imóveis no <span style={{ color: '#C9A84C' }}>SANTA MARIA DO CARMO</span>
            <br /><span className="text-xl font-normal text-white/70">Franca/SP</span>
          </h1>
          <p className="text-white/70 text-base mb-5 max-w-2xl">
            {total > 0 ? `${total} imóveis disponíveis` : 'Imóveis disponíveis'} no SANTA MARIA DO CARMO, Franca/SP.
            Casas, apartamentos, terrenos e comerciais. Imobiliária Lemos — CRECI 279051.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/imoveis?city=Franca&neighborhood=SANTA MARIA DO CARMO&type=HOUSE`}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium border border-white/20 transition-colors">
              Casas
            </Link>
            <Link href={`/imoveis?city=Franca&neighborhood=SANTA MARIA DO CARMO&type=APARTMENT`}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium border border-white/20 transition-colors">
              Apartamentos
            </Link>
            <Link href={`/imoveis?city=Franca&neighborhood=SANTA MARIA DO CARMO&type=LAND`}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium border border-white/20 transition-colors">
              Terrenos
            </Link>
            <Link href={`/imoveis?city=Franca&neighborhood=SANTA MARIA DO CARMO&purpose=RENT`}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium border border-white/20 transition-colors">
              Para Alugar
            </Link>
            <a href="https://wa.me/5516981010004?text=Olá! Quero um imóvel no SANTA MARIA DO CARMO em Franca/SP."
              target="_blank" rel="noreferrer"
              className="px-4 py-2 bg-[#25D366] hover:brightness-110 rounded-full text-sm font-medium transition-all flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* IMÓVEIS */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            {total > 0 ? `${total} Imóveis no SANTA MARIA DO CARMO` : 'Imóveis no SANTA MARIA DO CARMO'}
          </h2>
          <Link href={`/imoveis?city=Franca&neighborhood=SANTA MARIA DO CARMO`}
            className="text-sm font-semibold flex items-center gap-1" style={{ color: '#C9A84C' }}>
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {properties.map((p: any) => (
              <Link key={p.id} href={`/imoveis/${p.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="relative h-44 overflow-hidden bg-gray-100">
                  {p.coverImage ? (
                    <Image src={p.coverImage} alt={p.title} fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, 25vw" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-4xl"
                      style={{ background: 'linear-gradient(135deg, #1B2B5B15, #C9A84C15)' }}>🏠</div>
                  )}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: p.purpose === 'RENT' ? '#1B2B5B' : '#C9A84C', color: p.purpose === 'RENT' ? 'white' : '#1B2B5B' }}>
                    {p.purpose === 'RENT' ? 'Aluguel' : 'Venda'}
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-bold text-sm mb-0.5" style={{ color: p.purpose === 'RENT' ? '#C9A84C' : '#1B2B5B' }}>{fmtPrice(p)}</p>
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">{p.title}</p>
                  {p.neighborhood && (
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{p.neighborhood}, Franca/SP
                    </p>
                  )}
                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    {p.bedrooms > 0 && <span>{p.bedrooms} qto{p.bedrooms > 1 ? 's' : ''}</span>}
                    {p.totalArea > 0 && <span>{p.totalArea}m²</span>}
                    {p.parkingSpots > 0 && <span>{p.parkingSpots} vaga{p.parkingSpots > 1 ? 's' : ''}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border">
            <Home className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">Nenhum imóvel ativo no SANTA MARIA DO CARMO no momento.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/imoveis?city=Franca"
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: '#1B2B5B' }}>
                Ver imóveis em Franca
              </Link>
              <a href="https://wa.me/5516981010004?text=Olá! Quero um imóvel no SANTA MARIA DO CARMO em Franca/SP."
                target="_blank" rel="noreferrer"
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-[#25D366] text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Falar com Corretor
              </a>
            </div>
          </div>
        )}

        {total > 12 && (
          <div className="text-center mt-6">
            <Link href={`/imoveis?city=Franca&neighborhood=SANTA MARIA DO CARMO`}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: '#1B2B5B' }}>
              Ver todos os {total} imóveis no SANTA MARIA DO CARMO <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* FAQ SEO */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl p-8 border">
          <h2 className="text-xl font-bold mb-6" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Perguntas Frequentes — Imóveis no SANTA MARIA DO CARMO
          </h2>
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Tem imóveis à venda no SANTA MARIA DO CARMO em Franca/SP?</h3>
              <p className="text-gray-600 text-sm">
                Sim! A Imobiliária Lemos tem {total > 0 ? `${total} imóveis` : 'imóveis'} disponíveis no SANTA MARIA DO CARMO, Franca/SP.
                Acesse nossa plataforma para ver casas, apartamentos e terrenos com fotos e preços completos.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Como alugar ou comprar no SANTA MARIA DO CARMO, Franca?</h3>
              <p className="text-gray-600 text-sm">
                Entre em contato com a Imobiliária Lemos pelo WhatsApp <strong>(16) 98101-0004</strong> ou telefone <strong>(16) 3723-0045</strong>.
                Nossa equipe de corretores especializados atende o SANTA MARIA DO CARMO e toda Franca/SP.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Qual o preço dos imóveis no SANTA MARIA DO CARMO?</h3>
              <p className="text-gray-600 text-sm">
                Os preços variam conforme o tipo e tamanho do imóvel. Acesse nossa busca para ver os valores atualizados
                ou fale com um corretor para uma avaliação personalizada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-10 px-4 text-center" style={{ background: 'linear-gradient(135deg, #1B2B5B, #0f1c3a)' }}>
        <div className="max-w-2xl mx-auto">
          <Star className="w-7 h-7 mx-auto mb-3" style={{ color: '#C9A84C' }} />
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Imobiliária Lemos — SANTA MARIA DO CARMO, Franca/SP
          </h2>
          <p className="text-white/70 text-sm mb-5">CRECI 279051 · 22 anos de tradição · Atendimento personalizado</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://wa.me/5516981010004?text=Olá! Quero um imóvel no SANTA MARIA DO CARMO em Franca/SP."
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-white">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <a href="tel:+551637230045"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-white/10 text-white border border-white/20">
              <Phone className="w-4 h-4" /> (16) 3723-0045
            </a>
            <Link href="/imoveis?city=Franca"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-[#1B2B5B]"
              style={{ background: '#C9A84C' }}>
              <Home className="w-4 h-4" /> Ver Todos os Imóveis
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
