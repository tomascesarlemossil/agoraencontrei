/**
 * Sitemap dinâmico paginado para cidades
 * GET /api/sitemap/cidades?page=0
 * Cada página contém até 50.000 URLs
 */
import { NextRequest, NextResponse } from 'next/server'
import { IBGE_CITIES_152 } from '@/data/seo-ibge-cities-expanded'
import { UNIQUE_CITIES } from '@/data/seo-cities'

const WEB_URL = 'https://www.agoraencontrei.com.br'
const MAX_PER_PAGE = 50000

const CLUSTERS = [
  'imoveis-a-venda', 'imoveis-para-alugar', 'casas-a-venda', 'casas-para-alugar',
  'apartamentos-a-venda', 'apartamentos-para-alugar', 'terrenos-a-venda',
  'condominios-fechados', 'lancamentos-imobiliarios', 'imoveis-comerciais',
  'imoveis-para-investir', 'leilao-de-imoveis', 'chacaras-a-venda',
  'sitios-a-venda', 'loteamentos', 'imoveis-rurais',
  'avaliacao-de-imovel', 'anunciar-imovel',
]

export async function GET(request: NextRequest) {
  const page = parseInt(request.nextUrl.searchParams.get('page') || '0', 10)
  const now = new Date().toISOString().split('T')[0]

  // Gerar todas as URLs cidade × cluster
  const allUrls: string[] = []

  for (const city of IBGE_CITIES_152) {
    // Hub da cidade
    allUrls.push(`<url><loc>${WEB_URL}/${city.stateSlug}/${city.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.85</priority></url>`)
    // Clusters
    for (const cluster of CLUSTERS) {
      allUrls.push(`<url><loc>${WEB_URL}/${city.stateSlug}/${city.slug}/${cluster}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`)
    }
  }

  // Adicionar UNIQUE_CITIES que não estão nas 152
  const ibgeSlugs = new Set(IBGE_CITIES_152.map(c => c.slug))
  for (const city of UNIQUE_CITIES) {
    if (ibgeSlugs.has(city.slug)) continue
    allUrls.push(`<url><loc>${WEB_URL}/imoveis-a-venda/${city.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`)
    allUrls.push(`<url><loc>${WEB_URL}/imoveis-para-alugar/${city.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`)
    allUrls.push(`<url><loc>${WEB_URL}/leilao-imoveis-em/${city.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`)
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
