import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, MapPin, Home, MessageCircle, Phone, Star, Building2 } from 'lucide-react'
import { getStreetName, getStreetKeywords } from '@/data/seo-slug-maps'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface Props {
  params: { slug: string }
}

export const revalidate = 600
export const dynamicParams = true

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const streetName = getStreetName(params.slug)
  if (!streetName) {
    // Tentar derivar um nome do slug
    const derivedName = params.slug
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
    return {
      title: `Imóveis na ${derivedName}, Franca/SP | Imobiliária Lemos`,
      description: `Casas, apartamentos e terrenos na ${derivedName} em Franca/SP. Imobiliária Lemos — 22 anos de tradição..`,
      alternates: { canonical: `https://www.agoraencontrei.com.br/ruas/franca/${params.slug}` },
      robots: { index: true, follow: true },
    }
  }

  const keywords = getStreetKeywords(params.slug)

  return {
    title: `Imóveis na ${streetName}, Franca/SP | Imobiliária Lemos`,
    description: `Casas, apartamentos e terrenos na ${streetName} em Franca/SP. Imobiliária Lemos — 22 anos de tradição..`,
    keywords: keywords.join(', '),
    openGraph: {
      title: `Imóveis na ${streetName}, Franca/SP | Imobiliária Lemos`,
      description: `Encontre casas, apartamentos e terrenos na ${streetName} em Franca/SP.`,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'AgoraEncontrei — Imobiliária Lemos',
    },
    alternates: { canonical: `https://www.agoraencontrei.com.br/ruas/franca/${params.slug}` },
    robots: { index: true, follow: true },
  }
}

async function fetchProperties(streetName: string) {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/public/properties?city=Franca&street=${encodeURIComponent(streetName)}&limit=12&status=ACTIVE&sortBy=createdAt&sortOrder=desc`,
      { next: { revalidate: 600 } }
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
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
  return p.purpose === 'RENT' ? fmt + '/mês' : fmt
}

export default async function RuaPage({ params }: Props) {
  const streetName = getStreetName(params.slug) ?? params.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  const result = await fetchProperties(streetName)
  const properties = result?.data ?? []
  const total = result?.meta?.total ?? 0

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    name: `Imóveis na ${streetName} — Franca/SP`,
    description: `Imóveis disponíveis na ${streetName} em Franca, São Paulo. Imobiliária Lemos.`,
    url: `https://www.agoraencontrei.com.br/ruas/franca/${params.slug}`,
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main className="min-h-screen bg-gray-50">
        {/* Hero */}
        <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-16">
          <div className="max-w-6xl mx-auto px-4">
            <nav className="text-sm text-blue-200 mb-4 flex items-center gap-2 flex-wrap">
              <Link href="/" className="hover:text-white">Início</Link>
              <span>/</span>
              <Link href="/imoveis/em/franca" className="hover:text-white">Franca/SP</Link>
              <span>/</span>
              <span className="text-white">{streetName}</span>
            </nav>
            <div className="flex items-start gap-4">
              <MapPin className="w-10 h-10 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Imóveis na <span className="text-yellow-400">{streetName}</span>
                </h1>
                <p className="text-blue-100 text-lg">
                  Franca/SP — {total > 0 ? `${total} imóveis disponíveis` : 'Imóveis disponíveis'}
                </p>
                <p className="text-blue-200 text-sm mt-2">
                  Imobiliária Lemos · 22 anos de tradição em Franca/SP
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Listagem de imóveis */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          {properties.length > 0 ? (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {total} imóvel{total !== 1 ? 's' : ''} na {streetName}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((p: any) => {
                  const hasValidImage = p.coverImage &&
                    !p.coverImage.includes('telefone.png') &&
                    !p.coverImage.includes('whatsapp') &&
                    !p.coverImage.includes('placeholder')
                  return (
                  <Link key={p.id} href={`/imoveis/${p.slug}`}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
                    {hasValidImage ? (
                      <div className="aspect-video overflow-hidden">
                        <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                      </div>
                    )}
                    <div className="p-4">
                      <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">
                        {p.type === 'HOUSE' ? 'Casa' : p.type === 'APARTMENT' ? 'Apartamento' : p.type === 'LAND' ? 'Terreno' : p.type}
                        {' · '}
                        {p.purpose === 'SALE' ? 'Venda' : 'Aluguel'}
                      </p>
                      <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-2">{p.title}</h3>
                      <p className="text-lg font-bold text-blue-700">{fmtPrice(p)}</p>
                      <div className="flex gap-3 text-xs text-gray-500 mt-2 flex-wrap">
                        {p.bedrooms > 0 && <span>{p.bedrooms} quarto{p.bedrooms > 1 ? 's' : ''}</span>}
                        {p.bathrooms > 0 && <span>{p.bathrooms} banheiro{p.bathrooms > 1 ? 's' : ''}</span>}
                        {p.totalArea > 0 && <span>{p.totalArea}m²</span>}
                        {p.parkingSpaces > 0 && <span>{p.parkingSpaces} vaga{p.parkingSpaces > 1 ? 's' : ''}</span>}
                      </div>
                    </div>
                  </Link>
                  )
                })}
              </div>
              {total > 12 && (
                <div className="text-center mt-8">
                  <Link href={`/imoveis/em/franca?street=${encodeURIComponent(streetName)}`}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                    Ver todos os imóveis na {streetName} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Busque imóveis na {streetName}
              </h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Consulte nossa equipe para encontrar imóveis disponíveis na {streetName} em Franca/SP.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href={`/imoveis/em/franca?street=${encodeURIComponent(streetName)}`}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                  <Home className="w-4 h-4" /> Buscar Imóveis
                </Link>
                <a href={`https://wa.me/5516937230045?text=Olá!%20Tenho%20interesse%20em%20imóveis%20na%20${encodeURIComponent(streetName)}%20em%20Franca/SP`}
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
              Sobre a {streetName} em Franca/SP
            </h2>
            <div className="prose max-w-none text-gray-600">
              <p>
                A <strong>{streetName}</strong> está localizada em <strong>Franca/SP</strong>,
                uma das cidades mais importantes do interior paulista. A região oferece excelente infraestrutura,
                com fácil acesso a comércios, escolas, hospitais e transporte público.
              </p>
              <p>
                A <strong>Imobiliária Lemos</strong>, com mais de 22 anos de atuação em Franca/SP e,
                é especialista em imóveis na {streetName} e região. Nossa equipe de corretores conhece
                profundamente cada rua e bairro de Franca, garantindo o melhor atendimento na busca pelo
                seu imóvel ideal.
              </p>
              <p>
                Seja para <strong>comprar</strong> ou <strong>alugar</strong> um imóvel na {streetName},
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
                <p className="font-semibold text-gray-800"></p>
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
