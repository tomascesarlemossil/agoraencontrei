/**
 * Sitemap paginado — Imóveis individuais (do banco de dados)
 *
 * GET /api/sitemap/properties?page=0
 *
 * Cada página suporta até 50.000 URLs (limite Google).
 * Para 1M+ imóveis, o sitemap index gera múltiplas páginas.
 */
import { NextResponse, type NextRequest } from 'next/server'

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get('page') || '0')
  const perPage = 50000

  try {
    // Fetch property slugs from API
    const res = await fetch(
      `${API_URL}/api/v1/public/properties?page=${page + 1}&perPage=${perPage}&fields=slug,updatedAt,purpose,type,city&status=ACTIVE`,
      { next: { revalidate: 3600 } },
    )

    let properties: Array<{ slug: string; updatedAt?: string; purpose?: string; type?: string; city?: string }> = []

    if (res.ok) {
      const data = await res.json()
      properties = (data.data || data.properties || []).filter((p: any) => p.slug)
    }

    const now = new Date().toISOString().split('T')[0]
    const urls = properties.map(p => {
      const lastmod = p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : now
      return `<url><loc>${WEB_URL}/imoveis/${p.slug}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
    }).join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'text/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    })
  } catch {
    // Return empty sitemap on error
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`,
      { headers: { 'Content-Type': 'text/xml' } },
    )
  }
}
