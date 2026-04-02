import type { MetadataRoute } from 'next'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'
const COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID ?? ''

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticPages: MetadataRoute.Sitemap = [
    { url: WEB_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${WEB_URL}/imoveis`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${WEB_URL}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${WEB_URL}/contato`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ]

  // Property pages
  let propertyPages: MetadataRoute.Sitemap = []
  try {
    const res = await fetch(`${API_URL}/api/v1/public/properties?limit=1000&page=1`)
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

  // Blog pages
  let blogPages: MetadataRoute.Sitemap = []
  try {
    const qs = new URLSearchParams({ limit: '500', ...(COMPANY_ID && { companyId: COMPANY_ID }) })
    const res = await fetch(`${API_URL}/api/v1/blog?${qs}`)
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

  return [...staticPages, ...propertyPages, ...blogPages]
}
