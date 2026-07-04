/**
 * Tenant Home Page — Renders a clone site based on subdomain slug
 *
 * Accessed via middleware rewrite: parceiro.agoraencontrei.com.br → /_tenant/parceiro
 * Fetches tenant config from API and renders appropriate layout.
 * 
 * v2: Carrega imóveis REAIS do banco de dados (com destaque e super destaque por região)
 */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { resolveTheme, type ThemeConfig } from '@/lib/site-factory/theme-registry'
import TomasWidget from '@/components/tomas/TomasWidget'

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
  // Marca do cabeçalho — configurável pelo dono em dashboard/meu-site,
  // mesmo padrão do site principal (ver apps/web/src/lib/site-settings.ts).
  settings: {
    nicheSlug?: string | null
    logoWordmarkUrl?: string | null
    logoVisible?: boolean
    logoShowText?: boolean
    logoPosition?: 'left' | 'center'
    [key: string]: any
  }
  companyId: string
}

interface Property {
  id: string
  title: string
  slug: string
  type: string
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
  company?: { name: string; phone: string | null; logoUrl: string | null }
}

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

async function getTenantProperties(tenantSlug: string, limit = 9): Promise<Property[]> {
  try {
    const url = `${API_URL}/api/v1/public/properties?tenantSlug=${encodeURIComponent(tenantSlug)}&limit=${limit}&sortBy=createdAt&sortOrder=desc`
    const res = await fetch(url, { next: { revalidate: 120 } })
    if (!res.ok) return []
    const data = await res.json()
    // A rota /api/v1/public/properties responde { data: [...], meta }.
    // `data.data` JÁ é o array — o acesso anterior (data.data?.items) dava
    // sempre undefined, fazendo TODO site de parceiro renderizar vazio.
    return Array.isArray(data?.data) ? data.data : (Array.isArray(data?.items) ? data.items : [])
  } catch {
    return []
  }
}

function formatPrice(price: number | null, priceRent: number | null, purpose: string): string {
  const p = purpose === 'RENT' ? priceRent : price
  if (!p) return 'Consultar'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(p)
}

function PropertyBadge({ property, theme, accentColor }: { property: Property; theme: ThemeConfig; accentColor: string }) {
  if (property.isPremium) {
    return (
      <span className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
        style={{ backgroundColor: '#e11d48' }}>
        🌟 Super Destaque
      </span>
    )
  }
  if (property.isFeatured) {
    return (
      <span className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
        style={{ backgroundColor: accentColor }}>
        ⭐ Destaque
      </span>
    )
  }
  return null
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
  const [tenant, properties] = await Promise.all([
    getTenantBySubdomain(slug),
    getTenantProperties(slug, 9),
  ])

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
  const logoVisible = tenant.settings?.logoVisible !== false
  const logoShowText = tenant.settings?.logoShowText !== false
  const logoPosition = tenant.settings?.logoPosition === 'center' ? 'center' : 'left'

  // Ordenar imóveis: super destaque (isPremium) primeiro, depois destaque (isFeatured), depois os demais
  const sortedProperties = [...properties].sort((a, b) => {
    if (a.isPremium && !b.isPremium) return -1
    if (!a.isPremium && b.isPremium) return 1
    if (a.isFeatured && !b.isFeatured) return -1
    if (!a.isFeatured && b.isFeatured) return 1
    return 0
  })

  const hasProperties = sortedProperties.length > 0

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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {logoVisible ? (
            <div className={`flex items-center gap-3 ${logoPosition === 'center' ? 'md:absolute md:left-1/2 md:-translate-x-1/2' : ''}`}>
              {tenant.logoUrl && (
                <img
                  src={tenant.logoUrl}
                  alt={tenant.name}
                  className="h-10 w-auto object-contain"
                />
              )}
              {logoShowText && (
                tenant.settings?.logoWordmarkUrl ? (
                  <img src={tenant.settings.logoWordmarkUrl} alt={tenant.name} className="h-8 w-auto object-contain" />
                ) : (
                  <h1 className={`text-xl ${theme.fontHeading} font-bold`} style={{ color: accentColor }}>
                    {tenant.name}
                  </h1>
                )
              )}
            </div>
          ) : <div />}
          <nav className={`hidden md:flex items-center gap-6 text-sm ${theme.textMuted}`}>
            <a href="#imoveis" className="hover:opacity-80 transition">Imóveis</a>
            <a href="#sobre" className="hover:opacity-80 transition">Sobre</a>
            <a href="#contato" className="hover:opacity-80 transition">Contato</a>
          </nav>
          {/* Botão Tomás IA */}
          <a
            href={`https://wa.me/?text=Olá! Quero saber mais sobre os imóveis de ${tenant.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${theme.buttonPrimary}`}
          >
            💬 Tomás IA
          </a>
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
          {/* Quick filter chips */}
          {(theme.key === 'urban_tech' || theme.key === 'fast_sales_pro') && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['Pronto para morar', 'Aceita financiamento', 'Com piscina', 'Pet friendly'].map(chip => (
                <span key={chip} className={`${theme.buttonSecondary} px-3 py-1 rounded-full text-xs cursor-pointer`}>
                  {chip}
                </span>
              ))}
            </div>
          )}
          {/* Stats */}
          {hasProperties && (
            <div className="flex items-center justify-center gap-6 mt-8 text-xs">
              <div className="text-center">
                <p className={`text-lg font-bold`} style={{ color: accentColor }}>{sortedProperties.length}+</p>
                <p className={`text-[10px] ${theme.textMuted}`}>Imóveis</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold`} style={{ color: accentColor }}>
                  {sortedProperties.filter(p => p.isFeatured || p.isPremium).length}
                </p>
                <p className={`text-[10px] ${theme.textMuted}`}>Destaques</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold`} style={{ color: accentColor }}>24/7</p>
                <p className={`text-[10px] ${theme.textMuted}`}>Atendimento</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Properties Section */}
      <section id="imoveis" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className={`text-2xl ${theme.fontHeading} font-bold`}>
                {theme.key === 'luxury_gold' ? 'Oportunidades Selecionadas' :
                 theme.key === 'fast_sales_pro' ? '🔥 Destaques da Semana' :
                 theme.key === 'landscape_living' ? 'Terrenos e Loteamentos' :
                 'Imóveis em Destaque'}
              </h3>
              {hasProperties && (
                <p className={`text-sm ${theme.textMuted} mt-1`}>
                  {sortedProperties.length} imóve{sortedProperties.length === 1 ? 'l' : 'is'} disponíve{sortedProperties.length === 1 ? 'l' : 'is'}
                  {sortedProperties.filter(p => p.isPremium).length > 0 && (
                    <span> · <span className="text-rose-400 font-medium">{sortedProperties.filter(p => p.isPremium).length} super destaque{sortedProperties.filter(p => p.isPremium).length > 1 ? 's' : ''}</span></span>
                  )}
                  {sortedProperties.filter(p => p.isFeatured && !p.isPremium).length > 0 && (
                    <span> · <span style={{ color: accentColor }} className="font-medium">{sortedProperties.filter(p => p.isFeatured && !p.isPremium).length} destaque{sortedProperties.filter(p => p.isFeatured && !p.isPremium).length > 1 ? 's' : ''}</span></span>
                  )}
                </p>
              )}
            </div>
            {hasProperties && (
              <a href="#contato" className={`hidden sm:inline-flex items-center gap-1 text-sm font-semibold`} style={{ color: accentColor }}>
                Ver todos →
              </a>
            )}
          </div>

          {hasProperties ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProperties.map(property => (
                <div
                  key={property.id}
                  className={`${theme.card} ${theme.cardHover} border rounded-xl overflow-hidden transition-all duration-300 ${
                    property.isPremium ? 'ring-2 ring-rose-500/40 shadow-lg shadow-rose-500/10' :
                    property.isFeatured ? 'ring-1 shadow-md' : ''
                  }`}
                  style={property.isFeatured && !property.isPremium ? { '--tw-ring-color': `${accentColor}40` } as React.CSSProperties : {}}
                >
                  {/* Imagem */}
                  <div className="h-48 relative overflow-hidden">
                    {property.coverImage || (property.images && property.images.length > 0) ? (
                      <img
                        src={property.coverImage || property.images[0]}
                        alt={property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}11)` }}
                      >
                        <span className="text-4xl opacity-20">🏠</span>
                      </div>
                    )}
                    {/* Badge de destaque */}
                    <PropertyBadge property={property} theme={theme} accentColor={accentColor} />
                    {/* Badge de tipo */}
                    <span
                      className="absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ backgroundColor: `${accentColor}22`, color: accentColor, backdropFilter: 'blur(4px)' }}
                    >
                      {property.purpose === 'RENT' ? 'Aluguel' : property.purpose === 'BOTH' ? 'Venda/Aluguel' : 'Venda'}
                    </span>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-4">
                    <p className={`text-sm font-semibold ${theme.text} leading-tight mb-1`}>{property.title}</p>
                    <p className={`text-xs ${theme.textMuted} mb-2`}>
                      {[property.neighborhood, property.city, property.state].filter(Boolean).join(' • ')}
                    </p>
                    <p className="mt-1 text-lg font-bold" style={{ color: accentColor }}>
                      {formatPrice(property.price, property.priceRent, property.purpose)}
                    </p>
                    {/* Características */}
                    <div className={`mt-2 flex items-center gap-3 text-[11px] ${theme.textMuted}`}>
                      {property.bedrooms != null && property.bedrooms > 0 && (
                        <span>🛏 {property.bedrooms} qts</span>
                      )}
                      {property.bathrooms != null && property.bathrooms > 0 && (
                        <span>🚿 {property.bathrooms} bnh</span>
                      )}
                      {property.totalArea != null && property.totalArea > 0 && (
                        <span>📐 {property.totalArea}m²</span>
                      )}
                      {property.parkingSpaces != null && property.parkingSpaces > 0 && (
                        <span>🚗 {property.parkingSpaces} vg</span>
                      )}
                    </div>
                    {/* CTA */}
                    <a
                      href={`https://wa.me/?text=Olá! Tenho interesse no imóvel "${property.title}" anunciado em ${tenant.name}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-3 block w-full text-center py-2 rounded-lg text-xs font-bold transition-all ${theme.buttonPrimary}`}
                    >
                      Ver detalhes
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Estado vazio — sem imóveis cadastrados ainda */
            <div className="text-center py-16">
              <div className="text-6xl mb-4 opacity-30">🏠</div>
              <h4 className={`text-xl font-bold mb-2 ${theme.text}`}>Imóveis em breve</h4>
              <p className={`${theme.textMuted} max-w-md mx-auto`}>
                Estamos preparando nossa seleção de imóveis. Entre em contato para saber das próximas oportunidades.
              </p>
              <a
                href="#contato"
                className={`inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-lg font-medium ${theme.buttonPrimary}`}
              >
                Falar com a equipe
              </a>
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
              💬 Falar no WhatsApp
            </a>
            <button className={`${theme.buttonSecondary} px-6 py-3 rounded-lg`}>
              🤖 Falar com Tomás
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

      {/* Tomás IA do PARCEIRO: conversa com o cérebro daquele parceiro (modo
          público). O companyId é resolvido server-side a partir do slug. */}
      <TomasWidget tenantSlug={slug} partnerName={tenant.name} />
    </div>
  )
}
