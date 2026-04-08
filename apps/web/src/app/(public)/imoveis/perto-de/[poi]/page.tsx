import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Home, School, Hospital, ShoppingBag, Building, MessageCircle, ArrowRight, Navigation } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const WEB_URL = 'https://www.agoraencontrei.com.br'

export const revalidate = 86400 // 24h

// POIs conhecidos de Franca e região (expandir via OpenStreetMap API)
const POIS: Record<string, { name: string; type: string; lat: number; lng: number; city: string; neighborhood?: string }> = {
  'uni-franca': { name: 'Uni-FACEF', type: 'school', lat: -20.5363, lng: -47.3978, city: 'Franca', neighborhood: 'Centro' },
  'unesp-franca': { name: 'UNESP Franca', type: 'school', lat: -20.5191, lng: -47.3833, city: 'Franca', neighborhood: 'Residencial Zanetti' },
  'shopping-franca': { name: 'Franca Shopping', type: 'shopping', lat: -20.5247, lng: -47.3922, city: 'Franca', neighborhood: 'Jardim Petráglia' },
  'shopping-boulevard': { name: 'Boulevard Shopping', type: 'shopping', lat: -20.5350, lng: -47.4050, city: 'Franca' },
  'santa-casa-franca': { name: 'Santa Casa de Franca', type: 'hospital', lat: -20.5380, lng: -47.3950, city: 'Franca', neighborhood: 'Centro' },
  'hospital-regional': { name: 'Hospital Regional de Franca', type: 'hospital', lat: -20.5420, lng: -47.4100, city: 'Franca' },
  'sesi-franca': { name: 'SESI Franca', type: 'school', lat: -20.5300, lng: -47.3900, city: 'Franca' },
  'senai-franca': { name: 'SENAI Franca', type: 'school', lat: -20.5310, lng: -47.3880, city: 'Franca' },
  'etec-franca': { name: 'ETEC Dr. Júlio Cardoso', type: 'school', lat: -20.5370, lng: -47.3960, city: 'Franca', neighborhood: 'Centro' },
  'atacadao-franca': { name: 'Atacadão Franca', type: 'shopping', lat: -20.5200, lng: -47.4000, city: 'Franca' },
  'assai-franca': { name: 'Assaí Atacadista Franca', type: 'shopping', lat: -20.5150, lng: -47.3950, city: 'Franca' },
  'upa-franca': { name: 'UPA 24h Franca', type: 'hospital', lat: -20.5450, lng: -47.4050, city: 'Franca' },
  // Ribeirão Preto
  'shopping-ribeirao': { name: 'Ribeirão Shopping', type: 'shopping', lat: -21.1850, lng: -47.8150, city: 'Ribeirão Preto' },
  'usp-ribeirao': { name: 'USP Ribeirão Preto', type: 'school', lat: -21.1600, lng: -47.8500, city: 'Ribeirão Preto' },
  'hospital-clinicas-rp': { name: 'Hospital das Clínicas de Ribeirão Preto', type: 'hospital', lat: -21.1620, lng: -47.8480, city: 'Ribeirão Preto' },
  // São Paulo
  'shopping-ibirapuera': { name: 'Shopping Ibirapuera', type: 'shopping', lat: -23.6100, lng: -46.6650, city: 'São Paulo' },
  'usp-sao-paulo': { name: 'USP São Paulo', type: 'school', lat: -23.5600, lng: -46.7300, city: 'São Paulo' },
  'hospital-einstein': { name: 'Hospital Albert Einstein', type: 'hospital', lat: -23.5990, lng: -46.7130, city: 'São Paulo' },
  // Campinas
  'unicamp': { name: 'UNICAMP', type: 'school', lat: -22.8200, lng: -47.0700, city: 'Campinas' },
  'shopping-galleria': { name: 'Shopping Galleria', type: 'shopping', lat: -22.8900, lng: -47.0600, city: 'Campinas' },
}

function getPoiIcon(type: string) {
  if (type === 'school') return '🎓'
  if (type === 'hospital') return '🏥'
  if (type === 'shopping') return '🛍️'
  return '📍'
}

function getPoiLabel(type: string) {
  if (type === 'school') return 'Escola/Universidade'
  if (type === 'hospital') return 'Hospital/Saúde'
  if (type === 'shopping') return 'Shopping/Comércio'
  return 'Local'
}

type Props = { params: Promise<{ poi: string }> }

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const poi = POIS[params.poi]
  if (!poi) return { title: 'Imóveis Próximos | AgoraEncontrei' }

  return {
    title: `Imóveis Perto de ${poi.name}, ${poi.city}/SP — Venda e Aluguel | AgoraEncontrei`,
    description: `Encontre casas e apartamentos perto de ${poi.name} em ${poi.city}/SP. Imóveis à venda e para alugar no raio de 2km. Leilões com desconto disponíveis.`,
    keywords: [
      `imóveis perto ${poi.name.toLowerCase()}`,
      `apartamento próximo ${poi.name.toLowerCase()} ${poi.city.toLowerCase()}`,
      `casa perto ${poi.name.toLowerCase()}`,
      `alugar perto ${poi.name.toLowerCase()} ${poi.city.toLowerCase()} sp`,
      `morar perto ${poi.name.toLowerCase()}`,
    ],
    openGraph: {
      title: `Imóveis Perto de ${poi.name} | AgoraEncontrei`,
      description: `Casas e apartamentos no raio de 2km de ${poi.name} em ${poi.city}/SP.`,
      type: 'website', locale: 'pt_BR', siteName: 'AgoraEncontrei',
    },
    alternates: { canonical: `${WEB_URL}/imoveis/perto-de/${params.poi}` },
  }
}

export function generateStaticParams() {
  return Object.keys(POIS).map(poi => ({ poi }))
}

async function fetchNearbyProperties(city: string, neighborhood?: string) {
  try {
    const params = new URLSearchParams({ city, limit: '12', sortBy: 'createdAt', sortOrder: 'desc' })
    if (neighborhood) params.set('neighborhood', neighborhood)
    const res = await fetch(`${API_URL}/api/v1/public/properties?${params}`, { next: { revalidate: 3600 } })
    if (!res.ok) return []
    const data = await res.json()
    return data.data || []
  } catch { return [] }
}

function fmtPrice(p: any) {
  const v = Number(p.priceRent) || Number(p.price) || 0
  if (!v) return 'Consulte'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v) + (p.purpose === 'RENT' ? '/mês' : '')
}

export default async function PoiPage(props: Props) {
  const params = await props.params
  const poi = POIS[params.poi]
  if (!poi) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f6f1]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Local não encontrado</h1>
          <Link href="/imoveis" className="text-[#C9A84C] hover:underline">Ver todos os imóveis</Link>
        </div>
      </div>
    )
  }

  const properties = await fetchNearbyProperties(poi.city, poi.neighborhood)
  const icon = getPoiIcon(poi.type)
  const typeLabel = getPoiLabel(poi.type)

  // Schema.org
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Imóveis perto de ${poi.name}`,
    description: `Imóveis disponíveis no raio de 2km de ${poi.name} em ${poi.city}/SP`,
    url: `${WEB_URL}/imoveis/perto-de/${params.poi}`,
    numberOfItems: properties.length,
    itemListElement: properties.slice(0, 10).map((p: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'RealEstateListing',
        name: p.title,
        url: `${WEB_URL}/imoveis/${p.slug}`,
        price: Number(p.price || p.priceRent || 0),
        priceCurrency: 'BRL',
      },
    })),
  }

  // Outros POIs na mesma cidade para internal linking
  const relatedPois = Object.entries(POIS)
    .filter(([slug, p]) => p.city === poi.city && slug !== params.poi)
    .slice(0, 6)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="text-xs text-blue-200 mb-4 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-white">Início</Link> <span>/</span>
            <Link href="/imoveis" className="hover:text-white">Imóveis</Link> <span>/</span>
            <Link href={`/imoveis?city=${poi.city}`} className="hover:text-white">{poi.city}</Link> <span>/</span>
            <span className="text-white">Perto de {poi.name}</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">{icon}</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
                Imóveis Perto de <span style={{ color: '#C9A84C' }}>{poi.name}</span>
              </h1>
              <p className="text-white/50 text-sm">{poi.city}/SP — {typeLabel}</p>
            </div>
          </div>

          <p className="text-white/70 text-base mb-6 max-w-2xl">
            {properties.length > 0 ? `${properties.length} imóveis disponíveis` : 'Imóveis disponíveis'} no
            raio de 2km de {poi.name}. Casas, apartamentos e terrenos para compra e aluguel.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href={`/imoveis?city=${poi.city}${poi.neighborhood ? `&neighborhood=${encodeURIComponent(poi.neighborhood)}` : ''}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              <Home className="w-4 h-4" /> Ver no Mapa
            </Link>
            <Link href={`/leiloes?city=${poi.city}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white/10 text-white border border-white/20">
              🏛️ Leilões em {poi.city}
            </Link>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Imóveis à venda e para alugar perto de {poi.name}
        </h2>

        {properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.map((p: any) => (
              <Link key={p.id} href={`/imoveis/${p.slug}`}
                className="bg-white rounded-2xl overflow-hidden border hover:shadow-lg transition-shadow">
                <div className="h-44 bg-gray-100 flex items-center justify-center">
                  {p.coverImage && !p.coverImage.includes('telefone') ? (
                    <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <Home className="w-10 h-10 text-gray-300" />
                  )}
                </div>
                <div className="p-4">
                  <p className="font-bold text-sm text-gray-800 line-clamp-2 mb-1">{p.title}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                    <MapPin className="w-3 h-3" /> {p.neighborhood || poi.city}
                  </p>
                  <p className="font-bold text-base" style={{ color: '#1B2B5B' }}>{fmtPrice(p)}</p>
                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    {p.bedrooms > 0 && <span>{p.bedrooms} quartos</span>}
                    {p.totalArea > 0 && <span>{p.totalArea}m²</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border">
            <Home className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">Nenhum imóvel encontrado perto de {poi.name} no momento.</p>
            <Link href={`/imoveis?city=${poi.city}`}
              className="px-5 py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: '#1B2B5B' }}>
              Ver todos em {poi.city}
            </Link>
          </div>
        )}
      </section>

      {/* Related POIs — Internal Linking */}
      {relatedPois.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Outros locais em {poi.city}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {relatedPois.map(([slug, p]) => (
              <Link key={slug} href={`/imoveis/perto-de/${slug}`}
                className="bg-white rounded-xl border p-3 text-center hover:border-[#C9A84C] transition text-sm">
                <span className="text-2xl block mb-1">{getPoiIcon(p.type)}</span>
                <span className="text-xs font-medium text-gray-700 line-clamp-2">{p.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* SEO Content */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <div className="bg-gray-50 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">
            Por que morar perto de {poi.name}?
          </h2>
          <div className="prose prose-sm text-gray-600">
            <p>
              Morar perto de <strong>{poi.name}</strong> em <Link href={`/imoveis?city=${poi.city}`} className="text-[#C9A84C] hover:underline">{poi.city}/SP</Link> oferece
              praticidade e qualidade de vida. {poi.type === 'school' ? 'A proximidade com instituições de ensino valoriza o imóvel e facilita o dia a dia de famílias com filhos.' :
              poi.type === 'hospital' ? 'Estar próximo a centros de saúde traz segurança e comodidade para toda a família.' :
              'A proximidade com centros comerciais oferece conveniência e acesso a serviços essenciais.'}
            </p>
            <p>
              Confira também <Link href="/leiloes" className="text-[#C9A84C] hover:underline">leilões de imóveis</Link> na região e
              nossos <Link href="/profissionais/franca" className="text-[#C9A84C] hover:underline">profissionais recomendados</Link> para
              reforma e assessoria jurídica.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
