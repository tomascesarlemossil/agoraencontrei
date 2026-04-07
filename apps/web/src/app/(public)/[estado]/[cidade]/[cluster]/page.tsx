/**
 * Rota: /{estado}/{cidade}/{cluster}
 * Página de cluster específico (ex: /sp/franca/imoveis-a-venda)
 * Cobre: money pages, bairros, materiais/acabamentos
 * ISR: revalidate 86400
 */
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Home, Search, ChevronRight } from 'lucide-react'
import { IBGE_CITY_BY_SLUG, IBGE_CITIES_152, getIbgeCitySnippet } from '@/data/seo-ibge-cities-expanded'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://agoraencontrei.com.br'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.agoraencontrei.com.br'

// Mapeamento de cluster-slug para metadados
const CLUSTER_META: Record<string, { title: string; h1: string; desc: string; schema: string; icon: string }> = {
  'imoveis-a-venda':        { title: 'Imóveis à Venda',        h1: 'Imóveis à Venda em {cidade}/{estado}',        desc: 'Casas, apartamentos e terrenos à venda em {cidade}. Compre com segurança no AgoraEncontrei.',   schema: 'ItemList', icon: '🏠' },
  'imoveis-para-alugar':    { title: 'Imóveis para Alugar',    h1: 'Imóveis para Alugar em {cidade}/{estado}',    desc: 'Alugue casas e apartamentos em {cidade}. Encontre o imóvel ideal no AgoraEncontrei.',            schema: 'ItemList', icon: '🔑' },
  'casas-a-venda':          { title: 'Casas à Venda',          h1: 'Casas à Venda em {cidade}/{estado}',          desc: 'Casas à venda em {cidade}. Residências, sobrados e casas em condomínio.',                       schema: 'ItemList', icon: '🏡' },
  'casas-para-alugar':      { title: 'Casas para Alugar',      h1: 'Casas para Alugar em {cidade}/{estado}',      desc: 'Casas para alugar em {cidade}. Encontre a casa ideal para sua família.',                        schema: 'ItemList', icon: '🏡' },
  'apartamentos-a-venda':   { title: 'Apartamentos à Venda',   h1: 'Apartamentos à Venda em {cidade}/{estado}',   desc: 'Apartamentos à venda em {cidade}. Studios, 1, 2, 3 e 4 quartos.',                               schema: 'ItemList', icon: '🏢' },
  'apartamentos-para-alugar':{ title: 'Apartamentos para Alugar', h1: 'Apartamentos para Alugar em {cidade}/{estado}', desc: 'Apartamentos para alugar em {cidade}. Encontre o apartamento ideal.',                    schema: 'ItemList', icon: '🏢' },
  'terrenos-a-venda':       { title: 'Terrenos à Venda',       h1: 'Terrenos à Venda em {cidade}/{estado}',       desc: 'Terrenos e lotes à venda em {cidade}. Terrenos residenciais e comerciais.',                    schema: 'ItemList', icon: '📐' },
  'lotes-a-venda':          { title: 'Lotes à Venda',          h1: 'Lotes à Venda em {cidade}/{estado}',          desc: 'Lotes à venda em {cidade}. Lotes em condomínio, loteamentos e áreas.',                        schema: 'ItemList', icon: '📐' },
  'salas-comerciais':       { title: 'Salas Comerciais',       h1: 'Salas Comerciais em {cidade}/{estado}',       desc: 'Salas comerciais para venda e aluguel em {cidade}.',                                           schema: 'ItemList', icon: '🏪' },
  'galpoes':                { title: 'Galpões',                h1: 'Galpões em {cidade}/{estado}',                desc: 'Galpões industriais e logísticos em {cidade}. Venda e locação.',                               schema: 'ItemList', icon: '🏭' },
  'lojas-comerciais':       { title: 'Lojas Comerciais',       h1: 'Lojas Comerciais em {cidade}/{estado}',       desc: 'Lojas comerciais para venda e aluguel em {cidade}.',                                           schema: 'ItemList', icon: '🏪' },
  'condominios-fechados':   { title: 'Condomínios Fechados',   h1: 'Condomínios Fechados em {cidade}/{estado}',   desc: 'Imóveis em condomínios fechados em {cidade}. Segurança e qualidade de vida.',                  schema: 'ItemList', icon: '🏘️' },
  'lancamentos-imobiliarios':{ title: 'Lançamentos Imobiliários', h1: 'Lançamentos Imobiliários em {cidade}/{estado}', desc: 'Lançamentos imobiliários em {cidade}. Compre na planta com as melhores condições.',       schema: 'ItemList', icon: '✨' },
  'imoveis-comerciais':     { title: 'Imóveis Comerciais',     h1: 'Imóveis Comerciais em {cidade}/{estado}',     desc: 'Imóveis comerciais em {cidade}. Salas, lojas, galpões e prédios.',                             schema: 'ItemList', icon: '🏢' },
  'imoveis-para-investir':  { title: 'Imóveis para Investir',  h1: 'Imóveis para Investir em {cidade}/{estado}',  desc: 'Oportunidades de investimento imobiliário em {cidade}. Renda passiva e valorização.',          schema: 'ItemList', icon: '📈' },
  'chacaras-a-venda':       { title: 'Chácaras à Venda',       h1: 'Chácaras à Venda em {cidade}/{estado}',       desc: 'Chácaras e sítios à venda em {cidade} e região.',                                             schema: 'ItemList', icon: '🌿' },
  'sitios-a-venda':         { title: 'Sítios à Venda',         h1: 'Sítios à Venda em {cidade}/{estado}',         desc: 'Sítios e fazendas à venda em {cidade} e região.',                                             schema: 'ItemList', icon: '🌾' },
  'fazendas-a-venda':       { title: 'Fazendas à Venda',       h1: 'Fazendas à Venda em {cidade}/{estado}',       desc: 'Fazendas à venda em {cidade} e região. Agronegócio e pecuária.',                              schema: 'ItemList', icon: '🐄' },
  'loteamentos':            { title: 'Loteamentos',            h1: 'Loteamentos em {cidade}/{estado}',            desc: 'Loteamentos e parcelamentos de terra em {cidade}.',                                           schema: 'ItemList', icon: '🗺️' },
  'imoveis-rurais':         { title: 'Imóveis Rurais',         h1: 'Imóveis Rurais em {cidade}/{estado}',         desc: 'Imóveis rurais à venda em {cidade}. Sítios, fazendas e chácaras.',                            schema: 'ItemList', icon: '🌳' },
  // Bairros
  'centro':                 { title: 'Imóveis no Centro',      h1: 'Imóveis no Centro de {cidade}/{estado}',      desc: 'Imóveis no centro de {cidade}. Casas e apartamentos bem localizados.',                        schema: 'ItemList', icon: '🏙️' },
  // Serviços
  'avaliacao-de-imovel':    { title: 'Avaliação de Imóvel',    h1: 'Avaliação de Imóvel em {cidade}/{estado}',    desc: 'Avaliação profissional de imóveis em {cidade}. Laudos e pareceres técnicos.',                  schema: 'Service',  icon: '📊' },
  'anunciar-imovel':        { title: 'Anunciar Imóvel',        h1: 'Anunciar Imóvel em {cidade}/{estado}',        desc: 'Anuncie seu imóvel em {cidade} gratuitamente no AgoraEncontrei.',                             schema: 'Service',  icon: '📢' },
}

function resolveMeta(cluster: string, cityName: string, state: string) {
  const meta = CLUSTER_META[cluster]
  if (!meta) return null
  return {
    title: meta.title,
    h1: meta.h1.replace('{cidade}', cityName).replace('{estado}', state),
    desc: meta.desc.replace(/\{cidade\}/g, cityName).replace(/\{estado\}/g, state),
    schema: meta.schema,
    icon: meta.icon,
  }
}

export async function generateStaticParams() {
  const params: { estado: string; cidade: string; cluster: string }[] = []
  for (const city of IBGE_CITIES_152) {
    for (const cluster of Object.keys(CLUSTER_META)) {
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
  const meta = resolveMeta(params.cluster, city.name, city.state)
  if (!meta) return {}

  return {
    title: `${meta.title} em ${city.name}/${city.state} | AgoraEncontrei`,
    description: meta.desc,
    openGraph: {
      title: `${meta.title} em ${city.name}/${city.state} | AgoraEncontrei`,
      description: meta.desc,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'AgoraEncontrei',
    },
    alternates: {
      canonical: `${WEB_URL}/${params.estado}/${params.cidade}/${params.cluster}`,
    },
  }
}

export const revalidate = 86400

async function fetchProperties(cityName: string, cluster: string) {
  try {
    const purposeMap: Record<string, string> = {
      'imoveis-a-venda': 'SALE', 'casas-a-venda': 'SALE', 'apartamentos-a-venda': 'SALE',
      'terrenos-a-venda': 'SALE', 'imoveis-para-alugar': 'RENT', 'casas-para-alugar': 'RENT',
      'apartamentos-para-alugar': 'RENT',
    }
    const typeMap: Record<string, string> = {
      'casas-a-venda': 'HOUSE', 'casas-para-alugar': 'HOUSE',
      'apartamentos-a-venda': 'APARTMENT', 'apartamentos-para-alugar': 'APARTMENT',
      'terrenos-a-venda': 'LAND', 'lotes-a-venda': 'LAND',
    }
    const purpose = purposeMap[cluster] || 'SALE'
    const type = typeMap[cluster] || ''
    const url = `${API_URL}/api/v1/public/properties?city=${encodeURIComponent(cityName)}&purpose=${purpose}${type ? `&type=${type}` : ''}&limit=9`
    const r = await fetch(url, { next: { revalidate: 3600 } })
    if (r.ok) { const d = await r.json(); return d.data || [] }
  } catch {}
  return []
}

export default async function ClusterPage({
  params,
}: {
  params: { estado: string; cidade: string; cluster: string }
}) {
  const city = IBGE_CITY_BY_SLUG[params.cidade]
  if (!city || city.stateSlug !== params.estado) notFound()

  const meta = resolveMeta(params.cluster, city.name, city.state)
  if (!meta) notFound()

  const properties = await fetchProperties(city.name, params.cluster)
  const snippet = getIbgeCitySnippet(city)
  const pop = city.populacao.toLocaleString('pt-BR')

  // Clusters relacionados
  const related = Object.entries(CLUSTER_META)
    .filter(([k]) => k !== params.cluster)
    .slice(0, 6)

  const schema = {
    '@context': 'https://schema.org',
    '@type': meta.schema === 'Service' ? 'Service' : 'ItemList',
    name: meta.h1,
    url: `${WEB_URL}/${params.estado}/${params.cidade}/${params.cluster}`,
    description: meta.desc,
    areaServed: { '@type': 'City', name: city.name },
    ...(properties.length > 0 && { numberOfItems: properties.length }),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="text-xs text-blue-200 mb-4 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-white">Início</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href={`/${params.estado}/${params.cidade}`} className="hover:text-white">
              {city.name}/{city.state}
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span>{meta.title}</span>
          </nav>
          <h1
            className="text-3xl sm:text-4xl font-bold mb-3"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            <span className="text-2xl mr-2">{meta.icon}</span>
            {meta.h1}
          </h1>
          <p className="text-white/70 text-lg mb-6">
            {properties.length > 0
              ? `${properties.length}+ imóveis disponíveis`
              : 'Imóveis disponíveis'}{' '}
            em {city.name}. {pop} habitantes — {snippet}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/imoveis?city=${city.name}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}
            >
              <Search className="w-4 h-4" /> Ver Todos
            </Link>
            <Link
              href={`/${params.estado}/${params.cidade}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white/10 text-white border border-white/20"
            >
              <MapPin className="w-4 h-4" /> {city.name}
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* Imóveis */}
        {properties.length > 0 ? (
          <section>
            <h2 className="text-xl font-bold text-[#1B2B5B] mb-5">
              {meta.title} em {city.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {properties.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/imoveis/${p.slug}`}
                  className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition"
                >
                  <div className="h-40 bg-gray-100 flex items-center justify-center">
                    {p.coverImage ? (
                      <img
                        src={p.coverImage}
                        alt={p.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <Home className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-sm text-gray-800 line-clamp-2">{p.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      <MapPin className="w-3 h-3 inline" /> {p.neighborhood}, {city.name}
                    </p>
                    <p className="font-bold text-base mt-2" style={{ color: '#1B2B5B' }}>
                      {p.price
                        ? Number(p.price).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            maximumFractionDigits: 0,
                          })
                        : 'Consulte'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <section className="bg-white rounded-2xl border p-8 text-center">
            <p className="text-4xl mb-4">{meta.icon}</p>
            <h2 className="text-xl font-bold text-[#1B2B5B] mb-2">{meta.h1}</h2>
            <p className="text-gray-500 mb-6">
              Cadastre-se para receber alertas quando novos imóveis forem
              disponibilizados em {city.name}.
            </p>
            <Link
              href="/alertas"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}
            >
              Criar Alerta Gratuito
            </Link>
          </section>
        )}

        {/* Conteúdo SEO */}
        <section className="bg-gray-50 rounded-2xl border p-6">
          <h2 className="text-lg font-bold text-[#1B2B5B] mb-3">
            {meta.title} em {city.name}/{city.state} — Guia Completo
          </h2>
          <div className="prose prose-sm max-w-none text-gray-600 space-y-3">
            <p>
              {meta.desc} {city.name} possui{' '}
              <strong>{pop} habitantes</strong> e PIB per capita de{' '}
              <strong>
                {city.pibPerCapita.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  maximumFractionDigits: 0,
                })}
              </strong>
              , tornando-se um mercado imobiliário dinâmico e em crescimento.
            </p>
            <p>
              O AgoraEncontrei é a plataforma líder em {meta.title.toLowerCase()} em{' '}
              {city.name}, com imóveis verificados, fotos profissionais e
              negociação transparente. Utilize nossos filtros avançados para
              encontrar o imóvel ideal por bairro, preço, metragem e número de
              quartos.
            </p>
          </div>
        </section>

        {/* Clusters relacionados */}
        <section>
          <h2 className="text-lg font-bold text-[#1B2B5B] mb-4">
            Mais opções em {city.name}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {related.map(([k, v]) => (
              <Link
                key={k}
                href={`/${params.estado}/${params.cidade}/${k}`}
                className="bg-white rounded-xl border p-3 text-center hover:border-[#C9A84C] transition text-sm"
              >
                <span className="text-xl">{v.icon}</span>
                <p className="text-gray-700 mt-1 font-medium">{v.title}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Floating CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg px-4 py-3">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-700 text-center sm:text-left">
            {meta.icon} Procurando <strong>{meta.title}</strong> em{' '}
            <strong>{city.name}</strong>?
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <a
              href={`https://wa.me/5516999999999?text=Olá! Tenho interesse em ${meta.title.toLowerCase()} em ${city.name}/${city.state}`}
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
