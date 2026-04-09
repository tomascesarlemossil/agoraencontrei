/**
 * Sitemap dinâmico paginado para comparações cidade vs cidade
 * GET /api/sitemap/comparacoes?page=0
 * Cada página contém até 50.000 URLs
 *
 * Potencial: 152 cidades × 151 / 2 = 11.476 comparações (data layer)
 * Expandido: 500 cidades × 499 / 2 = 124.750 comparações (ISR)
 */
import { NextRequest, NextResponse } from 'next/server'
import { IBGE_CITIES_152 } from '@/data/seo-ibge-cities-expanded'

const WEB_URL = 'https://www.agoraencontrei.com.br'
const MAX_PER_PAGE = 50000

export async function GET(request: NextRequest) {
  const page = parseInt(request.nextUrl.searchParams.get('page') || '0', 10)
  const now = new Date().toISOString().split('T')[0]

  // Gerar todas as combinações de comparação
  const cities = IBGE_CITIES_152.sort((a, b) => b.populacao - a.populacao)
  const allUrls: string[] = []

  for (let i = 0; i < cities.length; i++) {
    for (let j = i + 1; j < cities.length; j++) {
      allUrls.push(
        `<url><loc>${WEB_URL}/comparar/${cities[i].slug}-vs-${cities[j].slug}</loc><lastmod>${now}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`
      )
    }
  }

  // Paginar
  const start = page * MAX_PER_PAGE
  const slice = allUrls.slice(start, start + MAX_PER_PAGE)

  if (slice.length === 0) {
    return new NextResponse('Not found', { status: 404 })
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${slice.join('\n')}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'text/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
    },
  })
}
