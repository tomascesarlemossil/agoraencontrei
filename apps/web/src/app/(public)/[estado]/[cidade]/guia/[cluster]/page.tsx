/**
 * Rota: /{estado}/{cidade}/guia/{cluster}
 * Páginas de guias locais (melhores bairros, custo de vida, etc.)
 * Ex: /sp/franca/guia/melhores-bairros-para-morar
 *     /go/anapolis/guia/custo-de-vida
 * ISR: revalidate 86400
 */
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, BookOpen } from 'lucide-react'
import { IBGE_CITY_BY_SLUG, IBGE_CITIES_152, getIbgeCitySnippet } from '@/data/seo-ibge-cities-expanded'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://agoraencontrei.com.br'

const GUIAS: Record<string, { label: string; desc: string; icon: string }> = {
  'melhores-bairros-para-morar': { label: 'Melhores Bairros para Morar',  icon: '🏘️', desc: 'Guia completo dos melhores bairros para morar em {cidade}. Segurança, infraestrutura e qualidade de vida.' },
  'custo-de-vida':               { label: 'Custo de Vida',                icon: '💰', desc: 'Custo de vida em {cidade}: aluguel, alimentação, transporte e serviços. Comparativo com outras cidades.' },
  'como-comprar-imovel':         { label: 'Como Comprar Imóvel',          icon: '🏠', desc: 'Guia completo para comprar imóvel em {cidade}. Financiamento, documentação e dicas essenciais.' },
  'como-alugar-imovel':          { label: 'Como Alugar Imóvel',           icon: '🔑', desc: 'Guia para alugar imóvel em {cidade}. Contrato, garantias e direitos do inquilino.' },
  'financiamento-imobiliario':   { label: 'Financiamento Imobiliário',    icon: '🏦', desc: 'Como financiar imóvel em {cidade}. Minha Casa Minha Vida, FGTS e simulação de parcelas.' },
  'melhores-construtoras':       { label: 'Melhores Construtoras',        icon: '🏗️', desc: 'Ranking das melhores construtoras em {cidade}. Avaliações, obras entregues e reputação.' },
  'bairros-mais-valorizados':    { label: 'Bairros Mais Valorizados',     icon: '📈', desc: 'Bairros mais valorizados em {cidade}. Imóveis com maior potencial de valorização.' },
  'onde-morar-em':               { label: 'Onde Morar',                   icon: '🗺️', desc: 'Onde morar em {cidade}? Guia completo por perfil: família, jovens, investidores.' },
  'precos-de-imoveis':           { label: 'Preços de Imóveis',            icon: '💲', desc: 'Preços de imóveis em {cidade}. Tabela de valores por bairro, tipo e metragem.' },
  'mercado-imobiliario':         { label: 'Mercado Imobiliário',          icon: '📊', desc: 'Análise do mercado imobiliário em {cidade}. Tendências, valorização e oportunidades.' },
}

export async function generateStaticParams() {
  const params: { estado: string; cidade: string; cluster: string }[] = []
  for (const city of IBGE_CITIES_152) {
    for (const cluster of Object.keys(GUIAS)) {
      params.push({ estado: city.stateSlug, cidade: city.slug, cluster })
    }
  }
  return params
}

export async function generateMetadata({
  params,
}: {
  params: { estado: string; cidade: string; cluster: string }
}): Promise<Metadata> {
  const city = IBGE_CITY_BY_SLUG[params.cidade]
  if (!city || city.stateSlug !== params.estado) return {}
  const guia = GUIAS[params.cluster]
  if (!guia) return {}

  const desc = guia.desc.replace(/\{cidade\}/g, city.name)

  return {
    title: `${guia.label} em ${city.name}/${city.state} | AgoraEncontrei`,
    description: desc,
    openGraph: {
      title: `${guia.label} em ${city.name}/${city.state} | AgoraEncontrei`,
      description: desc,
      type: 'article',
      locale: 'pt_BR',
      siteName: 'AgoraEncontrei',
    },
    alternates: {
      canonical: `${WEB_URL}/${params.estado}/${params.cidade}/guia/${params.cluster}`,
    },
  }
}

export const revalidate = 86400

export default function GuiaCidadePage({
  params,
}: {
  params: { estado: string; cidade: string; cluster: string }
}) {
  const city = IBGE_CITY_BY_SLUG[params.cidade]
  if (!city || city.stateSlug !== params.estado) notFound()
  const guia = GUIAS[params.cluster]
  if (!guia) notFound()

  const desc = guia.desc.replace(/\{cidade\}/g, city.name)
  const pop = city.populacao.toLocaleString('pt-BR')
  const pib = city.pibPerCapita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
  const snippet = getIbgeCitySnippet(city)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${guia.label} em ${city.name}/${city.state}`,
    url: `${WEB_URL}/${params.estado}/${params.cidade}/guia/${params.cluster}`,
    description: desc,
    author: { '@type': 'Organization', name: 'AgoraEncontrei' },
    publisher: { '@type': 'Organization', name: 'AgoraEncontrei', url: WEB_URL },
    about: { '@type': 'City', name: city.name },
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
            <span>Guia</span>
            <ChevronRight className="w-3 h-3" />
            <span>{guia.label}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            <span className="text-3xl mr-2">{guia.icon}</span>
            {guia.label} em <span style={{ color: '#C9A84C' }}>{city.name}/{city.state}</span>
          </h1>
          <p className="text-white/70 text-lg mb-6">{desc}</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        {/* Dados IBGE */}
        <section className="bg-gray-50 rounded-2xl border p-6">
          <h2 className="text-lg font-bold text-[#1B2B5B] mb-3">
            {city.name} em Números (IBGE)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-xl border p-3 text-center">
              <p className="text-lg font-bold text-[#1B2B5B]">{pop}</p>
              <p className="text-xs text-gray-500 mt-1">Habitantes</p>
            </div>
            <div className="bg-white rounded-xl border p-3 text-center">
              <p className="text-lg font-bold text-[#1B2B5B]">{pib}</p>
              <p className="text-xs text-gray-500 mt-1">PIB per capita</p>
            </div>
            <div className="bg-white rounded-xl border p-3 text-center">
              <p className="text-lg font-bold text-[#1B2B5B]">{city.salarioMedioSM} SM</p>
              <p className="text-xs text-gray-500 mt-1">Salário médio</p>
            </div>
            <div className="bg-white rounded-xl border p-3 text-center">
              <p className="text-lg font-bold text-[#1B2B5B]">{city.areakm2} km²</p>
              <p className="text-xs text-gray-500 mt-1">Área</p>
            </div>
          </div>
          <p className="text-sm text-gray-600">{snippet}</p>
        </section>

        {/* Conteúdo do guia */}
        <section className="bg-white rounded-2xl border p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#1B2B5B] mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#C9A84C]" />
            {guia.label} em {city.name} — Guia Completo
          </h2>
          <div className="prose prose-sm max-w-none text-gray-600 space-y-4">
            <p>
              {desc} Com <strong>{pop} habitantes</strong> e PIB per capita de{' '}
              <strong>{pib}</strong>, {city.name} é uma das cidades mais
              dinâmicas de {city.stateName}, oferecendo oportunidades únicas
              para quem busca qualidade de vida e investimento imobiliário.
            </p>
            <p>
              O AgoraEncontrei é o marketplace imobiliário líder em {city.name},
              com dados atualizados do mercado local, imóveis verificados e
              suporte especializado para compradores, vendedores e investidores.
            </p>
            <p>
              Utilize nosso guia completo para tomar a melhor decisão imobiliária
              em {city.name}. Compare bairros, analise preços e encontre o imóvel
              ideal para o seu perfil.
            </p>
          </div>
        </section>

        {/* Outros guias */}
        <section>
          <h2 className="text-lg font-bold text-[#1B2B5B] mb-4">
            Mais Guias sobre {city.name}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(GUIAS)
              .filter(([k]) => k !== params.cluster)
              .slice(0, 6)
              .map(([k, v]) => (
                <Link
                  key={k}
                  href={`/${params.estado}/${params.cidade}/guia/${k}`}
                  className="bg-white rounded-xl border p-4 hover:border-[#C9A84C] transition"
                >
                  <span className="text-xl">{v.icon}</span>
                  <p className="text-sm font-medium text-gray-700 mt-2">{v.label}</p>
                  <p className="text-xs text-gray-400 mt-1">em {city.name}</p>
                </Link>
              ))}
          </div>
        </section>
      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg px-4 py-3">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-700 text-center sm:text-left">
            {guia.icon} Procurando imóveis em <strong>{city.name}</strong>?
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <a
              href={`https://wa.me/5516999999999?text=Olá! Quero saber mais sobre ${guia.label.toLowerCase()} em ${city.name}/${city.state}`}
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
