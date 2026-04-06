import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin, Home, MessageCircle, Phone, Star, Building2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
export const revalidate = 600

export const metadata: Metadata = {
  title: 'Imóveis na Major Nicacio, 2514, SANTA CRUZ — Franca/SP | Imobiliária Lemos',
  description: 'Casas, apartamentos e terrenos na Major Nicacio, 2514 em SANTA CRUZ, Franca/SP. Imobiliária Lemos — 22 anos de tradição. CRECI 279051.',
  keywords: [
    'imóveis major nicacio, 2514 franca sp',
    'casas major nicacio, 2514 franca',
    'apartamentos major nicacio, 2514 franca',
    'comprar imóvel major nicacio, 2514 franca sp',
    'alugar major nicacio, 2514 franca sp',
    'imobiliária lemos major nicacio, 2514',
    'major nicacio, 2514 franca sp imóveis',
    'imóveis santa cruz franca sp',
  ],
  openGraph: {
    title: 'OG_Imóveis na Major Nicacio, 2514, SANTA CRUZ — Franca/SP | Imobiliária Lemos',
    description: 'Encontre casas, apartamentos e terrenos na Major Nicacio, 2514 em Franca/SP.',
    type: 'website', locale: 'pt_BR', siteName: 'AgoraEncontrei — Imobiliária Lemos',
  },
  alternates: { canonical: 'https://www.agoraencontrei.com.br/ruas/franca/major-nicacio-2514' },
  robots: { index: true, follow: true },
}

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SearchResultsPage',
  name: 'Imóveis na Major Nicacio, 2514 — Franca/SP',
  description: 'Imóveis disponíveis na Major Nicacio, 2514 em Franca, São Paulo. Imobiliária Lemos — CRECI 279051.',
  url: 'https://www.agoraencontrei.com.br/ruas/franca/major-nicacio-2514',
  provider: {
    '@type': 'RealEstateAgent', name: 'Imobiliária Lemos',
    url: 'https://www.agoraencontrei.com.br', telephone: '+55-16-3723-0045',
    address: { '@type': 'PostalAddress', addressLocality: 'Franca', addressRegion: 'SP', addressCountry: 'BR' },
  },
}

async function fetchProperties() {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/public/properties?city=Franca&street=${encodeURIComponent('MAJOR NICACIO, 2514')}&limit=12&status=ACTIVE&sortBy=createdAt&sortOrder=desc`,
      { next: { revalidate: 600 } }
    )
    if (!res.ok) return { data: [], meta: { total: 0 } }
    return res.json()
  } catch { return { data: [], meta: { total: 0 } } }
}

export default async function RuaPage() {
  const result = await fetchProperties()
  const properties = result?.data ?? []
  const total = result?.meta?.total ?? 0

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <nav className="text-sm text-blue-200 mb-4 flex items-center gap-2 flex-wrap">
              <Link href="/" className="hover:text-white">Início</Link>
              <span>/</span>
              <Link href="/imoveis/em/franca" className="hover:text-white">Franca/SP</Link>
              <><span>/</span><Link href="/bairros/franca/santa-cruz" className="hover:text-white">SANTA CRUZ</Link></>
              <span>/</span>
              <span className="text-white">Major Nicacio, 2514</span>
            </nav>
            <div className="flex items-start gap-4">
              <MapPin className="w-10 h-10 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Imóveis na <span className="text-yellow-400">Major Nicacio, 2514</span>
                </h1>
                <p className="text-blue-100 text-lg">
                  SANTA CRUZ · Franca/SP · {total > 0 ? `${total} imóveis disponíveis` : 'Consulte disponibilidade'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Conteúdo principal */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          {properties.length > 0 ? (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Imóveis disponíveis na Major Nicacio, 2514
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {properties.map((p: any) => (
                  <Link key={p.id} href={`/imoveis/${p.slug || p.id}`}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                    {p.images?.[0] && (
                      <div className="h-48 bg-gray-200 overflow-hidden">
                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">
                        {p.type} · {p.purpose === 'SALE' ? 'Venda' : 'Aluguel'}
                      </p>
                      <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{p.title}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                        <MapPin className="w-3 h-3" />
                        {p.neighborhood}, Franca/SP
                      </p>
                      <p className="text-lg font-bold text-blue-700">
                        {p.purpose === 'SALE'
                          ? `R$ ${Number(p.salePrice || 0).toLocaleString('pt-BR')}`
                          : `R$ ${Number(p.rentPrice || 0).toLocaleString('pt-BR')}/mês`}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="text-center">
                <Link href={`/imoveis/em/franca?street=${encodeURIComponent('MAJOR NICACIO, 2514')}`}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                  Ver todos os imóveis na Major Nicacio, 2514 <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Busque imóveis na Major Nicacio, 2514
              </h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Consulte nossa equipe para encontrar imóveis disponíveis na Major Nicacio, 2514,
                SANTA CRUZ em Franca/SP.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href={`/imoveis/em/franca?street=${encodeURIComponent('MAJOR NICACIO, 2514')}`}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                  <Home className="w-4 h-4" /> Buscar Imóveis
                </Link>
                <a href="https://wa.me/5516937230045?text=Olá!%20Tenho%20interesse%20em%20imóveis%20na%20Major%20Nicacio,%202514%20em%20Franca/SP"
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              </div>
            </div>
          )}
        </section>

        {/* Seção de contexto SEO */}
        <section className="bg-white py-12 border-t">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Sobre a Major Nicacio, 2514 em Franca/SP
            </h2>
            <div className="prose max-w-none text-gray-600">
              <p>
                A <strong>Major Nicacio, 2514</strong> está localizada no bairro <strong>SANTA CRUZ</strong> em <strong>Franca/SP</strong>,
                uma das cidades mais importantes do interior paulista. A região oferece excelente infraestrutura,
                com fácil acesso a comércios, escolas, hospitais e transporte público.
              </p>
              <p>
                A <strong>Imobiliária Lemos</strong>, com mais de 22 anos de atuação em Franca/SP e CRECI 279051,
                é especialista em imóveis na Major Nicacio, 2514 e região. Nossa equipe de corretores conhece
                profundamente cada rua e bairro de Franca, garantindo o melhor atendimento na busca pelo
                seu imóvel ideal.
              </p>
              <p>
                Seja para <strong>comprar</strong> ou <strong>alugar</strong> um imóvel na Major Nicacio, 2514,
                conte com a Imobiliária Lemos. Temos casas, apartamentos, terrenos e imóveis comerciais
                disponíveis em toda Franca/SP e região.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-800">22 anos de experiência</p>
                <p className="text-sm text-gray-600">Tradição em Franca/SP</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold text-gray-800">CRECI 279051</p>
                <p className="text-sm text-gray-600">Corretores certificados</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Phone className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="font-semibold text-gray-800">(16) 3723-0045</p>
                <p className="text-sm text-gray-600">Atendimento personalizado</p>
              </div>
            </div>
          </div>
        </section>

        {/* Links para bairros */}
        <section className="max-w-6xl mx-auto px-4 py-10">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Explore outros bairros de Franca/SP</h3>
          <div className="flex flex-wrap gap-2">
            <Link href="/bairros/franca/santa-cruz" className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors">SANTA CRUZ</Link>
            <Link href="/imoveis/em/franca" className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors">
              Todos os bairros de Franca
            </Link>
            <Link href="/bairros" className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-700 transition-colors">
              Ver índice completo →
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
