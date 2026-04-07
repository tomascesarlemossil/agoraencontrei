/**
 * Rota: /leilao/{estado}/{cidade}
 * Template SEO para 1M+ páginas de leilão por cidade.
 * ISR com revalidate de 1h. Fallback estático se API falhar.
 */
import { Metadata } from 'next'
import Link from 'next/link'
import { generateAllBlocks } from '@/lib/seo-content-blocks'
import { SEOFooterLinks } from '@/components/SEOFooterLinks'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-669c.up.railway.app'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://agoraencontrei.com.br'

export const revalidate = 3600

// ── helpers ──────────────────────────────────────────────────────────────────

function slugToName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function riskColor(level: string) {
  if (level === 'verde') return 'bg-green-100 text-green-800 border-green-300'
  if (level === 'amarelo') return 'bg-yellow-100 text-yellow-800 border-yellow-300'
  return 'bg-red-100 text-red-800 border-red-300'
}

// ── types ────────────────────────────────────────────────────────────────────

interface PropertyIntel {
  cityName?: string
  stateName?: string
  avgDiscount?: number
  avgPriceMarket?: number
  avgPriceAuction?: number
  avgRent?: number
  totalListings?: number
  population?: number
  idhm?: number
  listings?: AuctionListing[]
}

interface AuctionListing {
  id: string
  title: string
  address?: string
  price: number
  discount?: number
  imageUrl?: string
  bank?: string
  area?: number
}

// ── data fetching ────────────────────────────────────────────────────────────

async function fetchData(
  cidade: string,
  estado: string,
): Promise<PropertyIntel> {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/public/property-intelligence?city=${cidade}&state=${estado}`,
      { next: { revalidate: 3600 } },
    )
    if (!res.ok) throw new Error(`API ${res.status}`)
    return (await res.json()) as PropertyIntel
  } catch {
    // static fallback
    return {
      cityName: slugToName(cidade),
      stateName: estado.toUpperCase(),
      avgDiscount: 35,
      avgPriceMarket: 4500,
      avgPriceAuction: 2925,
      avgRent: 1800,
      totalListings: 12,
      population: 0,
      idhm: 0,
      listings: [],
    }
  }
}

// ── generateStaticParams (top 20 cities) ─────────────────────────────────────

const TOP_20_CITIES = [
  { estado: 'sp', cidade: 'sao-paulo' },
  { estado: 'rj', cidade: 'rio-de-janeiro' },
  { estado: 'mg', cidade: 'belo-horizonte' },
  { estado: 'df', cidade: 'brasilia' },
  { estado: 'ba', cidade: 'salvador' },
  { estado: 'pr', cidade: 'curitiba' },
  { estado: 'ce', cidade: 'fortaleza' },
  { estado: 'pe', cidade: 'recife' },
  { estado: 'rs', cidade: 'porto-alegre' },
  { estado: 'go', cidade: 'goiania' },
  { estado: 'am', cidade: 'manaus' },
  { estado: 'pa', cidade: 'belem' },
  { estado: 'sc', cidade: 'florianopolis' },
  { estado: 'ma', cidade: 'sao-luis' },
  { estado: 'pb', cidade: 'joao-pessoa' },
  { estado: 'mt', cidade: 'cuiaba' },
  { estado: 'al', cidade: 'maceio' },
  { estado: 'ms', cidade: 'campo-grande' },
  { estado: 'rn', cidade: 'natal' },
  { estado: 'sp', cidade: 'campinas' },
]

export async function generateStaticParams() {
  return TOP_20_CITIES
}

// ── metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ estado: string; cidade: string }>
}): Promise<Metadata> {
  const { estado, cidade } = await params
  const cityName = slugToName(cidade)
  const uf = estado.toUpperCase()

  return {
    title: `Leilão de Imóveis em ${cityName}/${uf} — Até 60% OFF | AgoraEncontrei`,
    description: `Encontre imóveis de leilão em ${cityName}/${uf} com descontos de até 60% abaixo do mercado. Compare preços ZAP vs Leilão, análise de risco e oportunidades exclusivas.`,
    keywords: [
      `leilão imóveis ${cityName.toLowerCase()}`,
      `leilão ${cityName.toLowerCase()} ${uf.toLowerCase()}`,
      `imóveis leilão caixa ${cityName.toLowerCase()}`,
      `comprar imóvel leilão ${cityName.toLowerCase()}`,
    ],
    openGraph: {
      title: `Leilão de Imóveis em ${cityName}/${uf} | AgoraEncontrei`,
      description: `Imóveis de leilão em ${cityName} com até 60% de desconto. Veja oportunidades exclusivas.`,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'AgoraEncontrei',
    },
    alternates: {
      canonical: `${WEB_URL}/leilao/${estado}/${cidade}`,
    },
  }
}

// ── page component ───────────────────────────────────────────────────────────

export default async function LeilaoPage({
  params,
}: {
  params: Promise<{ estado: string; cidade: string }>
}) {
  const { estado, cidade } = await params
  const data = await fetchData(cidade, estado)

  const cityName = data.cityName || slugToName(cidade)
  const uf = data.stateName || estado.toUpperCase()
  const discount = data.avgDiscount ?? 35
  const priceMarket = data.avgPriceMarket ?? 4500
  const priceAuction = data.avgPriceAuction ?? 2925
  const avgRent = data.avgRent ?? 1800
  const totalListings = data.totalListings ?? 0
  const listings = data.listings ?? []
  const spread = priceMarket > 0 ? Math.round(((priceMarket - priceAuction) / priceMarket) * 100) : discount

  // Generate SEO content blocks
  const blocks = generateAllBlocks({
    cidade: cityName,
    estado: uf,
    aluguelMedio: avgRent,
    precoM2Mercado: priceMarket,
    precoM2Leilao: priceAuction,
    spreadPercent: spread,
    totalLeiloes: totalListings,
    populacao: data.population,
    idhm: data.idhm,
  })

  // Risk block data
  const riscoBlock = blocks.find((b) => b.type === 'risco')
  const riskLevel = (riscoBlock?.dataPoints?.riskLevel as string) ?? 'amarelo'

  // FAQ
  const faqs = [
    {
      question: `Como funciona leilão de imóveis em ${cityName}?`,
      answer: `Leilões de imóveis em ${cityName}/${uf} são realizados por bancos como Caixa e Santander ou por leiloeiros judiciais. Você participa online ou presencialmente, dando lances a partir do valor mínimo do edital. É possível conseguir descontos de até ${discount}% em relação ao mercado.`,
    },
    {
      question: `Qual o desconto médio nos leilões em ${cityName}?`,
      answer: `Atualmente, o desconto médio em leilões de imóveis em ${cityName} é de aproximadamente ${discount}% em relação ao preço praticado no mercado (ZAP Imóveis). Isso representa uma economia de R$ ${(priceMarket - priceAuction).toLocaleString('pt-BR')}/m².`,
    },
    {
      question: `É seguro comprar imóvel de leilão em ${cityName}?`,
      answer: `Sim, desde que você analise o edital completo, verifique a matrícula atualizada, cheque a existência de ônus e consulte um advogado especializado. A AgoraEncontrei classifica cada oportunidade com um score de risco para ajudar na decisão.`,
    },
  ]

  const economia = priceMarket - priceAuction

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'RealEstateAgent',
        name: 'AgoraEncontrei',
        url: `${WEB_URL}/leilao/${estado}/${cidade}`,
        description: `Leilão de imóveis em ${cityName}/${uf} com descontos de até ${discount}% abaixo do mercado.`,
        areaServed: {
          '@type': 'City',
          name: cityName,
          containedInPlace: { '@type': 'State', name: uf },
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative bg-[#1B2B5B] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block bg-[#C9A84C] text-[#1B2B5B] text-sm font-bold px-4 py-1 rounded-full mb-4">
            Até {discount}% de desconto
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
            Leilão de Imóveis em {cityName}/{uf}
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Compare preços do mercado com oportunidades exclusivas de leilão.
            {totalListings > 0 &&
              ` ${totalListings} imóveis disponíveis agora.`}
          </p>
        </div>
      </section>

      {/* ── Market Comparison Widget ──────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-xl shadow-lg p-6 grid md:grid-cols-3 gap-6 items-center">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Preço Mercado (ZAP)
            </p>
            <p className="text-2xl font-bold text-gray-800">
              R$ {priceMarket.toLocaleString('pt-BR')}/m²
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Preço Leilão
            </p>
            <p className="text-2xl font-bold text-[#1B2B5B]">
              R$ {priceAuction.toLocaleString('pt-BR')}/m²
            </p>
          </div>
          <div className="text-center">
            <span className="inline-block bg-green-100 text-green-800 text-sm font-bold px-4 py-2 rounded-full border border-green-300">
              Economia de R$ {economia.toLocaleString('pt-BR')}/m² ({spread}%)
            </span>
          </div>
        </div>
      </section>

      {/* ── Auction Listings Grid ─────────────────────────────────────── */}
      {listings.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-[#1B2B5B] mb-6">
            Principais Oportunidades em {cityName}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow border hover:shadow-md transition overflow-hidden"
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">
                    {item.title}
                  </h3>
                  {item.address && (
                    <p className="text-xs text-gray-500 mb-2">{item.address}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-[#1B2B5B]">
                      R$ {item.price.toLocaleString('pt-BR')}
                    </p>
                    {item.discount && (
                      <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                        -{item.discount}%
                      </span>
                    )}
                  </div>
                  {item.bank && (
                    <p className="text-xs text-gray-400 mt-1">{item.bank}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Content Blocks ────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {blocks.map((block) => (
            <article
              key={block.type}
              className="bg-white rounded-lg border p-6"
            >
              <h2 className="text-xl font-bold text-[#1B2B5B] mb-2">
                {block.title}
              </h2>
              <p className="text-gray-700 leading-relaxed">{block.content}</p>
              <p className="text-xs text-gray-400 mt-3">
                Fonte: {block.source}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Risk Badge ────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 pb-8">
        <div
          className={`inline-flex items-center gap-2 px-5 py-3 rounded-full border font-semibold text-sm ${riskColor(riskLevel)}`}
        >
          <span className="w-3 h-3 rounded-full bg-current" />
          Score de Risco: {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-[#1B2B5B] mb-6">
          Perguntas Frequentes
        </h2>
        <dl className="space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b pb-4">
              <dt className="font-semibold text-gray-900 mb-2">
                {faq.question}
              </dt>
              <dd className="text-gray-600 leading-relaxed">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── CTA WhatsApp ──────────────────────────────────────────────── */}
      <section className="bg-[#1B2B5B] py-12 px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">
          Quer ajuda para arrematar em {cityName}?
        </h2>
        <p className="text-gray-300 mb-6 max-w-lg mx-auto">
          Fale com nosso time de especialistas em leilão e receba uma análise
          personalizada.
        </p>
        <a
          href={`https://wa.me/5516997799000?text=${encodeURIComponent(`Olá! Quero saber mais sobre leilões de imóveis em ${cityName}/${uf}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-4 rounded-full text-lg transition"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.325 0-4.47-.744-6.228-2.01l-.436-.328-2.848.955.955-2.848-.328-.436A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
          </svg>
          Falar no WhatsApp
        </a>
      </section>

      {/* ── SEO Footer Links ──────────────────────────────────────────── */}
      <SEOFooterLinks citySlug={cidade} estado={estado} cityName={cityName} />
    </>
  )
}
