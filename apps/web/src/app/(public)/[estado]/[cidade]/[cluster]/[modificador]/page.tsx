/**
 * Rota: /{estado}/{cidade}/{cluster}/{modificador}
 * Páginas long-tail com público-alvo específico
 * Ex: /sp/franca/imoveis-a-venda/para-investidor
 *     /go/anapolis/casas-a-venda/alto-padrao
 * ISR: revalidate 86400
 */
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Home, Search } from 'lucide-react'
import { IBGE_CITY_BY_SLUG, IBGE_CITIES_152, getIbgeCitySnippet } from '@/data/seo-ibge-cities-expanded'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://agoraencontrei.com.br'

const MODIFICADORES: Record<string, { label: string; desc: string }> = {
  'para-investidor':    { label: 'para Investidor',    desc: 'Oportunidades de investimento imobiliário com alto potencial de valorização e renda passiva.' },
  'para-proprietario':  { label: 'para Proprietário',  desc: 'Imóveis para proprietários que buscam vender ou alugar com segurança e agilidade.' },
  'alto-padrao':        { label: 'Alto Padrão',         desc: 'Imóveis de alto padrão com acabamento premium, localização privilegiada e infraestrutura completa.' },
  'popular':            { label: 'Popular',             desc: 'Imóveis populares com ótimo custo-benefício e financiamento facilitado.' },
  'minha-casa-minha-vida': { label: 'Minha Casa Minha Vida', desc: 'Imóveis enquadrados no programa Minha Casa Minha Vida com subsídio do governo federal.' },
  'para-empresa':       { label: 'para Empresa',        desc: 'Imóveis comerciais para empresas, com localização estratégica e infraestrutura adequada.' },
  'residencial':        { label: 'Residencial',         desc: 'Imóveis residenciais para moradia com conforto e segurança.' },
  'comercial':          { label: 'Comercial',           desc: 'Imóveis comerciais para negócios, lojas, escritórios e galpões.' },
  'alto-retorno':       { label: 'Alto Retorno',        desc: 'Imóveis com alto retorno sobre investimento e valorização acima da média.' },
  'baixo-risco':        { label: 'Baixo Risco',         desc: 'Investimentos imobiliários conservadores com risco reduzido e rentabilidade estável.' },
  'para-familia':       { label: 'para Família',        desc: 'Imóveis espaçosos e bem localizados, ideais para famílias com crianças.' },
  'perto-de-escola':    { label: 'Perto de Escola',     desc: 'Imóveis próximos a escolas e universidades, ideais para famílias e estudantes.' },
  'com-home-office':    { label: 'com Home Office',     desc: 'Imóveis com espaço dedicado para home office, ideais para profissionais remotos.' },
  'para-airbnb':        { label: 'para Airbnb',         desc: 'Imóveis com potencial para locação por temporada via Airbnb e plataformas similares.' },
}

// Clusters válidos (reutiliza do cluster page)
const VALID_CLUSTERS = [
  'imoveis-a-venda','imoveis-para-alugar','casas-a-venda','casas-para-alugar',
  'apartamentos-a-venda','apartamentos-para-alugar','terrenos-a-venda','lotes-a-venda',
  'salas-comerciais','galpoes','lojas-comerciais','condominios-fechados',
  'lancamentos-imobiliarios','imoveis-comerciais','imoveis-para-investir',
  'chacaras-a-venda','sitios-a-venda','fazendas-a-venda','loteamentos','imoveis-rurais',
  'leilao-de-imoveis','imoveis-caixa','investimento-imobiliario',
]

function clusterLabel(cluster: string): string {
  return cluster.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export async function generateStaticParams() {
  const params: { estado: string; cidade: string; cluster: string; modificador: string }[] = []
  // Gerar apenas para as top 20 cidades por população para não explodir o build
  const topCidades = IBGE_CITIES_152.sort((a, b) => b.populacao - a.populacao).slice(0, 20)
  const topClusters = VALID_CLUSTERS.slice(0, 10)
  const topMods = Object.keys(MODIFICADORES).slice(0, 5)
  for (const city of topCidades) {
    for (const cluster of topClusters) {
      for (const mod of topMods) {
        params.push({ estado: city.stateSlug, cidade: city.slug, cluster, modificador: mod })
      }
    }
  }
  return params
}

export async function generateMetadata(props: { params: Promise<{ estado: string; cidade: string; cluster: string; modificador: string }> }): Promise<Metadata> {
  const params = await props.params
  const city = IBGE_CITY_BY_SLUG[params.cidade]
  if (!city || city.stateSlug !== params.estado) return {}
  const mod = MODIFICADORES[params.modificador]
  if (!mod) return {}

  const clLabel = clusterLabel(params.cluster)
  const title = `${clLabel} ${mod.label} em ${city.name}/${city.state}`

  return {
    title: `${title} | AgoraEncontrei`,
    description: `${mod.desc} Encontre ${clLabel.toLowerCase()} ${mod.label.toLowerCase()} em ${city.name}/${city.state} no AgoraEncontrei.`,
    openGraph: {
      title: `${title} | AgoraEncontrei`,
      description: mod.desc,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'AgoraEncontrei',
    },
    alternates: {
      canonical: `${WEB_URL}/${params.estado}/${params.cidade}/${params.cluster}/${params.modificador}`,
    },
  }
}

export const revalidate = 86400

export default async function ClusterModificadorPage(props: { params: Promise<{ estado: string; cidade: string; cluster: string; modificador: string }> }) {
  const params = await props.params
  const city = IBGE_CITY_BY_SLUG[params.cidade]
  if (!city || city.stateSlug !== params.estado) notFound()

  const mod = MODIFICADORES[params.modificador]
  if (!mod) notFound()

  const clLabel = clusterLabel(params.cluster)
  const h1 = `${clLabel} ${mod.label} em ${city.name}/${city.state}`
  const pop = city.populacao.toLocaleString('pt-BR')
  const pib = city.pibPerCapita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: h1,
    url: `${WEB_URL}/${params.estado}/${params.cidade}/${params.cluster}/${params.modificador}`,
    description: mod.desc,
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
            <Link href={`/${params.estado}/${params.cidade}/${params.cluster}`} className="hover:text-white">{clLabel}</Link>
            <ChevronRight className="w-3 h-3" />
            <span>{mod.label}</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            {h1}
          </h1>
          <p className="text-white/70 text-lg mb-6">
            {mod.desc} {city.name} tem {pop} habitantes e PIB per capita de {pib}.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/imoveis?city=${city.name}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}
            >
              <Search className="w-4 h-4" /> Buscar Imóveis
            </Link>
            <Link
              href={`/${params.estado}/${params.cidade}/${params.cluster}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white/10 text-white border border-white/20"
            >
              Ver todos {clLabel}
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* Conteúdo SEO */}
        <section className="bg-white rounded-2xl border p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#1B2B5B] mb-4">{h1} — Guia Completo</h2>
          <div className="prose prose-sm max-w-none text-gray-600 space-y-3">
            <p>
              {mod.desc} Em {city.name}/{city.state}, com{' '}
              <strong>{pop} habitantes</strong> e PIB per capita de{' '}
              <strong>{pib}</strong>, o mercado de {clLabel.toLowerCase()}{' '}
              {mod.label.toLowerCase()} apresenta oportunidades únicas para quem
              busca qualidade de vida e retorno financeiro.
            </p>
            <p>
              O AgoraEncontrei conecta você aos melhores{' '}
              {clLabel.toLowerCase()} {mod.label.toLowerCase()} em {city.name},
              com imóveis verificados, negociação transparente e suporte
              especializado. Cadastre-se gratuitamente e receba alertas
              personalizados.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gradient-to-r from-[#1B2B5B] to-[#2a3f7e] rounded-2xl p-6 sm:p-8 text-white text-center">
          <h2 className="text-xl font-bold mb-2">Encontre o imóvel ideal em {city.name}</h2>
          <p className="text-white/70 mb-6">Crie um alerta gratuito e seja notificado assim que novos imóveis forem cadastrados.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/alertas"
              className="px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}
            >
              Criar Alerta Gratuito
            </Link>
            <Link
              href={`/imoveis?city=${city.name}`}
              className="px-6 py-3 rounded-xl font-bold text-sm bg-white/10 border border-white/20"
            >
              Ver Marketplace
            </Link>
          </div>
        </section>

        {/* Outros modificadores */}
        <section>
          <h2 className="text-lg font-bold text-[#1B2B5B] mb-4">Outras opções em {city.name}</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(MODIFICADORES)
              .filter(([k]) => k !== params.modificador)
              .map(([k, v]) => (
                <Link
                  key={k}
                  href={`/${params.estado}/${params.cidade}/${params.cluster}/${k}`}
                  className="px-4 py-2 bg-white border rounded-full text-sm text-gray-700 hover:border-[#C9A84C] hover:text-[#1B2B5B] transition"
                >
                  {clLabel} {v.label}
                </Link>
              ))}
          </div>
        </section>
      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg px-4 py-3">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-700 text-center sm:text-left">
            🏠 Procurando <strong>{clLabel} {mod.label}</strong> em <strong>{city.name}</strong>?
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <a
              href={`https://wa.me/5516999999999?text=Olá! Tenho interesse em ${clLabel.toLowerCase()} ${mod.label.toLowerCase()} em ${city.name}/${city.state}`}
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
