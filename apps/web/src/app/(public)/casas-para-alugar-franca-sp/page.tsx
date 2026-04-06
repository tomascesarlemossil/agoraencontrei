import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { LoadMoreProperties } from '../imoveis/LoadMoreProperties'
import { ArrowRight, MapPin, Home, Star, Phone, MessageCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

export const metadata: Metadata = {
  title: 'Casas para Alugar em Franca SP | Imobiliária Lemos — CRECI 279051',
  description: 'Encontre casas para alugar em Franca/SP com a Imobiliária Lemos. Mais de 22 anos no mercado. Casas com 2, 3 e 4 quartos em todos os bairros de Franca. Aluguel rápido e seguro. CRECI 279051.',
  keywords: [
    'casas para alugar franca sp', 'casa para alugar franca', 'aluguel de casas franca sp',
    'alugar casa franca sp', 'casas aluguel franca', 'casa aluguel franca sp',
    'casas para locação franca sp', 'locação de casas franca', 'imóveis para alugar franca sp',
    'casas 2 quartos para alugar franca sp', 'casas 3 quartos para alugar franca sp',
    'casas baratas para alugar franca sp', 'casas com garagem para alugar franca sp',
    'casas jardim california franca', 'casas jardim europa franca', 'casas centro franca',
    'casas vila lemos franca', 'casas jardim paulista franca', 'casas parque universitário franca',
    'imobiliária lemos aluguel franca', 'agoraencontrei casas franca',
  ],
  openGraph: {
    title: 'Casas para Alugar em Franca SP | Imobiliária Lemos',
    description: 'Mais de 22 anos conectando famílias às melhores casas para alugar em Franca/SP. Atendimento personalizado e contratos seguros.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'AgoraEncontrei — Imobiliária Lemos',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/casas-para-alugar-franca-sp' },
  robots: { index: true, follow: true },
}

export const revalidate = 300

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SearchResultsPage',
  name: 'Casas para Alugar em Franca SP',
  description: 'Listagem de casas disponíveis para aluguel em Franca, São Paulo. Imobiliária Lemos — CRECI 279051.',
  url: 'https://www.agoraencontrei.com.br/casas-para-alugar-franca-sp',
  provider: {
    '@type': 'RealEstateAgent',
    name: 'Imobiliária Lemos',
    url: 'https://www.agoraencontrei.com.br',
    telephone: '+55-16-3723-0045',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Franca',
      addressRegion: 'SP',
      addressCountry: 'BR',
    },
  },
}

const BAIRROS_DESTAQUE = [
  'Jardim Califórnia', 'Jardim Europa', 'Centro', 'Vila Lemos',
  'Jardim Paulista', 'Parque Universitário', 'Jardim América', 'Vila Santos Dumont',
  'Jardim Piratininga', 'Residencial Florença', 'Jardim Aeroporto', 'Jardim Planalto',
]

async function fetchCasasAluguel() {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/public/properties?type=HOUSE&purpose=RENT&city=Franca&limit=12&status=ACTIVE&sortBy=createdAt&sortOrder=desc`,
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

export default async function CasasParaAlugarFrancaSP() {
  const result = await fetchCasasAluguel()
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
            Casas para Alugar<br />
            <span style={{ color: '#C9A84C' }}>em Franca/SP</span>
          </h1>
          <p className="text-white/70 text-lg mb-6 max-w-2xl mx-auto">
            {total > 0 ? `${total} casas disponíveis` : 'Centenas de casas disponíveis'} para locação em Franca e região.
            Atendimento personalizado, contratos seguros e entrega rápida das chaves.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/imoveis?type=HOUSE&purpose=RENT&city=Franca"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              Ver todas as casas <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="https://wa.me/5516981010004?text=Olá! Quero alugar uma casa em Franca/SP. Podem me ajudar?"
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-white transition-all hover:brightness-110">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── BAIRROS ── */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold mb-4" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          Casas para Alugar por Bairro em Franca
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {BAIRROS_DESTAQUE.map(bairro => {
            const slug = bairro.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            return (
              <Link key={bairro}
                href={`/imoveis/em/franca/${slug}`}
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
            {total > 0 ? `${total} Casas para Alugar em Franca` : 'Casas Disponíveis para Alugar'}
          </h2>
          <Link href="/imoveis?type=HOUSE&purpose=RENT&city=Franca"
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
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: '#1B2B5B' }}>
                    Aluguel
                  </div>
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
                    {p.parkingSpots > 0 && <span>{p.parkingSpots} vaga{p.parkingSpots > 1 ? 's' : ''}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="mb-4">Carregando imóveis disponíveis...</p>
            <Link href="/imoveis?type=HOUSE&purpose=RENT"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: '#1B2B5B' }}>
              Ver todos os imóveis <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {total > 12 && (
          <div className="text-center mt-8">
            <Link href="/imoveis?type=HOUSE&purpose=RENT&city=Franca"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all hover:brightness-110"
              style={{ background: '#1B2B5B', color: 'white' }}>
              Ver todas as {total} casas para alugar <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* ── CONTEÚDO SEO ── */}
      <section className="bg-white border-t py-12 px-4">
        <div className="max-w-4xl mx-auto prose prose-gray">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Como Alugar uma Casa em Franca/SP com Segurança
          </h2>
          <p className="text-gray-600 mb-4">
            Alugar uma casa em Franca/SP é uma decisão importante que envolve planejamento financeiro e escolha do bairro ideal.
            A <strong>Imobiliária Lemos</strong>, com mais de 22 anos de experiência no mercado imobiliário de Franca,
            oferece um processo de locação transparente, seguro e ágil.
          </p>
          <h3 className="text-lg font-bold mt-6 mb-2" style={{ color: '#1B2B5B' }}>Bairros mais procurados para alugar casa em Franca</h3>
          <p className="text-gray-600 mb-4">
            Os bairros com maior demanda para locação residencial em Franca são: <strong>Jardim Califórnia</strong>,
            <strong> Jardim Europa</strong>, <strong>Centro</strong>, <strong>Vila Lemos</strong>,
            <strong> Jardim Paulista</strong> e <strong>Parque Universitário</strong>.
            Cada bairro tem características únicas de infraestrutura, proximidade com comércio e escolas.
          </p>
          <h3 className="text-lg font-bold mt-6 mb-2" style={{ color: '#1B2B5B' }}>Documentos necessários para alugar uma casa</h3>
          <p className="text-gray-600 mb-4">
            Para alugar uma casa em Franca/SP, você precisará de: RG e CPF, comprovante de renda (3 últimos holerites ou declaração de IR),
            comprovante de residência atual e fiador ou seguro fiança. Nossa equipe orienta você em cada etapa do processo.
          </p>
          <h3 className="text-lg font-bold mt-6 mb-2" style={{ color: '#1B2B5B' }}>Por que escolher a Imobiliária Lemos para alugar em Franca</h3>
          <p className="text-gray-600">
            Com o <strong>AgoraEncontrei</strong>, plataforma digital da Imobiliária Lemos, você pode buscar casas para alugar
            em Franca com filtros avançados, visualizar no mapa interativo e agendar visitas online.
            Nossa equipe de corretores especializados está pronta para encontrar a casa ideal para você e sua família.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-12 px-4 text-center" style={{ background: 'linear-gradient(135deg, #1B2B5B, #0f1c3a)' }}>
        <div className="max-w-2xl mx-auto">
          <Star className="w-8 h-8 mx-auto mb-3" style={{ color: '#C9A84C' }} />
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Não encontrou a casa ideal?
          </h2>
          <p className="text-white/70 mb-6">Fale com nossos corretores e receba indicações personalizadas.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://wa.me/5516981010004?text=Olá! Quero alugar uma casa em Franca/SP."
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-white">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <a href="tel:+551637230045"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-white/10 text-white border border-white/20">
              <Phone className="w-4 h-4" /> (16) 3723-0045
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
