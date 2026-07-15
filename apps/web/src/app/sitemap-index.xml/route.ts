/**
 * Sitemap Index dinâmico — suporta 1M+ URLs
 * Aponta para sub-sitemaps por família:
 *   - sitemap-franca.xml (bairros + leilões locais) — prioridade máxima
 *   - sitemap/{id}.xml   (core + landings + cidades×termos + rotas IBGE, fatiado)
 *   - api/sitemap/cidades|comparacoes|leiloes|bairros?page=N (paginados)
 *
 * GET /sitemap-index.xml
 */
import { NextResponse } from 'next/server'
import { sitemapChunkCount } from '@/lib/sitemap-entries'
import { IBGE_CITIES_152 } from '@/data/seo-ibge-cities-expanded'
import { UNIQUE_CITIES } from '@/data/seo-cities'

const WEB_URL = 'https://www.agoraencontrei.com.br'

// Contagens reais das fontes usadas pelos handlers. As estimativas antigas
// anunciavam sub-sitemaps inexistentes, que respondiam 404 ao Googlebot.
const CITY_CLUSTERS = 18
const ibgeCitySlugs = new Set(IBGE_CITIES_152.map(city => city.slug))
const extraCities = UNIQUE_CITIES.filter(city => !ibgeCitySlugs.has(city.slug)).length
const CIDADES_TOTAL = IBGE_CITIES_152.length * (1 + CITY_CLUSTERS) + extraCities * 3
const COMPARACOES_TOTAL = IBGE_CITIES_152.length * (IBGE_CITIES_152.length - 1) / 2
const URLS_PER_SITEMAP = 50000

export async function GET() {
  const now = new Date().toISOString().split('T')[0]
  const sitemaps: string[] = []

  // 1. Sitemap dedicado de Franca (máxima prioridade)
  sitemaps.push(`<sitemap><loc>${WEB_URL}/sitemap-franca.xml</loc><lastmod>${now}</lastmod></sitemap>`)

  // 2. Sitemap core, fatiado pelo Next (generateSitemaps → /sitemap/{id}.xml).
  //    Contagem BARATA (sem fetch) — idêntica à usada por generateSitemaps,
  //    então o índice responde instantâneo e nunca estoura o tempo do Googlebot.
  const coreChunks = sitemapChunkCount()
  for (let i = 0; i < coreChunks; i++) {
    sitemaps.push(`<sitemap><loc>${WEB_URL}/sitemap/${i}.xml</loc><lastmod>${now}</lastmod></sitemap>`)
  }

  // 3. Sitemaps de cidades (paginados)
  const cidadePages = Math.ceil(CIDADES_TOTAL / URLS_PER_SITEMAP)
  for (let i = 0; i < cidadePages; i++) {
    sitemaps.push(`<sitemap><loc>${WEB_URL}/sitemaps/cidades?page=${i}</loc><lastmod>${now}</lastmod></sitemap>`)
  }

  // 4. Sitemaps de comparações (paginados)
  const compPages = Math.ceil(COMPARACOES_TOTAL / URLS_PER_SITEMAP)
  for (let i = 0; i < compPages; i++) {
    sitemaps.push(`<sitemap><loc>${WEB_URL}/sitemaps/comparacoes?page=${i}</loc><lastmod>${now}</lastmod></sitemap>`)
  }

  // 5. Sitemaps de leilões por cidade (paginados) — /leilao/[estado]/[cidade]
  // O endpoint consulta a API em tempo real e o inventário atual cabe em um
  // arquivo. Páginas extras vazias não devem ser anunciadas no índice.
  sitemaps.push(`<sitemap><loc>${WEB_URL}/sitemaps/leiloes?page=0</loc><lastmod>${now}</lastmod></sitemap>`)

  // 6. Sitemaps de bairros (paginados) — /[estado]/[cidade]/bairro/[bairro]
  sitemaps.push(`<sitemap><loc>${WEB_URL}/sitemaps/bairros?page=0</loc><lastmod>${now}</lastmod></sitemap>`)

  // 7. Blog
  sitemaps.push(`<sitemap><loc>${WEB_URL}/sitemaps/blog</loc><lastmod>${now}</lastmod></sitemap>`)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.join('\n')}
</sitemapindex>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'text/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
    },
  })
}
