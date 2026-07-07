import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  PARTNER_CATEGORY_SEO,
  PARTNER_CITY_SEO,
  getPartnerCategoryBySlug,
  getPartnerCityBySlug,
  partnerSeoPath,
} from '@/lib/partner-seo'
import { limitSeoStaticItems } from '@/lib/ssg-runtime'
import { PartnerLeadQualifier } from '../../../especialistas/[slug]/PartnerLeadQualifier'

export const revalidate = 300

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'

interface Specialist {
  id: string
  slug: string
  name: string
  category: string
  categoryLabel?: string
  city?: string | null
  state?: string | null
  bio?: string | null
  photoUrl?: string | null
  logoUrl?: string | null
  whatsapp?: string | null
  phone?: string | null
  plan?: string | null
  adPlan?: string | null
  isFeatured?: boolean | null
  featuredUntil?: string | null
  featuredWeight?: number | null
  tags?: string[] | null
  landingPage?: { segmentLabel?: string } | null
}

function waHref(s: Specialist): string | null {
  const raw = s.whatsapp || s.phone
  if (!raw) return null
  const d = raw.replace(/\D/g, '')
  if (d.length < 10) return null
  return `https://wa.me/${d.startsWith('55') ? d : '55' + d}?text=${encodeURIComponent(`Ola ${s.name}, encontrei seu perfil no AgoraEncontrei e gostaria de atendimento.`)}`
}

async function fetchSpecialists(city: string, category: string): Promise<Specialist[]> {
  try {
    const qs = new URLSearchParams({ limit: '80', city, category })
    const res = await fetch(`${API_URL}/api/v1/specialists?${qs.toString()}`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const json = await res.json()
    const list: Specialist[] = Array.isArray(json?.data) ? json.data : []
    const rank: Record<string, number> = { VIP: 0, PREMIUM: 1, PRIME: 2, PROFISSIONAL: 3, ESSENCIAL: 4, START: 5 }
    const now = Date.now()
    return list.sort((a, b) => {
      const aUntil = a.featuredUntil ? new Date(a.featuredUntil).getTime() : null
      const bUntil = b.featuredUntil ? new Date(b.featuredUntil).getTime() : null
      const aFeatured = !!a.isFeatured && (!aUntil || aUntil >= now)
      const bFeatured = !!b.isFeatured && (!bUntil || bUntil >= now)
      if (aFeatured !== bFeatured) return aFeatured ? -1 : 1
      const featuredWeight = Number(b.featuredWeight ?? 0) - Number(a.featuredWeight ?? 0)
      if (featuredWeight !== 0) return featuredWeight
      const aPlan = a.adPlan || a.plan || ''
      const bPlan = b.adPlan || b.plan || ''
      const planRank = (rank[aPlan] ?? 6) - (rank[bPlan] ?? 6)
      if (planRank !== 0) return planRank
      return a.name.localeCompare(b.name, 'pt-BR')
    })
  } catch {
    return []
  }
}

export function generateStaticParams() {
  const cities = limitSeoStaticItems(PARTNER_CITY_SEO, 'SEO_STATIC_PARTNER_CITY_LIMIT', 3)
  const categories = limitSeoStaticItems(PARTNER_CATEGORY_SEO, 'SEO_STATIC_PARTNER_CATEGORY_LIMIT', 4)
  return cities.flatMap(city =>
    categories.map(category => ({
      cidade: city.slug,
      categoria: category.slug,
    }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cidade: string; categoria: string }>
}): Promise<Metadata> {
  const { cidade, categoria } = await params
  const city = getPartnerCityBySlug(cidade)
  const cat = getPartnerCategoryBySlug(categoria)
  if (!city || !cat) return { title: 'Empresas parceiras | AgoraEncontrei' }

  const title = `${cat.label} em ${city.city}/${city.state} | Empresas Parceiras AgoraEncontrei`
  const description = `${cat.description} Encontre ${cat.singular} em ${city.city}/${city.state} e receba atendimento pelo AgoraEncontrei.`
  const canonical = `${WEB_URL}${partnerSeoPath(city.slug, cat.slug)}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      siteName: 'AgoraEncontrei',
    },
  }
}

export default async function PartnerSeoPage({
  params,
}: {
  params: Promise<{ cidade: string; categoria: string }>
}) {
  const { cidade, categoria } = await params
  const city = getPartnerCityBySlug(cidade)
  const cat = getPartnerCategoryBySlug(categoria)
  if (!city || !cat) notFound()

  const specialists = await fetchSpecialists(city.city, cat.value)
  const leadTarget = specialists[0]

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${cat.label} em ${city.city}/${city.state}`,
    itemListElement: specialists.map((s, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${WEB_URL}/especialistas/${s.slug}`,
      name: s.name,
    })),
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Como encontrar ${cat.singular} em ${city.city}/${city.state}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Use o AgoraEncontrei para comparar empresas parceiras, ver especialidades e falar pelo WhatsApp com profissionais de ${cat.service} em ${city.city}/${city.state}.`,
        },
      },
      {
        '@type': 'Question',
        name: `O AgoraEncontrei indica profissionais verificados?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'O diretorio destaca parceiros cadastrados, planos de divulgacao e perfis completos. Antes de contratar, confirme escopo, prazo, documentacao e referencias diretamente com o profissional.',
        },
      },
      {
        '@type': 'Question',
        name: `Posso pedir atendimento online?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim. Muitas demandas podem comecar por briefing online, envio de fotos, medidas, documentos e conversa pelo WhatsApp.',
        },
      },
    ],
  }

  return (
    <main className="min-h-screen bg-[#f8f6f1]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <section className="px-4 py-16 text-white" style={{ background: 'linear-gradient(135deg, #143A1F 0%, #0E2A15 100%)' }}>
        <div className="mx-auto max-w-5xl">
          <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-white/60">
            <Link href="/" className="hover:text-white">Inicio</Link>
            <span>/</span>
            <Link href="/empresas-parceiras" className="hover:text-white">Empresas parceiras</Link>
            <span>/</span>
            <span>{city.city}</span>
            <span>/</span>
            <span>{cat.label}</span>
          </nav>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em]" style={{ color: '#C9A84C' }}>
            Profissionais parceiros em {city.region}
          </p>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight md:text-5xl" style={{ fontFamily: 'Georgia, serif' }}>
            {cat.label} em {city.city}/{city.state}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-white/75">
            Encontre empresas e profissionais para {cat.intent}. O AgoraEncontrei organiza parceiros,
            contexto imobiliario e atendimento inteligente para conectar voce ao servico certo.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={`https://wa.me/5516981010004?text=${encodeURIComponent(`Ola! Preciso de ${cat.service} em ${city.city}/${city.state}. Vim pelo AgoraEncontrei.`)}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl px-6 py-3 text-center text-sm font-bold text-[#143A1F]"
              style={{ backgroundColor: '#C9A84C' }}
            >
              Pedir indicacao agora
            </a>
            <Link href="/parceiros/cadastro" className="rounded-xl border border-white/25 px-6 py-3 text-center text-sm font-bold text-white hover:bg-white/10">
              Divulgar minha empresa
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {[
            ['Busca com intencao', `Filtramos quem procura ${cat.service} por cidade, servico e momento de decisao.`],
            ['Parceiros em destaque', 'Planos profissionais e destaques ativos aparecem com mais forca, sem esconder a lista completa.'],
            ['Atendimento rastreavel', 'Links de WhatsApp e perfis ajudam a medir origem, demanda e conversao.'],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-[#C9A84C]/20 bg-white p-5">
              <h2 className="text-sm font-bold text-[#143A1F]">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">{text}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#143A1F]" style={{ fontFamily: 'Georgia, serif' }}>
              Empresas encontradas
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {specialists.length} resultado{specialists.length === 1 ? '' : 's'} para {cat.service} em {city.city}/{city.state}
            </p>
          </div>
          <Link href={`/empresas-parceiras?city=${encodeURIComponent(city.city)}&category=${cat.value}`} className="text-sm font-bold text-[#143A1F] hover:underline">
            Abrir filtros avancados
          </Link>
        </div>

        {specialists.length > 0 ? (
          <>
            <div className="mb-8">
              <PartnerLeadQualifier
                specialistId={leadTarget.id}
                specialistName={leadTarget.name}
                categoryLabel={`${cat.label} em ${city.city}/${city.state}`}
                whatsapp={leadTarget.whatsapp || leadTarget.phone}
                services={[
                  { name: cat.service },
                  { name: 'Projeto ou orcamento' },
                  { name: 'Comparar profissionais' },
                  { name: 'Outro' },
                ]}
              />
            </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {specialists.map(s => {
              const wa = waHref(s)
              const until = s.featuredUntil ? new Date(s.featuredUntil).getTime() : null
              const activeFeatured = !!s.isFeatured && (!until || until >= Date.now())
              const isFeatured = activeFeatured || s.plan === 'VIP' || s.plan === 'PRIME' || s.adPlan === 'PROFISSIONAL' || s.adPlan === 'PREMIUM'
              const thumb = s.photoUrl || s.logoUrl || null
              const segLabel = s.landingPage?.segmentLabel || s.categoryLabel || cat.label
              return (
                <article key={s.id} className={`rounded-2xl border bg-white p-6 text-center transition hover:shadow-lg ${isFeatured ? 'border-[#C9A84C] ring-1 ring-[#C9A84C]/30' : 'border-gray-100'}`}>
                  {isFeatured && (
                    <span className="mb-3 inline-flex rounded-full bg-[#C9A84C]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#9A7A23]">
                      Destaque {s.adPlan || s.plan || ''}
                    </span>
                  )}
                  <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full ring-2 ring-[#C9A84C]/30">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt={s.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#143A1F]/5 text-2xl font-bold text-[#143A1F]">
                        {(s.name || '?').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-[#143A1F]">{s.name}</h3>
                  <p className="mt-1 text-xs font-semibold text-[#C9A84C]">{segLabel}</p>
                  {s.bio && <p className="mt-3 line-clamp-3 text-xs leading-5 text-gray-500">{s.bio}</p>}
                  <div className="mt-5 flex gap-2">
                    <Link href={`/especialistas/${s.slug}`} className="flex-1 rounded-lg bg-[#143A1F] px-3 py-2 text-xs font-bold text-white">
                      Ver perfil
                    </Link>
                    {wa && (
                      <a href={wa} target="_blank" rel="noreferrer" className="flex-1 rounded-lg bg-[#25D366] px-3 py-2 text-xs font-bold text-white">
                        WhatsApp
                      </a>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#C9A84C] bg-white p-10 text-center">
            <h2 className="text-xl font-bold text-[#143A1F]">Seja o primeiro destaque nesta busca</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-600">
              Ainda nao ha parceiros ativos para {cat.service} em {city.city}/{city.state}. O AgoraEncontrei ja deixou a pagina preparada
              para capturar demanda organica e receber profissionais dessa categoria.
            </p>
            <Link href="/parceiros/cadastro" className="mt-6 inline-flex rounded-xl px-6 py-3 text-sm font-bold text-[#143A1F]" style={{ backgroundColor: '#C9A84C' }}>
              Cadastrar minha empresa
            </Link>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <div className="rounded-3xl bg-white p-8">
          <h2 className="text-2xl font-bold text-[#143A1F]" style={{ fontFamily: 'Georgia, serif' }}>
            Mais buscas de empresas parceiras
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {PARTNER_CATEGORY_SEO.slice(0, 10).map(item => (
              <Link
                key={item.slug}
                href={partnerSeoPath(city.slug, item.slug)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${item.slug === cat.slug ? 'border-[#143A1F] bg-[#143A1F] text-white' : 'border-gray-200 text-gray-700 hover:border-[#C9A84C]'}`}
              >
                {item.label} em {city.city}
              </Link>
            ))}
            {PARTNER_CITY_SEO.slice(0, 6).map(item => (
              <Link
                key={item.slug}
                href={partnerSeoPath(item.slug, cat.slug)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${item.slug === city.slug ? 'border-[#143A1F] bg-[#143A1F] text-white' : 'border-gray-200 text-gray-700 hover:border-[#C9A84C]'}`}
              >
                {cat.label} em {item.city}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
