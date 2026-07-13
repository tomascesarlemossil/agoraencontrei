/**
 * Empresas Parceiras — diretório de prestadores de serviço (arquitetos,
 * engenheiros, construtoras, advogados, etc.) do AgoraEncontrei.
 *
 * Reusa o modelo/endpoint Specialist já existente (GET /api/v1/specialists),
 * que aceita ?category, ?city e ?q. Visual premium verde/dourado. Sem dados →
 * fallback profissional convidando empresas a anunciarem.
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import {
  NIU_OFFICIAL_PARTNER,
  PARTNER_CATEGORY_SEO,
  PARTNER_CITY_SEO,
  PARTNER_INTENT_PAGES,
  partnerSeoPath,
} from '@/lib/partner-seo'
import { PartnerLeadQualifier } from '../especialistas/[slug]/PartnerLeadQualifier'

export const revalidate = 300

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// Categorias oferecidas no filtro (chave = SpecialistCategory do schema).
const CATEGORIES: { value: string; label: string }[] = [
  { value: 'ARQUITETO', label: 'Arquitetura' },
  { value: 'ENGENHEIRO', label: 'Engenharia' },
  { value: 'DESIGNER_INTERIORES', label: 'Design de Interiores' },
  { value: 'AVALIADOR', label: 'Avaliação' },
  { value: 'ADVOGADO_IMOBILIARIO', label: 'Advocacia Imobiliária' },
  { value: 'DESPACHANTE', label: 'Despachante' },
  { value: 'FOTOGRAFO', label: 'Fotografia' },
  { value: 'VIDEOMAKER', label: 'Vídeo' },
  { value: 'IMOBILIARIA', label: 'Imobiliária' },
  { value: 'LOTEADORA', label: 'Loteadora' },
  { value: 'OUTRO', label: 'Outros Serviços' },
]

interface Specialist {
  id: string
  slug: string
  name: string
  category: string
  categoryLabel?: string
  city?: string | null
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
  profilePath?: string | null
}

const OFFICIAL_PARTNERS: Specialist[] = [
  {
    ...NIU_OFFICIAL_PARTNER,
    tags: [...NIU_OFFICIAL_PARTNER.tags],
  },
]

function matchesFilters(s: Specialist, sp: Record<string, string>): boolean {
  if (sp.category && s.category !== sp.category) return false
  if (sp.city && !(s.city || '').toLowerCase().includes(sp.city.toLowerCase())) return false
  if (sp.q) {
    const haystack = [
      s.name,
      s.categoryLabel,
      s.bio,
      s.city,
      ...(s.tags || []),
    ].filter(Boolean).join(' ').toLowerCase()
    if (!haystack.includes(sp.q.toLowerCase())) return false
  }
  return true
}

async function fetchSpecialists(sp: Record<string, string>): Promise<Specialist[]> {
  try {
    const qs = new URLSearchParams({ limit: '60' })
    if (sp.category) qs.set('category', sp.category)
    if (sp.city) qs.set('city', sp.city)
    if (sp.q) qs.set('q', sp.q)
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
      const weight = Number(b.featuredWeight ?? 0) - Number(a.featuredWeight ?? 0)
      if (weight !== 0) return weight
      const aPlan = a.adPlan || a.plan || ''
      const bPlan = b.adPlan || b.plan || ''
      const plan = (rank[aPlan] ?? 6) - (rank[bPlan] ?? 6)
      if (plan !== 0) return plan
      return a.name.localeCompare(b.name, 'pt-BR')
    })
  } catch {
    return []
  }
}

function waHref(s: Specialist): string | null {
  const raw = s.whatsapp || s.phone
  if (!raw) return null
  const d = raw.replace(/\D/g, '')
  if (d.length < 10) return null
  return `https://wa.me/${d.startsWith('55') ? d : '55' + d}?text=${encodeURIComponent(`Olá ${s.name}, encontrei sua empresa no AgoraEncontrei e gostaria de um orçamento.`)}`
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
  const spRaw = await searchParams
  const cat = typeof spRaw.category === 'string' ? CATEGORIES.find(c => c.value === spRaw.category)?.label : null
  const city = typeof spRaw.city === 'string' ? spRaw.city : null
  const title = cat
    ? `${cat}${city ? ` em ${city}` : ''} | Empresas Parceiras — AgoraEncontrei`
    : 'Empresas Parceiras | AgoraEncontrei — Serviços para seu imóvel'
  return {
    title,
    description:
      'Encontre profissionais e empresas de confiança para comprar, vender, construir, reformar, financiar e valorizar seu imóvel em Franca/SP e região.',
    alternates: { canonical: 'https://www.agoraencontrei.com.br/empresas-parceiras' },
  }
}

export default async function EmpresasParceirasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const spRaw = await searchParams
  const sp: Record<string, string> = {}
  for (const [k, v] of Object.entries(spRaw)) if (typeof v === 'string') sp[k] = v

  const fetchedSpecialists = await fetchSpecialists(sp)
  const officialMatches = OFFICIAL_PARTNERS.filter(s => matchesFilters(s, sp))
  const fetchedSlugs = new Set(fetchedSpecialists.map(s => s.slug))
  const specialists = [
    ...officialMatches.filter(s => !fetchedSlugs.has(s.slug)),
    ...fetchedSpecialists,
  ]
  const activeCat = CATEGORIES.find(c => c.value === sp.category)
  const leadTarget = specialists[0]
  const leadCategoryLabel = activeCat?.label || leadTarget?.landingPage?.segmentLabel || leadTarget?.categoryLabel || 'Servicos para imoveis'
  const directorySchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Empresas Parceiras do AgoraEncontrei',
    description: 'Diretorio de profissionais e empresas parceiras para imoveis, arquitetura, engenharia, reformas, documentacao e marketing imobiliario.',
    url: 'https://www.agoraencontrei.com.br/empresas-parceiras',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: specialists.slice(0, 20).map((s, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: s.name,
        url: `https://www.agoraencontrei.com.br${s.profilePath || `/especialistas/${s.slug}`}`,
      })),
    },
  }

  return (
    <main style={{ backgroundColor: '#f8f6f1' }} className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(directorySchema) }} />
      {/* Hero premium */}
      <section className="py-16 px-4 text-center text-white" style={{ background: 'linear-gradient(135deg, #143A1F 0%, #0E2A15 60%, #143A1F 100%)' }}>
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#C9A84C' }}>
            Marketplace de Serviços
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Empresas Parceiras do <span style={{ color: '#C9A84C' }}>AgoraEncontrei</span>
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Profissionais e empresas de confiança para comprar, vender, construir, reformar, financiar e valorizar seu imóvel.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Filtros (GET) */}
        <form method="get" className="flex flex-wrap gap-2 mb-6 items-center">
          <input
            type="text"
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="Buscar empresa ou serviço..."
            className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
          />
          <input
            type="text"
            name="city"
            defaultValue={sp.city ?? ''}
            placeholder="Cidade (ex.: Franca)"
            className="min-w-[160px] px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]"
          />
          <select name="category" defaultValue={sp.category ?? ''} className="px-3 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm">
            <option value="">Todas as categorias</option>
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#143A1F]" style={{ backgroundColor: '#C9A84C' }}>
            Filtrar
          </button>
        </form>

        {/* Chips de categoria (atalhos) */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link
            href="/empresas-parceiras"
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${!sp.category ? 'bg-[#143A1F] text-white border-[#143A1F]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#C9A84C]'}`}
          >
            Todas
          </Link>
          {CATEGORIES.map(c => {
            const q = new URLSearchParams(sp)
            q.set('category', c.value)
            const active = sp.category === c.value
            return (
              <Link
                key={c.value}
                href={`/empresas-parceiras?${q.toString()}`}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${active ? 'bg-[#143A1F] text-white border-[#143A1F]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#C9A84C]'}`}
              >
                {c.label}
              </Link>
            )
          })}
        </div>

        <section className="mb-10 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#C9A84C' }}>
              Buscas mais fortes
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#143A1F]" style={{ fontFamily: 'Georgia, serif' }}>
              Encontre profissionais por cidade e profissao
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              O AgoraEncontrei organiza paginas locais para que arquitetos, engenheiros,
              designers, avaliadores, imobiliarias e outras empresas parceiras aparecam
              mais nas buscas e recebam clientes com intencao real.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {PARTNER_INTENT_PAGES.map(item => (
                <Link key={item.href} href={item.href} className="rounded-2xl border border-gray-100 p-4 transition hover:border-[#C9A84C] hover:shadow-sm">
                  <p className="text-sm font-bold text-[#143A1F]">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">{item.description}</p>
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-[#C9A84C]/25 bg-[#143A1F] p-6 text-white shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#C9A84C' }}>
              Vitrine inteligente
            </p>
            <h2 className="mt-2 text-2xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>
              Mais visibilidade para cada parceiro
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-white/75">
              <li>Ranking com planos em destaque primeiro.</li>
              <li>URLs limpas por cidade e categoria para SEO.</li>
              <li>Perfis individuais com WhatsApp, tags e prova de especialidade.</li>
              <li>Base pronta para Tomas IA qualificar demanda antes do contato.</li>
            </ul>
          </div>
        </section>

        <p className="text-sm text-gray-500 mb-6">
          {specialists.length} empresa{specialists.length === 1 ? '' : 's'} parceira{specialists.length === 1 ? '' : 's'}
          {activeCat ? ` em ${activeCat.label}` : ''}{sp.city ? ` · ${sp.city}` : ''}
        </p>

        {specialists.length > 0 ? (
          <>
            <div className="mb-8">
              <PartnerLeadQualifier
                specialistId={leadTarget.id}
                specialistName={leadTarget.name}
                categoryLabel={leadCategoryLabel}
                whatsapp={leadTarget.whatsapp || leadTarget.phone}
                services={[
                  { name: leadCategoryLabel },
                  { name: 'Orcamento e diagnostico' },
                  { name: 'Comparar profissionais' },
                  { name: 'Outro' },
                ]}
              />
            </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {specialists.map(s => {
              const wa = waHref(s)
              const until = s.featuredUntil ? new Date(s.featuredUntil).getTime() : null
              const activeFeatured = !!s.isFeatured && (!until || until >= Date.now())
              const isFeatured = activeFeatured || s.plan === 'VIP' || s.plan === 'PRIME' || s.adPlan === 'PROFISSIONAL' || s.adPlan === 'PREMIUM'
              const thumb = s.photoUrl || s.logoUrl || null
              const segLabel = s.landingPage?.segmentLabel || s.categoryLabel || s.category
              return (
                <div
                  key={s.id}
                  className={`bg-white rounded-2xl border p-6 flex flex-col items-center text-center transition-all hover:shadow-lg ${isFeatured ? 'border-[#C9A84C] ring-1 ring-[#C9A84C]/30' : 'border-gray-100'}`}
                >
                  {isFeatured && (
                    <span className="self-start text-[10px] font-bold px-2 py-0.5 rounded-full mb-2" style={{ backgroundColor: 'rgba(201,168,76,0.15)', color: '#C9A84C' }}>
                      ⭐ Destaque
                    </span>
                  )}
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-3 ring-2 ring-[#C9A84C]/30">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt={s.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: 'rgba(20,58,31,0.06)', color: '#143A1F' }}>
                        {(s.name || '?').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p className="text-base font-bold text-[#143A1F] leading-tight">{s.name}</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: '#C9A84C' }}>{segLabel}</p>
                  {s.city && <p className="text-xs text-gray-400 mt-0.5">{s.city}</p>}
                  {s.bio && <p className="text-xs text-gray-500 mt-2 line-clamp-3">{s.bio}</p>}
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 w-full">
                    <Link
                      href={s.profilePath || `/especialistas/${s.slug}`}
                      className="flex-1 min-w-[90px] px-3 py-2 rounded-lg text-xs font-bold text-white text-center"
                      style={{ backgroundColor: '#143A1F' }}
                    >
                      Ver perfil
                    </Link>
                    {wa && (
                      <a
                        href={wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-[90px] px-3 py-2 rounded-lg text-xs font-bold text-white text-center"
                        style={{ backgroundColor: '#25D366' }}
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          </>
        ) : (
          <div className="max-w-2xl mx-auto rounded-2xl border border-dashed p-10 text-center bg-white" style={{ borderColor: '#C9A84C' }}>
            <div className="text-5xl mb-3 opacity-30">🏢</div>
            <h2 className="text-xl font-bold text-[#143A1F] mb-2">Em breve, empresas parceiras aqui</h2>
            <p className="text-gray-500 text-sm mb-6">
              Arquitetura, engenharia, construção, reforma, design, financiamento e mais.
              {sp.category || sp.city || sp.q ? ' Nenhuma empresa encontrada para este filtro ainda.' : ''}
            </p>
            <Link
              href="/parceiros/cadastro"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-[#143A1F]"
              style={{ backgroundColor: '#C9A84C' }}
            >
              Divulgar minha empresa
            </Link>
          </div>
        )}

        {/* CTA final — anuncie sua empresa */}
        <section className="mt-14 rounded-3xl bg-white p-6">
          <h2 className="text-2xl font-bold text-[#143A1F]" style={{ fontFamily: 'Georgia, serif' }}>
            Paginas por cidade e categoria
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Atalhos preparados para disputar buscas locais de alto valor, como arquiteto em Franca,
            engenheiro em Ribeirao Preto, avaliador de imoveis e empresas para construir,
            reformar, vender ou alugar melhor.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {PARTNER_CITY_SEO.slice(0, 6).flatMap(city =>
              PARTNER_CATEGORY_SEO.slice(0, 4).map(category => (
                <Link
                  key={`${city.slug}-${category.slug}`}
                  href={partnerSeoPath(city.slug, category.slug)}
                  className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-[#C9A84C] hover:text-[#143A1F]"
                >
                  {category.label} em {city.city}
                </Link>
              ))
            )}
          </div>
        </section>

        <div className="mt-14 rounded-3xl p-8 sm:p-10 text-center" style={{ background: 'linear-gradient(135deg, #143A1F, #0E2A15)' }}>
          <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
            Sua empresa no maior marketplace imobiliário da região
          </h2>
          <p className="text-white/70 text-sm mb-6 max-w-2xl mx-auto">
            Apareça para milhares de pessoas que estão comprando, vendendo ou reformando imóveis em Franca e região.
          </p>
          <Link
            href="/parceiros/cadastro"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold text-[#143A1F]"
            style={{ backgroundColor: '#C9A84C' }}
          >
            Quero divulgar minha empresa
          </Link>
        </div>
      </div>
    </main>
  )
}
