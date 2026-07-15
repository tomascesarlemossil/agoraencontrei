/**
 * Sitemap paginado das páginas individuais de leilão.
 * Inclui ativos e históricos: o dossiê continua útil depois do encerramento.
 */
import { NextResponse, type NextRequest } from 'next/server'

const WEB_URL = 'https://www.agoraencontrei.com.br'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.agoraencontrei.com.br'
const URLS_PER_PAGE = 50000

type SitemapAuction = { slug: string; updatedAt: string; status: string }
const ACTIVE = new Set(['OPEN', 'UPCOMING', 'FIRST_ROUND', 'SECOND_ROUND'])

export async function GET(req: NextRequest) {
  const page = Math.max(0, Number.parseInt(req.nextUrl.searchParams.get('page') || '0', 10))
  let rows: SitemapAuction[] = []

  try {
    const response = await fetch(
      `${API_URL}/api/v1/auctions/sitemap?page=${page + 1}&limit=${URLS_PER_PAGE}`,
      // A resposta pode ultrapassar o limite de 2 MB do Data Cache do Next.js.
      // O XML final continua cacheado na CDN pelo cabeçalho abaixo.
      { cache: 'no-store' },
    )
    if (response.ok) rows = (await response.json()).data || []
  } catch {
    // Resposta vazia temporária; o cache/CDN tenta novamente na revalidação.
  }

  const urls = rows.map(item => {
    const active = ACTIVE.has(item.status)
    return `<url><loc>${WEB_URL}/leiloes/${encodeURIComponent(item.slug)}</loc><lastmod>${new Date(item.updatedAt).toISOString()}</lastmod><changefreq>${active ? 'daily' : 'monthly'}</changefreq><priority>${active ? '0.9' : '0.6'}</priority></url>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
