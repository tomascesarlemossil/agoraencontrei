import type { MetadataRoute } from 'next'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // Allow '/api/sitemap/' explicitly so crawlers can read the paginated
        // sub-sitemaps (cidades, bairros, leilões, comparações) referenced by
        // /sitemap-index.xml — longest-match wins over the '/api/' disallow.
        allow: ['/', '/api/sitemap/'],
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
        allow: ['/', '/api/sitemap/'],
        disallow: ['/dashboard/', '/api/', '/login', '/register', '/portal/', '/admin/', '/meu-painel'],
      },
      {
        userAgent: 'Bingbot',
        allow: ['/', '/api/sitemap/'],
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
      // Índice-mestre: aponta para todos os sub-sitemaps
      // (core fatiado em /sitemap/{id}.xml + cidades, bairros, comparações,
      // leilões paginados) — descoberta completa.
      `${WEB_URL}/sitemap-index.xml`,
      // Sitemap dedicado de Franca (máxima prioridade)
      `${WEB_URL}/sitemap-franca.xml`,
      `${WEB_URL}/api/sitemap/blog`,
    ],
    host: WEB_URL,
  }
}
