import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Home, Search, MessageCircle, ArrowRight } from 'lucide-react'
import { IBGE_CITIES_MAP, IBGE_CITIES_ARRAY, type IBGECityData } from '@/data/seo-ibge-cities'
import { CLUSTERS_MAP, ALL_CLUSTERS } from '@/data/seo-clusters'

const WEB_URL = 'https://www.agoraencontrei.com.br'

export const revalidate = 86400

function findCity(estado: string, cidade: string): IBGECityData | undefined {
  return IBGE_CITIES_MAP[`${cidade}-${estado}`]
}

function applyTemplate(template: string, city: IBGECityData): string {
  return template
    .replace(/\{CIDADE\}/g, city.nome)
    .replace(/\{UF\}/g, city.estadoSigla)
    .replace(/\{POPULACAO\}/g, city.populacaoCenso2022.toLocaleString('pt-BR'))
    .replace(/\{PIB\}/g, city.pibPerCapita?.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) ?? '-')
    .replace(/\{AREA\}/g, city.areaKm2.toLocaleString('pt-BR', { maximumFractionDigits: 0 }))
    .replace(/\{PESSOAL_OCUPADO\}/g, city.pessoalOcupado?.toLocaleString('pt-BR') ?? '-')
}

// ISR: gera sob demanda
export function generateStaticParams() {
  const params: { estado: string; cidade: string; cluster: string }[] = []
  for (const city of IBGE_CITIES_ARRAY) {
    const cidadeSlug = city.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    for (const cluster of ALL_CLUSTERS.filter(c => c.group === 'A')) {
      params.push({
        estado: city.estadoSigla.toLowerCase(),
        cidade: cidadeSlug,
        cluster: cluster.slug,
      })
    }
  }
  return params
}

export async function generateMetadata({ params }: { params: Promise<{ estado: string; cidade: string; cluster: string }> }): Promise<Metadata> {
  const { estado, cidade, cluster: clusterSlug } = await params
  const city = findCity(estado, cidade)
  const cluster = CLUSTERS_MAP[clusterSlug]
  if (!city || !cluster) return { title: 'Página não encontrada | AgoraEncontrei' }

  return {
    title: applyTemplate(cluster.titleTemplate, city),
    description: applyTemplate(cluster.descriptionTemplate, city),
    keywords: [
      `${cluster.keyword.toLowerCase()} ${city.nome.toLowerCase()} ${city.estadoSigla.toLowerCase()}`,
      `${cluster.keyword.toLowerCase()} em ${city.nome.toLowerCase()}`,
    ],
    openGraph: {
      title: applyTemplate(cluster.titleTemplate, city),
      description: applyTemplate(cluster.descriptionTemplate, city),
      type: 'website',
      locale: 'pt_BR',
      siteName: 'AgoraEncontrei',
    },
    alternates: { canonical: `${WEB_URL}/${estado}/${cidade}/${clusterSlug}` },
    robots: { index: true, follow: true },
  }
}

export default async function ClusterCidadePage({ params }: { params: Promise<{ estado: string; cidade: string; cluster: string }> }) {
  const { estado, cidade, cluster: clusterSlug } = await params
  const city = findCity(estado, cidade)
  const cluster = CLUSTERS_MAP[clusterSlug]
  if (!city || !cluster) notFound()

  const relatedClusters = cluster.relatedClusters
    .map(slug => CLUSTERS_MAP[slug])
    .filter(Boolean)

  const nearbyCities = IBGE_CITIES_ARRAY
    .filter(c => c.slug !== city.slug && c.estadoSigla === city.estadoSigla)
    .slice(0, 6)

  const schema = {
    '@context': 'https://schema.org',
    '@type': cluster.schemaType,
    name: applyTemplate(cluster.h1Template, city),
    description: applyTemplate(cluster.descriptionTemplate, city),
    url: `${WEB_URL}/${estado}/${cidade}/${clusterSlug}`,
    ...(cluster.schemaType === 'SearchResultsPage' ? {} : {
      areaServed: { '@type': 'City', name: city.nome, addressRegion: city.estadoSigla },
    }),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="text-xs text-blue-200 mb-4 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-white">Início</Link>
            <span>/</span>
            <Link href={`/${estado}/${cidade}`} className="hover:text-white">{city.nome}/{city.estadoSigla}</Link>
            <span>/</span>
            <span>{cluster.keyword}</span>
          </nav>

          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ color: '#C9A84C' }}>
            <MapPin className="w-3.5 h-3.5" /> {city.nome}/{city.estadoSigla} · {city.populacaoCenso2022.toLocaleString('pt-BR')} hab.
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            {applyTemplate(cluster.h1Template, city)}
          </h1>

          <p className="text-white/70 text-lg mb-6 max-w-3xl">
            {applyTemplate(cluster.descriptionTemplate, city)}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href={`/imoveis?city=${encodeURIComponent(city.nome)}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              <Search className="w-4 h-4" /> Ver Ofertas Reais
            </Link>
            <a href={`https://wa.me/5516981010004?text=Olá! Interesse em ${cluster.keyword} em ${city.nome}/${city.estadoSigla}.`}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-white">
              <MessageCircle className="w-4 h-4" /> Falar com Especialista
            </a>
          </div>
        </div>
      </section>

      {/* CONTEÚDO */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-8 border space-y-6">

          <h2 className="text-xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Oportunidades de {cluster.keyword} em {city.nome}: Panorama Atual
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            {city.nome}, com <strong>{city.populacaoCenso2022.toLocaleString('pt-BR')} habitantes</strong> (Censo IBGE 2022),
            é um município estratégico de {city.estado} para quem busca {cluster.keyword.toLowerCase()}.
            {city.pibPerCapita ? ` Com PIB per capita de R$ ${city.pibPerCapita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, ` : ' '}
            a cidade oferece uma base econômica sólida para investimentos imobiliários.
            {city.distanciaFrancaKm ? ` Localizada a ${city.distanciaFrancaKm}km de Franca, ` : ' '}
            {city.nome} se destaca por: {city.destaquesLocais.slice(0, 3).join('; ')}.
          </p>

          <h3 className="font-semibold text-gray-800 mb-2">Por que investir em {city.nome}?</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {city.destaquesLocais.join('. ')}.
            {city.pessoalOcupado ? ` A cidade conta com ${city.pessoalOcupado.toLocaleString('pt-BR')} postos de trabalho formal.` : ''}
            {city.esgotamentoSanitario ? ` O saneamento básico alcança ${city.esgotamentoSanitario}% dos domicílios.` : ''}
            {' '}Os bairros mais valorizados para {cluster.keyword.toLowerCase()} são: {city.bairrosValorizados.join(', ')}.
          </p>

          <blockquote className="border-l-4 pl-4 py-2 bg-amber-50 rounded-r-lg text-sm text-amber-800" style={{ borderColor: '#C9A84C' }}>
            <strong>Nota:</strong> O mercado de leilões e imóveis em {city.estadoSigla} está em constante atualização. Fique atento às datas de editais.
          </blockquote>

          {/* Placeholder de ofertas */}
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Estamos processando novos editais para <strong>{city.nome}</strong>. Enquanto isso, veja as ofertas globais na Home.
            </p>
            <Link href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all"
              style={{ background: '#1B2B5B', color: 'white' }}>
              <Search className="w-4 h-4" /> Ver Ofertas no Marketplace
            </Link>
          </div>

          {/* CTA obrigatório */}
          <p className="text-gray-600 text-sm leading-relaxed pt-2 border-t">
            Para conferir a lista completa e atualizada de oportunidades reais agora mesmo,{' '}
            <a href="https://agoraencontrei.com.br" className="font-semibold underline" style={{ color: '#1B2B5B' }}>
              acesse nossa vitrine principal no marketplace AgoraEncontrei
            </a>.
            Lá você filtra por preço, tipo de imóvel e status do leilão em tempo real.
          </p>
        </div>
      </section>

      {/* CLUSTERS RELACIONADOS */}
      {relatedClusters.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-12">
          <h2 className="text-xl font-bold mb-5" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Veja Também em {city.nome}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {relatedClusters.map((rc) => (
              <Link key={rc.slug} href={`/${estado}/${cidade}/${rc.slug}`}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-[#C9A84C] hover:shadow-sm transition-all">
                <span className="font-semibold text-sm text-gray-800">{rc.keyword} em {city.nome}</span>
                <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* MESMA BUSCA EM OUTRAS CIDADES */}
      {nearbyCities.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-12">
          <h2 className="text-xl font-bold mb-5" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            {cluster.keyword} em Outras Cidades
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nearbyCities.map((c) => {
              const cSlug = c.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
              return (
                <Link key={c.slug} href={`/${c.estadoSigla.toLowerCase()}/${cSlug}/${clusterSlug}`}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-[#C9A84C] hover:shadow-sm transition-all">
                  <div>
                    <span className="font-semibold text-sm text-gray-800">{c.nome}/{c.estadoSigla}</span>
                    <span className="block text-xs text-gray-400">{c.populacaoCenso2022.toLocaleString('pt-BR')} hab.</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* CTA FINAL */}
      <section className="py-10 px-4 text-center" style={{ background: 'linear-gradient(135deg, #1B2B5B, #0f1c3a)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Marketplace AgoraEncontrei
          </h2>
          <p className="text-white/70 mb-5">{cluster.keyword} em {city.nome} e região</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://wa.me/5516981010004" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-white">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <Link href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-[#1B2B5B]"
              style={{ background: '#C9A84C' }}>
              <Home className="w-4 h-4" /> Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* FLOATING CTA (mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1B2B5B] p-3 text-white text-center font-bold text-sm shadow-2xl sm:hidden">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Search className="w-4 h-4" style={{ color: '#C9A84C' }} />
          {cluster.keyword} em {city.nome}?
          <span className="underline ml-1" style={{ color: '#C9A84C' }}>VER MARKETPLACE</span>
        </Link>
      </div>
    </>
  )
}
