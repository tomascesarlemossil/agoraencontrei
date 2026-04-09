/**
 * Sitemap Index dinâmico — suporta 1M+ URLs
 * Aponta para sub-sitemaps paginados por família:
 *   - sitemap-franca.xml (bairros + leilões locais) — prioridade máxima
 *   - sitemap-cidades-[page].xml (5.570 cidades × clusters)
 *   - sitemap-comparacoes-[page].xml (matriz de comparação)
 *
 * GET /sitemap-index.xml
 */
import { NextResponse } from 'next/server'

const WEB_URL = 'https://www.agoraencontrei.com.br'

// Estimativas de URLs por família
const CIDADES_TOTAL = 5570 * 22 // 5.570 cidades × 22 clusters
const COMPARACOES_TOTAL = 499500 // 1.000 cidades top × combinações
const LEILAO_PAGES_TOTAL = 5570 * 27 // 5.570 cidades × 27 estados
const BAIRROS_TOTAL = 45000 // Estimativa de bairros com dados
const URLS_PER_SITEMAP = 50000

export async function GET() {
  const now = new Date().toISOString().split('T')[0]
  const sitemaps: string[] = []

  // 1. Sitemap dedicado de Franca (máxima prioridade)
  sitemaps.push(`<sitemap><loc>${WEB_URL}/sitemap-franca.xml</loc><lastmod>${now}</lastmod></sitemap>`)

  // 2. Sitemap core (páginas estáticas, blog, etc.)
  sitemaps.push(`<sitemap><loc>${WEB_URL}/sitemap.xml</loc><lastmod>${now}</lastmod></sitemap>`)

  // 3. Sitemaps de cidades (paginados)
  const cidadePages = Math.ceil(CIDADES_TOTAL / URLS_PER_SITEMAP)
  for (let i = 0; i < cidadePages; i++) {
    sitemaps.push(`<sitemap><loc>${WEB_URL}/api/sitemap/cidades?page=${i}</loc><lastmod>${now}</lastmod></sitemap>`)
  }

  // 4. Sitemaps de comparações (paginados)
  const compPages = Math.ceil(COMPARACOES_TOTAL / URLS_PER_SITEMAP)
  for (let i = 0; i < compPages; i++) {
    sitemaps.push(`<sitemap><loc>${WEB_URL}/api/sitemap/comparacoes?page=${i}</loc><lastmod>${now}</lastmod></sitemap>`)
  }

  // 5. Sitemaps de leilões por cidade (paginados) — /leilao/[estado]/[cidade]
  const leilaoPages = Math.ceil(LEILAO_PAGES_TOTAL / URLS_PER_SITEMAP)
  for (let i = 0; i < leilaoPages; i++) {
    sitemaps.push(`<sitemap><loc>${WEB_URL}/api/sitemap/leiloes?page=${i}</loc><lastmod>${now}</lastmod></sitemap>`)
  }

  // 6. Sitemaps de bairros (paginados) — /[estado]/[cidade]/bairro/[bairro]
  const bairroPages = Math.ceil(BAIRROS_TOTAL / URLS_PER_SITEMAP)
  for (let i = 0; i < bairroPages; i++) {
    sitemaps.push(`<sitemap><loc>${WEB_URL}/api/sitemap/bairros?page=${i}</loc><lastmod>${now}</lastmod></sitemap>`)
  }

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
