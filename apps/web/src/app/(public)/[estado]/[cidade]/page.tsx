/**
 * Rota: /{estado}/{cidade}
 * Página hub da cidade com dados IBGE reais e interlinking para todos os clusters
 * Gerada via ISR (revalidate: 86400) para escalar a 152 cidades × N clusters
 */
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, TrendingUp, Home, Building2, Gavel, Wrench, Search } from 'lucide-react'
import { IBGE_CITY_BY_SLUG, IBGE_CITIES_152, getIbgeCitySnippet } from '@/data/seo-ibge-cities-expanded'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://agoraencontrei.com.br'

// Clusters principais por família de URL
const MONEY_CLUSTERS = [
  { slug: 'imoveis-a-venda', label: 'Imóveis à Venda', icon: '🏠' },
  { slug: 'imoveis-para-alugar', label: 'Imóveis para Alugar', icon: '🔑' },
  { slug: 'casas-a-venda', label: 'Casas à Venda', icon: '🏡' },
  { slug: 'apartamentos-a-venda', label: 'Apartamentos à Venda', icon: '🏢' },
  { slug: 'terrenos-a-venda', label: 'Terrenos à Venda', icon: '📐' },
  { slug: 'condominios-fechados', label: 'Condomínios Fechados', icon: '🏘️' },
  { slug: 'lancamentos-imobiliarios', label: 'Lançamentos', icon: '✨' },
  { slug: 'imoveis-comerciais', label: 'Imóveis Comerciais', icon: '🏪' },
]

const INVEST_CLUSTERS = [
  { slug: 'leilao-de-imoveis', label: 'Leilão de Imóveis', icon: '🏛️' },
  { slug: 'imoveis-para-investir', label: 'Imóveis para Investir', icon: '📈' },
  { slug: 'imoveis-caixa', label: 'Imóveis Caixa', icon: '🏦' },
]

const SERVICE_CLUSTERS = [
  { slug: 'arquiteto', label: 'Arquiteto', icon: '📐' },
  { slug: 'engenheiro-civil', label: 'Engenheiro Civil', icon: '🏗️' },
  { slug: 'pedreiro', label: 'Pedreiro', icon: '🧱' },
  { slug: 'avaliacao-de-imovel', label: 'Avaliação de Imóvel', icon: '📊' },
]

export async function generateStaticParams() {
  return IBGE_CITIES_152.map(city => ({
    estado: city.stateSlug,
    cidade: city.slug,
  }))
}

export async function generateMetadata(props: { params: Promise<{ estado: string; cidade: string }> }): Promise<Metadata> {
  const params = await props.params
  const city = IBGE_CITY_BY_SLUG[params.cidade]
  if (!city || city.stateSlug !== params.estado) return {}

  const snippet = getIbgeCitySnippet(city)
  const pop = city.populacao.toLocaleString('pt-BR')

  return {
    title: `Imóveis em ${city.name}/${city.state} — ${pop} hab | AgoraEncontrei`,
    description: `Encontre imóveis à venda, aluguel e leilão em ${city.name}/${city.state}. ${snippet} Marketplace imobiliário #1 do Brasil.`,
    keywords: [
      `imóveis ${city.name.toLowerCase()}`,
      `casas à venda ${city.name.toLowerCase()}`,
      `apartamentos ${city.name.toLowerCase()} ${city.state.toLowerCase()}`,
      `leilão imóveis ${city.name.toLowerCase()}`,
      `alugar imóvel ${city.name.toLowerCase()}`,
    ],
    openGraph: {
      title: `Imóveis em ${city.name}/${city.state} | AgoraEncontrei`,
      description: snippet,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'AgoraEncontrei',
    },
    alternates: {
      canonical: `${WEB_URL}/${params.estado}/${params.cidade}`,
    },
  }
}

export const revalidate = 86400

export default async function CidadePage(props: { params: Promise<{ estado: string; cidade: string }> }) {
  const params = await props.params
  const city = IBGE_CITY_BY_SLUG[params.cidade]
  if (!city || city.stateSlug !== params.estado) notFound()

  const pop = city.populacao.toLocaleString('pt-BR')
  const pib = city.pibPerCapita.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })
  const area = city.areakm2.toLocaleString('pt-BR')

  // Cidades vizinhas do mesmo estado
  const vizinhas = IBGE_CITIES_152
    .filter(c => c.state === city.state && c.slug !== city.slug)
    .sort((a, b) => b.populacao - a.populacao)
    .slice(0, 8)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: `AgoraEncontrei — Imóveis em ${city.name}/${city.state}`,
    url: `${WEB_URL}/${params.estado}/${params.cidade}`,
    areaServed: {
      '@type': 'City',
      name: city.name,
      containedInPlace: { '@type': 'State', name: city.stateName },
    },
    description: getIbgeCitySnippet(city),
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
      bestRating: '5',
      worstRating: '1',
    },
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Como comprar imóvel em ${city.name}/${city.state}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Para comprar um imóvel em ${city.name}, acesse o AgoraEncontrei e busque entre casas, apartamentos e terrenos à venda. Filtre por preço, bairro e tipo de imóvel. A cidade possui ${pop} habitantes e PIB per capita de ${pib}.`,
        },
      },
      {
        '@type': 'Question',
        name: `Qual o preço médio de imóveis em ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Os preços de imóveis em ${city.name}/${city.state} variam conforme localização, tamanho e tipo. Consulte o AgoraEncontrei para valores atualizados de casas, apartamentos e terrenos na cidade.`,
        },
      },
      {
        '@type': 'Question',
        name: `Existem leilões de imóveis em ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Sim! O AgoraEncontrei lista leilões judiciais e extrajudiciais em ${city.name}/${city.state} com descontos de até 50% sobre o valor de mercado. Incluímos leilões da Caixa, Banco do Brasil, Bradesco e outros.`,
        },
      },
      {
        '@type': 'Question',
        name: `Como investir em imóveis em ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${city.name} oferece oportunidades em leilões judiciais, imóveis retomados e lançamentos. Com salário médio de ${city.salarioMedioSM} SM e economia diversificada, a cidade apresenta potencial para investimentos imobiliários.`,
        },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="text-xs text-blue-200 mb-4 flex items-center gap-1.5">
            <Link href="/" className="hover:text-white">Início</Link>
            <span>/</span>
            <Link href={`/${params.estado}`} className="hover:text-white">{city.state}</Link>
            <span>/</span>
            <span>{city.name}</span>
          </nav>
          <h1
            className="text-3xl sm:text-4xl font-bold mb-3"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            Imóveis em{' '}
            <span style={{ color: '#C9A84C' }}>
              {city.name}/{city.state}
            </span>
          </h1>
          <p className="text-white/70 text-lg mb-6">
            Marketplace imobiliário com imóveis à venda, aluguel e leilão em{' '}
            {city.name}. {pop} habitantes — PIB per capita {pib}.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/imoveis?city=${city.name}&purpose=SALE`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}
            >
              <Search className="w-4 h-4" /> Buscar Imóveis
            </Link>
            <Link
              href={`/${params.estado}/${params.cidade}/leilao-de-imoveis`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white/10 text-white border border-white/20"
            >
              🏛️ Ver Leilões
            </Link>
          </div>
        </div>
      </section>

      {/* Cards IBGE */}
      <section className="bg-gray-50 border-b py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Dados IBGE — {city.name}/{city.state}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4 text-center">
              <p className="text-2xl font-bold text-[#1B2B5B]">{pop}</p>
              <p className="text-xs text-gray-500 mt-1">Habitantes</p>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <p className="text-2xl font-bold text-[#1B2B5B]">{pib}</p>
              <p className="text-xs text-gray-500 mt-1">PIB per capita</p>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <p className="text-2xl font-bold text-[#1B2B5B]">{area} km²</p>
              <p className="text-xs text-gray-500 mt-1">Área territorial</p>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <p className="text-2xl font-bold text-[#1B2B5B]">
                {city.salarioMedioSM} SM
              </p>
              <p className="text-xs text-gray-500 mt-1">Salário médio</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
        {/* Money pages */}
        <section>
          <h2 className="text-xl font-bold text-[#1B2B5B] mb-5 flex items-center gap-2">
            <Home className="w-5 h-5 text-[#C9A84C]" />
            Imóveis em {city.name}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {MONEY_CLUSTERS.map(c => (
              <Link
                key={c.slug}
                href={`/${params.estado}/${params.cidade}/${c.slug}`}
                className="bg-white rounded-xl border p-4 text-center hover:border-[#C9A84C] hover:shadow-sm transition group"
              >
                <span className="text-2xl">{c.icon}</span>
                <p className="text-sm font-medium text-gray-700 mt-2 group-hover:text-[#1B2B5B]">
                  {c.label}
                </p>
                <p className="text-xs text-gray-400 mt-1">{city.name}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Investimentos e Leilões */}
        <section>
          <h2 className="text-xl font-bold text-[#1B2B5B] mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#C9A84C]" />
            Investimentos e Leilões em {city.name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {INVEST_CLUSTERS.map(c => (
              <Link
                key={c.slug}
                href={`/${params.estado}/${params.cidade}/investimentos/${c.slug}`}
                className="bg-white rounded-xl border p-5 hover:border-[#C9A84C] hover:shadow-sm transition group"
              >
                <span className="text-3xl">{c.icon}</span>
                <p className="font-semibold text-gray-800 mt-3 group-hover:text-[#1B2B5B]">
                  {c.label}
                </p>
                <p className="text-sm text-gray-500 mt-1">em {city.name}/{city.state}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Serviços */}
        <section>
          <h2 className="text-xl font-bold text-[#1B2B5B] mb-5 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#C9A84C]" />
            Serviços Imobiliários em {city.name}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SERVICE_CLUSTERS.map(c => (
              <Link
                key={c.slug}
                href={`/${params.estado}/${params.cidade}/servicos/${c.slug}`}
                className="bg-white rounded-xl border p-4 text-center hover:border-[#C9A84C] hover:shadow-sm transition group"
              >
                <span className="text-2xl">{c.icon}</span>
                <p className="text-sm font-medium text-gray-700 mt-2 group-hover:text-[#1B2B5B]">
                  {c.label}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Conteúdo SEO */}
        <section className="bg-white rounded-2xl border p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#1B2B5B] mb-4">
            Mercado Imobiliário em {city.name}/{city.state}
          </h2>
          <div className="prose prose-sm max-w-none text-gray-600 space-y-3">
            <p>
              {city.name} é um município do estado de {city.stateName} com{' '}
              <strong>{pop} habitantes</strong> e área territorial de{' '}
              <strong>{area} km²</strong>, segundo dados do IBGE. A cidade apresenta
              PIB per capita de <strong>{pib}</strong> e salário médio de{' '}
              <strong>{city.salarioMedioSM} salários mínimos</strong>, indicadores
              que refletem o dinamismo econômico local e o potencial do mercado
              imobiliário.
            </p>
            <p>
              O AgoraEncontrei é o marketplace imobiliário especializado em{' '}
              {city.name}, conectando compradores, vendedores, locatários e
              investidores. Encontre casas, apartamentos, terrenos, imóveis
              comerciais e oportunidades de leilão com até 50% de desconto em
              relação ao valor de mercado.
            </p>
            <p>
              Para investidores, {city.name} oferece oportunidades em leilões
              judiciais e extrajudiciais, imóveis retomados por bancos e
              lançamentos imobiliários. Consulte nossos especialistas para uma
              avaliação gratuita do imóvel.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white rounded-2xl border p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#1B2B5B] mb-5">
            Perguntas Frequentes — Imóveis em {city.name}
          </h2>
          <div className="space-y-4">
            {(faqSchema.mainEntity as any[]).map((item: any, i: number) => (
              <details key={i} className="group border rounded-xl">
                <summary className="flex items-center justify-between cursor-pointer p-4 font-medium text-gray-800 group-open:text-[#1B2B5B]">
                  {item.name}
                  <span className="ml-2 text-gray-400 group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                <p className="px-4 pb-4 text-sm text-gray-600">{item.acceptedAnswer.text}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Cidades vizinhas */}
        {vizinhas.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-[#1B2B5B] mb-5 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#C9A84C]" />
              Outras Cidades em {city.stateName}
            </h2>
            <div className="flex flex-wrap gap-2">
              {vizinhas.map(v => (
                <Link
                  key={v.slug}
                  href={`/${v.stateSlug}/${v.slug}`}
                  className="px-4 py-2 bg-white border rounded-full text-sm text-gray-700 hover:border-[#C9A84C] hover:text-[#1B2B5B] transition"
                >
                  {v.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg px-4 py-3">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-700 text-center sm:text-left">
            🏠 Procurando imóveis em <strong>{city.name}</strong>?
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <a
              href={`https://wa.me/5516999999999?text=Olá! Tenho interesse em imóveis em ${city.name}/${city.state}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-sm text-white text-center"
              style={{ background: '#25D366' }}
            >
              WhatsApp
            </a>
            <Link
              href={`/imoveis?city=${city.name}`}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-sm text-center"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}
            >
              Ver Marketplace
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
