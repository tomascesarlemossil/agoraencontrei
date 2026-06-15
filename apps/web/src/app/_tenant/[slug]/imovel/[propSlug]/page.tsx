/**
 * Página de detalhe de imóvel — site de tenant (parceiro)
 *
 * Acessada via rewrite do middleware:
 *   parceiro.agoraencontrei.com.br/imovel/{slug} → /_tenant/{parceiro}/imovel/{slug}
 */

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { resolveTheme } from '@/lib/site-factory/theme-registry'
import {
  getTenant,
  getTenantProperty,
  propertyPrice,
  typeLabel,
} from '@/lib/tenant/api'
import PropertyGallery from './PropertyGallery'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; propSlug: string }>
}): Promise<Metadata> {
  const { slug, propSlug } = await params
  const property = await getTenantProperty(slug, propSlug)
  if (!property) return { title: 'Imóvel não encontrado' }
  return {
    title: `${property.title} — ${propertyPrice(property)}`,
    description: property.description?.slice(0, 160) ?? property.title,
    openGraph: {
      title: property.title,
      ...(property.coverImage && { images: [property.coverImage] }),
    },
  }
}

export default async function TenantPropertyPage({
  params,
}: {
  params: Promise<{ slug: string; propSlug: string }>
}) {
  const { slug, propSlug } = await params
  const [tenant, property] = await Promise.all([
    getTenant(slug),
    getTenantProperty(slug, propSlug),
  ])

  if (!tenant || !tenant.isActive || !property) {
    notFound()
  }

  const theme = resolveTheme(tenant.layoutType)
  const accentColor = tenant.primaryColor || theme.accentHex
  const s = tenant.settings || {}
  const waNumber: string | undefined = s.whatsapp || (s.phone ? String(s.phone).replace(/\D/g, '') : undefined)
  const waBase = waNumber ? `https://wa.me/${waNumber}` : 'https://wa.me/'
  const waText = encodeURIComponent(
    `Olá, tenho interesse no imóvel "${property.title}" (${property.reference ?? ''}) anunciado no site da ${tenant.name}.`,
  )

  const images = property.images?.length ? property.images : property.coverImage ? [property.coverImage] : []

  const specs: { label: string; value: string }[] = [
    property.bedrooms ? { label: 'Quartos', value: String(property.bedrooms) } : null,
    property.suites ? { label: 'Suítes', value: String(property.suites) } : null,
    property.bathrooms ? { label: 'Banheiros', value: String(property.bathrooms) } : null,
    property.parkingSpaces ? { label: 'Vagas', value: String(property.parkingSpaces) } : null,
    property.totalArea ? { label: 'Área', value: `${property.totalArea} m²` } : null,
    property.floor ? { label: 'Andar', value: String(property.floor) } : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text}`}>
      <style>{`:root{--color-primary:${accentColor};--color-accent:${theme.accentHex}}`}</style>

      {/* Header */}
      <header className={`${theme.headerBg} sticky top-0 z-50`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            {tenant.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tenant.logoUrl} alt={tenant.name} className="h-10 w-auto object-contain" />
            )}
            <span className={`text-xl ${theme.fontHeading} font-bold`} style={{ color: accentColor }}>
              {tenant.name}
            </span>
          </a>
          <a href="/#imoveis" className={`text-sm ${theme.textMuted} hover:opacity-80`}>
            ← Ver todos os imóveis
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Título */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: accentColor, color: '#0a0a0a' }}>
              {typeLabel(property.type)}
            </span>
            {property.reference && (
              <span className={`text-xs ${theme.textMuted}`}>Ref. {property.reference}</span>
            )}
          </div>
          <h1 className={`text-2xl sm:text-3xl ${theme.fontHeading} font-bold`}>{property.title}</h1>
          <p className={`${theme.textMuted} mt-1`}>
            {[property.condoName, property.neighborhood, `${property.city}/${property.state}`].filter(Boolean).join(' • ')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Galeria + conteúdo */}
          <div className="lg:col-span-2 space-y-8">
            <PropertyGallery images={images} title={property.title} accentColor={accentColor} />

            {/* Specs */}
            {specs.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {specs.map(sp => (
                  <div key={sp.label} className={`${theme.card} border rounded-lg p-3 text-center`}>
                    <p className="text-lg font-bold" style={{ color: accentColor }}>{sp.value}</p>
                    <p className={`text-[11px] ${theme.textMuted}`}>{sp.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Descrição */}
            {property.description && (
              <div>
                <h2 className={`text-xl ${theme.fontHeading} font-bold mb-3`}>Descrição</h2>
                <p className={`${theme.textMuted} leading-relaxed whitespace-pre-line`}>{property.description}</p>
              </div>
            )}

            {/* Características */}
            {property.features?.length > 0 && (
              <div>
                <h2 className={`text-xl ${theme.fontHeading} font-bold mb-3`}>Características</h2>
                <div className="flex flex-wrap gap-2">
                  {property.features.map(f => (
                    <span key={f} className={`${theme.buttonSecondary} text-sm px-3 py-1.5 rounded-full`}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar de contato */}
          <aside className="lg:col-span-1">
            <div className={`${theme.card} border rounded-2xl p-6 lg:sticky lg:top-24`}>
              <p className={`text-sm ${theme.textMuted}`}>
                {property.purpose === 'RENT' ? 'Aluguel' : 'Valor de venda'}
              </p>
              <p className="text-3xl font-bold mb-1" style={{ color: accentColor }}>
                {propertyPrice(property)}
              </p>
              {property.condoFee && Number(property.condoFee) > 0 && (
                <p className={`text-xs ${theme.textMuted} mb-4`}>
                  Condomínio: R$ {Number(property.condoFee).toLocaleString('pt-BR')}
                </p>
              )}
              <a
                href={`${waBase}?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-medium w-full"
                style={{ backgroundColor: '#25D366' }}
              >
                Tenho interesse (WhatsApp)
              </a>
              <button className={`${theme.buttonSecondary} mt-3 px-6 py-3 rounded-lg w-full`}>
                Falar com o Tomás (IA)
              </button>
              {(s.agent || s.creci || s.phone) && (
                <div className={`mt-5 pt-5 border-t border-gray-500/20 text-sm ${theme.textMuted}`}>
                  {s.agent && <p className={`font-semibold ${theme.text}`}>{s.agent}</p>}
                  {s.creci && <p className="text-xs">{s.creci}</p>}
                  {s.phone && <p className="text-xs mt-1">{s.phone}</p>}
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className={`${theme.footerBg} py-8 px-4 mt-8`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm opacity-60">
          <p>&copy; {new Date().getFullYear()} {tenant.name}. Todos os direitos reservados.</p>
          <p>
            Powered by <a href="https://www.agoraencontrei.com.br" className="underline">AgoraEncontrei</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
