import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, MapPin, Home, MessageCircle, Phone, Star, Building2 } from 'lucide-react'
import { getNeighborhoodName, getNeighborhoodKeywords } from '@/data/seo-slug-maps'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface Props {
  params: Promise<{ bairro: string }>
}

export const revalidate = 600
export const dynamicParams = true

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const neighborhoodName = getNeighborhoodName(params.bairro)
    ?? params.bairro.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  const keywords = getNeighborhoodKeywords(params.bairro)

  return {
    title: `Imóveis no ${neighborhoodName}, Franca/SP | Imobiliária Lemos`,
    description: `Casas à venda e para alugar no ${neighborhoodName} em Franca/SP. Imobiliária Lemos — 22 anos de tradição.. Encontre o imóvel ideal no ${neighborhoodName} com atendimento personalizado.`,
    keywords: keywords.join(', '),
    openGraph: {
      title: `Imóveis no ${neighborhoodName}, Franca/SP | Imobiliária Lemos`,
      description: `Encontre casas, apartamentos e terrenos no ${neighborhoodName} em Franca/SP com a Imobiliária Lemos.`,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'AgoraEncontrei — Imobiliária Lemos',
    },
    alternates: { canonical: `https://www.agoraencontrei.com.br/bairros/franca/${params.bairro}` },
    robots: { index: true, follow: true },
  }
}

async function fetchProperties(neighborhoodName: string) {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/public/properties?city=Franca&neighborhood=${encodeURIComponent(neighborhoodName)}&limit=12&status=ACTIVE&sortBy=createdAt&sortOrder=desc`,
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

export default async function BairroPage(props: Props) {
  const params = await props.params
  const neighborhoodName = getNeighborhoodName(params.bairro)
    ?? params.bairro.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  const result = await fetchProperties(neighborhoodName)
  const properties = result?.data ?? []
  const total = result?.meta?.total ?? 0

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    name: `Imóveis no ${neighborhoodName}, Franca/SP`,
    description: `Imóveis disponíveis no ${neighborhoodName} em Franca, São Paulo. Imobiliária Lemos.`,
    url: `https://www.agoraencontrei.com.br/bairros/franca/${params.bairro}`,
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
            <span className="text-white">{neighborhoodName}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Imóveis no <span style={{ color: '#C9A84C' }}>{neighborhoodName}</span>
            <br /><span className="text-xl font-normal text-white/70">Franca/SP</span>
          </h1>
          <p className="text-white/70 text-base mb-5 max-w-2xl">
            {total > 0 ? `${total} imóveis disponíveis` : 'Imóveis disponíveis'} no {neighborhoodName}, Franca/SP.
            Casas, apartamentos, terrenos e comerciais. Imobiliária Lemos.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href={`/imoveis?city=Franca&neighborhood=${encodeURIComponent(neighborhoodName)}&type=HOUSE`}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium border border-white/20 transition-colors">
              Casas
            </Link>
            <Link href={`/imoveis?city=Franca&neighborhood=${encodeURIComponent(neighborhoodName)}&type=APARTMENT`}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium border border-white/20 transition-colors">
              Apartamentos
            </Link>
            <Link href={`/imoveis?city=Franca&neighborhood=${encodeURIComponent(neighborhoodName)}&type=LAND`}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium border border-white/20 transition-colors">
              Terrenos
            </Link>
            <Link href={`/imoveis?city=Franca&neighborhood=${encodeURIComponent(neighborhoodName)}&purpose=SALE`}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium border border-white/20 transition-colors">
              À Venda
            </Link>
            <Link href={`/imoveis?city=Franca&neighborhood=${encodeURIComponent(neighborhoodName)}&purpose=RENT`}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium border border-white/20 transition-colors">
              Para Alugar
            </Link>
          </div>
        </div>
      </section>

      {/* Listagem de imóveis */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        {properties.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {properties.map((p: any) => {
                // Detectar imagens inválidas do sistema antigo
                const hasValidImage = p.coverImage &&
                  !p.coverImage.includes('telefone.png') &&
                  !p.coverImage.includes('whatsapp') &&
                  !p.coverImage.includes('placeholder')
                return (
                <Link key={p.id} href={`/imoveis/${p.slug}`}
                  className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
                  {hasValidImage ? (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={p.coverImage}
                        alt={p.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video overflow-hidden bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#C9A84C' }}>
                      {p.type === 'HOUSE' ? 'Casa' : p.type === 'APARTMENT' ? 'Apartamento' : p.type === 'LAND' ? 'Terreno' : p.type}
                      {' · '}
                      {p.purpose === 'SALE' ? 'Venda' : 'Aluguel'}
                    </p>
                    <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-2">{p.title}</h3>
                    <p className="text-lg font-bold" style={{ color: '#1B2B5B' }}>{fmtPrice(p)}</p>
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
              <div className="text-center mt-6">
                <Link href={`/imoveis?city=Franca&neighborhood=${encodeURIComponent(neighborhoodName)}`}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-white"
                  style={{ background: '#1B2B5B' }}>
                  Ver todos os {total} imóveis no {neighborhoodName} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border">
            <Home className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">Nenhum imóvel ativo no {neighborhoodName} no momento.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/imoveis?city=Franca"
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: '#1B2B5B' }}>
                Ver imóveis em Franca
              </Link>
              <a href={`https://wa.me/5516981010004?text=Olá! Quero um imóvel no ${encodeURIComponent(neighborhoodName)} em Franca/SP.`}
                target="_blank" rel="noreferrer"
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-[#25D366] text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Falar com Corretor
              </a>
            </div>
          </div>
        )}
      </section>

      {/* FAQ SEO */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl p-8 border">
          <h2 className="text-xl font-bold mb-6" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Perguntas Frequentes — Imóveis no {neighborhoodName}
          </h2>
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Tem imóveis à venda no {neighborhoodName} em Franca/SP?</h3>
              <p className="text-gray-600 text-sm">
                Sim! A Imobiliária Lemos tem {total > 0 ? `${total} imóveis` : 'imóveis'} disponíveis no {neighborhoodName}, Franca/SP.
                Acesse nossa plataforma para ver casas, apartamentos e terrenos com fotos e preços completos.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Como alugar ou comprar no {neighborhoodName}, Franca?</h3>
              <p className="text-gray-600 text-sm">
                Entre em contato com a Imobiliária Lemos pelo WhatsApp <strong>(16) 98101-0004</strong> ou telefone <strong>(16) 3723-0045</strong>.
                Nossa equipe de corretores especializados atende o {neighborhoodName} e toda Franca/SP.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Qual o preço dos imóveis no {neighborhoodName}?</h3>
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
            Imobiliária Lemos — {neighborhoodName}, Franca/SP
          </h2>
          <p className="text-white/70 text-sm mb-5">22 anos de tradição · Atendimento personalizado</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={`https://wa.me/5516981010004?text=Olá! Quero um imóvel no ${encodeURIComponent(neighborhoodName)} em Franca/SP.`}
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
