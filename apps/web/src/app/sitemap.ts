import type { MetadataRoute } from 'next'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// Cidades atendidas
const CIDADES = [
  'franca', 'rifaina', 'cristais-paulista', 'patrocinio-paulista',
  'ribeirao-preto', 'pedregulho', 'itirapua', 'delfinopolis',
  'capitolio', 'cassia', 'ibiraci', 'capetinga', 'sacramento', 'restinga',
]

function cityToSlug(city: string): string {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Páginas estáticas principais
  const staticPages: MetadataRoute.Sitemap = [
    { url: WEB_URL,                          lastModified: now, changeFrequency: 'daily',   priority: 1.0 },
    { url: `${WEB_URL}/imoveis`,             lastModified: now, changeFrequency: 'hourly',  priority: 0.95 },
    { url: `${WEB_URL}/blog`,                lastModified: now, changeFrequency: 'daily',   priority: 0.8 },
    { url: `${WEB_URL}/corretores`,          lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${WEB_URL}/avaliacao`,           lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${WEB_URL}/anunciar`,            lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${WEB_URL}/financiamentos`,      lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${WEB_URL}/servicos/2via-boleto`,            lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${WEB_URL}/servicos/extrato-proprietario`,   lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${WEB_URL}/servicos/fichas-cadastrais`,      lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  // Páginas de cidades
  const cityPages: MetadataRoute.Sitemap = CIDADES.map(cidade => ({
    url: `${WEB_URL}/imoveis/em/${cidade}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }))

  // Páginas de imóveis individuais
  let propertyPages: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/api/v1/public/properties?limit=1000&page=1`, {
      next: { revalidate: 3600 },
    })
    if (res.ok) {
      const data = await res.json()
      propertyPages = (data.data ?? []).map((p: any) => ({
        url: `${WEB_URL}/imoveis/${p.slug}`,
        lastModified: new Date(p.updatedAt ?? now),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    }
  } catch { /* ignore */ }

  // Páginas de bairros (busca bairros únicos do banco)
  let neighborhoodPages: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/api/v1/public/properties?limit=500&city=Franca&status=ACTIVE`, {
      next: { revalidate: 3600 },
    })
    if (res.ok) {
      const data = await res.json()
      const neighborhoods = new Set<string>()
      ;(data.data ?? []).forEach((p: any) => {
        if (p.neighborhood) neighborhoods.add(p.neighborhood.trim())
      })
      neighborhoodPages = Array.from(neighborhoods).map(bairro => ({
        url: `${WEB_URL}/imoveis/em/franca/${cityToSlug(bairro)}`,
        lastModified: now,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }))
    }
  } catch { /* ignore */ }

  // Blog
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/api/v1/blog?limit=500`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const data = await res.json()
      blogPages = (data.data ?? []).map((p: any) => ({
        url: `${WEB_URL}/blog/${p.slug}`,
        lastModified: new Date(p.publishedAt ?? p.createdAt ?? now),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
    }
  } catch { /* ignore */ }

  return [
    ...staticPages,
    ...cityPages,
    ...neighborhoodPages,
    ...propertyPages,
    ...blogPages,
  ]
}
