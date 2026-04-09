/**
 * Universal SEO Page Handler
 * Rota interna: /seo/{categoria}/{cidade}
 * Mapeada via rewrites de ~85 categorias × 500+ cidades
 * Exemplos: /vistoria-imovel/toledo-pr → /seo/vistoria-imovel/toledo-pr
 *           /leilao-caixa/franca-sp → /seo/leilao-caixa/franca-sp
 * ISR: revalidate 86400 (1 dia)
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Search, ChevronRight, Home, ArrowRight } from 'lucide-react'
import { SEO_CATEGORIAS_MAP, type SeoCategoria } from '@/data/seo-categorias'
import { UNIQUE_CITIES } from '@/data/seo-cities'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || 'https://www.agoraencontrei.com.br'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.agoraencontrei.com.br'

export const revalidate = 86400

/** Parse "toledo-pr" → { name: "Toledo", state: "PR", slug: "toledo-pr" } */
function parseCitySlug(slug: string) {
  const city = UNIQUE_CITIES.find(c => c.slug === slug)
  if (city) return city
  // Fallback: parse from slug pattern "cidade-uf"
  const match = slug.match(/^(.+)-([a-z]{2})$/)
  if (!match) return null
  const [, rawName, uf] = match
  const name = rawName
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  return { slug, name, state: uf.toUpperCase(), stateSlug: uf, region: 'brasil' }
}

function resolveMeta(cat: SeoCategoria, cityName: string, uf: string) {
  return {
    h1: cat.h1Template.replace('{cidade}', cityName).replace('{uf}', uf),
    desc: cat.descTemplate.replace('{cidade}', cityName).replace('{uf}', uf),
  }
}

export async function generateMetadata(
  props: { params: Promise<{ categoria: string; cidade: string }> }
): Promise<Metadata> {
  const params = await props.params
  const cat = SEO_CATEGORIAS_MAP[params.categoria]
  if (!cat) return {}
  const city = parseCitySlug(params.cidade)
  if (!city) return {}

  const meta = resolveMeta(cat, city.name, city.state)
  return {
    title: `${cat.titulo} em ${city.name}/${city.state} | AgoraEncontrei`,
    description: meta.desc,
    keywords: [
      `${cat.titulo.toLowerCase()} ${city.name.toLowerCase()}`,
      `${cat.titulo.toLowerCase()} ${city.name.toLowerCase()} ${city.state.toLowerCase()}`,
      `${cat.slug} ${city.name.toLowerCase()}`,
    ],
    openGraph: {
      title: `${cat.titulo} em ${city.name}/${city.state} | AgoraEncontrei`,
      description: meta.desc,
      type: 'website',
      locale: 'pt_BR',
      siteName: 'AgoraEncontrei',
    },
    alternates: {
      canonical: `${WEB_URL}/${cat.slug}/${params.cidade}`,
    },
  }
}

async function fetchProperties(cityName: string, cat: SeoCategoria) {
  if (!cat.apiFilter) return []
  try {
    const qs = new URLSearchParams({ city: cityName, limit: '9' })
    if (cat.apiFilter.purpose) qs.set('purpose', cat.apiFilter.purpose)
    if (cat.apiFilter.type) qs.set('type', cat.apiFilter.type)
    const r = await fetch(`${API_URL}/api/v1/public/properties?${qs}`, { next: { revalidate: 3600 } })
    if (r.ok) { const d = await r.json(); return d.data || [] }
  } catch {}
  return []
}

// Related categories from same group
function getRelated(cat: SeoCategoria) {
  const all = Object.values(SEO_CATEGORIAS_MAP)
  return all.filter(c => c.grupo === cat.grupo && c.slug !== cat.slug).slice(0, 6)
}

export default async function SeoCidadePage(
  props: { params: Promise<{ categoria: string; cidade: string }> }
) {
  const params = await props.params
  const cat = SEO_CATEGORIAS_MAP[params.categoria]
  if (!cat) notFound()
  const city = parseCitySlug(params.cidade)
  if (!city) notFound()

  const meta = resolveMeta(cat, city.name, city.state)
  const properties = await fetchProperties(city.name, cat)
  const related = getRelated(cat)

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Como encontrar ${cat.titulo.toLowerCase()} em ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Acesse o AgoraEncontrei e busque por ${cat.titulo.toLowerCase()} em ${city.name}/${city.state}. Use filtros de preço, bairro e tipo para encontrar o ideal.`,
        },
      },
      {
        '@type': 'Question',
        name: `Quantas opções de ${cat.titulo.toLowerCase()} existem em ${city.name}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `O AgoraEncontrei lista ${properties.length > 0 ? `${properties.length}+` : 'diversas'} opções de ${cat.titulo.toLowerCase()} em ${city.name}/${city.state}, atualizadas diariamente.`,
        },
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1B2B5B] to-[#0f1c3a] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="text-xs text-blue-200 mb-4 flex items-center gap-1.5 flex-wrap">
            <Link href="/" className="hover:text-white">Início</Link>
            <ChevronRight className="w-3 h-3" />
            <span>{city.name}/{city.state}</span>
            <ChevronRight className="w-3 h-3" />
            <span>{cat.titulo}</span>
          </nav>
          <h1
            className="text-3xl sm:text-4xl font-bold mb-3"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            <span className="text-2xl mr-2">{cat.icon}</span>
            {meta.h1}
          </h1>
          <p className="text-white/70 text-lg mb-6 max-w-3xl">
            {meta.desc} Encontre as melhores opções no AgoraEncontrei, o marketplace imobiliário #1 do Brasil.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/imoveis?city=${encodeURIComponent(city.name)}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}
            >
              <Search className="w-4 h-4" /> Ver Imóveis em {city.name}
            </Link>
            <Link
              href={`/leiloes`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white/10 text-white border border-white/20"
            >
              Ver Leilões
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        {/* Properties grid OR smart redirect to closest content */}
        {properties.length > 0 ? (
          <section>
            <h2 className="text-xl font-bold text-[#1B2B5B] mb-5">
              {cat.titulo} em {city.name}
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
                      <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
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
                      {p.price ? Number(p.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : 'Consulte'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <section className="bg-amber-50 rounded-2xl border border-amber-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-[#1B2B5B] mb-3">
              {cat.icon} {cat.titulo} em {city.name}
            </h2>
            <p className="text-gray-600 mb-6">
              Ainda não temos listagens específicas de {cat.titulo.toLowerCase()} em {city.name}/{city.state}.
              Enquanto isso, confira as opções mais próximas:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {cat.grupo === 'leilao' ? (
                <>
                  <Link href="/leiloes" className="bg-white rounded-xl border p-4 text-center hover:border-[#C9A84C] transition">
                    <p className="text-2xl mb-2">🏛️</p>
                    <p className="font-bold text-sm text-[#1B2B5B]">Todos os Leilões</p>
                    <p className="text-xs text-gray-500 mt-1">Leilões em todo o Brasil</p>
                  </Link>
                  <Link href={`/imoveis-a-venda/${params.cidade}`} className="bg-white rounded-xl border p-4 text-center hover:border-[#C9A84C] transition">
                    <p className="text-2xl mb-2">🏠</p>
                    <p className="font-bold text-sm text-[#1B2B5B]">Imóveis à Venda</p>
                    <p className="text-xs text-gray-500 mt-1">em {city.name}</p>
                  </Link>
                  <Link href="/investor" className="bg-white rounded-xl border p-4 text-center hover:border-[#C9A84C] transition">
                    <p className="text-2xl mb-2">📊</p>
                    <p className="font-bold text-sm text-[#1B2B5B]">Terminal de Investimento</p>
                    <p className="text-xs text-gray-500 mt-1">Análise DCF e Monte Carlo</p>
                  </Link>
                </>
              ) : (cat.grupo === 'servicos' || cat.grupo === 'profissionais' || cat.grupo === 'construcao' || cat.grupo === 'documentacao' || cat.grupo === 'outros') ? (
                <>
                  <Link href="/servicos" className="bg-white rounded-xl border p-4 text-center hover:border-[#C9A84C] transition">
                    <p className="text-2xl mb-2">🔧</p>
                    <p className="font-bold text-sm text-[#1B2B5B]">Nossos Serviços</p>
                    <p className="text-xs text-gray-500 mt-1">Todos os serviços disponíveis</p>
                  </Link>
                  <Link href={`/imoveis?city=${encodeURIComponent(city.name)}`} className="bg-white rounded-xl border p-4 text-center hover:border-[#C9A84C] transition">
                    <p className="text-2xl mb-2">🏠</p>
                    <p className="font-bold text-sm text-[#1B2B5B]">Imóveis em {city.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Venda e aluguel</p>
                  </Link>
                  <Link href="/profissionais/franca" className="bg-white rounded-xl border p-4 text-center hover:border-[#C9A84C] transition">
                    <p className="text-2xl mb-2">👷</p>
                    <p className="font-bold text-sm text-[#1B2B5B]">Profissionais</p>
                    <p className="text-xs text-gray-500 mt-1">Corretores e especialistas</p>
                  </Link>
                </>
              ) : (
                <>
                  <Link href={`/imoveis-a-venda/${params.cidade}`} className="bg-white rounded-xl border p-4 text-center hover:border-[#C9A84C] transition">
                    <p className="text-2xl mb-2">🏠</p>
                    <p className="font-bold text-sm text-[#1B2B5B]">Imóveis à Venda</p>
                    <p className="text-xs text-gray-500 mt-1">em {city.name}</p>
                  </Link>
                  <Link href={`/imoveis-para-alugar/${params.cidade}`} className="bg-white rounded-xl border p-4 text-center hover:border-[#C9A84C] transition">
                    <p className="text-2xl mb-2">🔑</p>
                    <p className="font-bold text-sm text-[#1B2B5B]">Imóveis para Alugar</p>
                    <p className="text-xs text-gray-500 mt-1">em {city.name}</p>
                  </Link>
                  <Link href={`/leilao-imoveis-em/${params.cidade}`} className="bg-white rounded-xl border p-4 text-center hover:border-[#C9A84C] transition">
                    <p className="text-2xl mb-2">🏛️</p>
                    <p className="font-bold text-sm text-[#1B2B5B]">Leilões de Imóveis</p>
                    <p className="text-xs text-gray-500 mt-1">em {city.name}</p>
                  </Link>
                </>
              )}
            </div>
          </section>
        )}

        {/* SEO content */}
        <section className="bg-white rounded-2xl border p-6 sm:p-8">
          <h2 className="text-xl font-bold text-[#1B2B5B] mb-4">
            {cat.titulo} em {city.name}/{city.state}
          </h2>
          <div className="prose prose-sm max-w-none text-gray-600 space-y-3">
            <p>
              {meta.desc} O AgoraEncontrei é a plataforma líder em {cat.titulo.toLowerCase()} em {city.name},
              conectando compradores, vendedores e prestadores de serviço com transparência e segurança.
            </p>
            <p>
              Utilize nossos filtros avançados para encontrar exatamente o que procura por bairro,
              preço, metragem e características. Todas as listagens são verificadas e atualizadas
              regularmente para garantir informações precisas.
            </p>
            {cat.grupo === 'leilao' && (
              <p>
                Para leilões, o AgoraEncontrei oferece análise de investimento com DCF (Fluxo de Caixa
                Descontado), simulação Monte Carlo e stress tests. Utilize nosso{' '}
                <Link href="/investor" className="text-[#1B2B5B] underline">Terminal de Investimento</Link>{' '}
                para avaliar oportunidades antes de arrematar.
              </p>
            )}
            {(cat.grupo === 'servicos' || cat.grupo === 'profissionais' || cat.grupo === 'construcao') && (
              <p>
                Encontre os melhores profissionais de {cat.titulo.toLowerCase()} em {city.name}. Cadastre-se
                como profissional no AgoraEncontrei para receber leads qualificados da sua região.
              </p>
            )}
          </div>
        </section>

        {/* FAQ section */}
        <section className="bg-white rounded-2xl border p-6 sm:p-8">
          <h2 className="text-lg font-bold text-[#1B2B5B] mb-4">
            Perguntas Frequentes — {cat.titulo} em {city.name}
          </h2>
          <div className="space-y-3">
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

        {/* Related categories */}
        {related.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-[#1B2B5B] mb-4">
              Veja também em {city.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {related.map(r => (
                <Link
                  key={r.slug}
                  href={`/${r.slug}/${params.cidade}`}
                  className="bg-white rounded-xl border p-3 text-center hover:border-[#C9A84C] transition text-sm"
                >
                  <span className="text-xl">{r.icon}</span>
                  <p className="text-gray-700 mt-1 font-medium">{r.titulo}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-gradient-to-r from-blue-50 to-amber-50 rounded-2xl border p-6 text-center">
          <p className="text-lg font-bold text-[#1B2B5B] mb-2">
            Não encontrou o que procura em {city.name}?
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Cadastre-se para receber alertas quando novas opções estiverem disponíveis.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/alertas"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm"
              style={{ background: '#C9A84C', color: '#1B2B5B' }}
            >
              Criar Alerta Gratuito <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={`https://wa.me/5516999999999?text=Olá! Procuro ${cat.titulo.toLowerCase()} em ${city.name}/${city.state}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white"
              style={{ background: '#25D366' }}
            >
              Falar no WhatsApp
            </a>
          </div>
        </section>
      </div>
    </>
  )
}
