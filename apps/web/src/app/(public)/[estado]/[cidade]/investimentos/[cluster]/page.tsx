/**
 * Rota: /{estado}/{cidade}/investimentos/{cluster}
 * Páginas de investimentos e leilões
 * Ex: /sp/franca/investimentos/leilao-de-imoveis
 *     /go/anapolis/investimentos/investimento-imobiliario
 * ISR: revalidate 86400
 */
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, TrendingUp, Search } from 'lucide-react'
import { IBGE_CITY_BY_SLUG, IBGE_CITIES_152, getIbgeCitySnippet } from '@/data/seo-ibge-cities-expanded'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://agoraencontrei.com.br'

const INVESTIMENTOS: Record<string, { label: string; desc: string; icon: string }> = {
  'leilao-de-imoveis':          { label: 'Leilão de Imóveis',          icon: '🏛️', desc: 'Imóveis em leilão judicial e extrajudicial em {cidade} com até 50% de desconto.' },
  'leilao-judicial-de-imoveis': { label: 'Leilão Judicial de Imóveis', icon: '⚖️', desc: 'Leilões judiciais de imóveis em {cidade}. Hasta pública com oportunidades únicas.' },
  'imoveis-caixa':              { label: 'Imóveis Caixa',              icon: '🏦', desc: 'Imóveis retomados pela Caixa Econômica Federal em {cidade} com condições especiais.' },
  'imoveis-retomados':          { label: 'Imóveis Retomados',          icon: '🔄', desc: 'Imóveis retomados por bancos em {cidade}. Oportunidades com financiamento facilitado.' },
  'investimento-imobiliario':   { label: 'Investimento Imobiliário',   icon: '📈', desc: 'Investimento imobiliário em {cidade}. Renda passiva, valorização e diversificação.' },
  'imoveis-para-investir':      { label: 'Imóveis para Investir',      icon: '💰', desc: 'Melhores imóveis para investir em {cidade}. Alto retorno e baixo risco.' },
  'fundos-imobiliarios':        { label: 'Fundos Imobiliários',        icon: '📊', desc: 'FIIs com exposição ao mercado imobiliário de {cidade} e região.' },
  'arrematacao-de-imoveis':     { label: 'Arrematação de Imóveis',     icon: '🔨', desc: 'Como arrematar imóveis em leilão em {cidade}. Guia completo para iniciantes.' },
}

export async function generateStaticParams() {
  const params: { estado: string; cidade: string; cluster: string }[] = []
  for (const city of IBGE_CITIES_152) {
    for (const cluster of Object.keys(INVESTIMENTOS)) {
      params.push({ estado: city.stateSlug, cidade: city.slug, cluster })
    }
  }
  return params
}

export async function generateMetadata(props: { params: Promise<{ estado: string; cidade: string; cluster: string }> }): Promise<Metadata> {
  const params = await props.params
  const city = IBGE_CITY_BY_SLUG[params.cidade]
  if (!city || city.stateSlug !== params.estado) return {}
  const inv = INVESTIMENTOS[params.cluster]
  if (!inv) return {}

  const desc = inv.desc.replace(/\{cidade\}/g, city.name)

  return {
    title: `${inv.label} em ${city.name}/${city.state} | AgoraEncontrei`,
    description: desc,
    openGraph: {
      title: `${inv.label} em ${city.name}/${city.state} | AgoraEncontrei`,
      description: desc,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'AgoraEncontrei',
    },
    alternates: {
      canonical: `${WEB_URL}/${params.estado}/${params.cidade}/investimentos/${params.cluster}`,
    },
  }
}

export const revalidate = 86400

export default async function InvestimentoCidadePage(props: { params: Promise<{ estado: string; cidade: string; cluster: string }> }) {
  const params = await props.params
  const city = IBGE_CITY_BY_SLUG[params.cidade]
  if (!city || city.stateSlug !== params.estado) notFound()
  const inv = INVESTIMENTOS[params.cluster]
  if (!inv) notFound()

  const desc = inv.desc.replace(/\{cidade\}/g, city.name)
  const pop = city.populacao.toLocaleString('pt-BR')
  const pib = city.pibPerCapita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FinancialProduct',
    name: `${inv.label} em ${city.name}/${city.state}`,
    url: `${WEB_URL}/${params.estado}/${params.cidade}/investimentos/${params.cluster}`,
    description: desc,
    areaServed: { '@type': 'City', name: city.name },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="text-xs text-blue-200 mb-4 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-white">Início</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/${params.estado}/${params.cidade}`} className="hover:text-white">{city.name}/{city.state}</Link>
            <ChevronRight className="w-3 h-3" />
            <span>Investimentos</span>
            <ChevronRight className="w-3 h-3" />
            <span>{inv.label}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            <span className="text-3xl mr-2">{inv.icon}</span>
            {inv.label} em <span style={{ color: '#C9A84C' }}>{city.name}/{city.state}</span>
          </h1>
          <p className="text-white/70 text-lg mb-6">{desc}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/leilao-imoveis"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}
            >
              <TrendingUp className="w-4 h-4" /> Ver Oportunidades
            </Link>
            <Link
              href={`/${params.estado}/${params.cidade}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white/10 text-white border border-white/20"
            >
              Ver {city.name}
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* Dados IBGE para investidores */}
        <section className="bg-white rounded-2xl border p-6">
          <h2 className="text-xl font-bold text-[#1B2B5B] mb-4">
            Por que investir em {city.name}/{city.state}?
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-[#1B2B5B]">{pop}</p>
              <p className="text-xs text-gray-500 mt-1">Habitantes</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-[#1B2B5B]">{pib}</p>
              <p className="text-xs text-gray-500 mt-1">PIB per capita</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-[#1B2B5B]">{city.salarioMedioSM} SM</p>
              <p className="text-xs text-gray-500 mt-1">Salário médio</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xl font-bold text-[#1B2B5B]">{city.areakm2} km²</p>
              <p className="text-xs text-gray-500 mt-1">Área</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            {city.name} apresenta indicadores econômicos sólidos com PIB per
            capita de <strong>{pib}</strong> e população de{' '}
            <strong>{pop} habitantes</strong>, tornando-se um mercado
            imobiliário atrativo para investidores que buscam valorização e
            renda passiva.
          </p>
        </section>

        {/* Outros investimentos */}
        <section>
          <h2 className="text-lg font-bold text-[#1B2B5B] mb-4">
            Outras oportunidades em {city.name}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(INVESTIMENTOS)
              .filter(([k]) => k !== params.cluster)
              .map(([k, v]) => (
                <Link
                  key={k}
                  href={`/${params.estado}/${params.cidade}/investimentos/${k}`}
                  className="bg-white rounded-xl border p-4 text-center hover:border-[#C9A84C] transition"
                >
                  <span className="text-2xl">{v.icon}</span>
                  <p className="text-xs text-gray-700 mt-2 font-medium">{v.label}</p>
                </Link>
              ))}
          </div>
        </section>
      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg px-4 py-3">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-700 text-center sm:text-left">
            {inv.icon} Interessado em <strong>{inv.label}</strong> em <strong>{city.name}</strong>?
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <a
              href={`https://wa.me/5516999999999?text=Olá! Tenho interesse em ${inv.label.toLowerCase()} em ${city.name}/${city.state}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-sm text-white text-center"
              style={{ background: '#25D366' }}
            >
              WhatsApp
            </a>
            <Link
              href="/leilao-imoveis"
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-sm text-center"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}
            >
              Ver Leilões
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
