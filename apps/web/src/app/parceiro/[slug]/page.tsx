/**
 * Tenant Home Page — Renders a clone site based on subdomain slug
 *
 * Accessed via middleware rewrite: parceiro.agoraencontrei.com.br → /parceiro/lemos
 * Fetches tenant config from API and renders appropriate layout.
 * 
 * v2: Carrega imóveis REAIS do banco de dados (com destaque e super destaque por região)
 */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { resolveTheme, type ThemeConfig } from '@/lib/site-factory/theme-registry'
import TomasWidget from '@/components/tomas/TomasWidget'

// Render ao vivo: evita 404 preso no cache ISR/CDN quando a API tem um blip.
export const dynamic = 'force-dynamic'

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

interface TeamMember {
  id: string
  name: string
  email: string | null
  phone: string | null
  avatarUrl: string | null
  bio: string | null
  role: string
  creciNumber: string | null
}

async function getTenantBySubdomain(slug: string): Promise<TenantData | null> {
  // Retry em falhas de rede (ECONNRESET/TLS do SSR → API): sem isso, um blip de
  // conexão fazia o site do parceiro cair em notFound() (404). 404 real (tenant
  // inexistente) não é retentado — retorna null na hora.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${API_URL}/api/v1/public/tenant/${slug}`, {
        next: { revalidate: 60 },
      })
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`tenant ${slug}: HTTP ${res.status}`)
      const data = await res.json()
      return data.data || null
    } catch {
      if (attempt === 2) return null
      await new Promise(r => setTimeout(r, 200 * (attempt + 1)))
    }
  }
  return null
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

async function getTeam(tenantSlug: string): Promise<TeamMember[]> {
  try {
    const url = `${API_URL}/api/v1/public/team?tenantSlug=${encodeURIComponent(tenantSlug)}`
    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const data = await res.json()
    return Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : [])
  } catch {
    return []
  }
}

function formatPrice(price: number | null, priceRent: number | null, purpose: string): string {
  const p = purpose === 'RENT' ? priceRent : price
  if (!p) return 'Consultar'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(p)
}

// Rótulo de função amigável quando a pessoa ainda não preencheu a bio.
function roleLabel(role: string): string {
  switch (role) {
    case 'BROKER': return 'Corretor(a) de Imóveis'
    case 'ADMIN': return 'Equipe Imobiliária'
    case 'SUPER_ADMIN': return 'Diretoria'
    default: return 'Equipe'
  }
}

// Iniciais para o avatar quando não há foto cadastrada.
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Fallback de foto por nome: reusa as fotos já cadastradas da equipe Lemos
// (mesmas do /corretores). Só é usado quando a pessoa ainda não subiu um
// avatar próprio (avatarUrl vazio) — quando subir, o avatarUrl tem prioridade.
// Chave = primeiro nome normalizado (sem acento, minúsculo).
const PHOTO_BY_FIRST_NAME: Record<string, string> = {
  tomas: '/corretores/tomas.jpg',
  naira: '/corretores/naira-lemos.jpg',
  noemia: '/corretores/noemia-pires.jpg',
  nadia: '/corretores/nadia.png',
  nilton: '/corretores/nilton-lemos.jpg',
  laura: '/corretores/laura.jpg',
  lucas: '/corretores/lucas.jpg',
  loren: '/corretores/lorena.jpg',
  lorena: '/corretores/lorena.jpg',
  miriam: '/corretores/miriam-icon-final.png',
  gabriel: '/corretores/gabriel-icon-v2.jpg',
  geraldo: '/corretores/geraldo.jpg',
}

function normFirst(name: string): string {
  const first = name.trim().split(/\s+/)[0] || ''
  return first.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// Foto a exibir: avatar do cadastro > foto estática por nome > null (iniciais).
function memberPhoto(m: TeamMember): string | null {
  if (m.avatarUrl) return m.avatarUrl
  return PHOTO_BY_FIRST_NAME[normFirst(m.name || '')] ?? null
}

// Dados de contato do parceiro: lê de tenant.settings (address, city, phone,
// hours). Fallback para a Lemos (dados já públicos no site principal) enquanto
// os campos não estão no cadastro do tenant.
interface Contact { address?: string; city?: string; phone?: string; phoneHref?: string; hours?: string; email?: string }
function resolveContact(slug: string, settings: Record<string, any> | undefined): Contact {
  const s = settings || {}
  const c: Contact = {
    address: s.address, city: s.city, phone: s.phone,
    phoneHref: s.phone ? s.phone.replace(/\D/g, '') : undefined,
    hours: s.hours, email: s.email,
  }
  if (!c.address && slug === 'lemos') {
    return {
      address: 'Rua João Ramalho, 1060 — Centro',
      city: 'Franca/SP',
      phone: '(16) 3723-0045',
      phoneHref: '1637230045',
      hours: 'Seg a Sex, 8h30 às 18h · Sáb, 8h30 às 12h',
      email: 'contato@imobiliarialemos.com.br',
    }
  }
  return c
}

// Normaliza telefone BR para link wa.me (só dígitos, com DDI 55).
function waLink(phone: string | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return null
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`
  return `https://wa.me/${withCountry}`
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
  const [tenant, properties, teamRaw] = await Promise.all([
    getTenantBySubdomain(slug),
    getTenantProperties(slug, 9),
    getTeam(slug),
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

  // Parceiros "founder" (ex.: Lemos) adotam a identidade premium do
  // AgoraEncontrei (verde/dourado). Demais parceiros seguem o tema do cadastro.
  const usePremium = slug === 'lemos' || tenant.settings?.brandStyle === 'ae_premium'
  const theme = resolveTheme(usePremium ? 'ae_premium' : tenant.layoutType)
  const accentColor = usePremium ? theme.accentHex : (tenant.primaryColor || theme.accentHex)
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

  // "Nossa Equipe": exclui a conta institucional (usuário com o mesmo nome da
  // empresa, ex.: "Imobiliária Lemos") — ela representa a empresa, não uma
  // pessoa. Gabriel e demais desligados já saem por status !== ACTIVE na API.
  // Normaliza removendo acentos: o nome do usuário e o do tenant podem diferir
  // só na forma Unicode do acento (NFC × NFD), o que quebraria um === simples.
  const nameKey = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase()
  const tenantNameNorm = nameKey(tenant.name)
  const team = teamRaw.filter(m => m.name && nameKey(m.name) !== tenantNameNorm)
  const hasTeam = team.length > 0
  const contact = resolveContact(slug, tenant.settings)

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
          {/* Menu de ferramentas — links internos do parceiro + serviços nacionais (absolutos).
              Header é escuro (verde), então os links usam tom claro para contraste. */}
          <nav className="hidden md:flex items-center gap-5 text-sm text-white/80">
            <a href="/imoveis" className="hover:text-white transition">Imóveis</a>
            <a href="#equipe" className="hover:text-white transition">Equipe</a>
            <a href="#sobre" className="hover:text-white transition">Sobre</a>
            <a href="#contato" className="hover:text-white transition">Contato</a>
            <a href="https://www.agoraencontrei.com.br/avaliacao" className="hover:text-white transition">Avaliação</a>
          </nav>
          <div className="flex items-center gap-2">
            {/* Menu mobile — CSS-only via <details> (sem JS num server component) */}
            <details className="md:hidden relative">
              <summary className="list-none cursor-pointer p-2 rounded-lg text-white/90 hover:bg-white/10 transition select-none [&::-webkit-details-marker]:hidden">
                <span className="text-lg leading-none">☰</span>
              </summary>
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-2xl border py-1 z-50" style={{ backgroundColor: '#0E2A15', borderColor: 'rgba(255,255,255,0.12)' }}>
                {[
                  { href: '/imoveis', label: 'Imóveis' },
                  { href: '#equipe', label: 'Equipe' },
                  { href: '#sobre', label: 'Sobre' },
                  { href: '#contato', label: 'Contato' },
                  { href: 'https://www.agoraencontrei.com.br/avaliacao', label: 'Avaliação' },
                  { href: 'https://www.agoraencontrei.com.br/login', label: '🔐 Área de Acesso' },
                ].map(item => (
                  <a key={item.label} href={item.href} className="block px-4 py-2.5 text-sm text-white/85 hover:bg-white/8 transition">
                    {item.label}
                  </a>
                ))}
              </div>
            </details>
            {/* Área de Acesso (painel/CRM/portal no site principal) */}
            <a
              href="https://www.agoraencontrei.com.br/login"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border border-white/25 text-white/90 hover:bg-white/10 transition"
            >
              🔐 Área de Acesso
            </a>
            {/* Falar com corretor (WhatsApp da imobiliária) */}
            <a
              href={`https://wa.me/${contact.phoneHref ? '55' + contact.phoneHref : ''}?text=${encodeURIComponent(`Olá! Quero saber mais sobre os imóveis de ${tenant.name}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${theme.buttonPrimary}`}
            >
              💬 Falar com corretor
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section — heróis escuros usam texto claro para contraste */}
      <section className={`${theme.hero} py-20 sm:py-28 px-4`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className={`text-3xl sm:text-4xl md:text-5xl ${theme.fontHeading} font-bold mb-6 leading-tight ${['ae_premium', 'luxury_gold', 'bold_agency', 'signature_estate'].includes(theme.key) ? 'text-white' : ''}`}>
            Encontre o imóvel dos seus{' '}
            <span style={{ color: accentColor }}>sonhos</span>
          </h2>
          <p className={`text-base sm:text-lg mb-8 max-w-2xl mx-auto ${['ae_premium', 'luxury_gold', 'bold_agency', 'signature_estate'].includes(theme.key) ? 'text-white/70' : theme.textMuted}`}>
            {theme.key === 'luxury_gold'
              ? 'Imóveis selecionados e oportunidades exclusivas para investidores exigentes.'
              : theme.key === 'landscape_living'
              ? 'Terrenos, chácaras e loteamentos para quem busca qualidade de vida.'
              : theme.key === 'fast_sales_pro'
              ? 'As melhores oportunidades do mercado. Encontre rápido, negocie direto.'
              : 'Navegue por nossa seleção de imóveis. Casas, apartamentos, terrenos e mais.'}
          </p>
          {/* Search Bar — GET form para o catálogo do parceiro (?search=) */}
          <form action="/imoveis" method="get" className="max-w-xl mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                name="search"
                placeholder={theme.key === 'urban_tech' ? 'Casa com piscina em Franca até 500k...' : 'Buscar por bairro, cidade ou tipo...'}
                className={`flex-1 px-4 py-3 rounded-lg border text-gray-900 focus:outline-none focus:ring-2 ${theme.key === 'luxury_gold' ? 'bg-gray-800 text-white border-gray-700 placeholder:text-gray-500' : 'border-gray-300 bg-white'}`}
                style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
              />
              <button
                type="submit"
                className={`${theme.buttonPrimary} px-6 py-3 rounded-lg transition`}
              >
                Buscar
              </button>
            </div>
          </form>
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
          {hasProperties && (() => {
            const statLabel = ['ae_premium', 'luxury_gold', 'bold_agency', 'signature_estate'].includes(theme.key) ? 'text-white/60' : theme.textMuted
            return (
            <div className="flex items-center justify-center gap-6 mt-8 text-xs">
              <div className="text-center">
                <p className={`text-lg font-bold`} style={{ color: accentColor }}>{sortedProperties.length}+</p>
                <p className={`text-[10px] ${statLabel}`}>Imóveis</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold`} style={{ color: accentColor }}>
                  {sortedProperties.filter(p => p.isFeatured || p.isPremium).length}
                </p>
                <p className={`text-[10px] ${statLabel}`}>Destaques</p>
              </div>
              <div className="text-center">
                <p className={`text-lg font-bold`} style={{ color: accentColor }}>24/7</p>
                <p className={`text-[10px] ${statLabel}`}>Atendimento</p>
              </div>
            </div>
            )
          })()}
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
              <a href="/imoveis" className={`hidden sm:inline-flex items-center gap-1 text-sm font-semibold`} style={{ color: accentColor }}>
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
                    {/* CTA → página de detalhe do imóvel no site do parceiro */}
                    <a
                      href={`/imoveis/${property.slug}`}
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

      {/* Nossa Equipe — pessoas reais da imobiliária (fotos e dados do cadastro) */}
      {hasTeam && (
        <section id="equipe" className="py-16 px-4 border-t border-gray-200/10">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h3 className={`text-2xl ${theme.fontHeading} font-bold`}>Nossa Equipe</h3>
              <p className={`text-sm ${theme.textMuted} mt-1`}>
                Atendimento humano e próximo. Conheça quem cuida do seu imóvel.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {team.map(member => {
                const wa = waLink(member.phone)
                const photo = memberPhoto(member)
                // Perfil público do corretor no site principal (lista os imóveis
                // que ele captou/é responsável). Absoluto: no host do parceiro a
                // rota /corretores seria reescrita e não existe.
                const profileHref = `https://www.agoraencontrei.com.br/corretores/${member.id}`
                return (
                  <div key={member.id} className={`${theme.card} border rounded-2xl p-5 flex flex-col items-center text-center`}>
                    {/* Avatar redondo: foto do cadastro > foto estática da equipe > iniciais */}
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo}
                        alt={member.name}
                        className="w-24 h-24 rounded-full object-cover ring-2"
                        style={{ ['--tw-ring-color' as any]: `${accentColor}55` }}
                      />
                    ) : (
                      <div
                        className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold ring-2"
                        style={{ backgroundColor: `${accentColor}18`, color: accentColor, ['--tw-ring-color' as any]: `${accentColor}55` }}
                      >
                        {initials(member.name)}
                      </div>
                    )}
                    <p className={`mt-4 text-sm font-semibold ${theme.text} leading-tight`}>{member.name}</p>
                    <p className={`text-xs ${theme.textMuted} mt-0.5`}>
                      {member.bio?.trim() || roleLabel(member.role)}
                    </p>
                    {member.creciNumber && (
                      <span className="mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${accentColor}18`, color: accentColor }}>
                        CRECI {member.creciNumber}
                      </span>
                    )}
                    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                      {wa && (
                        <a
                          href={`${wa}?text=${encodeURIComponent(`Olá ${member.name.split(' ')[0]}, vi você no site da ${tenant.name} e gostaria de falar sobre imóveis.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                          style={{ backgroundColor: '#25D366' }}
                        >
                          💬 WhatsApp
                        </a>
                      )}
                      <a
                        href={profileHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg ${theme.buttonSecondary}`}
                      >
                        Ver imóveis
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Sobre — apresentação e sinais de confiança da imobiliária */}
      <section id="sobre" className="py-16 px-4 border-t border-gray-200/10">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className={`text-2xl ${theme.fontHeading} font-bold mb-4`}>Sobre a {tenant.name}</h3>
          <p className={`${theme.textMuted} max-w-2xl mx-auto leading-relaxed`}>
            {slug === 'lemos'
              ? 'Referência no mercado imobiliário de Franca e região desde 2002. Especializada em compra, venda e locação de imóveis residenciais e comerciais, com atendimento humano, tecnologia e transparência em cada negociação.'
              : `Atendimento próximo e especializado em compra, venda e locação de imóveis${contact.city ? ` em ${contact.city}` : ''}. Conte com a nossa equipe para encontrar o imóvel ideal com segurança e transparência.`}
          </p>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              slug === 'lemos'
                ? { icon: '🏆', title: 'Desde 2002', desc: '+22 anos de tradição e experiência' }
                : { icon: '🤝', title: 'Confiança', desc: 'Negociações seguras e transparentes' },
              { icon: '👥', title: 'Atendimento humano', desc: 'Uma equipe real cuidando do seu imóvel' },
              { icon: '📍', title: contact.city || 'Franca e região', desc: 'Conhecimento local de verdade' },
            ].map(item => (
              <div key={item.title} className={`${theme.card} border rounded-2xl p-6`}>
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className={`font-bold ${theme.text}`}>{item.title}</p>
                <p className={`text-sm ${theme.textMuted} mt-1`}>{item.desc}</p>
              </div>
            ))}
          </div>
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
              href={`https://wa.me/${contact.phoneHref ? '55' + contact.phoneHref : ''}?text=${encodeURIComponent(`Olá, vi um imóvel no site ${tenant.name} e gostaria de mais informações.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium"
              style={{ backgroundColor: '#25D366' }}
            >
              💬 Falar no WhatsApp
            </a>
            <a href="#imoveis" className={`${theme.buttonSecondary} px-6 py-3 rounded-lg`}>
              🏠 Ver imóveis
            </a>
          </div>

          {/* Endereço, telefone e horário (do cadastro do parceiro) */}
          {(contact.address || contact.phone || contact.hours) && (
            <div className={`mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm ${theme.textMuted}`}>
              {contact.address && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xl">📍</span>
                  <span className={`font-semibold ${theme.text}`}>Endereço</span>
                  <span>{contact.address}{contact.city ? `, ${contact.city}` : ''}</span>
                </div>
              )}
              {contact.phone && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xl">📞</span>
                  <span className={`font-semibold ${theme.text}`}>Telefone</span>
                  <a href={`tel:${contact.phoneHref}`} className="hover:underline">{contact.phone}</a>
                  {contact.email && <a href={`mailto:${contact.email}`} className="hover:underline text-xs">{contact.email}</a>}
                </div>
              )}
              {contact.hours && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xl">🕐</span>
                  <span className={`font-semibold ${theme.text}`}>Atendimento</span>
                  <span>{contact.hours}</span>
                </div>
              )}
            </div>
          )}
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
