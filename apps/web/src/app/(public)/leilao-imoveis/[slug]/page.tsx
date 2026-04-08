import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin, Home, Building, TrendingUp, MessageCircle, ArrowRight, Search } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const WEB_URL = 'https://www.agoraencontrei.com.br'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oenbzvxcsgyzqjtlovdq.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const revalidate = 3600

// Mapeamento de slugs para dados de bairro/cidade
const LOCATIONS: Record<string, { bairro: string; bairroDisplay: string; cidade: string; cidadeDisplay: string; estado: string }> = {
  'centro-franca-sp': { bairro: 'Centro', bairroDisplay: 'Centro', cidade: 'Franca', cidadeDisplay: 'Franca', estado: 'SP' },
  'jardim-petraglia-franca-sp': { bairro: 'Jardim Petráglia', bairroDisplay: 'Jardim Petráglia', cidade: 'Franca', cidadeDisplay: 'Franca', estado: 'SP' },
  'city-petropolis-franca-sp': { bairro: 'City Petrópolis', bairroDisplay: 'City Petrópolis', cidade: 'Franca', cidadeDisplay: 'Franca', estado: 'SP' },
  'vila-santa-cruz-franca-sp': { bairro: 'Vila Santa Cruz', bairroDisplay: 'Vila Santa Cruz', cidade: 'Franca', cidadeDisplay: 'Franca', estado: 'SP' },
  'jardim-paulista-franca-sp': { bairro: 'Jardim Paulista', bairroDisplay: 'Jardim Paulista', cidade: 'Franca', cidadeDisplay: 'Franca', estado: 'SP' },
  'jardim-california-franca-sp': { bairro: 'Jardim Califórnia', bairroDisplay: 'Jardim Califórnia', cidade: 'Franca', cidadeDisplay: 'Franca', estado: 'SP' },
  'jardim-independencia-franca-sp': { bairro: 'Jardim Independência', bairroDisplay: 'Jardim Independência', cidade: 'Franca', cidadeDisplay: 'Franca', estado: 'SP' },
  'polo-club-franca-sp': { bairro: 'Polo Club', bairroDisplay: 'Polo Club', cidade: 'Franca', cidadeDisplay: 'Franca', estado: 'SP' },
  'jardim-zanetti-franca-sp': { bairro: 'Jardim Zanetti', bairroDisplay: 'Jardim Zanetti', cidade: 'Franca', cidadeDisplay: 'Franca', estado: 'SP' },
  'jardim-piemonte-franca-sp': { bairro: 'Jardim Piemonte', bairroDisplay: 'Jardim Piemonte', cidade: 'Franca', cidadeDisplay: 'Franca', estado: 'SP' },
  'jardim-eldorado-franca-sp': { bairro: 'Jardim Eldorado', bairroDisplay: 'Jardim Eldorado', cidade: 'Franca', cidadeDisplay: 'Franca', estado: 'SP' },
  'espraiado-franca-sp': { bairro: 'Espraiado', bairroDisplay: 'Espraiado', cidade: 'Franca', cidadeDisplay: 'Franca', estado: 'SP' },
  'jardim-luiza-franca-sp': { bairro: 'Jardim Luiza', bairroDisplay: 'Jardim Luiza', cidade: 'Franca', cidadeDisplay: 'Franca', estado: 'SP' },
  'residencial-zanetti-franca-sp': { bairro: 'Residencial Zanetti', bairroDisplay: 'Residencial Zanetti', cidade: 'Franca', cidadeDisplay: 'Franca', estado: 'SP' },
  'jardim-francano-franca-sp': { bairro: 'Jardim Francano', bairroDisplay: 'Jardim Francano', cidade: 'Franca', cidadeDisplay: 'Franca', estado: 'SP' },
  // Capitais
  'savassi-belo-horizonte-mg': { bairro: 'Savassi', bairroDisplay: 'Savassi', cidade: 'Belo Horizonte', cidadeDisplay: 'Belo Horizonte', estado: 'MG' },
  'pampulha-belo-horizonte-mg': { bairro: 'Pampulha', bairroDisplay: 'Pampulha', cidade: 'Belo Horizonte', cidadeDisplay: 'Belo Horizonte', estado: 'MG' },
  'agua-verde-curitiba-pr': { bairro: 'Água Verde', bairroDisplay: 'Água Verde', cidade: 'Curitiba', cidadeDisplay: 'Curitiba', estado: 'PR' },
  'santa-felicidade-curitiba-pr': { bairro: 'Santa Felicidade', bairroDisplay: 'Santa Felicidade', cidade: 'Curitiba', cidadeDisplay: 'Curitiba', estado: 'PR' },
  'setor-bueno-goiania-go': { bairro: 'Setor Bueno', bairroDisplay: 'Setor Bueno', cidade: 'Goiânia', cidadeDisplay: 'Goiânia', estado: 'GO' },
  'aguas-claras-brasilia-df': { bairro: 'Águas Claras', bairroDisplay: 'Águas Claras', cidade: 'Brasília', cidadeDisplay: 'Brasília', estado: 'DF' },
  'vila-mariana-sao-paulo-sp': { bairro: 'Vila Mariana', bairroDisplay: 'Vila Mariana', cidade: 'São Paulo', cidadeDisplay: 'São Paulo', estado: 'SP' },
  'tatupe-sao-paulo-sp': { bairro: 'Tatuapé', bairroDisplay: 'Tatuapé', cidade: 'São Paulo', cidadeDisplay: 'São Paulo', estado: 'SP' },
  'tijuca-rio-de-janeiro-rj': { bairro: 'Tijuca', bairroDisplay: 'Tijuca', cidade: 'Rio de Janeiro', cidadeDisplay: 'Rio de Janeiro', estado: 'RJ' },
  'campo-grande-rio-de-janeiro-rj': { bairro: 'Campo Grande', bairroDisplay: 'Campo Grande', cidade: 'Rio de Janeiro', cidadeDisplay: 'Rio de Janeiro', estado: 'RJ' },
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return Object.keys(LOCATIONS).map(slug => ({ slug }))
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const loc = LOCATIONS[params.slug]
  if (!loc) return { title: 'Leilão de Imóveis | AgoraEncontrei' }
  return {
    title: `Leilão de Imóveis no ${loc.bairroDisplay}, ${loc.cidadeDisplay}/${loc.estado} | AgoraEncontrei`,
    description: `Imóveis em leilão no ${loc.bairroDisplay} em ${loc.cidadeDisplay}/${loc.estado}. Descontos de até 50% em casas, apartamentos e terrenos. Calculadora de ROI e assessoria jurídica.`,
    keywords: [
      `leilão imóveis ${loc.bairroDisplay.toLowerCase()} ${loc.cidadeDisplay.toLowerCase()}`,
      `leilão casa ${loc.bairroDisplay.toLowerCase()} ${loc.cidadeDisplay.toLowerCase()} ${loc.estado.toLowerCase()}`,
      `imóvel leilão ${loc.bairroDisplay.toLowerCase()}`,
      `arremate imóvel ${loc.cidadeDisplay.toLowerCase()}`,
      `leilão caixa ${loc.bairroDisplay.toLowerCase()}`,
    ],
    openGraph: {
      title: `Leilão de Imóveis no ${loc.bairroDisplay} — ${loc.cidadeDisplay}/${loc.estado}`,
      description: `Encontre oportunidades de leilão no ${loc.bairroDisplay}. Descontos de até 50%.`,
      type: 'website', locale: 'pt_BR', siteName: 'AgoraEncontrei',
    },
    alternates: { canonical: `${WEB_URL}/leilao-imoveis/${params.slug}` },
  }
}

async function fetchAuctions(bairro: string, cidade: string) {
  // Try API
  try {
    const res = await fetch(`${API_URL}/api/v1/auctions?city=${encodeURIComponent(cidade)}&search=${encodeURIComponent(bairro)}&limit=20`, { next: { revalidate: 3600 } })
    if (res.ok) { const d = await res.json(); if (d.data?.length > 0) return d.data }
  } catch {}
  // Try Supabase
  if (SUPABASE_ANON_KEY) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/auctions?select=*&or=(neighborhood.ilike.*${encodeURIComponent(bairro)}*,city.ilike.*${encodeURIComponent(cidade)}*)&status=not.in.(CANCELLED,CLOSED)&limit=20`,
        { headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }, next: { revalidate: 3600 } }
      )
      if (res.ok) return res.json()
    } catch {}
  }
  return []
}

export default async function LeilaoBairroPage(props: Props) {
  const params = await props.params
  const loc = LOCATIONS[params.slug]
  if (!loc) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Localização não encontrada</h1>
          <Link href="/leiloes" className="text-[#C9A84C] hover:underline">Ver todos os leilões</Link>
        </div>
      </div>
    )
  }

  const auctions = await fetchAuctions(loc.bairro, loc.cidade)
  const otherLocations = Object.entries(LOCATIONS).filter(([s]) => s !== params.slug && LOCATIONS[s].cidade === loc.cidade).slice(0, 8)
  const otherCities = Object.entries(LOCATIONS).filter(([s]) => LOCATIONS[s].cidade !== loc.cidade).slice(0, 6)

  const schema = {
    '@context': 'https://schema.org', '@type': 'ItemList',
    name: `Leilão de Imóveis no ${loc.bairroDisplay}, ${loc.cidadeDisplay}/${loc.estado}`,
    url: `${WEB_URL}/leilao-imoveis/${params.slug}`,
    numberOfItems: auctions.length,
    itemListElement: auctions.slice(0, 10).map((a: any, i: number) => ({
      '@type': 'ListItem', position: i + 1,
      item: { '@type': 'RealEstateListing', name: a.title, price: Number(a.minimumBid || 0), priceCurrency: 'BRL' },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="text-xs text-blue-200 mb-4 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-white">Início</Link> <span>/</span>
            <Link href="/leiloes" className="hover:text-white">Leilões</Link> <span>/</span>
            <Link href={`/imoveis?city=${loc.cidade}`} className="hover:text-white">{loc.cidadeDisplay}</Link> <span>/</span>
            <span>{loc.bairroDisplay}</span>
          </nav>
          <h1 className="text-2xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Leilão de Imóveis no <span style={{ color: '#C9A84C' }}>{loc.bairroDisplay}</span>
            <br /><span className="text-lg font-normal text-white/60">{loc.cidadeDisplay}/{loc.estado}</span>
          </h1>
          <p className="text-white/70 mb-6 max-w-2xl">
            {auctions.length > 0 ? `${auctions.length} imóveis em leilão` : 'Imóveis em leilão'} no {loc.bairroDisplay}.
            Descontos de até 50% sobre o valor de avaliação. Calculadora de ROI e assessoria jurídica.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={`/leiloes?search=${encodeURIComponent(loc.bairro)}&city=${encodeURIComponent(loc.cidade)}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm" style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              <Search className="w-4 h-4" /> Buscar no Mapa
            </Link>
            <a href={`https://wa.me/5516981010004?text=Olá! Vi leilões no ${loc.bairroDisplay} em ${loc.cidadeDisplay} no AgoraEncontrei.`}
              target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#25D366] text-white">
              <MessageCircle className="w-4 h-4" /> Assessoria Jurídica
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {auctions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {auctions.map((a: any) => (
              <Link key={a.id} href={`/leiloes/${a.slug}`}
                className="bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition">
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 font-semibold">{a.source || 'CAIXA'}</span>
                    {a.discountPercent && <span className="text-xs font-bold text-red-600">-{a.discountPercent}%</span>}
                    {a.opportunityScore && <span className="text-xs font-semibold text-green-600">Score {a.opportunityScore}</span>}
                  </div>
                  <p className="font-bold text-sm text-gray-800 line-clamp-2 mb-2">{a.title}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3" /> {a.neighborhood || loc.bairroDisplay}, {a.city || loc.cidadeDisplay}
                  </p>
                  {a.appraisalValue && <p className="text-xs text-gray-400 line-through">Avaliação: {fmt(Number(a.appraisalValue))}</p>}
                  <p className="text-xl font-bold mt-1" style={{ color: '#1B2B5B' }}>{a.minimumBid ? fmt(Number(a.minimumBid)) : '—'}</p>
                  <div className="flex gap-2 mt-3 text-xs text-gray-500">
                    {a.totalArea && <span>{a.totalArea}m²</span>}
                    {a.bedrooms > 0 && <span>{a.bedrooms} quartos</span>}
                    {a.financingAvailable && <span className="text-green-600">Financiável</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border">
            <Building className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">Nenhum leilão ativo no {loc.bairroDisplay} no momento.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/leiloes" className="px-5 py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: '#1B2B5B' }}>Ver todos os leilões</Link>
              <Link href={`/imoveis?city=${loc.cidade}&neighborhood=${encodeURIComponent(loc.bairro)}`}
                className="px-5 py-2.5 rounded-xl font-bold text-sm border text-gray-700">Imóveis à venda</Link>
            </div>
          </div>
        )}

        {/* Outros bairros na mesma cidade */}
        {otherLocations.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Leilões em outros bairros de {loc.cidadeDisplay}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {otherLocations.map(([slug, l]) => (
                <Link key={slug} href={`/leilao-imoveis/${slug}`}
                  className="bg-white rounded-xl border p-3 text-center hover:border-[#C9A84C] transition text-sm">
                  <MapPin className="w-4 h-4 mx-auto mb-1 text-[#C9A84C]" />
                  <span className="font-medium text-gray-700">{l.bairroDisplay}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Outras cidades */}
        {otherCities.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Leilões em outras cidades</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {otherCities.map(([slug, l]) => (
                <Link key={slug} href={`/leilao-imoveis/${slug}`}
                  className="bg-white rounded-xl border p-3 text-center hover:border-[#C9A84C] transition text-sm">
                  {l.bairroDisplay}, {l.cidadeDisplay}/{l.estado}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* SEO Content + Internal Links */}
        <section className="bg-gray-50 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Sobre leilões no {loc.bairroDisplay}, {loc.cidadeDisplay}</h2>
          <div className="prose prose-sm text-gray-600">
            <p>
              O <strong>{loc.bairroDisplay}</strong> em <Link href={`/imoveis?city=${loc.cidade}`} className="text-[#C9A84C] hover:underline">{loc.cidadeDisplay}/{loc.estado}</Link> é
              um dos bairros com oportunidades de leilão no marketplace <Link href="/" className="text-[#C9A84C] hover:underline">AgoraEncontrei</Link>.
              Imóveis em leilão podem ter descontos de até 50% sobre o valor de mercado.
            </p>
            <p>
              Recomendamos contratar um <Link href="/profissionais/franca" className="text-[#C9A84C] hover:underline">advogado especializado em leilões</Link> para
              verificar a documentação antes de dar qualquer lance. Confira também nosso{' '}
              <Link href={`/custo-de-vida/${loc.cidade.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')}-${loc.estado.toLowerCase()}`} className="text-[#C9A84C] hover:underline">
                guia de custo de vida em {loc.cidadeDisplay}
              </Link>.
            </p>
          </div>
        </section>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/leiloes" className="text-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition text-sm">🏛️ Todos os Leilões</Link>
          <Link href={`/imoveis?city=${loc.cidade}`} className="text-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition text-sm">🏠 Imóveis {loc.cidadeDisplay}</Link>
          <Link href="/avaliacao" className="text-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition text-sm">📊 Avaliar Imóvel</Link>
          <Link href="/anunciar-imovel" className="text-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition text-sm">📢 Anunciar</Link>
        </div>
      </div>
    </>
  )
}
