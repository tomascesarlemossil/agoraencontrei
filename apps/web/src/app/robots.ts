import type { MetadataRoute } from 'next'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/login',
          '/register',
          '/portal/',
          '/_next/',
          '/admin/',
          '/meu-painel',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/login', '/register', '/portal/', '/admin/', '/meu-painel'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/dashboard/', '/api/', '/login', '/register', '/portal/', '/admin/', '/meu-painel'],
      },
      // Block known bad bots / scrapers
      { userAgent: 'AhrefsBot', disallow: '/' },
      { userAgent: 'SemrushBot', disallow: '/' },
      { userAgent: 'MJ12bot', disallow: '/' },
      { userAgent: 'DotBot', disallow: '/' },
      { userAgent: 'BLEXBot', disallow: '/' },
      { userAgent: 'DataForSeoBot', disallow: '/' },
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'ClaudeBot', disallow: '/' },
      { userAgent: 'anthropic-ai', disallow: '/' },
      { userAgent: 'Bytespider', disallow: '/' },
    ],
    sitemap: [
      `${WEB_URL}/sitemap.xml`,
      `${WEB_URL}/api/sitemap/blog`,
    ],
    host: WEB_URL,
  }
}
