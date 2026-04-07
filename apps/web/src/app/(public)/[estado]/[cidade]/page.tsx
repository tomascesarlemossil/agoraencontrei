import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Home, Search, MessageCircle, ArrowRight, Users, BarChart3, Building2, TrendingUp } from 'lucide-react'
import { IBGE_CITIES_MAP, IBGE_CITIES_ARRAY, type IBGECityData } from '@/data/seo-ibge-cities'
import { CLUSTERS_GROUP_A, CLUSTERS_GROUP_B } from '@/data/seo-clusters'

const WEB_URL = 'https://www.agoraencontrei.com.br'

export const revalidate = 86400

// ── Helpers ─────────────────────────────────────────────────────────────────

function findCity(estado: string, cidade: string): IBGECityData | undefined {
  const slug = `${cidade}-${estado}`
  return IBGE_CITIES_MAP[slug]
}

function formatPop(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 100000 ? 0 : 1).replace('.', ',')} mil`
  return n.toLocaleString('pt-BR')
}

// ── Static Params (ISR) ─────────────────────────────────────────────────────

export function generateStaticParams() {
  return IBGE_CITIES_ARRAY.map(city => ({
    estado: city.estadoSigla.toLowerCase(),
    cidade: city.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
  }))
}

// ── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ estado: string; cidade: string }> }): Promise<Metadata> {
  const { estado, cidade } = await params
  const city = findCity(estado, cidade)
  if (!city) return { title: 'Cidade não encontrada | AgoraEncontrei' }

  return {
    title: `Imóveis em ${city.nome}/${city.estadoSigla} — ${formatPop(city.populacaoCenso2022)} hab. | AgoraEncontrei`,
    description: `${city.descricaoSEO} Encontre casas, apartamentos, terrenos e leilões de imóveis em ${city.nome}/${city.estadoSigla}. Marketplace AgoraEncontrei.`,
    keywords: [
      `imóveis ${city.nome.toLowerCase()} ${city.estadoSigla.toLowerCase()}`,
      `casas à venda ${city.nome.toLowerCase()}`,
      `apartamentos ${city.nome.toLowerCase()}`,
      `terrenos ${city.nome.toLowerCase()}`,
      `leilão imóveis ${city.nome.toLowerCase()}`,
      `imobiliária ${city.nome.toLowerCase()}`,
    ],
    openGraph: {
      title: `Imóveis em ${city.nome}/${city.estadoSigla} | AgoraEncontrei`,
      description: city.descricaoSEO,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'AgoraEncontrei',
    },
    alternates: { canonical: `${WEB_URL}/${estado}/${cidade}` },
    robots: { index: true, follow: true },
  }
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function CidadePage({ params }: { params: Promise<{ estado: string; cidade: string }> }) {
  const { estado, cidade } = await params
  const city = findCity(estado, cidade)
  if (!city) notFound()

  const nearbyCities = IBGE_CITIES_ARRAY.filter(c =>
    c.slug !== city.slug && c.estadoSigla === city.estadoSigla
  ).slice(0, 8)

  const clusters = [...CLUSTERS_GROUP_A, ...CLUSTERS_GROUP_B].slice(0, 12)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Imóveis em ${city.nome}/${city.estadoSigla}`,
    description: city.descricaoSEO,
    url: `${WEB_URL}/${estado}/${cidade}`,
    about: {
      '@type': 'City',
      name: city.nome,
      addressRegion: city.estadoSigla,
      addressCountry: 'BR',
      population: city.populacaoCenso2022,
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {/* HERO */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="text-xs text-blue-200 mb-4 flex items-center gap-1.5">
            <Link href="/" className="hover:text-white">Início</Link>
            <span>/</span>
            <Link href={`/${estado}`} className="hover:text-white">{city.estado}</Link>
            <span>/</span>
            <span>{city.nome}</span>
          </nav>

          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-semibold mb-4" style={{ color: '#C9A84C' }}>
            <MapPin className="w-3.5 h-3.5" /> {city.nome}/{city.estadoSigla} · {formatPop(city.populacaoCenso2022)} hab. · IBGE {city.codigoIBGE}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            Imóveis em {city.nome}/{city.estadoSigla}
          </h1>

          <p className="text-white/70 text-lg mb-6 max-w-3xl">
            {city.descricaoSEO}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href={`/imoveis?city=${encodeURIComponent(city.nome)}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}>
              <Search className="w-4 h-4" /> Ver Imóveis em {city.nome}
            </Link>
            <a href={`https://wa.me/5516981010004?text=Olá! Tenho interesse em imóveis em ${city.nome}/${city.estadoSigla}.`}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-white">
              <MessageCircle className="w-4 h-4" /> Falar com Corretor
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-8 text-sm">
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: '#C9A84C' }}>{city.populacaoCenso2022.toLocaleString('pt-BR')}</div>
              <div className="text-white/60">habitantes</div>
            </div>
            {city.pibPerCapita && (
              <div className="text-center">
                <div className="text-xl font-bold" style={{ color: '#C9A84C' }}>R$ {city.pibPerCapita.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
                <div className="text-white/60">PIB per capita</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: '#C9A84C' }}>{city.areaKm2.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} km²</div>
              <div className="text-white/60">área total</div>
            </div>
            {city.distanciaFrancaKm && (
              <div className="text-center">
                <div className="text-xl font-bold" style={{ color: '#C9A84C' }}>{city.distanciaFrancaKm}km</div>
                <div className="text-white/60">de Franca</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CONTEÚDO SEO */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-8 border space-y-6">

          <h2 className="text-xl font-bold" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Oportunidades de Imóveis em {city.nome}: Panorama Atual
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            {city.nome} é um município de {city.estado} com população de <strong>{city.populacaoCenso2022.toLocaleString('pt-BR')} habitantes</strong> segundo
            o Censo IBGE 2022{city.populacaoEstimada2025 ? `, com projeção de ${city.populacaoEstimada2025.toLocaleString('pt-BR')} para 2025` : ''}.
            {city.pibPerCapita ? ` O PIB per capita é de R$ ${city.pibPerCapita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, ` : ' '}
            e a densidade demográfica atinge {city.densidadeDemografica.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} hab/km²
            em uma área de {city.areaKm2.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} km².
            {city.distanciaFrancaKm ? ` Localizada a ${city.distanciaFrancaKm}km de Franca, polo regional de serviços e comércio,` : ''}
            {' '}{city.nome} apresenta oportunidades relevantes no mercado imobiliário — de terrenos e chácaras a imóveis
            urbanos com potencial de valorização constante.
          </p>

          <h3 className="font-semibold text-gray-800 mb-2">Por que investir em {city.nome}?</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            {city.destaquesLocais.join('. ')}. Com uma base econômica diversificada e{' '}
            {city.pessoalOcupado ? `${city.pessoalOcupado.toLocaleString('pt-BR')} postos de trabalho formal, ` : ''}
            {city.nome} oferece fundamentos sólidos para investimento imobiliário.
            {city.esgotamentoSanitario ? ` A infraestrutura de saneamento atinge ${city.esgotamentoSanitario}% de cobertura, ` : ' '}
            {city.salarioMedioFormal ? `e o salário médio formal é de ${city.salarioMedioFormal} salários mínimos. ` : ''}
            Os bairros mais valorizados incluem {city.bairrosValorizados.join(', ')}.
          </p>

          <blockquote className="border-l-4 pl-4 py-2 bg-amber-50 rounded-r-lg text-sm text-amber-800" style={{ borderColor: '#C9A84C' }}>
            <strong>Nota:</strong> O mercado de leilões e imóveis em {city.estadoSigla} está em constante atualização. Fique atento às datas de editais.
          </blockquote>

          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                <Users className="w-4 h-4" /> População
              </div>
              <div className="text-base font-bold" style={{ color: '#1B2B5B' }}>{city.populacaoCenso2022.toLocaleString('pt-BR')}</div>
              <div className="text-[10px] text-gray-400">Censo IBGE 2022</div>
            </div>
            {city.pibPerCapita && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                  <BarChart3 className="w-4 h-4" /> PIB per capita
                </div>
                <div className="text-base font-bold" style={{ color: '#1B2B5B' }}>R$ {city.pibPerCapita.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
                <div className="text-[10px] text-gray-400">IBGE 2023</div>
              </div>
            )}
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                <Building2 className="w-4 h-4" /> Área
              </div>
              <div className="text-base font-bold" style={{ color: '#1B2B5B' }}>{city.areaKm2.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} km²</div>
              <div className="text-[10px] text-gray-400">IBGE 2024</div>
            </div>
            {city.pessoalOcupado && (
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                  <TrendingUp className="w-4 h-4" /> Empregos
                </div>
                <div className="text-base font-bold" style={{ color: '#1B2B5B' }}>{city.pessoalOcupado.toLocaleString('pt-BR')}</div>
                <div className="text-[10px] text-gray-400">Formais 2023</div>
              </div>
            )}
          </div>

          {/* CTA de fechamento obrigatório */}
          <p className="text-gray-600 text-sm leading-relaxed pt-2 border-t">
            Para conferir a lista completa e atualizada de oportunidades reais agora mesmo,{' '}
            <a href="https://agoraencontrei.com.br" className="font-semibold underline" style={{ color: '#1B2B5B' }}>
              acesse nossa vitrine principal no marketplace AgoraEncontrei
            </a>.
            Lá você filtra por preço, tipo de imóvel e status do leilão em tempo real.
          </p>
        </div>
      </section>

      {/* BAIRROS */}
      {city.bairrosValorizados.length > 2 && (
        <section className="max-w-5xl mx-auto px-4 pb-10">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Bairros Valorizados em {city.nome}/{city.estadoSigla}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {city.bairrosValorizados.map(bairro => {
              const slug = bairro.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
              return (
                <Link key={bairro} href={`/imoveis/em/${cidade}/${slug}`}
                  className="flex items-center gap-2 p-3 rounded-xl bg-white border border-gray-100 hover:border-[#C9A84C] hover:shadow-sm transition-all text-sm text-gray-700 hover:text-[#1B2B5B]">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C9A84C' }} />
                  {bairro}
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* CLUSTERS / TIPOS DE BUSCA */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-bold mb-5" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
          Explore Imóveis em {city.nome}/{city.estadoSigla}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {clusters.map((cluster) => (
            <Link key={cluster.slug} href={`/${estado}/${cidade}/${cluster.slug}`}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-[#C9A84C] hover:shadow-sm transition-all">
              <span className="font-semibold text-sm text-gray-800">
                {cluster.keyword} em {city.nome}
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* CIDADES PRÓXIMAS */}
      {nearbyCities.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-12">
          <h2 className="text-xl font-bold mb-5" style={{ color: '#1B2B5B', fontFamily: 'Georgia, serif' }}>
            Imóveis em Cidades Próximas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nearbyCities.map((c) => {
              const cSlug = c.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
              return (
                <Link key={c.slug} href={`/${c.estadoSigla.toLowerCase()}/${cSlug}`}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-[#C9A84C] hover:shadow-sm transition-all">
                  <div>
                    <span className="font-semibold text-sm text-gray-800">{c.nome}/{c.estadoSigla}</span>
                    <span className="block text-xs text-gray-400">
                      {c.populacaoCenso2022.toLocaleString('pt-BR')} hab.
                      {c.distanciaFrancaKm ? ` · ${c.distanciaFrancaKm}km de Franca` : ''}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* CTA FINAL */}
      <section className="py-12 px-4 text-center" style={{ background: 'linear-gradient(135deg, #1B2B5B, #0f1c3a)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Marketplace AgoraEncontrei
          </h2>
          <p className="text-white/70 mb-5">Imóveis em {city.nome} e região · Leilões, venda e locação</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://wa.me/5516981010004" target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-white">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <Link href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-[#1B2B5B]"
              style={{ background: '#C9A84C' }}>
              <Home className="w-4 h-4" /> Ver Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* FLOATING CTA (mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1B2B5B] p-3 text-white text-center font-bold text-sm shadow-2xl sm:hidden">
        <Link href="/" className="flex items-center justify-center gap-2">
          <Search className="w-4 h-4" style={{ color: '#C9A84C' }} />
          Oportunidades em {city.nome}?
          <span className="underline ml-1" style={{ color: '#C9A84C' }}>VER MARKETPLACE</span>
        </Link>
      </div>
    </>
  )
}
