/**
 * Rota: /{estado}/{cidade}/bairro/{bairro}
 * Página de bairro com Market Insight, m², score comodidade e leilões
 * ISR: revalidate 86400
 */
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, TrendingUp, Home, Building2, Star, Navigation, Search } from 'lucide-react'
import { BAIRROS_FRANCA, BAIRRO_BY_SLUG, getMarketInsight, type BairroFranca } from '@/data/seo-bairros-franca'
import { IBGE_CITY_BY_SLUG } from '@/data/seo-ibge-cities-expanded'

export const revalidate = 86400

export function generateStaticParams() {
  // Gerar apenas para Franca (por agora)
  return BAIRROS_FRANCA.map(b => ({
    estado: 'sp',
    cidade: 'franca',
    bairro: b.slug,
  }))
}

export async function generateMetadata(props: { params: Promise<{ estado: string; cidade: string; bairro: string }> }): Promise<Metadata> {
  const params = await props.params
  const bairro = BAIRRO_BY_SLUG[params.bairro]
  const city = IBGE_CITY_BY_SLUG[params.cidade]
  if (!bairro || !city) return {}

  return {
    title: `Imóveis no ${bairro.name} em ${city.name}/${city.state} — m² R$ ${bairro.m2Venda} | AgoraEncontrei`,
    description: `${bairro.descricao} Valor do m²: R$ ${bairro.m2Venda}. Score de comodidade: ${bairro.scoreComodidade}/100. ${bairro.temLeiloes ? 'Leilões disponíveis.' : ''}`,
    openGraph: {
      title: `${bairro.name} — ${city.name}/${city.state} | AgoraEncontrei`,
      description: bairro.descricao,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'AgoraEncontrei',
    },
  }
}

const zonaColors: Record<string, { bg: string; text: string; label: string }> = {
  expansao: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Zona de Expansão' },
  nobre: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Zona Nobre' },
  comercial: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Zona Comercial' },
  popular: { bg: 'bg-green-100', text: 'text-green-800', label: 'Zona Popular' },
  rural: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Zona Rural' },
  misto: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Zona Mista' },
}

export default async function BairroPage(props: { params: Promise<{ estado: string; cidade: string; bairro: string }> }) {
  const params = await props.params
  const bairro = BAIRRO_BY_SLUG[params.bairro]
  const city = IBGE_CITY_BY_SLUG[params.cidade]
  if (!bairro || !city) notFound()

  const zona = zonaColors[bairro.zona]
  const vizinhos = BAIRROS_FRANCA.filter(b => b.slug !== bairro.slug && b.zona === bairro.zona).slice(0, 4)
  const outrosZonas = BAIRROS_FRANCA.filter(b => b.slug !== bairro.slug && b.zona !== bairro.zona).slice(0, 4)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${bairro.name}, ${city.name}/${city.state}`,
    description: bairro.descricao,
    geo: { '@type': 'GeoCoordinates' },
    containedInPlace: { '@type': 'City', name: city.name },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="text-xs text-blue-200 mb-4 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-white">Início</Link>
            <span>/</span>
            <Link href={`/${params.estado}/${params.cidade}`} className="hover:text-white">{city.name}</Link>
            <span>/</span>
            <span>{bairro.name}</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${zona.bg} ${zona.text}`}>
              {zona.label}
            </span>
            {bairro.temLeiloes && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                Leilões Disponíveis
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            Imóveis no <span style={{ color: '#C9A84C' }}>{bairro.name}</span>
            <br />
            <span className="text-xl text-white/60">{city.name}/{city.state}</span>
          </h1>

          <p className="text-white/70 text-lg mb-6 max-w-3xl">{bairro.descricao}</p>

          <div className="flex flex-wrap gap-3">
            <Link href={`/imoveis?city=${city.name}&neighborhood=${bairro.name}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              <Search className="w-4 h-4" /> Ver Imóveis no {bairro.name}
            </Link>
            {bairro.temLeiloes && (
              <Link href={`/leiloes`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white/10 text-white border border-white/20">
                🏛️ Ver Leilões
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Market Insight Cards */}
      <section className="bg-gray-50 border-b py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Market Insight — {bairro.name}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border p-4 text-center">
              <p className="text-2xl font-bold text-[#1B2B5B]">R$ {bairro.m2Venda.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-gray-500 mt-1">m² Venda (média)</p>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <p className="text-2xl font-bold text-[#1B2B5B]">R$ {bairro.m2Aluguel}/m²</p>
              <p className="text-xs text-gray-500 mt-1">m² Aluguel (média)</p>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4" style={{ color: '#C9A84C' }} />
                <p className="text-2xl font-bold text-[#1B2B5B]">{bairro.scoreComodidade}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">Score Comodidade /100</p>
            </div>
            <div className="bg-white rounded-xl border p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <Navigation className="w-4 h-4 text-gray-400" />
                <p className="text-2xl font-bold text-[#1B2B5B]">{bairro.distanciaCentroKm}km</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">do Centro</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pontos de Interesse */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold mb-4" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          Pontos de Interesse Próximos
        </h2>
        <div className="flex flex-wrap gap-2">
          {bairro.pontosInteresse.map(poi => (
            <span key={poi} className="px-3 py-1.5 bg-blue-50 text-blue-800 rounded-full text-sm font-medium">
              📍 {poi}
            </span>
          ))}
        </div>

        {/* SEO Content */}
        <div className="mt-8 bg-white rounded-2xl border p-6">
          <h3 className="font-bold text-lg mb-3" style={{ color: '#1B2B5B' }}>
            Sobre o {bairro.name} em {city.name}/{city.state}
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {getMarketInsight(bairro)} Com {city.populacao.toLocaleString('pt-BR')} habitantes e PIB per capita
            de {city.pibPerCapita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })},
            {city.name} oferece um mercado imobiliário sólido.
            {bairro.temLeiloes ? ` O ${bairro.name} é um dos bairros com maior concentração de imóveis em leilão da Caixa Econômica Federal, com descontos de até 40% sobre o valor de avaliação.` : ''}
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            O mercado de leilões em {bairro.name} destaca-se pela proximidade com {bairro.pontosInteresse.slice(0, 2).join(' e ')}.
            Com um valor médio de mercado de R$ {bairro.m2Venda}/m², arrematar um imóvel através do AgoraEncontrei
            pode gerar um ROI superior a 40%, superando investimentos tradicionais na região de {city.name}/{city.state}.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mt-4 border-t pt-4">
            Para conferir a lista completa e atualizada de oportunidades reais,{' '}
            <a href="https://agoraencontrei.com.br" className="font-semibold underline" style={{ color: '#1B2B5B' }}>
              acesse o marketplace AgoraEncontrei
            </a>.
          </p>
        </div>
      </section>

      {/* Bairros similares */}
      <section className="max-w-5xl mx-auto px-4 pb-8">
        <h2 className="text-xl font-bold mb-4" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          Bairros Similares em {city.name}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...vizinhos, ...outrosZonas].slice(0, 8).map(b => (
            <Link key={b.slug} href={`/${params.estado}/${params.cidade}/bairro/${b.slug}`}
              className="bg-white rounded-xl border p-4 hover:border-[#C9A84C] transition-all">
              <p className="font-semibold text-sm" style={{ color: '#1B2B5B' }}>{b.name}</p>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <span>R$ {b.m2Venda}/m²</span>
                <span className={`px-2 py-0.5 rounded-full ${zonaColors[b.zona].bg} ${zonaColors[b.zona].text}`}>
                  {zonaColors[b.zona].label}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Floating CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1B2B5B] p-3 text-white text-center font-bold text-sm shadow-2xl sm:hidden">
        <Link href={`/imoveis?city=${city.name}&neighborhood=${bairro.name}`} className="flex items-center justify-center gap-2">
          <Search className="w-4 h-4" style={{ color: '#C9A84C' }} />
          Imóveis no {bairro.name}
        </Link>
      </div>
    </>
  )
}
