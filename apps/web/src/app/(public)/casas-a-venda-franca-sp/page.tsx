import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, MapPin, Home, Star, Phone, MessageCircle, TrendingUp } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

export const metadata: Metadata = {
  title: 'Casas à Venda em Franca SP | Imobiliária Lemos',
  description: 'Compre sua casa em Franca/SP com a Imobiliária Lemos. Mais de 300 casas à venda em todos os bairros. Casas com 2, 3 e 4 quartos, condomínios fechados e sobrados. Financiamento facilitado..',
  keywords: [
    'casas à venda franca sp', 'casa à venda franca', 'comprar casa franca sp',
    'venda de casas franca sp', 'casas venda franca', 'casa venda franca sp',
    'casas para comprar franca sp', 'comprar imóvel franca sp', 'casa própria franca sp',
    'casas 3 quartos à venda franca sp', 'casas 4 quartos à venda franca sp',
    'sobrado à venda franca sp', 'condomínio fechado franca sp', 'casa condomínio franca',
    'casas baratas à venda franca sp', 'casas financiamento franca sp',
    'casas jardim california franca venda', 'casas jardim europa franca venda',
    'casas vila lemos franca venda', 'imobiliária lemos venda casas franca',
    'primeiro imóvel franca sp', 'casa nova franca sp',
  ],
  openGraph: {
    title: 'Casas à Venda em Franca SP | Imobiliária Lemos',
    description: 'Encontre a casa dos seus sonhos em Franca/SP. Mais de 22 anos conectando famílias aos melhores imóveis. Financiamento facilitado.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AgoraEncontrei — Imobiliária Lemos',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/casas-a-venda-franca-sp' },
  robots: { index: true, follow: true },
}

export const revalidate = 300

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SearchResultsPage',
  name: 'Casas à Venda em Franca SP',
  description: 'Listagem de casas disponíveis para venda em Franca, São Paulo. Imobiliária Lemos.',
  url: 'https://www.agoraencontrei.com.br/casas-a-venda-franca-sp',
  provider: {
    '@type': 'RealEstateAgent',
    name: 'Imobiliária Lemos',
    url: 'https://www.agoraencontrei.com.br',
    telephone: '+55-16-3723-0045',
  },
}

const BAIRROS_DESTAQUE = [
  'Jardim Califórnia', 'Jardim Europa', 'Centro', 'Vila Lemos',
  'Jardim Paulista', 'Parque Universitário', 'Jardim América', 'Residencial Florença',
  'Jardim Piratininga', 'Vila Totoli', 'Jardim Aeroporto', 'Vila Real',
]

async function fetchCasasVenda() {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/public/properties?type=HOUSE&purpose=SALE&city=Franca&limit=12&status=ACTIVE&sortBy=createdAt&sortOrder=desc`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return { data: [], meta: { total: 0 } }
    return res.json()
  } catch {
    return { data: [], meta: { total: 0 } }
  }
}

function fmtPrice(p: any) {
  const v = Number(p.price) || 0
  if (!v) return 'Consulte'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

export default async function CasasAVendaFrancaSP() {
  const result = await fetchCasasVenda()
  const properties = result.data ?? []
  const total = result.meta?.total ?? 0

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />

      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ color: '#C9A84C' }}>
            <Home className="w-3.5 h-3.5" />
            Imobiliária Lemos — 22+ anos em Franca/SP
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Casas à Venda<br />
            <span style={{ color: '#C9A84C' }}>em Franca/SP</span>
          </h1>
          <p className="text-white/70 text-lg mb-6 max-w-2xl mx-auto">
            {total > 0 ? `${total} casas disponíveis` : 'Centenas de casas disponíveis'} para compra em Franca e região.
            Financiamento facilitado, assessoria completa e segurança jurídica em cada negociação.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/imoveis?type=HOUSE&purpose=SALE&city=Franca"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              Ver todas as casas <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="https://wa.me/5516981010004?text=Olá! Quero comprar uma casa em Franca/SP. Podem me ajudar?"
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-white">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── DIFERENCIAIS ── */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <Star className="w-5 h-5" />, title: '22+ Anos de Tradição', desc: 'Imobiliária referência em Franca/SP desde 2002' },
            { icon: <TrendingUp className="w-5 h-5" />, title: 'Financiamento Facilitado', desc: 'Parceria com os principais bancos e Caixa Econômica' },
            { icon: <Home className="w-5 h-5" />, title: '300+ Casas à Venda', desc: 'O maior portfólio de casas em Franca e região' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 flex gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1B2B5B15', color: '#1B2B5B' }}>
                {item.icon}
              </div>
              <div>
                <p className="font-bold text-sm" style={{ color: '#1B2B5B' }}>{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BAIRROS ── */}
      <section className="max-w-5xl mx-auto px-4 pb-10">
        <h2 className="text-xl font-bold mb-4" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          Casas à Venda por Bairro em Franca
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {BAIRROS_DESTAQUE.map(bairro => {
            const slug = bairro.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            return (
              <Link key={bairro} href={`/imoveis/em/franca/${slug}`}
                className="flex items-center gap-2 p-3 rounded-xl bg-white border border-gray-100 hover:border-[#C9A84C] hover:shadow-sm transition-all text-sm text-gray-700 hover:text-[#1B2B5B]">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C9A84C' }} />
                {bairro}
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── IMÓVEIS ── */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            {total > 0 ? `${total} Casas à Venda em Franca` : 'Casas Disponíveis para Compra'}
          </h2>
          <Link href="/imoveis?type=HOUSE&purpose=SALE&city=Franca"
            className="text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
            style={{ color: '#C9A84C' }}>
            Ver todas <ArrowRight className="w-4 h-4" />
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
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-4xl" style={{ background: 'linear-gradient(135deg, #1B2B5B15, #C9A84C15)' }}>🏠</div>
                  )}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: '#C9A84C', color: '#1B2B5B' }}>
                    Venda
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-bold text-base mb-0.5" style={{ color: '#1B2B5B' }}>{fmtPrice(p)}</p>
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">{p.title}</p>
                  {p.neighborhood && (
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{p.neighborhood}, Franca/SP
                    </p>
                  )}
                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    {p.bedrooms > 0 && <span>{p.bedrooms} quarto{p.bedrooms > 1 ? 's' : ''}</span>}
                    {p.totalArea > 0 && <span>{p.totalArea}m²</span>}
                    {p.parkingSpots > 0 && <span>{p.parkingSpots} vaga{p.parkingSpots > 1 ? 's' : ''}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Link href="/imoveis?type=HOUSE&purpose=SALE"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: '#1B2B5B' }}>
              Ver todos os imóveis <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {total > 12 && (
          <div className="text-center mt-8">
            <Link href="/imoveis?type=HOUSE&purpose=SALE&city=Franca"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110"
              style={{ background: '#1B2B5B', color: 'white' }}>
              Ver todas as {total} casas à venda <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* ── CONTEÚDO SEO ── */}
      <section className="bg-white border-t py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Comprar Casa em Franca/SP: Guia Completo
          </h2>
          <p className="text-gray-600 mb-4">
            Franca é uma das cidades mais desenvolvidas do interior de São Paulo, com excelente qualidade de vida,
            infraestrutura completa e mercado imobiliário aquecido. Comprar uma casa em Franca/SP é um investimento
            seguro e valorizado ao longo do tempo.
          </p>
          <h3 className="text-lg font-bold mt-6 mb-2" style={{ color: '#1B2B5B' }}>Melhores bairros para comprar casa em Franca</h3>
          <p className="text-gray-600 mb-4">
            Os bairros mais valorizados para compra de casas em Franca são: <strong>Jardim Califórnia</strong> (infraestrutura completa),
            <strong> Jardim Europa</strong> (residencial tranquilo), <strong>Residencial Florença</strong> (condomínio fechado),
            <strong> Jardim Paulista</strong> (próximo ao centro) e <strong>Vila Lemos</strong> (tradicional e bem localizado).
          </p>
          <h3 className="text-lg font-bold mt-6 mb-2" style={{ color: '#1B2B5B' }}>Financiamento imobiliário em Franca</h3>
          <p className="text-gray-600 mb-4">
            A Imobiliária Lemos oferece assessoria completa para financiamento imobiliário em Franca, com parceria com
            Caixa Econômica Federal, Banco do Brasil, Bradesco e outros. Simulamos o melhor financiamento para o seu perfil.
          </p>
          <h3 className="text-lg font-bold mt-6 mb-2" style={{ color: '#1B2B5B' }}>Por que comprar com a Imobiliária Lemos</h3>
          <p className="text-gray-600">
            Com mais de 22 anos de experiência em Franca/SP, a <strong>Imobiliária Lemos</strong> oferece segurança jurídica,
            assessoria em toda a documentação, avaliação gratuita do imóvel e acompanhamento até a entrega das chaves.
            Nosso CRECI é 279051 — transparência e confiança em cada negociação.
          </p>
        </div>
      </section>
    </>
  )
}
