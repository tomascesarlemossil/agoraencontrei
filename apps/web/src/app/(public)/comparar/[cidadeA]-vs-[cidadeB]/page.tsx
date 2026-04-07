/**
 * Rota: /comparar/[cidadeA]-vs-[cidadeB]
 * Comparação de custo de vida, PIB, população entre duas cidades
 * ISR: revalidate 86400 (24h)
 *
 * Potencial: 500 cidades × 500 = 499.500 páginas únicas
 * Cada página resolve dados via city-resolver (static → API fallback)
 */
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, TrendingUp, Users, BarChart3, MapPin, Home } from 'lucide-react'
import { IBGE_CITIES_152, IBGE_CITY_BY_SLUG, type IbgeCityData } from '@/data/seo-ibge-cities-expanded'

export const revalidate = 86400

// Top 100 cidades para generateStaticParams (pré-gera as mais populares)
const TOP_CITIES = IBGE_CITIES_152
  .sort((a, b) => b.populacao - a.populacao)
  .slice(0, 50)

export function generateStaticParams() {
  const params: { 'cidadeA-vs-cidadeB': string }[] = []
  // Gerar combinações das top 50 cidades (50×49/2 = 1.225 páginas pré-geradas)
  for (let i = 0; i < TOP_CITIES.length; i++) {
    for (let j = i + 1; j < TOP_CITIES.length; j++) {
      params.push({
        'cidadeA-vs-cidadeB': `${TOP_CITIES[i].slug}-vs-${TOP_CITIES[j].slug}`,
      })
    }
  }
  return params
}

function parseSlugs(param: string): { slugA: string; slugB: string } | null {
  const parts = param.split('-vs-')
  if (parts.length !== 2) return null
  return { slugA: parts[0], slugB: parts[1] }
}

export async function generateMetadata({
  params,
}: {
  params: { 'cidadeA-vs-cidadeB': string }
}): Promise<Metadata> {
  const parsed = parseSlugs(params['cidadeA-vs-cidadeB'])
  if (!parsed) return {}
  const cityA = IBGE_CITY_BY_SLUG[parsed.slugA]
  const cityB = IBGE_CITY_BY_SLUG[parsed.slugB]
  if (!cityA || !cityB) return {}

  return {
    title: `${cityA.name} vs ${cityB.name} — Comparação de Custo de Vida e Imóveis | AgoraEncontrei`,
    description: `Compare ${cityA.name}/${cityA.state} com ${cityB.name}/${cityB.state}: população, PIB per capita, salário médio, área territorial e mercado imobiliário. Dados IBGE reais.`,
    openGraph: {
      title: `${cityA.name} vs ${cityB.name} | AgoraEncontrei`,
      description: `Comparação completa entre ${cityA.name} e ${cityB.name} com dados IBGE.`,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'AgoraEncontrei',
    },
    alternates: {
      canonical: `https://agoraencontrei.com.br/comparar/${params['cidadeA-vs-cidadeB']}`,
    },
  }
}

function formatNum(n: number): string {
  return n.toLocaleString('pt-BR')
}

function formatCurrency(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function CompareBar({ label, valueA, valueB, nameA, nameB, format = 'number' }: {
  label: string; valueA: number; valueB: number; nameA: string; nameB: string; format?: 'number' | 'currency' | 'sm'
}) {
  const max = Math.max(valueA, valueB) || 1
  const pctA = (valueA / max) * 100
  const pctB = (valueB / max) * 100
  const winner = valueA > valueB ? 'A' : valueA < valueB ? 'B' : 'tie'

  const fmt = (v: number) => {
    if (format === 'currency') return formatCurrency(v)
    if (format === 'sm') return `${v} SM`
    return formatNum(v)
  }

  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-gray-700 mb-2">{label}</p>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold w-24 truncate ${winner === 'A' ? 'text-green-700' : 'text-gray-500'}`}>{nameA}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
            <div className="h-full rounded-full flex items-center px-2 text-xs font-bold text-white" style={{ width: `${Math.max(pctA, 10)}%`, background: winner === 'A' ? '#16a34a' : '#1B2B5B' }}>
              {fmt(valueA)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold w-24 truncate ${winner === 'B' ? 'text-green-700' : 'text-gray-500'}`}>{nameB}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
            <div className="h-full rounded-full flex items-center px-2 text-xs font-bold text-white" style={{ width: `${Math.max(pctB, 10)}%`, background: winner === 'B' ? '#16a34a' : '#1B2B5B' }}>
              {fmt(valueB)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CompareCidadesPage({
  params,
}: {
  params: { 'cidadeA-vs-cidadeB': string }
}) {
  const parsed = parseSlugs(params['cidadeA-vs-cidadeB'])
  if (!parsed) notFound()

  const cityA = IBGE_CITY_BY_SLUG[parsed.slugA]
  const cityB = IBGE_CITY_BY_SLUG[parsed.slugB]
  if (!cityA || !cityB) notFound()

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    name: `${cityA.name} vs ${cityB.name} — Comparação`,
    description: `Comparação de custo de vida e mercado imobiliário entre ${cityA.name}/${cityA.state} e ${cityB.name}/${cityB.state}`,
    url: `https://agoraencontrei.com.br/comparar/${params['cidadeA-vs-cidadeB']}`,
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="text-xs text-blue-200 mb-4 flex items-center gap-1.5">
            <Link href="/" className="hover:text-white">Início</Link>
            <span>/</span>
            <Link href="/comparar" className="hover:text-white">Comparar Cidades</Link>
            <span>/</span>
            <span>{cityA.name} vs {cityB.name}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            <span style={{ color: '#C9A84C' }}>{cityA.name}/{cityA.state}</span>
            {' '}vs{' '}
            <span style={{ color: '#C9A84C' }}>{cityB.name}/{cityB.state}</span>
          </h1>
          <p className="text-white/70 text-lg">
            Comparação completa com dados IBGE reais: população, PIB, salário, área e mercado imobiliário.
          </p>
        </div>
      </section>

      {/* Cards resumo */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[cityA, cityB].map((city, i) => (
            <div key={city.slug} className="bg-white rounded-2xl border p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5" style={{ color: '#C9A84C' }} />
                <h2 className="text-xl font-bold" style={{ color: '#1B2B5B' }}>{city.name}/{city.state}</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold" style={{ color: '#1B2B5B' }}>{formatNum(city.populacao)}</p>
                  <p className="text-[10px] text-gray-500">Habitantes</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold" style={{ color: '#1B2B5B' }}>{formatCurrency(city.pibPerCapita)}</p>
                  <p className="text-[10px] text-gray-500">PIB per capita</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold" style={{ color: '#1B2B5B' }}>{city.salarioMedioSM} SM</p>
                  <p className="text-[10px] text-gray-500">Salário médio</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold" style={{ color: '#1B2B5B' }}>{formatNum(city.areakm2)} km²</p>
                  <p className="text-[10px] text-gray-500">Área</p>
                </div>
              </div>
              <Link href={`/${city.stateSlug}/${city.slug}`}
                className="flex items-center justify-center gap-2 mt-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: '#1B2B5B' }}>
                Ver imóveis em {city.name} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* Barras comparativas */}
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="text-xl font-bold mb-6" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Comparação Detalhada
          </h2>

          <CompareBar label="População" valueA={cityA.populacao} valueB={cityB.populacao} nameA={cityA.name} nameB={cityB.name} />
          <CompareBar label="PIB per capita" valueA={cityA.pibPerCapita} valueB={cityB.pibPerCapita} nameA={cityA.name} nameB={cityB.name} format="currency" />
          <CompareBar label="Salário médio formal" valueA={cityA.salarioMedioSM} valueB={cityB.salarioMedioSM} nameA={cityA.name} nameB={cityB.name} format="sm" />
          <CompareBar label="Área territorial (km²)" valueA={cityA.areakm2} valueB={cityB.areakm2} nameA={cityA.name} nameB={cityB.name} />
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm mb-4">
            Para conferir a lista completa e atualizada de oportunidades reais agora mesmo,{' '}
            <a href="https://agoraencontrei.com.br" className="font-semibold underline" style={{ color: '#1B2B5B' }}>
              acesse nossa vitrine principal no marketplace AgoraEncontrei
            </a>.
          </p>
        </div>

        {/* Outras comparações */}
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Outras Comparações
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {IBGE_CITIES_152
              .filter(c => c.slug !== cityA.slug && c.slug !== cityB.slug)
              .sort((a, b) => b.populacao - a.populacao)
              .slice(0, 6)
              .map(city => (
                <Link key={city.slug} href={`/comparar/${cityA.slug}-vs-${city.slug}`}
                  className="flex items-center justify-between p-3 bg-white rounded-xl border hover:border-[#C9A84C] transition-all">
                  <span className="text-sm font-semibold text-gray-800">{cityA.name} vs {city.name}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* Floating CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1B2B5B] p-3 text-white text-center font-bold text-sm shadow-2xl sm:hidden">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Home className="w-4 h-4" style={{ color: '#C9A84C' }} />
          Marketplace AgoraEncontrei
        </Link>
      </div>
    </>
  )
}
