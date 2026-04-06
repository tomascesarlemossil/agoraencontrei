import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowRight, MapPin, Home, MessageCircle, Phone, Star, Building, TrendingUp } from 'lucide-react'
import { getCondoName } from '@/data/seo-condo-slugs'
import CondoIntelligence from './CondoIntelligence'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

export const revalidate = 600

interface Props {
  params: { condo: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const condoName = getCondoName(params.condo)
  return {
    title: `Apartamentos no ${condoName} em Franca — Valor do m², Leilões e Vendas | AgoraEncontrei`,
    description: `Confira a tabela de preços atualizada do ${condoName} em Franca/SP. Valor do m², unidades disponíveis, leilões com desconto e profissionais de reforma recomendados.`,
    keywords: [
      `${condoName.toLowerCase()} franca sp`,
      `apartamento ${condoName.toLowerCase()} franca`,
      `valor m2 ${condoName.toLowerCase()} franca`,
      `leilão ${condoName.toLowerCase()} franca`,
      `reforma ${condoName.toLowerCase()} franca`,
      `comprar ${condoName.toLowerCase()} franca sp`,
      `alugar ${condoName.toLowerCase()} franca sp`,
      `arquiteto ${condoName.toLowerCase()} franca`,
    ],
    openGraph: {
      title: `${condoName} em Franca — Preços, Leilões e Vendas | AgoraEncontrei`,
      description: `Guia completo do ${condoName}: valor do m², imóveis à venda, leilões com desconto e profissionais recomendados.`,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'AgoraEncontrei',
    },
    alternates: { canonical: `https://www.agoraencontrei.com.br/condominios/franca/${params.condo}` },
    robots: { index: true, follow: true },
  }
}

async function fetchProperties(condoName: string) {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/public/properties?city=Franca&neighborhood=${encodeURIComponent(condoName)}&limit=12&status=ACTIVE&sortBy=createdAt&sortOrder=desc`,
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

export default async function CondoPage({ params }: Props) {
  const condoName = getCondoName(params.condo)
  const result = await fetchProperties(condoName)
  const properties = result.data ?? []
  const total = result.meta?.total ?? 0

  const SCHEMA = [
    {
      '@context': 'https://schema.org',
      '@type': 'ApartmentComplex',
      name: condoName,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Franca',
        addressRegion: 'SP',
        addressCountry: 'BR',
      },
      url: `https://www.agoraencontrei.com.br/condominios/franca/${params.condo}`,
      numberOfAvailableAccommodation: total,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'RealEstateAgent',
      name: 'AgoraEncontrei — Imobiliária Lemos',
      url: 'https://www.agoraencontrei.com.br',
      telephone: '+55-16-3723-0045',
      address: { '@type': 'PostalAddress', addressLocality: 'Franca', addressRegion: 'SP', addressCountry: 'BR' },
      areaServed: { '@type': 'City', name: 'Franca' },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: `Imóveis no ${condoName}`,
        itemListElement: properties.slice(0, 5).map((p: any, i: number) => ({
          '@type': 'Offer',
          position: i + 1,
          name: p.title,
          price: Number(p.price || p.priceRent || 0),
          priceCurrency: 'BRL',
          url: `https://www.agoraencontrei.com.br/imoveis/${p.slug}`,
        })),
      },
    },
  ]

  return (
    <>
      {SCHEMA.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }} />
      ))}

      {/* HERO — Template Elite */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="text-xs text-blue-200 mb-4 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-white">Início</Link>
            <span>/</span>
            <Link href="/imoveis" className="hover:text-white">Imóveis</Link>
            <span>/</span>
            <Link href="/imoveis?city=Franca" className="hover:text-white">Franca</Link>
            <span>/</span>
            <Link href="/condominios/franca" className="hover:text-white">Condomínios</Link>
            <span>/</span>
            <span className="text-white">{condoName}</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(201,168,76,0.2)' }}>
              <Building className="w-6 h-6 text-[#C9A84C]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
                Apartamentos no{' '}
                <span style={{ color: '#C9A84C' }}>{condoName}</span>
              </h1>
              <p className="text-white/50 text-sm">Franca/SP — Valor do m², Leilões e Vendas</p>
            </div>
          </div>

          <p className="text-white/70 text-base mb-5 max-w-2xl">
            Confira a tabela de preços atualizada, unidades disponíveis e profissionais de reforma recomendados para este edifício.
            {total > 0 && ` ${total} imóveis ativos no marketplace.`}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href={`/imoveis?city=Franca&neighborhood=${encodeURIComponent(condoName)}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              <Home className="w-4 h-4" /> Ver Imóveis à Venda
            </Link>
            <Link href={`/leiloes?search=${encodeURIComponent(condoName)}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white/10 text-white border border-white/20 hover:bg-white/20">
              🏛️ Ver Leilões neste Edifício
            </Link>
            <a href={`https://wa.me/5516981010004?text=Olá! Quero um imóvel no ${condoName} em Franca/SP.`}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#25D366] text-white">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* IMÓVEIS */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((p: any) => {
              const hasValidImage = p.coverImage &&
                !p.coverImage.includes('telefone.png') &&
                !p.coverImage.includes('whatsapp') &&
                !p.coverImage.includes('placeholder')
              return (
              <Link key={p.id} href={`/imoveis/${p.slug}`}
                className="bg-white rounded-2xl overflow-hidden border hover:shadow-lg transition-shadow">
                <div className="relative h-44 bg-gray-100">
                  {hasValidImage ? (
                    <Image src={p.coverImage} alt={p.title ?? condoName} fill className="object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a]">
                      <Home className="w-10 h-10 text-white/30" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-bold text-sm text-gray-800 line-clamp-2 mb-1">{p.title}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <MapPin className="w-3 h-3" /> {p.neighborhood ?? condoName}, Franca/SP
                  </p>
                  <p className="font-bold text-base" style={{ color: '#1B2B5B' }}>{fmtPrice(p)}</p>
                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    {p.bedrooms > 0 && <span>{p.bedrooms} qto{p.bedrooms > 1 ? 's' : ''}</span>}
                    {p.area > 0 && <span>{p.area}m²</span>}
                    {p.parkingSpots > 0 && <span>{p.parkingSpots} vaga{p.parkingSpots > 1 ? 's' : ''}</span>}
                  </div>
                </div>
              </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border">
            <Home className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">Nenhum imóvel ativo no {condoName} no momento.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/imoveis?city=Franca"
                className="px-5 py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: '#1B2B5B' }}>
                Ver imóveis em Franca
              </Link>
              <a href={`https://wa.me/5516981010004?text=Olá! Quero um imóvel no ${condoName} em Franca/SP.`}
                target="_blank" rel="noreferrer"
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-[#25D366] text-white flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> Falar com Corretor
              </a>
            </div>
          </div>
        )}
        {total > 12 && (
          <div className="text-center mt-6">
            <Link href={`/imoveis?city=Franca&neighborhood=${encodeURIComponent(condoName)}`}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: '#1B2B5B' }}>
              Ver todos os {total} imóveis no {condoName} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </section>

      {/* Painel de Inteligência + Leilões + Profissionais */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <CondoIntelligence condoName={condoName} condoSlug={params.condo} properties={properties} />
      </section>

      {/* FAQ SEO */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl p-8 border">
          <h2 className="text-xl font-bold mb-6" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Perguntas Frequentes — Imóveis no {condoName}
          </h2>
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Tem imóveis à venda no {condoName} em Franca/SP?</h3>
              <p className="text-gray-600 text-sm">
                Sim! A Imobiliária Lemos tem {total > 0 ? `${total} imóveis` : 'imóveis'} disponíveis no {condoName}, Franca/SP.
                Acesse nossa plataforma para ver casas, apartamentos e terrenos com fotos e preços completos.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Como alugar ou comprar no {condoName}, Franca?</h3>
              <p className="text-gray-600 text-sm">
                Entre em contato com a Imobiliária Lemos pelo WhatsApp <strong>(16) 98101-0004</strong> ou telefone <strong>(16) 3723-0045</strong>.
                Nossa equipe de corretores especializados atende o {condoName} e toda Franca/SP.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Qual o preço dos imóveis no {condoName}?</h3>
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
            Imobiliária Lemos — {condoName}, Franca/SP
          </h2>
          <p className="text-white/70 text-sm mb-5">22 anos de tradição · Atendimento personalizado</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={`https://wa.me/5516981010004?text=Olá! Quero um imóvel no ${condoName} em Franca/SP.`}
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
