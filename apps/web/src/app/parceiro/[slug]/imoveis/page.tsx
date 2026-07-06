/**
 * Tenant Catalog — catálogo completo de imóveis no site do PARCEIRO.
 *
 * parceiro.agoraencontrei.com.br/imoveis → /parceiro/{parceiro}/imoveis
 * Lista TODOS os imóveis publicados do parceiro, paginados, com busca/filtro
 * simples. Escopado pelo tenant (tenantSlug), então nunca mostra imóvel de outra
 * empresa. Cada card leva ao detalhe do imóvel no próprio site do parceiro.
 */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { resolveTheme } from '@/lib/site-factory/theme-registry'

// Render ao vivo: evita 404 preso no cache ISR/CDN quando a API tem um blip.
export const dynamic = 'force-dynamic'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const PAGE_SIZE = 24

interface TenantData {
  name: string
  layoutType: string
  primaryColor: string
  logoUrl: string | null
  isActive: boolean
  settings: { logoWordmarkUrl?: string | null; logoVisible?: boolean; logoShowText?: boolean; [k: string]: any }
}

interface Property {
  id: string
  title: string
  slug: string
  purpose: string
  price: number | null
  priceRent: number | null
  city: string | null
  state: string | null
  neighborhood: string | null
  bedrooms: number | null
  bathrooms: number | null
  parkingSpaces: number | null
  totalArea: number | null
  coverImage: string | null
  images: string[]
  isFeatured: boolean
  isPremium: boolean
}

interface Meta { total: number; page: number; limit: number; totalPages: number }

// Retry em falhas de rede do SSR → API (ECONNRESET/TLS). 404 real não é retentado.
async function fetchJsonRetry(url: string, revalidate: number): Promise<any | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { next: { revalidate } })
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch {
      if (attempt === 2) return null
      await new Promise(r => setTimeout(r, 200 * (attempt + 1)))
    }
  }
  return null
}

async function getTenant(slug: string): Promise<TenantData | null> {
  const data = await fetchJsonRetry(`${API_URL}/api/v1/public/tenant/${encodeURIComponent(slug)}`, 60)
  return data?.data || null
}

async function getProperties(slug: string, sp: Record<string, string>): Promise<{ items: Property[]; meta: Meta }> {
  const qs = new URLSearchParams({
    tenantSlug: slug,
    limit: String(PAGE_SIZE),
    page: sp.page && /^\d+$/.test(sp.page) ? sp.page : '1',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })
  if (sp.purpose) qs.set('purpose', sp.purpose)
  if (sp.type) qs.set('type', sp.type)
  if (sp.search) qs.set('search', sp.search)
  const data = await fetchJsonRetry(`${API_URL}/api/v1/public/properties?${qs.toString()}`, 120)
  return {
    items: Array.isArray(data?.data) ? data.data : [],
    meta: data?.meta ?? { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 },
  }
}

function formatPrice(price: number | null, priceRent: number | null, purpose: string): string {
  const p = purpose === 'RENT' ? priceRent : price
  if (!p) return 'Consultar'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(p)
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const tenant = await getTenant(slug)
  return { title: tenant ? `Imóveis — ${tenant.name}` : 'Imóveis' }
}

export default async function TenantCatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  const spRaw = await searchParams
  const sp: Record<string, string> = {}
  for (const [k, v] of Object.entries(spRaw)) if (typeof v === 'string') sp[k] = v

  const tenant = await getTenant(slug)
  if (!tenant || !tenant.isActive) notFound()

  const { items, meta } = await getProperties(slug, sp)
  const theme = resolveTheme(tenant.layoutType)
  const accentColor = tenant.primaryColor || theme.accentHex
  const logoVisible = tenant.settings?.logoVisible !== false
  const logoShowText = tenant.settings?.logoShowText !== false

  const currentPage = meta.page
  const buildHref = (page: number) => {
    const q = new URLSearchParams(sp)
    q.set('page', String(page))
    return `/imoveis?${q.toString()}`
  }

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text}`}>
      <style>{`:root{--color-primary:${accentColor};}`}</style>

      {/* Header */}
      <header className={`${theme.headerBg} sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            {logoVisible && tenant.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logoUrl} alt={tenant.name} className="h-10 w-auto object-contain" />
            )}
            {logoShowText && (
              tenant.settings?.logoWordmarkUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={tenant.settings.logoWordmarkUrl} alt={tenant.name} className="h-8 w-auto object-contain" />
                : <span className={`text-xl ${theme.fontHeading} font-bold`} style={{ color: accentColor }}>{tenant.name}</span>
            )}
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className={`text-2xl ${theme.fontHeading} font-bold`}>Imóveis disponíveis</h1>
          <p className={`text-sm ${theme.textMuted} mt-1`}>{meta.total} imóve{meta.total === 1 ? 'l' : 'is'} encontrado{meta.total === 1 ? '' : 's'}</p>
        </div>

        {/* Filtro simples (GET form) */}
        <form method="get" className="flex flex-wrap gap-2 mb-6">
          <input
            type="text"
            name="search"
            defaultValue={sp.search ?? ''}
            placeholder="Buscar por bairro, cidade ou título..."
            className="flex-1 min-w-[200px] px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:outline-none"
          />
          <select name="purpose" defaultValue={sp.purpose ?? ''} className="px-3 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm">
            <option value="">Venda e Aluguel</option>
            <option value="SALE">Venda</option>
            <option value="RENT">Aluguel</option>
          </select>
          <button type="submit" className={`${theme.buttonPrimary} px-5 py-2.5 rounded-lg text-sm`}>Buscar</button>
        </form>

        {items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map(property => (
                <a
                  key={property.id}
                  href={`/imoveis/${property.slug}`}
                  className={`${theme.card} ${theme.cardHover} border rounded-xl overflow-hidden transition-all duration-300 block`}
                >
                  <div className="h-48 relative overflow-hidden">
                    {property.coverImage || property.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={property.coverImage || property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}11)` }}>
                        <span className="text-4xl opacity-20">🏠</span>
                      </div>
                    )}
                    {property.isPremium && <span className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: '#e11d48' }}>🌟 Super Destaque</span>}
                    {property.isFeatured && !property.isPremium && <span className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: accentColor }}>⭐ Destaque</span>}
                    <span className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: `${accentColor}22`, color: accentColor, backdropFilter: 'blur(4px)' }}>
                      {property.purpose === 'RENT' ? 'Aluguel' : property.purpose === 'BOTH' ? 'Venda/Aluguel' : 'Venda'}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className={`text-sm font-semibold ${theme.text} leading-tight mb-1`}>{property.title}</p>
                    <p className={`text-xs ${theme.textMuted} mb-2`}>{[property.neighborhood, property.city, property.state].filter(Boolean).join(' • ')}</p>
                    <p className="mt-1 text-lg font-bold" style={{ color: accentColor }}>{formatPrice(property.price, property.priceRent, property.purpose)}</p>
                    <div className={`mt-2 flex items-center gap-3 text-[11px] ${theme.textMuted}`}>
                      {property.bedrooms ? <span>🛏 {property.bedrooms} qts</span> : null}
                      {property.bathrooms ? <span>🚿 {property.bathrooms} bnh</span> : null}
                      {property.totalArea ? <span>📐 {property.totalArea}m²</span> : null}
                      {property.parkingSpaces ? <span>🚗 {property.parkingSpaces} vg</span> : null}
                    </div>
                  </div>
                </a>
              ))}
            </div>

            {/* Paginação */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                {currentPage > 1 && (
                  <a href={buildHref(currentPage - 1)} className={`${theme.buttonSecondary} px-4 py-2 rounded-lg text-sm`}>← Anterior</a>
                )}
                <span className={`text-sm ${theme.textMuted} px-3`}>Página {currentPage} de {meta.totalPages}</span>
                {currentPage < meta.totalPages && (
                  <a href={buildHref(currentPage + 1)} className={`${theme.buttonPrimary} px-4 py-2 rounded-lg text-sm`}>Próxima →</a>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 opacity-30">🔍</div>
            <h4 className={`text-xl font-bold mb-2 ${theme.text}`}>Nenhum imóvel encontrado</h4>
            <p className={`${theme.textMuted}`}>Tente ajustar a busca ou os filtros.</p>
            <a href="/imoveis" className={`inline-block mt-6 px-6 py-3 rounded-lg font-medium ${theme.buttonPrimary}`}>Ver todos os imóveis</a>
          </div>
        )}
      </main>

      <footer className={`${theme.footerBg} py-8 px-4 mt-8`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm opacity-60">
          <p>&copy; {new Date().getFullYear()} {tenant.name}. Todos os direitos reservados.</p>
          <p>Powered by <a href="https://www.agoraencontrei.com.br" className="underline">AgoraEncontrei</a></p>
        </div>
      </footer>
    </div>
  )
}
