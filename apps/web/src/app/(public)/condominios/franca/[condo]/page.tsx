import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowRight, MapPin, Home, MessageCircle, Phone, Star, Building2, User, ExternalLink, ChevronDown } from 'lucide-react'
import { getCondoName } from '@/data/seo-condo-slugs'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

export const revalidate = 600

interface Props {
  params: { condo: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const condoName = getCondoName(params.condo)
  if (!condoName) return { title: 'Condomínio não encontrado' }

  const title = `${condoName}, Franca/SP — Imóveis, Especialistas e Leilões | AgoraEncontrei`
  const description = `Imóveis à venda e para alugar no ${condoName} em Franca/SP. Veja também arquitetos, engenheiros e corretores que já trabalharam neste condomínio. Imobiliária Lemos — 22 anos de tradição.`

  return {
    title,
    description,
    keywords: [
      `imóveis ${condoName.toLowerCase()} franca sp`,
      `casas ${condoName.toLowerCase()} franca`,
      `comprar casa ${condoName.toLowerCase()} franca sp`,
      `alugar ${condoName.toLowerCase()} franca sp`,
      `arquiteto ${condoName.toLowerCase()} franca`,
      `engenheiro ${condoName.toLowerCase()} franca`,
      `reforma ${condoName.toLowerCase()} franca sp`,
      `leilão ${condoName.toLowerCase()} franca`,
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'AgoraEncontrei — Imobiliária Lemos',
      url: `https://www.agoraencontrei.com.br/condominios/franca/${params.condo}`,
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

async function fetchSpecialists(buildingSlug: string) {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/specialists/by-building/${buildingSlug}?limit=6`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.data || []
  } catch {
    return []
  }
}

async function fetchAuctions(condoName: string) {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/public/auctions?city=Franca&q=${encodeURIComponent(condoName)}&limit=3`,
      { next: { revalidate: 1800 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.data || []
  } catch {
    return []
  }
}

function fmtPrice(p: any) {
  const v = Number(p.priceRent) || Number(p.price) || 0
  if (!v) return 'Consulte'
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
  return p.purpose === 'RENT' ? fmt + '/mês' : fmt
}

const CATEGORY_LABELS: Record<string, string> = {
  ARQUITETO: 'Arquiteto(a)',
  ENGENHEIRO: 'Engenheiro(a)',
  CORRETOR: 'Corretor(a)',
  AVALIADOR: 'Avaliador(a)',
  DESIGNER_INTERIORES: 'Designer de Interiores',
  FOTOGRAFO: 'Fotógrafo(a)',
  VIDEOMAKER: 'Videomaker',
  ADVOGADO_IMOBILIARIO: 'Advogado(a) Imobiliário',
  DESPACHANTE: 'Despachante',
  OUTRO: 'Especialista',
}

export default async function CondoPage({ params }: Props) {
  const condoName = getCondoName(params.condo)
  if (!condoName) notFound()

  const [result, specialists, auctions] = await Promise.all([
    fetchProperties(condoName),
    fetchSpecialists(params.condo),
    fetchAuctions(condoName),
  ])

  const properties = result.data ?? []
  const total = result.meta?.total ?? 0

  // Schema.org ApartmentComplex + FAQ + BreadcrumbList
  const apartmentComplexSchema = {
    '@context': 'https://schema.org',
    '@type': 'ApartmentComplex',
    name: condoName,
    description: `Condomínio ${condoName} em Franca/SP. Imóveis disponíveis para compra e locação.`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Franca',
      addressRegion: 'SP',
      addressCountry: 'BR',
    },
    url: `https://www.agoraencontrei.com.br/condominios/franca/${params.condo}`,
    numberOfAvailableAccommodationUnits: total,
    amenityFeature: [],
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Tem imóveis à venda no ${condoName} em Franca/SP?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Sim! A Imobiliária Lemos tem ${total > 0 ? `${total} imóveis` : 'imóveis'} disponíveis no ${condoName}, Franca/SP. Acesse nossa plataforma para ver casas, apartamentos e terrenos com fotos e preços completos.`,
        },
      },
      {
        '@type': 'Question',
        name: `Como alugar ou comprar no ${condoName}, Franca?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Entre em contato com a Imobiliária Lemos pelo WhatsApp (16) 98101-0004 ou telefone (16) 3723-0045. Nossa equipe de corretores especializados atende o ${condoName} e toda Franca/SP.`,
        },
      },
      {
        '@type': 'Question',
        name: `Tem arquiteto ou engenheiro para reforma no ${condoName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Sim! O AgoraEncontrei conecta você com arquitetos, engenheiros e designers de interiores que já trabalharam no ${condoName} em Franca/SP. Veja os profissionais disponíveis na página do condomínio.`,
        },
      },
      {
        '@type': 'Question',
        name: `Tem imóveis em leilão no ${condoName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Verificamos periodicamente leilões de imóveis no ${condoName} em Franca/SP. Acesse nossa página de leilões para ver as oportunidades disponíveis com descontos de até 50%.`,
        },
      },
    ],
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.agoraencontrei.com.br' },
      { '@type': 'ListItem', position: 2, name: 'Imóveis', item: 'https://www.agoraencontrei.com.br/imoveis' },
      { '@type': 'ListItem', position: 3, name: 'Franca', item: 'https://www.agoraencontrei.com.br/imoveis?city=Franca' },
      { '@type': 'ListItem', position: 4, name: condoName, item: `https://www.agoraencontrei.com.br/condominios/franca/${params.condo}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(apartmentComplexSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="text-xs text-blue-200 mb-4 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-white">Início</Link>
            <span>/</span>
            <Link href="/imoveis" className="hover:text-white">Imóveis</Link>
            <span>/</span>
            <Link href="/imoveis?city=Franca" className="hover:text-white">Franca</Link>
            <span>/</span>
            <span className="text-white">{condoName}</span>
          </nav>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
              <Building2 className="w-6 h-6 text-[#C9A84C]" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                {condoName}
                <br /><span className="text-xl font-normal text-white/70">Franca/SP</span>
              </h1>
              <p className="text-white/70 text-base mb-5 max-w-2xl">
                {total > 0 ? `${total} imóveis disponíveis` : 'Condomínio em Franca/SP'} · {specialists.length > 0 ? `${specialists.length} especialistas cadastrados` : 'Especialistas disponíveis'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/imoveis?city=Franca&neighborhood=${encodeURIComponent(condoName)}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              <Home className="w-4 h-4" /> Ver Imóveis
            </Link>
            <a href={`https://wa.me/5516981010004?text=Olá! Quero um imóvel no ${condoName} em Franca/SP.`}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#25D366] text-white">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            {auctions.length > 0 && (
              <Link href="/leilao-imoveis-franca-sp"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-red-500 text-white">
                🔥 {auctions.length} em Leilão
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* IMÓVEIS */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-[#1B2B5B] mb-6" style={{ fontFamily: 'Georgia, serif' }}>
          Imóveis no {condoName}
        </h2>
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

      {/* LEILÕES */}
      {auctions.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-10">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-red-700 mb-1 flex items-center gap-2">
              🔥 Imóveis em Leilão no {condoName}
            </h2>
            <p className="text-red-600 text-sm mb-4">Oportunidades com desconto de até 50% no valor de mercado</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {auctions.map((a: any) => (
                <Link key={a.id} href={`/leiloes/${a.slug}`}
                  className="bg-white rounded-xl p-4 border border-red-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{a.source}</span>
                    {a.discountPercent && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">-{a.discountPercent}%</span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1">{a.title}</p>
                  <p className="text-[#1B2B5B] font-bold">
                    {a.minimumBid ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(a.minimumBid)) : 'Consulte'}
                  </p>
                </Link>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link href="/leilao-imoveis-franca-sp"
                className="inline-flex items-center gap-2 text-red-600 font-semibold text-sm hover:underline">
                Ver todos os leilões em Franca <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ESPECIALISTAS — INTERLINKAGEM SEO */}
      <section className="max-w-6xl mx-auto px-4 pb-10">
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-xl font-bold text-[#1B2B5B] mb-1" style={{ fontFamily: 'Georgia, serif' }}>
            Especialistas que já trabalharam no {condoName}
          </h2>
          <p className="text-gray-500 text-sm mb-5">
            Arquitetos, engenheiros, corretores e designers que conhecem este condomínio
          </p>

          {specialists.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {specialists.map((s: any) => (
                <Link key={s.id} href={`/especialistas/${s.slug}`}
                  className="flex items-center gap-3 p-4 bg-[#f8f6f1] rounded-xl hover:bg-[#C9A84C]/10 transition-colors group border border-transparent hover:border-[#C9A84C]/20">
                  <div className="w-10 h-10 rounded-full bg-[#1B2B5B]/10 flex items-center justify-center flex-shrink-0 font-bold text-[#1B2B5B]">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="font-semibold text-[#1B2B5B] text-sm truncate group-hover:text-[#C9A84C] transition-colors">
                        {s.name}
                      </p>
                      {(s.plan === 'PRIME' || s.plan === 'VIP') && (
                        <span className="text-[10px] bg-[#C9A84C] text-white px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">✓</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{CATEGORY_LABELS[s.category] || s.category}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#C9A84C] flex-shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-[#f8f6f1] rounded-xl">
              <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-500 text-sm mb-3">
                Nenhum especialista cadastrado para o {condoName} ainda.
              </p>
              <Link href="/parceiros/cadastro"
                className="inline-flex items-center gap-2 bg-[#1B2B5B] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#162247] transition-colors">
                Cadastrar meu perfil aqui
              </Link>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              É arquiteto, engenheiro ou corretor? Apareça aqui.
            </p>
            <Link href="/parceiros/cadastro"
              className="text-sm font-semibold text-[#C9A84C] hover:underline flex items-center gap-1">
              Cadastrar perfil <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ SEO */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl p-8 border">
          <h2 className="text-xl font-bold mb-6" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Perguntas Frequentes — {condoName}, Franca/SP
          </h2>
          <div className="space-y-5 divide-y divide-gray-100">
            {[
              {
                q: `Tem imóveis à venda no ${condoName} em Franca/SP?`,
                a: `Sim! A Imobiliária Lemos tem ${total > 0 ? `${total} imóveis` : 'imóveis'} disponíveis no ${condoName}, Franca/SP. Acesse nossa plataforma para ver casas, apartamentos e terrenos com fotos e preços completos.`,
              },
              {
                q: `Como alugar ou comprar no ${condoName}, Franca?`,
                a: `Entre em contato com a Imobiliária Lemos pelo WhatsApp (16) 98101-0004 ou telefone (16) 3723-0045. Nossa equipe de corretores especializados atende o ${condoName} e toda Franca/SP.`,
              },
              {
                q: `Tem arquiteto ou engenheiro para reforma no ${condoName}?`,
                a: `Sim! O AgoraEncontrei conecta você com arquitetos, engenheiros e designers de interiores que já trabalharam no ${condoName} em Franca/SP. Veja os profissionais disponíveis acima.`,
              },
              {
                q: `Qual o preço dos imóveis no ${condoName}?`,
                a: `Os preços variam conforme o tipo e tamanho do imóvel. Acesse nossa busca para ver os valores atualizados ou fale com um corretor para uma avaliação personalizada.`,
              },
              {
                q: `Tem imóveis em leilão no ${condoName}?`,
                a: `Verificamos periodicamente leilões de imóveis no ${condoName} em Franca/SP. Acesse nossa página de leilões para ver as oportunidades disponíveis com descontos de até 50%.`,
              },
            ].map((item, i) => (
              <div key={i} className={`${i > 0 ? 'pt-5' : ''}`}>
                <h3 className="font-semibold text-gray-800 mb-1 flex items-start gap-2">
                  <ChevronDown className="w-4 h-4 text-[#C9A84C] flex-shrink-0 mt-0.5" />
                  {item.q}
                </h3>
                <p className="text-gray-600 text-sm pl-6">{item.a}</p>
              </div>
            ))}
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
