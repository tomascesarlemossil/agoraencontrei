/**
 * Tenant Property Detail — página de detalhe do imóvel no site do PARCEIRO.
 *
 * Acessada via subdomínio/domínio próprio: parceiro.agoraencontrei.com.br/imoveis/{slug}
 * → middleware reescreve para /_tenant/{parceiro}/imoveis/{slug}.
 *
 * Consome o endpoint público de detalhe COM tenantSlug (ciente do parceiro), então
 * mostra só imóveis daquele parceiro e nunca dá 404 por resolver a empresa errada.
 * Exibe galeria, descrição completa, características e o CORRETOR RESPONSÁVEL real
 * (nome + CRECI + WhatsApp/telefone vindos do cadastro — genérico p/ qualquer parceiro).
 */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { resolveTheme } from '@/lib/site-factory/theme-registry'
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
  planStatus: string
  isActive: boolean
  settings: { logoWordmarkUrl?: string | null; logoVisible?: boolean; logoShowText?: boolean; [k: string]: any }
}

interface PropertyDetail {
  id: string
  title: string
  slug: string
  description: string | null
  type: string
  purpose: string
  price: number | null
  priceRent: number | null
  condoFee: number | null
  iptu: number | null
  city: string | null
  state: string | null
  neighborhood: string | null
  bedrooms: number | null
  suites: number | null
  bathrooms: number | null
  parkingSpaces: number | null
  totalArea: number | null
  builtArea: number | null
  landArea: number | null
  coverImage: string | null
  images: string[]
  features: string[]
  reference: string | null
  isFeatured: boolean
  isPremium: boolean
  company?: { name: string; phone: string | null; email: string | null; logoUrl: string | null } | null
  user?: { name: string; phone: string | null; email: string | null; avatarUrl: string | null; creciNumber: string | null } | null
}

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

async function getProperty(tenantSlug: string, propertySlug: string): Promise<PropertyDetail | null> {
  // Endpoint ciente do parceiro: escopa ao companyId do tenant (ver resolveScopedCompanyId na API).
  return await fetchJsonRetry(
    `${API_URL}/api/v1/public/properties/${encodeURIComponent(propertySlug)}?tenantSlug=${encodeURIComponent(tenantSlug)}`,
    120,
  )
}

function formatPrice(p: number | null): string {
  if (!p) return 'Consultar'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(p)
}

// WhatsApp do responsável: prioriza o corretor (user.phone), depois a imobiliária
// (company.phone). Retorna só dígitos com DDI 55. Null quando ninguém tem número.
function waNumber(p: PropertyDetail): string | null {
  const raw = p.user?.phone || p.company?.phone || ''
  const digits = String(raw).replace(/\D/g, '')
  if (!digits) return null
  return digits.startsWith('55') ? digits : `55${digits}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; propertySlug: string }>
}): Promise<Metadata> {
  const { slug, propertySlug } = await params
  const [tenant, property] = await Promise.all([getTenant(slug), getProperty(slug, propertySlug)])
  if (!tenant || !property) return { title: 'Imóvel não encontrado' }
  const cover = property.coverImage || property.images?.[0]
  return {
    title: `${property.title} — ${tenant.name}`,
    description: (property.description || '').slice(0, 160) || `${property.title} em ${property.city ?? ''}`,
    openGraph: { title: property.title, ...(cover && { images: [cover] }) },
  }
}

export default async function TenantPropertyPage({
  params,
}: {
  params: Promise<{ slug: string; propertySlug: string }>
}) {
  const { slug, propertySlug } = await params
  const [tenant, property] = await Promise.all([getTenant(slug), getProperty(slug, propertySlug)])

  if (!tenant || !tenant.isActive) notFound()
  if (!property) notFound()

  const theme = resolveTheme(tenant.layoutType)
  const accentColor = tenant.primaryColor || theme.accentHex
  const logoVisible = tenant.settings?.logoVisible !== false
  const logoShowText = tenant.settings?.logoShowText !== false

  const isRent = property.purpose === 'RENT'
  const priceLabel = isRent ? formatPrice(property.priceRent) : formatPrice(property.price)
  const gallery = [property.coverImage, ...(property.images || [])].filter(Boolean) as string[]
  const wa = waNumber(property)
  const brokerName = property.user?.name || property.company?.name || tenant.name
  const waText = encodeURIComponent(`Olá! Tenho interesse no imóvel "${property.title}" (ref. ${property.reference ?? property.slug}) anunciado em ${tenant.name}.`)

  const specs: { label: string; value: string }[] = []
  if (property.bedrooms) specs.push({ label: 'Quartos', value: `${property.bedrooms}` })
  if (property.suites) specs.push({ label: 'Suítes', value: `${property.suites}` })
  if (property.bathrooms) specs.push({ label: 'Banheiros', value: `${property.bathrooms}` })
  if (property.parkingSpaces) specs.push({ label: 'Vagas', value: `${property.parkingSpaces}` })
  if (property.totalArea) specs.push({ label: 'Área total', value: `${property.totalArea} m²` })
  if (property.builtArea) specs.push({ label: 'Área construída', value: `${property.builtArea} m²` })

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text}`}>
      <style>{`:root{--color-primary:${accentColor};}`}</style>

      {/* Header (marca do parceiro) */}
      <header className={`${theme.headerBg} sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
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
          </Link>
          <Link href="/imoveis" className={`text-sm font-semibold`} style={{ color: accentColor }}>
            Ver todos os imóveis →
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <nav className={`text-xs ${theme.textMuted} mb-4`}>
          <Link href="/" className="hover:underline">Início</Link>
          {' / '}
          <Link href="/imoveis" className="hover:underline">Imóveis</Link>
          {' / '}
          <span>{property.title}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coluna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Galeria */}
            <div className={`${theme.card} border rounded-2xl overflow-hidden`}>
              {gallery.length > 0 ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={gallery[0]} alt={property.title} className="w-full h-[280px] sm:h-[420px] object-cover" />
                  {gallery.length > 1 && (
                    <div className="grid grid-cols-4 gap-1 p-1">
                      {gallery.slice(1, 9).map((img, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={img} alt={`${property.title} ${i + 2}`} className="w-full h-20 sm:h-24 object-cover rounded" />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-[280px] flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}0a)` }}>
                  <span className="text-5xl opacity-20">🏠</span>
                </div>
              )}
            </div>

            {/* Título + specs */}
            <div className={`${theme.card} border rounded-2xl p-5`}>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: `${accentColor}22`, color: accentColor }}>
                  {isRent ? 'Aluguel' : property.purpose === 'BOTH' ? 'Venda/Aluguel' : 'Venda'}
                </span>
                {property.isPremium && <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white" style={{ backgroundColor: '#e11d48' }}>🌟 Super Destaque</span>}
                {property.isFeatured && !property.isPremium && <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white" style={{ backgroundColor: accentColor }}>⭐ Destaque</span>}
                {property.reference && <span className={`text-[11px] ${theme.textMuted}`}>Ref. {property.reference}</span>}
              </div>
              <h1 className={`text-xl sm:text-2xl ${theme.fontHeading} font-bold leading-tight`}>{property.title}</h1>
              <p className={`text-sm ${theme.textMuted} mt-1`}>
                {[property.neighborhood, property.city, property.state].filter(Boolean).join(' • ')}
              </p>
              {specs.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-4">
                  {specs.map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-sm font-bold" style={{ color: accentColor }}>{s.value}</p>
                      <p className={`text-[10px] ${theme.textMuted}`}>{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Descrição */}
            {property.description && (
              <div className={`${theme.card} border rounded-2xl p-5`}>
                <h2 className={`text-lg ${theme.fontHeading} font-bold mb-3`}>Descrição</h2>
                <div className={`text-sm leading-relaxed whitespace-pre-line ${theme.textMuted}`}>{property.description}</div>
              </div>
            )}

            {/* Características */}
            {property.features && property.features.length > 0 && (
              <div className={`${theme.card} border rounded-2xl p-5`}>
                <h2 className={`text-lg ${theme.fontHeading} font-bold mb-3`}>Características</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {property.features.map((f, i) => (
                    <span key={i} className={`text-sm ${theme.textMuted} flex items-center gap-1.5`}>
                      <span style={{ color: accentColor }}>✓</span> {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Coluna lateral — preço + corretor */}
          <aside className="space-y-4">
            <div className={`${theme.card} border rounded-2xl p-5 lg:sticky lg:top-24`}>
              <p className={`text-xs ${theme.textMuted}`}>{isRent ? 'Aluguel' : 'Valor'}</p>
              <p className="text-3xl font-bold" style={{ color: accentColor }}>{priceLabel}</p>
              {(property.condoFee || property.iptu) && (
                <div className={`mt-2 text-xs ${theme.textMuted} space-y-0.5`}>
                  {property.condoFee ? <p>Condomínio: {formatPrice(property.condoFee)}</p> : null}
                  {property.iptu ? <p>IPTU: {formatPrice(property.iptu)}</p> : null}
                </div>
              )}

              {/* Corretor responsável */}
              <div className="mt-5 pt-5 border-t border-gray-200/20">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0" style={{ backgroundColor: accentColor }}>
                    {brokerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${theme.text} truncate`}>{brokerName}</p>
                    <p className={`text-xs ${theme.textMuted}`}>
                      Corretor de Imóveis{property.user?.creciNumber ? ` · CRECI ${property.user.creciNumber}` : ''}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {wa ? (
                    <a
                      href={`https://wa.me/${wa}?text=${waText}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-bold text-sm"
                      style={{ backgroundColor: '#25D366' }}
                    >
                      💬 Falar com o Corretor
                    </a>
                  ) : (
                    <a
                      href="#contato"
                      className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm ${theme.buttonPrimary}`}
                    >
                      💬 Tenho interesse
                    </a>
                  )}
                  {wa && (
                    <a
                      href={`tel:+${wa}`}
                      className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-semibold text-sm ${theme.buttonSecondary}`}
                    >
                      📞 Ligar
                    </a>
                  )}
                </div>

                {property.company?.name && (
                  <p className={`mt-4 text-[11px] ${theme.textMuted} text-center`}>
                    Anunciado por {property.company.name}
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className={`${theme.footerBg} py-8 px-4 mt-8`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm opacity-60">
          <p>&copy; {new Date().getFullYear()} {tenant.name}. Todos os direitos reservados.</p>
          <p>Powered by <a href="https://www.agoraencontrei.com.br" className="underline">AgoraEncontrei</a></p>
        </div>
      </footer>

      <TomasWidget tenantSlug={slug} partnerName={tenant.name} />
    </div>
  )
}
