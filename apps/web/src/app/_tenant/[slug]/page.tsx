/**
 * Tenant Home Page — Renders a clone site based on subdomain slug
 *
 * Accessed via middleware rewrite: parceiro.agoraencontrei.com.br → /_tenant/parceiro
 * Fetches tenant config from API and renders appropriate layout.
 */

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

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

// Layout themes based on tenant configuration
const LAYOUT_THEMES = {
  luxury: {
    bg: 'bg-gray-950',
    text: 'text-white',
    accent: 'text-amber-400',
    card: 'bg-gray-900 border-gray-800',
    hero: 'bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800',
  },
  clean: {
    bg: 'bg-white',
    text: 'text-gray-900',
    accent: 'text-blue-600',
    card: 'bg-white border-gray-200 shadow-sm',
    hero: 'bg-gradient-to-br from-blue-50 via-white to-blue-50',
  },
  social: {
    bg: 'bg-gray-50',
    text: 'text-gray-900',
    accent: 'text-purple-600',
    card: 'bg-white border-gray-100 shadow-md rounded-2xl',
    hero: 'bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50',
  },
  marketplace: {
    bg: 'bg-gray-100',
    text: 'text-gray-900',
    accent: 'text-green-600',
    card: 'bg-white border-gray-200 shadow',
    hero: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50',
  },
} as const

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

  const theme = LAYOUT_THEMES[tenant.layoutType as keyof typeof LAYOUT_THEMES] || LAYOUT_THEMES.clean

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text}`}>
      {/* Header */}
      <header className="border-b border-gray-200/10 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logoUrl && (
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="h-10 w-auto object-contain"
              />
            )}
            <h1 className="text-xl font-bold" style={{ color: tenant.primaryColor }}>
              {tenant.name}
            </h1>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#imoveis" className="hover:opacity-80 transition">Imóveis</a>
            <a href="#sobre" className="hover:opacity-80 transition">Sobre</a>
            <a href="#contato" className="hover:opacity-80 transition">Contato</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`${theme.hero} py-20 px-4`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Encontre o imóvel dos seus{' '}
            <span style={{ color: tenant.primaryColor }}>sonhos</span>
          </h2>
          <p className="text-lg opacity-80 mb-8 max-w-2xl mx-auto">
            Navegue por nossa seleção de imóveis disponíveis. Casas, apartamentos, terrenos e muito mais.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar por bairro, cidade ou tipo..."
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': tenant.primaryColor } as any}
              />
              <button
                className="px-6 py-3 rounded-lg text-white font-medium transition hover:opacity-90"
                style={{ backgroundColor: tenant.primaryColor }}
              >
                Buscar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Properties Section */}
      <section id="imoveis" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-2xl font-bold mb-8 text-center">
            Imóveis em Destaque
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Properties will be loaded dynamically via client component */}
            <div className={`${theme.card} border rounded-lg p-6 text-center`}>
              <p className="text-gray-500">Carregando imóveis...</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contato" className="py-16 px-4 border-t">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">Entre em Contato</h3>
          <p className="opacity-70 mb-8">
            Tem interesse em algum imóvel? Fale conosco!
          </p>
          <a
            href={`https://wa.me/?text=Olá, vi um imóvel no site ${tenant.name} e gostaria de mais informações.`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium"
            style={{ backgroundColor: '#25D366' }}
          >
            Falar no WhatsApp
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
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
