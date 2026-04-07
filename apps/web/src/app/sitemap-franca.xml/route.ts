/**
 * Sitemap dedicado para Franca/SP — Máxima prioridade
 * Inclui: 22 bairros × 10 tipos + leilões + guias
 * GET /sitemap-franca.xml
 */
import { NextResponse } from 'next/server'
import { BAIRROS_FRANCA } from '@/data/seo-bairros-franca'

const WEB_URL = 'https://www.agoraencontrei.com.br'

const CLUSTERS = [
  'imoveis-a-venda', 'imoveis-para-alugar', 'casas-a-venda',
  'apartamentos-a-venda', 'terrenos-a-venda', 'leilao-de-imoveis',
  'condominios-fechados', 'imoveis-comerciais', 'chacaras-a-venda',
  'imoveis-para-investir',
]

export async function GET() {
  const now = new Date().toISOString().split('T')[0]
  const urls: string[] = []

  // Hub de Franca
  urls.push(`<url><loc>${WEB_URL}/sp/franca</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`)

  // Bairros de Franca
  for (const bairro of BAIRROS_FRANCA) {
    urls.push(`<url><loc>${WEB_URL}/bairros/franca/${bairro.slug}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.95</priority></url>`)
    // Bairro × cluster
    for (const cluster of CLUSTERS) {
      urls.push(`<url><loc>${WEB_URL}/sp/franca/${cluster}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>`)
    }
  }

  // Páginas estáticas de Franca
  const staticPages = [
    '/casas-a-venda-franca-sp', '/casas-para-alugar-franca-sp',
    '/apartamentos-a-venda-franca-sp', '/apartamentos-para-alugar-franca-sp',
    '/terrenos-a-venda-franca-sp', '/imoveis-comerciais-franca-sp',
    '/chacaras-e-sitios-franca-sp', '/condominio-fechado-franca-sp',
    '/leilao-imoveis-franca-sp', '/investimento-imobiliario-franca-sp',
    '/imoveis-franca-sp', '/imoveis-regiao-franca-sp',
    '/avaliacao-imoveis-franca-sp', '/financiamento-imovel-franca-sp',
  ]
  for (const page of staticPages) {
    urls.push(`<url><loc>${WEB_URL}${page}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>0.95</priority></url>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'text/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
    },
  })
}
