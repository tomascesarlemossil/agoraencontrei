/**
 * Rota: /{estado}/{cidade}/servicos/{cluster}
 * Páginas de fornecedores/serviços (arquiteto, engenheiro, pedreiro, etc.)
 * Ex: /sp/franca/servicos/arquiteto
 *     /go/anapolis/servicos/engenheiro-civil
 * ISR: revalidate 86400
 */
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Search, Star } from 'lucide-react'
import { IBGE_CITY_BY_SLUG, IBGE_CITIES_152, getIbgeCitySnippet } from '@/data/seo-ibge-cities-expanded'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://agoraencontrei.com.br'

const SERVICOS: Record<string, { label: string; desc: string; icon: string; faq: string[] }> = {
  'arquiteto':              { label: 'Arquiteto',              icon: '📐', desc: 'Encontre arquitetos qualificados em {cidade} para projetos residenciais, comerciais e interiores.',  faq: ['Quanto custa um arquiteto em {cidade}?', 'Como contratar um arquiteto?', 'O que faz um arquiteto?'] },
  'engenheiro-civil':       { label: 'Engenheiro Civil',       icon: '🏗️', desc: 'Engenheiros civis em {cidade} para projetos estruturais, laudos e acompanhamento de obras.',        faq: ['Quanto custa um engenheiro civil?', 'Quando preciso de engenheiro?', 'Diferença entre arquiteto e engenheiro'] },
  'pedreiro':               { label: 'Pedreiro',               icon: '🧱', desc: 'Pedreiros experientes em {cidade} para construção, reforma e acabamento.',                           faq: ['Quanto custa um pedreiro em {cidade}?', 'Como contratar pedreiro?', 'Pedreiro por empreitada ou diária?'] },
  'empreiteira':            { label: 'Empreiteira',            icon: '🏚️', desc: 'Empreiteiras em {cidade} para obras completas, reformas e construções.',                             faq: ['Como escolher empreiteira?', 'Contrato com empreiteira', 'Empreiteira vs construção própria'] },
  'construtora':            { label: 'Construtora',            icon: '🏢', desc: 'Construtoras em {cidade} para construção de casas, prédios e empreendimentos.',                      faq: ['Como escolher construtora?', 'Garantia de construtora', 'Construtora vs empreiteira'] },
  'avaliacao-de-imovel':    { label: 'Avaliação de Imóvel',    icon: '📊', desc: 'Avaliação profissional de imóveis em {cidade}. Laudos PTAM e pareceres técnicos.',                  faq: ['Quanto custa avaliação de imóvel?', 'Para que serve avaliação?', 'Quem pode avaliar imóvel?'] },
  'vistoria-de-imovel':     { label: 'Vistoria de Imóvel',     icon: '🔍', desc: 'Vistoria técnica de imóveis em {cidade} para compra, venda e locação.',                              faq: ['O que é vistoria de imóvel?', 'Quando fazer vistoria?', 'Quanto custa vistoria?'] },
  'topografia':             { label: 'Topografia',             icon: '🗺️', desc: 'Serviços de topografia em {cidade} para levantamentos, georreferenciamento e demarcação.',           faq: ['O que é topografia?', 'Quando preciso de topógrafo?', 'Quanto custa topografia?'] },
  'regularizacao-de-imovel':{ label: 'Regularização de Imóvel',icon: '📋', desc: 'Regularização de imóveis em {cidade}. Habite-se, escritura e registro.',                            faq: ['Como regularizar imóvel?', 'O que é habite-se?', 'Quanto custa regularização?'] },
  'fotografia-de-imovel':   { label: 'Fotografia de Imóvel',   icon: '📸', desc: 'Fotografia profissional de imóveis em {cidade} para venda e aluguel.',                               faq: ['Importância da fotografia?', 'Quanto custa foto profissional?', 'Drone para imóveis'] },
  'drone':                  { label: 'Drone para Imóveis',     icon: '🚁', desc: 'Filmagem e fotografia com drone em {cidade} para imóveis, obras e terrenos.',                        faq: ['Quanto custa drone?', 'Drone é obrigatório?', 'Vantagens do drone'] },
  'decoracao-de-interiores':{ label: 'Decoração de Interiores',icon: '🛋️', desc: 'Decoradores de interiores em {cidade} para projetos residenciais e comerciais.',                     faq: ['Quanto custa decorador?', 'Arquiteto vs decorador?', 'Como decorar sem gastar muito?'] },
}

export async function generateStaticParams() {
  const params: { estado: string; cidade: string; cluster: string }[] = []
  for (const city of IBGE_CITIES_152) {
    for (const cluster of Object.keys(SERVICOS)) {
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
  const servico = SERVICOS[params.cluster]
  if (!servico) return {}

  const label = servico.label
  const desc = servico.desc.replace(/\{cidade\}/g, city.name)

  return {
    title: `${label} em ${city.name}/${city.state} | AgoraEncontrei`,
    description: desc,
    openGraph: {
      title: `${label} em ${city.name}/${city.state} | AgoraEncontrei`,
      description: desc,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'AgoraEncontrei',
    },
    alternates: {
      canonical: `${WEB_URL}/${params.estado}/${params.cidade}/servicos/${params.cluster}`,
    },
  }
}

export const revalidate = 86400

export default function ServicoCidadePage({
  params,
}: {
  params: { estado: string; cidade: string; cluster: string }
}) {
  const city = IBGE_CITY_BY_SLUG[params.cidade]
  if (!city || city.stateSlug !== params.estado) notFound()
  const servico = SERVICOS[params.cluster]
  if (!servico) notFound()

  const label = servico.label
  const desc = servico.desc.replace(/\{cidade\}/g, city.name)
  const faq = servico.faq.map(q => q.replace(/\{cidade\}/g, city.name))
  const pop = city.populacao.toLocaleString('pt-BR')
  const pib = city.pibPerCapita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${label} em ${city.name}/${city.state}`,
    url: `${WEB_URL}/${params.estado}/${params.cidade}/servicos/${params.cluster}`,
    description: desc,
    areaServed: { '@type': 'City', name: city.name },
    provider: { '@type': 'Organization', name: 'AgoraEncontrei', url: WEB_URL },
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(q => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Encontre ${label.toLowerCase()} em ${city.name} no AgoraEncontrei. ${desc}`,
      },
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="text-xs text-blue-200 mb-4 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-white">Início</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/${params.estado}/${params.cidade}`} className="hover:text-white">{city.name}/{city.state}</Link>
            <ChevronRight className="w-3 h-3" />
            <span>Serviços</span>
            <ChevronRight className="w-3 h-3" />
            <span>{label}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            <span className="text-3xl mr-2">{servico.icon}</span>
            {label} em <span style={{ color: '#C9A84C' }}>{city.name}/{city.state}</span>
          </h1>
          <p className="text-white/70 text-lg mb-6">{desc}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/seja-parceiro"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}
            >
              <Star className="w-4 h-4" /> Seja um Parceiro
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
        {/* Dados IBGE contextuais */}
        <section className="bg-gray-50 rounded-2xl border p-6">
          <h2 className="text-lg font-bold text-[#1B2B5B] mb-3">
            Mercado de {label} em {city.name}/{city.state}
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            {city.name} é um município com <strong>{pop} habitantes</strong> e
            PIB per capita de <strong>{pib}</strong>, o que representa um
            mercado robusto para serviços de {label.toLowerCase()}. A demanda
            por profissionais qualificados cresce junto com o desenvolvimento
            imobiliário da cidade.
          </p>
        </section>

        {/* FAQ com Schema */}
        <section>
          <h2 className="text-xl font-bold text-[#1B2B5B] mb-5">
            Perguntas Frequentes sobre {label} em {city.name}
          </h2>
          <div className="space-y-4">
            {faq.map((q, i) => (
              <div key={i} className="bg-white rounded-xl border p-5">
                <h3 className="font-semibold text-gray-800 mb-2">{q}</h3>
                <p className="text-sm text-gray-600">
                  Encontre {label.toLowerCase()} em {city.name} no AgoraEncontrei.
                  Conectamos você aos melhores profissionais da região com
                  avaliações verificadas e orçamentos gratuitos.
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Outros serviços */}
        <section>
          <h2 className="text-lg font-bold text-[#1B2B5B] mb-4">
            Outros Serviços em {city.name}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(SERVICOS)
              .filter(([k]) => k !== params.cluster)
              .slice(0, 8)
              .map(([k, v]) => (
                <Link
                  key={k}
                  href={`/${params.estado}/${params.cidade}/servicos/${k}`}
                  className="bg-white rounded-xl border p-3 text-center hover:border-[#C9A84C] transition"
                >
                  <span className="text-xl">{v.icon}</span>
                  <p className="text-xs text-gray-700 mt-1 font-medium">{v.label}</p>
                </Link>
              ))}
          </div>
        </section>
      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg px-4 py-3">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-700 text-center sm:text-left">
            {servico.icon} Precisa de <strong>{label}</strong> em <strong>{city.name}</strong>?
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <a
              href={`https://wa.me/5516999999999?text=Olá! Preciso de ${label.toLowerCase()} em ${city.name}/${city.state}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-sm text-white text-center"
              style={{ background: '#25D366' }}
            >
              WhatsApp
            </a>
            <Link
              href="/seja-parceiro"
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-sm text-center"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}
            >
              Seja Parceiro
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
