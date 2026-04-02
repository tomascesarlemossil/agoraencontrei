import type { MetadataRoute } from 'next'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/dashboard/', '/api/'] },
      { userAgent: 'Googlebot', allow: '/', disallow: ['/dashboard/'] },
    ],
    sitemap: `${WEB_URL}/sitemap.xml`,
    host: WEB_URL,
  }
}
