import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LoadMoreProperties } from '../../LoadMoreProperties'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// Mapeamento de slug → nome real da cidade
const CIDADES: Record<string, { nome: string; estado: string; descricao: string }> = {
  'franca':               { nome: 'Franca', estado: 'SP', descricao: 'maior polo calçadista do Brasil, localizada no interior de São Paulo' },
  'rifaina':              { nome: 'Rifaina', estado: 'SP', descricao: 'cidade à beira do Lago de Água Vermelha, no interior de São Paulo' },
  'cristais-paulista':    { nome: 'Cristais Paulista', estado: 'SP', descricao: 'cidade serrana próxima a Franca, conhecida pelo clima ameno' },
  'patrocinio-paulista':  { nome: 'Patrocínio Paulista', estado: 'SP', descricao: 'cidade do interior paulista próxima a Franca' },
  'ribeirao-preto':       { nome: 'Ribeirão Preto', estado: 'SP', descricao: 'uma das maiores cidades do interior de São Paulo' },
  'pedregulho':           { nome: 'Pedregulho', estado: 'SP', descricao: 'cidade do interior paulista na região de Franca' },
  'itirapua':             { nome: 'Itirapuã', estado: 'SP', descricao: 'cidade do interior paulista próxima a Franca' },
  'delfinopolis':         { nome: 'Delfinópolis', estado: 'MG', descricao: 'cidade mineira próxima ao Lago de Furnas, região turística' },
  'capitolio':            { nome: 'Capitólio', estado: 'MG', descricao: 'cidade às margens do Lago de Furnas, em Minas Gerais' },
  'cassia':               { nome: 'Cássia', estado: 'MG', descricao: 'cidade mineira próxima à divisa com São Paulo' },
  'ibiraci':              { nome: 'Ibiraci', estado: 'MG', descricao: 'cidade mineira próxima à região de Franca' },
  'capetinga':            { nome: 'Capetinga', estado: 'MG', descricao: 'cidade mineira próxima à divisa com São Paulo' },
  'sacramento':           { nome: 'Sacramento', estado: 'MG', descricao: 'cidade do Triângulo Mineiro' },
  'restinga':             { nome: 'Restinga', estado: 'SP', descricao: 'cidade do interior paulista na região de Franca' },
}

function slugToCity(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function cityToSlug(city: string): string {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

async function fetchCityData(citySlug: string) {
  const cidade = CIDADES[citySlug]
  const cityName = cidade?.nome ?? slugToCity(citySlug)

  try {
    const [propertiesRes, neighborhoodsRes] = await Promise.all([
      fetch(`${API_URL}/api/v1/public/properties?city=${encodeURIComponent(cityName)}&limit=12&status=ACTIVE`, {
        next: { revalidate: 300 },
      }),
      fetch(`${API_URL}/api/v1/public/properties?city=${encodeURIComponent(cityName)}&limit=200&status=ACTIVE`, {
        next: { revalidate: 3600 },
      }),
    ])

    const propertiesData = propertiesRes.ok ? await propertiesRes.json() : { data: [], meta: { total: 0 } }
    const allData = neighborhoodsRes.ok ? await neighborhoodsRes.json() : { data: [] }

    // Extrair bairros únicos
    const neighborhoodMap = new Map<string, number>()
    allData.data?.forEach((p: any) => {
      if (p.neighborhood) {
        const n = p.neighborhood.trim()
        neighborhoodMap.set(n, (neighborhoodMap.get(n) ?? 0) + 1)
      }
    })
    const neighborhoods = Array.from(neighborhoodMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)

    return {
      properties: propertiesData.data ?? [],
      total: propertiesData.meta?.total ?? 0,
      neighborhoods,
      cityName,
      citySlug,
    }
  } catch {
    return { properties: [], total: 0, neighborhoods: [], cityName, citySlug }
  }
}

export async function generateMetadata({ params }: { params: { cidade: string } }): Promise<Metadata> {
  const cidade = CIDADES[params.cidade]
  const cityName = cidade?.nome ?? slugToCity(params.cidade)
  const estado = cidade?.estado ?? 'SP'
  const desc = cidade?.descricao ?? `cidade do interior`

  const title = `Imóveis em ${cityName}/${estado} | Casas e Apartamentos | Imobiliária Lemos`
  const description = `Encontre casas à venda, apartamentos para alugar e terrenos em ${cityName}/${estado}, ${desc}. Imobiliária Lemos — CRECI 279051. Atendimento especializado na região.`

  return {
    title,
    description,
    keywords: `imóveis ${cityName.toLowerCase()}, casas à venda ${cityName.toLowerCase()}, apartamentos ${cityName.toLowerCase()}, terrenos ${cityName.toLowerCase()}, imóveis ${cityName.toLowerCase()} ${estado.toLowerCase()}, comprar casa ${cityName.toLowerCase()}, alugar apartamento ${cityName.toLowerCase()}, imobiliária ${cityName.toLowerCase()}`,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'Imobiliária Lemos',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `/imoveis/em/${params.cidade}`,
    },
  }
}

export async function generateStaticParams() {
  return Object.keys(CIDADES).map(cidade => ({ cidade }))
}

export const revalidate = 3600

export default async function CidadePage({ params }: { params: { cidade: string } }) {
  const { properties, total, neighborhoods, cityName, citySlug } = await fetchCityData(params.cidade)
  const cidade = CIDADES[params.cidade]
  const estado = cidade?.estado ?? 'SP'

  // Schema JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'Imobiliária Lemos',
    url: `https://www.imobiliarialemos.com.br/imoveis/${params.cidade}`,
    description: `Imóveis à venda e para alugar em ${cityName}/${estado}`,
    areaServed: { '@type': 'City', name: cityName, containedInPlace: { '@type': 'State', name: estado } },
    numberOfItems: total,
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.agoraencontrei.com.br' },
      { '@type': 'ListItem', position: 2, name: 'Imóveis', item: 'https://www.agoraencontrei.com.br/imoveis' },
      { '@type': 'ListItem', position: 3, name: `Imóveis em ${cityName}`, item: `https://www.imobiliarialemos.com.br/imoveis/${params.cidade}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-[#1B2B5B] text-white py-12 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb */}
            <nav className="text-sm text-blue-200 mb-4 flex items-center gap-2">
              <Link href="/" className="hover:text-white">Início</Link>
              <span>/</span>
              <Link href="/imoveis" className="hover:text-white">Imóveis</Link>
              <span>/</span>
              <span className="text-white">{cityName}/{estado}</span>
            </nav>

            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Imóveis em {cityName}/{estado}
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl">
              {total > 0
                ? `${total} imóvel${total !== 1 ? 's' : ''} disponível${total !== 1 ? 'is' : ''} em ${cityName}/${estado}. Casas, apartamentos, terrenos e imóveis comerciais para comprar ou alugar.`
                : `Encontre imóveis em ${cityName}/${estado} com a Imobiliária Lemos. Atendimento especializado na região.`}
            </p>

            {/* Links rápidos por tipo */}
            <div className="flex flex-wrap gap-2 mt-6">
              {['Casas à Venda', 'Apartamentos', 'Terrenos', 'Para Alugar', 'Comercial'].map((tipo, i) => {
                const purposeMap = ['SALE', 'SALE', 'SALE', 'RENT', 'SALE']
                const typeMap = ['HOUSE', 'APARTMENT', 'LAND', '', 'STORE']
                const qs = new URLSearchParams({ city: cityName, purpose: purposeMap[i] })
                if (typeMap[i]) qs.set('type', typeMap[i])
                return (
                  <Link
                    key={tipo}
                    href={`/imoveis?${qs}`}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors border border-white/20"
                  >
                    {tipo}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-10">
          {/* Bairros */}
          {neighborhoods.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold text-[#1B2B5B] mb-4">
                Bairros em {cityName}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {neighborhoods.map(([bairro, count]) => (
                  <Link
                    key={bairro}
                    href={`/imoveis/em/${params.cidade}/${cityToSlug(bairro)}`}
                    className="group flex flex-col items-center p-3 bg-white rounded-xl border hover:border-[#C9A84C] hover:shadow-md transition-all text-center"
                  >
                    <span className="text-sm font-medium text-gray-800 group-hover:text-[#1B2B5B] leading-tight">
                      {bairro.split(' ').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ')}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">{count} imóvel{count !== 1 ? 'is' : ''}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Imóveis em destaque */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1B2B5B]">
                Imóveis disponíveis em {cityName}
              </h2>
              <Link
                href={`/imoveis?city=${encodeURIComponent(cityName)}`}
                className="text-sm text-[#C9A84C] hover:underline font-medium"
              >
                Ver todos →
              </Link>
            </div>

            {properties.length > 0 ? (
              <LoadMoreProperties
                initialProperties={properties}
                initialTotal={total}
                initialTotalPages={Math.ceil(total / 12)}
                searchParams={{ city: cityName, limit: '12' }}
              />
            ) : (
              <div className="text-center py-16 text-gray-500">
                <p className="text-lg font-medium">Nenhum imóvel ativo em {cityName} no momento.</p>
                <p className="text-sm mt-2">Entre em contato para verificar disponibilidade.</p>
                <Link href="/imoveis" className="mt-4 inline-block px-6 py-2 bg-[#1B2B5B] text-white rounded-lg hover:bg-[#2d4a8a] transition-colors">
                  Ver todos os imóveis
                </Link>
              </div>
            )}
          </section>

          {/* Texto SEO */}
          <section className="mt-12 bg-white rounded-2xl p-8 border">
            <h2 className="text-xl font-bold text-[#1B2B5B] mb-4">
              Imobiliária Lemos em {cityName}/{estado}
            </h2>
            <div className="prose prose-sm max-w-none text-gray-600 space-y-3">
              <p>
                A <strong>Imobiliária Lemos</strong> atua há décadas no mercado imobiliário de {cityName}/{estado} e região,
                oferecendo um portfólio completo de imóveis para compra e locação. Nossa equipe de corretores especializados
                conhece profundamente o mercado local e está pronta para ajudá-lo a encontrar o imóvel ideal.
              </p>
              <p>
                Em {cityName}, trabalhamos com <strong>casas à venda</strong>, <strong>apartamentos para alugar</strong>,
                <strong> terrenos</strong>, <strong>imóveis comerciais</strong> e <strong>chácaras</strong>.
                Seja para moradia, investimento ou temporada, temos a opção certa para você.
              </p>
              <p>
                Entre em contato com nossa equipe pelo telefone <strong>(16) 3723-0045</strong> ou visite nossa
                sede em Franca/SP. Somos credenciados pelo CRECI 279051.
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
