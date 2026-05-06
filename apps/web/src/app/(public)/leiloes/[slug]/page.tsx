import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Building2, Calculator, Home, MapPin, ShieldCheck, TrendingUp } from 'lucide-react'
import LeilaoDetailClient from './LeilaoDetailClient'

type Props = { params: Promise<{ slug: string }> }

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api-production-669c.up.railway.app'
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'

type LandingConfig = {
  slug: string
  title: string
  h1: string
  description: string
  city: string
  state: string
  search?: string
  neighborhood?: string
  kind: 'cidade' | 'bairro' | 'tipo' | 'origem' | 'judicial' | 'oportunidade'
  keywords: string[]
}

const SEO_LANDINGS: Record<string, LandingConfig> = {
  'leilao-imoveis-franca-sp': {
    slug: 'leilao-imoveis-franca-sp',
    title: 'Leilão de Imóveis em Franca/SP | Oportunidades Caixa e Judiciais',
    h1: 'Leilão de imóveis em Franca/SP',
    description: 'Casas, apartamentos, terrenos e imóveis comerciais em leilão em Franca/SP, com busca por desconto, ROI, ocupação e fonte do leilão.',
    city: 'Franca', state: 'SP', search: 'Franca', kind: 'cidade',
    keywords: ['leilão imóvel Franca SP', 'imóveis leilão Franca SP', 'leilão Caixa Franca SP'],
  },
  'leilao-imoveis-caixa-franca-sp': {
    slug: 'leilao-imoveis-caixa-franca-sp',
    title: 'Leilão Caixa em Franca/SP | Imóveis Caixa com Desconto',
    h1: 'Leilão Caixa de imóveis em Franca/SP',
    description: 'Página dedicada a imóveis Caixa em leilão ou venda direta em Franca/SP, com análise de lance mínimo, avaliação, desconto e financiamento.',
    city: 'Franca', state: 'SP', search: 'CAIXA', kind: 'origem',
    keywords: ['leilão Caixa Franca SP', 'casa leilão Caixa Franca SP', 'leilão Caixa imóveis Franca SP'],
  },
  'leilao-casas-franca-sp': {
    slug: 'leilao-casas-franca-sp',
    title: 'Casas em Leilão em Franca/SP | Lances e Descontos',
    h1: 'Casas em leilão em Franca/SP',
    description: 'Encontre casas em leilão em Franca/SP e compare lance mínimo, valor de avaliação, ocupação, financiamento e desconto estimado.',
    city: 'Franca', state: 'SP', search: 'casa', kind: 'tipo',
    keywords: ['casa leilão Franca SP', 'casas em leilão Franca', 'casa leilão Caixa Franca SP'],
  },
  'leilao-apartamentos-franca-sp': {
    slug: 'leilao-apartamentos-franca-sp',
    title: 'Apartamentos em Leilão em Franca/SP | Oportunidades para Arremate',
    h1: 'Apartamentos em leilão em Franca/SP',
    description: 'Apartamentos em leilão em Franca/SP com filtros de desconto, ROI, financiamento, ocupação e análise de oportunidade para investidores.',
    city: 'Franca', state: 'SP', search: 'apartamento', kind: 'tipo',
    keywords: ['apartamento leilão Franca SP', 'apartamento leilão Caixa Franca', 'apartamentos em leilão Franca'],
  },
  'leilao-terrenos-franca-sp': {
    slug: 'leilao-terrenos-franca-sp',
    title: 'Terrenos em Leilão em Franca/SP | Lotes e Áreas com Desconto',
    h1: 'Terrenos em leilão em Franca/SP',
    description: 'Terrenos, lotes e áreas em leilão em Franca/SP para construção, incorporação ou investimento patrimonial.',
    city: 'Franca', state: 'SP', search: 'terreno', kind: 'tipo',
    keywords: ['terreno leilão Franca SP', 'lote leilão Franca', 'área em leilão Franca'],
  },
  'leilao-imoveis-comerciais-franca-sp': {
    slug: 'leilao-imoveis-comerciais-franca-sp',
    title: 'Imóveis Comerciais em Leilão em Franca/SP | Salas, Galpões e Áreas',
    h1: 'Imóveis comerciais em leilão em Franca/SP',
    description: 'Salas, pontos comerciais, galpões e áreas em leilão em Franca/SP com leitura de desconto, documentação e potencial de renda.',
    city: 'Franca', state: 'SP', search: 'comercial', kind: 'tipo',
    keywords: ['imóvel comercial leilão Franca SP', 'galpão leilão Franca', 'sala comercial leilão Franca'],
  },
  'leilao-imoveis-judicial-franca-sp': {
    slug: 'leilao-imoveis-judicial-franca-sp',
    title: 'Leilão Judicial de Imóveis em Franca/SP | Guia e Oportunidades',
    h1: 'Leilão judicial de imóveis em Franca/SP',
    description: 'Imóveis judiciais em Franca/SP com orientação para análise de edital, matrícula, ocupação e riscos antes do arremate.',
    city: 'Franca', state: 'SP', search: 'judicial', kind: 'judicial',
    keywords: ['leilão judicial imóvel Franca SP', 'arrematação judicial Franca', 'imóveis judiciais Franca'],
  },
  'arrematacao-imoveis-franca-sp': {
    slug: 'arrematacao-imoveis-franca-sp',
    title: 'Arrematação de Imóveis em Franca/SP | Como Comprar com Segurança',
    h1: 'Arrematação de imóveis em Franca/SP',
    description: 'Página para quem busca arrematar imóveis em Franca/SP com análise de ROI, desconto, custos, ocupação e riscos jurídicos.',
    city: 'Franca', state: 'SP', search: 'Franca', kind: 'oportunidade',
    keywords: ['arrematação imóveis Franca SP', 'arrematar imóvel Franca', 'como comprar leilão Franca'],
  },
  'imoveis-desconto-leilao-franca-sp': {
    slug: 'imoveis-desconto-leilao-franca-sp',
    title: 'Imóveis com Desconto em Leilão em Franca/SP | Ranking de Oportunidades',
    h1: 'Imóveis com desconto em leilão em Franca/SP',
    description: 'Ranking de imóveis em leilão em Franca/SP com foco em desconto sobre avaliação, potencial de ganho e liquidez por bairro.',
    city: 'Franca', state: 'SP', search: 'Franca', kind: 'oportunidade',
    keywords: ['imóveis com desconto Franca SP', 'leilão imóveis desconto Franca', 'oportunidade leilão Franca'],
  },
}

const BAIRRO_LANDINGS: Record<string, { bairro: string; label: string }> = {
  'leilao-imoveis-centro-franca-sp': { bairro: 'Centro', label: 'Centro' },
  'leilao-imoveis-jardim-california-franca-sp': { bairro: 'Jardim Califórnia', label: 'Jardim Califórnia' },
  'leilao-imoveis-jardim-europa-franca-sp': { bairro: 'Jardim Europa', label: 'Jardim Europa' },
  'leilao-imoveis-jardim-america-franca-sp': { bairro: 'Jardim América', label: 'Jardim América' },
  'leilao-imoveis-jardim-paulista-franca-sp': { bairro: 'Jardim Paulista', label: 'Jardim Paulista' },
  'leilao-imoveis-polo-club-franca-sp': { bairro: 'Polo Club', label: 'Polo Club' },
  'leilao-imoveis-jardim-panorama-franca-sp': { bairro: 'Jardim Panorama', label: 'Jardim Panorama' },
  'leilao-imoveis-jardim-redentor-franca-sp': { bairro: 'Jardim Redentor', label: 'Jardim Redentor' },
  'leilao-imoveis-jardim-sumare-franca-sp': { bairro: 'Jardim Sumaré', label: 'Jardim Sumaré' },
  'leilao-imoveis-jardim-independencia-franca-sp': { bairro: 'Jardim Independência', label: 'Jardim Independência' },
  'leilao-imoveis-jardim-petraglia-franca-sp': { bairro: 'Jardim Petráglia', label: 'Jardim Petráglia' },
  'leilao-imoveis-jardim-paulistano-franca-sp': { bairro: 'Jardim Paulistano', label: 'Jardim Paulistano' },
  'leilao-imoveis-vila-industrial-franca-sp': { bairro: 'Vila Industrial', label: 'Vila Industrial' },
  'leilao-imoveis-boa-vista-franca-sp': { bairro: 'Boa Vista', label: 'Boa Vista' },
  'leilao-imoveis-parque-das-nacoes-franca-sp': { bairro: 'Parque das Nações', label: 'Parque das Nações' },
  'leilao-imoveis-residencial-brasil-franca-sp': { bairro: 'Residencial Brasil', label: 'Residencial Brasil' },
  'leilao-imoveis-jardim-botanico-franca-sp': { bairro: 'Jardim Botânico', label: 'Jardim Botânico' },
  'leilao-imoveis-jardim-noemia-franca-sp': { bairro: 'Jardim Noêmia', label: 'Jardim Noêmia' },
  'leilao-imoveis-parque-universitario-franca-sp': { bairro: 'Parque Universitário', label: 'Parque Universitário' },
  'leilao-imoveis-sao-jose-franca-sp': { bairro: 'São José', label: 'São José' },
  'leilao-imoveis-cidade-nova-franca-sp': { bairro: 'Cidade Nova', label: 'Cidade Nova' },
  'leilao-imoveis-jardim-santa-lucia-franca-sp': { bairro: 'Jardim Santa Lúcia', label: 'Jardim Santa Lúcia' },
  'leilao-imoveis-jardim-consolacao-franca-sp': { bairro: 'Jardim Consolação', label: 'Jardim Consolação' },
  'leilao-imoveis-residencial-paraiso-franca-sp': { bairro: 'Residencial Paraíso', label: 'Residencial Paraíso' },
  'leilao-imoveis-residencial-amazonas-franca-sp': { bairro: 'Residencial Amazonas', label: 'Residencial Amazonas' },
  'leilao-imoveis-jardim-natal-i-franca-sp': { bairro: 'Jardim Natal I', label: 'Jardim Natal I' },
  'leilao-imoveis-sao-joaquim-franca-sp': { bairro: 'São Joaquim', label: 'São Joaquim' },
}

for (const [slug, bairro] of Object.entries(BAIRRO_LANDINGS)) {
  SEO_LANDINGS[slug] = {
    slug,
    title: `Leilão de Imóveis no ${bairro.label}, Franca/SP | Casas e Apartamentos`,
    h1: `Leilão de imóveis no ${bairro.label}`,
    description: `Imóveis em leilão no ${bairro.label}, em Franca/SP, com busca por lance mínimo, desconto, ocupação, financiamento e análise de ROI.`,
    city: 'Franca', state: 'SP', search: bairro.bairro, neighborhood: bairro.bairro, kind: 'bairro',
    keywords: [`leilão imóveis ${bairro.label} Franca`, `imóvel leilão ${bairro.label}`, `casa leilão ${bairro.label} Franca SP`],
  }
}

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value)
}

async function getAuction(slug: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/auctions/${slug}`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

async function fetchLandingAuctions(config: LandingConfig) {
  const params = new URLSearchParams({ city: config.city, limit: '12', sortBy: 'discountPercent', sortOrder: 'desc' })
  if (config.search) params.set('search', config.search)
  try {
    const res = await fetch(`${API_URL}/api/v1/auctions?${params}`, { next: { revalidate: 1800 } })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data.data) ? data.data : []
  } catch {
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const landing = SEO_LANDINGS[params.slug]
  if (landing) {
    return {
      title: `${landing.title} | AgoraEncontrei`,
      description: landing.description,
      keywords: landing.keywords,
      openGraph: {
        title: landing.title,
        description: landing.description,
        type: 'website',
        locale: 'pt_BR',
        siteName: 'AgoraEncontrei',
        url: `${WEB_URL}/leiloes/${landing.slug}`,
      },
      alternates: { canonical: `${WEB_URL}/leiloes/${landing.slug}` },
    }
  }

  const auction = await getAuction(params.slug)
  if (!auction) return { title: 'Leilão não encontrado | AgoraEncontrei' }

  const title = `${auction.title} | Leilão — AgoraEncontrei`
  const description = `Imóvel em leilão: ${auction.title}. ${auction.city ? `${auction.city}/${auction.state}` : ''}. Lance mínimo: R$ ${Number(auction.minimumBid || 0).toLocaleString('pt-BR')}. ${auction.discountPercent ? `${auction.discountPercent}% de desconto.` : ''}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'AgoraEncontrei',
      images: auction.coverImage ? [{ url: auction.coverImage }] : [],
    },
    alternates: { canonical: `${WEB_URL}/leiloes/${params.slug}` },
  }
}

function LandingPage({ config, auctions }: { config: LandingConfig; auctions: any[] }) {
  const related = Object.values(SEO_LANDINGS)
    .filter(item => item.slug !== config.slug && item.city === config.city)
    .slice(0, 8)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: config.title,
    description: config.description,
    url: `${WEB_URL}/leiloes/${config.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: auctions.length,
      itemListElement: auctions.slice(0, 10).map((a, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${WEB_URL}/leiloes/${a.slug}`,
        name: a.title,
      })),
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="bg-gradient-to-br from-[#1B2B5B] via-[#243866] to-[#0f172a] text-white px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <nav className="mb-5 text-xs text-white/60">
            <Link href="/" className="hover:text-white">Início</Link> <span className="mx-1">/</span>
            <Link href="/leiloes" className="hover:text-white">Leilões</Link> <span className="mx-1">/</span>
            <span>{config.h1}</span>
          </nav>
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex rounded-full bg-[#C9A84C]/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#E9D27B]">
              Landing SEO de alta intenção
            </p>
            <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-5xl" style={{ fontFamily: 'Georgia, serif' }}>{config.h1}</h1>
            <p className="max-w-2xl text-base leading-7 text-white/75">{config.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={`/leiloes?city=${encodeURIComponent(config.city)}${config.search ? `&search=${encodeURIComponent(config.search)}` : ''}`} className="inline-flex items-center gap-2 rounded-xl bg-[#C9A84C] px-5 py-3 text-sm font-bold text-[#1B2B5B]">
                Ver oportunidades <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/leiloes/comparativo" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">
                Comparar ROI
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border bg-white p-5 shadow-sm"><Building2 className="mb-3 h-6 w-6 text-[#C9A84C]" /><p className="text-2xl font-bold text-[#1B2B5B]">{auctions.length || '—'}</p><p className="text-sm text-gray-500">oportunidades encontradas</p></div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm"><TrendingUp className="mb-3 h-6 w-6 text-[#C9A84C]" /><p className="text-2xl font-bold text-[#1B2B5B]">ROI</p><p className="text-sm text-gray-500">leitura por lance, custos e avaliação</p></div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm"><ShieldCheck className="mb-3 h-6 w-6 text-[#C9A84C]" /><p className="text-2xl font-bold text-[#1B2B5B]">Risco</p><p className="text-sm text-gray-500">ocupação, edital e matrícula</p></div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm"><Calculator className="mb-3 h-6 w-6 text-[#C9A84C]" /><p className="text-2xl font-bold text-[#1B2B5B]">Cálculo</p><p className="text-sm text-gray-500">custos de arrematação e margem</p></div>
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[#1B2B5B]">Imóveis em destaque</h2>
              <p className="text-sm text-gray-500">Lista dinâmica atualizada a partir da base de leilões do AgoraEncontrei.</p>
            </div>
            <Link href="/leiloes" className="hidden text-sm font-semibold text-[#1B2B5B] md:inline-flex">Ver todos</Link>
          </div>
          {auctions.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {auctions.slice(0, 9).map((a: any) => (
                <Link key={a.id ?? a.slug} href={`/leiloes/${a.slug}`} className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                  {a.coverImage ? <img src={a.coverImage} alt={a.title} className="h-40 w-full object-cover" /> : <div className="flex h-40 items-center justify-center bg-gray-100"><Home className="h-10 w-10 text-gray-300" /></div>}
                  <div className="p-5">
                    <div className="mb-2 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-yellow-100 px-2 py-1 font-bold text-yellow-800">{a.source || 'Leilão'}</span>{a.discountPercent ? <span className="rounded-full bg-red-50 px-2 py-1 font-bold text-red-600">-{a.discountPercent}%</span> : null}</div>
                    <h3 className="line-clamp-2 text-sm font-bold text-gray-900">{a.title}</h3>
                    <p className="mt-2 flex items-center gap-1 text-xs text-gray-500"><MapPin className="h-3 w-3" /> {a.neighborhood || config.neighborhood || config.city}, {a.city || config.city}</p>
                    <p className="mt-4 text-xs text-gray-400">Lance mínimo</p>
                    <p className="text-xl font-extrabold text-[#1B2B5B]">{a.minimumBid ? fmt(Number(a.minimumBid)) : 'Sob consulta'}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border bg-white p-8 text-center">
              <Building2 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <h3 className="text-lg font-bold text-gray-800">Nenhum anúncio ativo foi encontrado para este recorte agora.</h3>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-gray-500">A página permanece útil para capturar demanda orgânica, orientar o comprador e encaminhar para o mapa de leilões quando novos lotes forem importados.</p>
              <Link href="/leiloes" className="mt-5 inline-flex rounded-xl bg-[#1B2B5B] px-5 py-3 text-sm font-bold text-white">Ver todos os leilões</Link>
            </div>
          )}
        </section>

        <section className="rounded-2xl border bg-[#f8f6f1] p-6">
          <h2 className="mb-3 text-xl font-bold text-[#1B2B5B]">Como analisar este tipo de oportunidade</h2>
          <p className="leading-7 text-gray-700">Antes de dar lance, compare o valor de avaliação com imóveis semelhantes no mesmo bairro, estime ITBI, registro, comissão do leiloeiro, condomínio, débitos e eventual custo de desocupação. O AgoraEncontrei prioriza páginas que combinam intenção local, leitura de risco e consulta dinâmica ao inventário de leilões.</p>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold text-[#1B2B5B]">Buscas relacionadas em Franca/SP</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {related.map(item => (
              <Link key={item.slug} href={`/leiloes/${item.slug}`} className="rounded-xl border bg-white p-4 text-sm font-semibold text-gray-700 hover:border-[#C9A84C] hover:text-[#1B2B5B]">{item.h1}</Link>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}

export default async function LeilaoPage(props: Props) {
  const params = await props.params
  const landing = SEO_LANDINGS[params.slug]
  if (landing) {
    const auctions = await fetchLandingAuctions(landing)
    return <LandingPage config={landing} auctions={auctions} />
  }

  const auction = await getAuction(params.slug)

  if (!auction) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f6f1]">
        <div className="text-center">
          <div className="mb-4 text-5xl">🔍</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-800">Leilão não encontrado</h1>
          <p className="mb-4 text-gray-500">O leilão que você procura pode ter sido encerrado ou removido.</p>
          <a href="/leiloes" className="rounded-lg bg-[#1B2B5B] px-6 py-3 font-semibold text-white">
            Ver Todos os Leilões
          </a>
        </div>
      </div>
    )
  }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: auction.title,
    description: auction.description || `Imóvel em leilão em ${auction.city}/${auction.state}`,
    url: `${WEB_URL}/leiloes/${params.slug}`,
    image: auction.coverImage,
    offers: {
      '@type': 'Offer',
      price: Number(auction.minimumBid || 0),
      priceCurrency: 'BRL',
      availability: auction.status === 'OPEN' || auction.status === 'UPCOMING'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/SoldOut',
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <LeilaoDetailClient auction={auction} />
    </>
  )
}
