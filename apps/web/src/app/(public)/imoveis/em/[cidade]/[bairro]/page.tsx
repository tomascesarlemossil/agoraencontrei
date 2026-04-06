import type { Metadata } from 'next'
import Link from 'next/link'
import { LoadMoreProperties } from '../../../LoadMoreProperties'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

const CIDADES: Record<string, { nome: string; estado: string }> = {
  'franca':              { nome: 'Franca', estado: 'SP' },
  'rifaina':             { nome: 'Rifaina', estado: 'SP' },
  'cristais-paulista':   { nome: 'Cristais Paulista', estado: 'SP' },
  'patrocinio-paulista': { nome: 'Patrocínio Paulista', estado: 'SP' },
  'ribeirao-preto':      { nome: 'Ribeirão Preto', estado: 'SP' },
  'pedregulho':          { nome: 'Pedregulho', estado: 'SP' },
  'itirapua':            { nome: 'Itirapuã', estado: 'SP' },
  'delfinopolis':        { nome: 'Delfinópolis', estado: 'MG' },
  'capitolio':           { nome: 'Capitólio', estado: 'MG' },
  'cassia':              { nome: 'Cássia', estado: 'MG' },
  'ibiraci':             { nome: 'Ibiraci', estado: 'MG' },
  'capetinga':           { nome: 'Capetinga', estado: 'MG' },
  'sacramento':          { nome: 'Sacramento', estado: 'MG' },
  'restinga':            { nome: 'Restinga', estado: 'SP' },
}

function slugToName(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function slugToCity(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

async function fetchBairroData(citySlug: string, bairroSlug: string) {
  const cidadeInfo = CIDADES[citySlug]
  const cityName = cidadeInfo?.nome ?? slugToCity(citySlug)
  const bairroName = slugToName(bairroSlug)

  // Tenta encontrar o bairro real no banco (pode ter acentos diferentes)
  try {
    const res = await fetch(
      `${API_URL}/api/v1/public/properties?city=${encodeURIComponent(cityName)}&neighborhood=${encodeURIComponent(bairroName)}&limit=24&status=ACTIVE`,
      { next: { revalidate: 300 } }
    )
    const data = res.ok ? await res.json() : { data: [], meta: { total: 0 } }

    // Se não encontrou com o slug, tenta busca mais ampla
    if (data.meta?.total === 0) {
      const res2 = await fetch(
        `${API_URL}/api/v1/public/properties?city=${encodeURIComponent(cityName)}&search=${encodeURIComponent(bairroName)}&limit=24&status=ACTIVE`,
        { next: { revalidate: 300 } }
      )
      const data2 = res2.ok ? await res2.json() : { data: [], meta: { total: 0 } }
      return { properties: data2.data ?? [], total: data2.meta?.total ?? 0, cityName, bairroName, citySlug, bairroSlug }
    }

    return { properties: data.data ?? [], total: data.meta?.total ?? 0, cityName, bairroName, citySlug, bairroSlug }
  } catch {
    return { properties: [], total: 0, cityName, bairroName, citySlug, bairroSlug }
  }
}

export async function generateMetadata({ params }: { params: { cidade: string; bairro: string } }): Promise<Metadata> {
  const cidadeInfo = CIDADES[params.cidade]
  const cityName = cidadeInfo?.nome ?? slugToCity(params.cidade)
  const estado = cidadeInfo?.estado ?? 'SP'
  const bairroName = slugToName(params.bairro)

  const title = `Imóveis no ${bairroName}, ${cityName}/${estado} | Imobiliária Lemos`
  const description = `Casas à venda e apartamentos para alugar no ${bairroName}, ${cityName}/${estado}. Imobiliária Lemos. Encontre o imóvel ideal no seu bairro.`

  return {
    title,
    description,
    keywords: `imóveis ${bairroName.toLowerCase()} ${cityName.toLowerCase()}, casas ${bairroName.toLowerCase()}, apartamentos ${bairroName.toLowerCase()}, comprar casa ${bairroName.toLowerCase()} ${cityName.toLowerCase()}, alugar ${bairroName.toLowerCase()} ${cityName.toLowerCase()}, imóveis ${cityName.toLowerCase()} ${bairroName.toLowerCase()}`,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'AgoraEncontrei — Imobiliária Lemos',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    },
    alternates: {
      canonical: `/imoveis/em/${params.cidade}/${params.bairro}`,
    },
  }
}

export const revalidate = 120

export default async function BairroPage({ params }: { params: { cidade: string; bairro: string } }) {
  const { properties, total, cityName, bairroName, citySlug, bairroSlug } = await fetchBairroData(params.cidade, params.bairro)
  const cidadeInfo = CIDADES[params.cidade]
  const estado = cidadeInfo?.estado ?? 'SP'

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.agoraencontrei.com.br' },
      { '@type': 'ListItem', position: 2, name: 'Imóveis', item: 'https://www.agoraencontrei.com.br/imoveis' },
      { '@type': 'ListItem', position: 3, name: `${cityName}`, item: `https://www.agoraencontrei.com.br/imoveis/em/${params.cidade}` },
      { '@type': 'ListItem', position: 4, name: bairroName, item: `https://www.agoraencontrei.com.br/imoveis/em/${params.cidade}/${params.bairro}` },
    ],
  }

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Quantos imóveis estão disponíveis no ${bairroName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `A Imobiliária Lemos tem ${total} imóvel${total !== 1 ? 'is' : ''} disponível${total !== 1 ? 'is' : ''} no ${bairroName}, ${cityName}/${estado}.`,
        },
      },
      {
        '@type': 'Question',
        name: `Como comprar um imóvel no ${bairroName}, ${cityName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Entre em contato com a Imobiliária Lemos pelo telefone (16) 3723-0045 ou (16) 98101-0004. Nossa equipe de corretores especializados irá apresentar as melhores opções no ${bairroName}.`,
        },
      },
      {
        '@type': 'Question',
        name: `A Imobiliária Lemos atende o bairro ${bairroName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Sim! A Imobiliária Lemos atende todo o ${bairroName} e demais bairros de ${cityName}/${estado}. Somos credenciados pelo CRECI 279051.`,
        },
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-[#1B2B5B] text-white py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <nav className="text-sm text-blue-200 mb-4 flex items-center gap-2 flex-wrap">
              <Link href="/" className="hover:text-white">Início</Link>
              <span>/</span>
              <Link href="/imoveis" className="hover:text-white">Imóveis</Link>
              <span>/</span>
              <Link href={`/imoveis/em/${params.cidade}`} className="hover:text-white">{cityName}</Link>
              <span>/</span>
              <span className="text-white">{bairroName}</span>
            </nav>

            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Imóveis no {bairroName}, {cityName}/{estado}
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl">
              {total > 0
                ? `${total} imóvel${total !== 1 ? 'is' : ''} disponível${total !== 1 ? 'is' : ''} no ${bairroName}. Casas, apartamentos e terrenos para comprar ou alugar.`
                : `Encontre imóveis no ${bairroName}, ${cityName}/${estado} com a Imobiliária Lemos.`}
            </p>

            <div className="flex flex-wrap gap-2 mt-5">
              {[
                { label: 'Casas à Venda', qs: `city=${cityName}&neighborhood=${bairroName}&type=HOUSE&purpose=SALE` },
                { label: 'Apartamentos', qs: `city=${cityName}&neighborhood=${bairroName}&type=APARTMENT` },
                { label: 'Terrenos', qs: `city=${cityName}&neighborhood=${bairroName}&type=LAND` },
                { label: 'Para Alugar', qs: `city=${cityName}&neighborhood=${bairroName}&purpose=RENT` },
              ].map(({ label, qs }) => (
                <Link
                  key={label}
                  href={`/imoveis?${qs}`}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors border border-white/20"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-10">
          {properties.length > 0 ? (
            <LoadMoreProperties
              initialProperties={properties}
              initialTotal={total}
              initialTotalPages={Math.ceil(total / 24)}
              searchParams={{ city: cityName, neighborhood: bairroName, limit: '24' }}
            />
          ) : (
            <div className="text-center py-16 text-gray-500">
              <p className="text-lg font-medium">Nenhum imóvel ativo no {bairroName} no momento.</p>
              <div className="flex gap-3 justify-center mt-4">
                <Link href={`/imoveis/em/${params.cidade}`} className="px-6 py-2 bg-[#1B2B5B] text-white rounded-lg hover:bg-[#2d4a8a] transition-colors">
                  Ver imóveis em {cityName}
                </Link>
                <Link href="/imoveis" className="px-6 py-2 border border-[#1B2B5B] text-[#1B2B5B] rounded-lg hover:bg-gray-100 transition-colors">
                  Todos os imóveis
                </Link>
              </div>
            </div>
          )}

          {/* FAQ SEO */}
          <section className="mt-12 bg-white rounded-2xl p-8 border">
            <h2 className="text-xl font-bold text-[#1B2B5B] mb-6">
              Perguntas Frequentes — Imóveis no {bairroName}
            </h2>
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">
                  Quantos imóveis estão disponíveis no {bairroName}?
                </h3>
                <p className="text-gray-600 text-sm">
                  A Imobiliária Lemos tem {total} imóvel{total !== 1 ? 'is' : ''} disponível{total !== 1 ? 'is' : ''} no {bairroName}, {cityName}/{estado}.
                  Acesse nossa plataforma para ver todos com fotos, preços e detalhes completos.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">
                  Como comprar um imóvel no {bairroName}, {cityName}?
                </h3>
                <p className="text-gray-600 text-sm">
                  Entre em contato com a Imobiliária Lemos pelo telefone <strong>(16) 3723-0045</strong> ou <strong>(16) 98101-0004</strong>.
                  Nossa equipe de corretores especializados irá apresentar as melhores opções no {bairroName} e acompanhar todo o processo.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">
                  A Imobiliária Lemos atende o bairro {bairroName}?
                </h3>
                <p className="text-gray-600 text-sm">
                  Sim! Atendemos todo o {bairroName} e demais bairros de {cityName}/{estado}.
                  Somos credenciados pelo <strong>CRECI 279051</strong> e atuamos na região há décadas.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
