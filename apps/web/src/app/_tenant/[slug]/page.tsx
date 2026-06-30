/**
 * Tenant Home Page — Renders a clone site based on subdomain slug
 *
 * Accessed via middleware rewrite: parceiro.agoraencontrei.com.br → /_tenant/parceiro
 * Fetches tenant config from API and renders appropriate layout.
 */

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { resolveTheme, type ThemeConfig } from '@/lib/site-factory/theme-registry'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

interface TenantData {
  id: string
  name: string
  subdomain: string
  customDomain: string | null
  layoutType: string
  primaryColor: string
  logoUrl: string | null
  plan: string
  planStatus: string
  isActive: boolean
  settings: Record<string, any>
  companyId: string
}

interface TenantProperty {
  id: string
  slug: string | null
  title: string
  type: string
  purpose: string
  price: number | null
  priceRent: number | null
  valueUnderConsultation: boolean | null
  city: string | null
  neighborhood: string | null
  bedrooms: number | null
  bathrooms: number | null
  parkingSpaces: number | null
  coverImage: string | null
  images: string[] | null
  isFeatured: boolean
  isPremium: boolean
}

// Canonical main-site URL — tenant subdomains don't serve property detail pages,
// so cards link back to the main domain where /imovel/[slug] is rendered.
const MAIN_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.agoraencontrei.com.br'

async function getTenantBySubdomain(slug: string): Promise<TenantData | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/public/tenant/${slug}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.data || null
  } catch {
    return null
  }
}

// Fetch the tenant's real properties, scoped by companyId. Results come back
// ordered Super Destaque (isPremium) → Destaque (isFeatured) → rest from the API.
async function getTenantProperties(companyId: string): Promise<TenantProperty[]> {
  try {
    const res = await fetch(
      `${API_URL}/api/v1/public/properties?companyId=${encodeURIComponent(companyId)}&limit=12`,
      { next: { revalidate: 60 } },
    )
    if (!res.ok) return []
    const json = await res.json()
    return Array.isArray(json.data) ? json.data : []
  } catch {
    return []
  }
}

function formatTenantPrice(p: TenantProperty): string {
  if (p.valueUnderConsultation) return 'Sob consulta'
  const isRent = p.purpose === 'RENT'
  const value = isRent ? p.priceRent ?? p.price : p.price ?? p.priceRent
  if (!value) return 'Sob consulta'
  const formatted = `R$ ${value.toLocaleString('pt-BR')}`
  return isRent ? `${formatted}/mês` : formatted
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const tenant = await getTenantBySubdomain(slug)

  if (!tenant) {
    return { title: 'Não encontrado' }
  }

  return {
    title: `${tenant.name} — Imóveis`,
    description: `Encontre os melhores imóveis em ${tenant.name}. Casas, apartamentos, terrenos e mais.`,
    openGraph: {
      title: `${tenant.name} — Imóveis`,
      description: `Plataforma imobiliária ${tenant.name}`,
      ...(tenant.logoUrl && { images: [tenant.logoUrl] }),
    },
  }
}

// Resolve theme from registry (supports both old and new layout keys)

export default async function TenantPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tenant = await getTenantBySubdomain(slug)

  if (!tenant || !tenant.isActive) {
    notFound()
  }

  if (tenant.planStatus === 'SUSPENDED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Site Temporariamente Indisponível</h1>
          <p className="text-gray-600">
            Este site está temporariamente fora do ar. Entre em contato com o administrador.
          </p>
        </div>
      </div>
    )
  }

  const theme = resolveTheme(tenant.layoutType)
  const accentColor = tenant.primaryColor || theme.accentHex
  const properties = await getTenantProperties(tenant.companyId)

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text}`}>
      {/* CSS Variables for dynamic theming */}
      <style>{`
        :root {
          --color-primary: ${accentColor};
          --color-accent: ${theme.accentHex};
        }
      `}</style>

      {/* Header */}
      <header className={`${theme.headerBg} sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logoUrl && (
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="h-10 w-auto object-contain"
              />
            )}
            <h1 className={`text-xl ${theme.fontHeading} font-bold`} style={{ color: accentColor }}>
              {tenant.name}
            </h1>
          </div>
          <nav className={`hidden md:flex items-center gap-6 text-sm ${theme.textMuted}`}>
            <a href="#imoveis" className="hover:opacity-80 transition">Imóveis</a>
            <a href="#sobre" className="hover:opacity-80 transition">Sobre</a>
            <a href="#contato" className="hover:opacity-80 transition">Contato</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`${theme.hero} py-20 sm:py-28 px-4`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`text-3xl sm:text-4xl md:text-5xl ${theme.fontHeading} font-bold mb-6 leading-tight`}>
            Encontre o imóvel dos seus{' '}
            <span style={{ color: accentColor }}>sonhos</span>
          </h2>
          <p className={`text-base sm:text-lg ${theme.textMuted} mb-8 max-w-2xl mx-auto`}>
            {theme.key === 'luxury_gold'
              ? 'Imóveis selecionados e oportunidades exclusivas para investidores exigentes.'
              : theme.key === 'landscape_living'
              ? 'Terrenos, chácaras e loteamentos para quem busca qualidade de vida.'
              : theme.key === 'fast_sales_pro'
              ? 'As melhores oportunidades do mercado. Encontre rápido, negocie direto.'
              : 'Navegue por nossa seleção de imóveis. Casas, apartamentos, terrenos e mais.'}
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={theme.key === 'urban_tech' ? 'Casa com piscina em Franca até 500k...' : 'Buscar por bairro, cidade ou tipo...'}
                className={`flex-1 px-4 py-3 rounded-lg border text-gray-900 focus:outline-none focus:ring-2 ${theme.key === 'luxury_gold' ? 'bg-gray-800 text-white border-gray-700 placeholder:text-gray-500' : 'border-gray-300 bg-white'}`}
                style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
              />
              <button
                className={`${theme.buttonPrimary} px-6 py-3 rounded-lg transition`}
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Quick filter chips for urban_tech/fast_sales_pro */}
          {(theme.key === 'urban_tech' || theme.key === 'fast_sales_pro') && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['Pronto para morar', 'Aceita financiamento', 'Com piscina', 'Pet friendly'].map(chip => (
                <span key={chip} className={`${theme.buttonSecondary} px-3 py-1 rounded-full text-xs cursor-pointer`}>
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Properties Section */}
      <section id="imoveis" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h3 className={`text-2xl ${theme.fontHeading} font-bold mb-8 text-center`}>
            {theme.key === 'luxury_gold' ? 'Oportunidades Selecionadas' :
             theme.key === 'fast_sales_pro' ? 'Destaques da Semana' :
             theme.key === 'landscape_living' ? 'Terrenos e Loteamentos' :
             'Imóveis em Destaque'}
          </h3>
          {properties.length === 0 ? (
            <div className={`text-center py-16 ${theme.textMuted}`}>
              <p className="text-lg font-medium">Novos imóveis em breve.</p>
              <p className="text-sm mt-2">
                Estamos preparando as melhores oportunidades. Fale conosco para
                receber as novidades em primeira mão.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map(prop => {
                const image = prop.coverImage || prop.images?.[0] || null
                const details = [
                  prop.bedrooms ? `${prop.bedrooms} quartos` : null,
                  prop.bathrooms ? `${prop.bathrooms} banheiros` : null,
                  prop.parkingSpaces ? `${prop.parkingSpaces} vagas` : null,
                ].filter(Boolean).join(' • ')
                const location = [prop.neighborhood, prop.city].filter(Boolean).join(', ')
                return (
                  <a
                    key={prop.id}
                    href={`${MAIN_SITE_URL}/imovel/${prop.slug ?? prop.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${theme.card} ${theme.cardHover} border rounded-lg overflow-hidden transition-all block`}
                  >
                    <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 relative">
                      {image && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image}
                          alt={prop.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                      {prop.isPremium ? (
                        <span className="absolute top-2 left-2 bg-amber-500 text-gray-950 text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                          Super Destaque
                        </span>
                      ) : prop.isFeatured ? (
                        <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                          Destaque
                        </span>
                      ) : null}
                    </div>
                    <div className="p-4">
                      <p className={`text-sm font-semibold ${theme.text} line-clamp-1`}>{prop.title}</p>
                      <p className={`text-xs ${theme.textMuted} mt-1 line-clamp-1`}>
                        {[location, details].filter(Boolean).join(' • ')}
                      </p>
                      <p className="mt-2 font-bold" style={{ color: accentColor }}>
                        {formatTenantPrice(prop)}
                      </p>
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-16 px-4 border-t border-gray-200/10">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className={`text-2xl ${theme.fontHeading} font-bold mb-4`}>
            {theme.key === 'luxury_gold' ? 'Consultoria Personalizada' : 'Entre em Contato'}
          </h3>
          <p className={`${theme.textMuted} mb-8`}>
            {theme.key === 'luxury_gold'
              ? 'Solicite uma análise exclusiva do seu perfil de investimento.'
              : 'Tem interesse em algum imóvel? Fale conosco!'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`https://wa.me/?text=Olá, vi um imóvel no site ${tenant.name} e gostaria de mais informações.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium"
              style={{ backgroundColor: '#25D366' }}
            >
              Falar no WhatsApp
            </a>
            <button className={`${theme.buttonSecondary} px-6 py-3 rounded-lg`}>
              Falar com Tomás
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`${theme.footerBg} py-8 px-4`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm opacity-60">
          <p>&copy; {new Date().getFullYear()} {tenant.name}. Todos os direitos reservados.</p>
          <p>
            Powered by{' '}
            <a href="https://www.agoraencontrei.com.br" className="underline">
              AgoraEncontrei
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
