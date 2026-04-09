/**
 * Sitemap paginado — Páginas de leilão por cidade
 * /leilao/[estado]/[cidade]
 *
 * GET /api/sitemap/leiloes?page=0
 * Cada página contém até 50.000 URLs
 */
import { NextResponse, type NextRequest } from 'next/server'

const WEB_URL = 'https://www.agoraencontrei.com.br'
const URLS_PER_PAGE = 50000

// Top 27 estados × cidades de cada estado
const ESTADOS_UF = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

// Pre-computed city slugs for sitemap (top cities per state)
async function getCitySlugs(): Promise<Array<{ estado: string; cidade: string; priority: number }>> {
  try {
    // Try to import all cities data
    const { IBGE_ALL_CITIES } = await import('@/data/seo-ibge-all-cities')
    if (IBGE_ALL_CITIES?.length) {
      return IBGE_ALL_CITIES.map((c: any) => ({
        estado: (c.estado || c.state || 'sp').toLowerCase(),
        cidade: (c.slug || c.cidade || '').toLowerCase().replace(/\s+/g, '-'),
        priority: c.populacao > 500000 ? 0.9 : c.populacao > 100000 ? 0.7 : 0.5,
      })).filter((c: any) => c.cidade)
    }
  } catch { /* fallback */ }

  // Fallback: top cities only
  const topCities = [
    { estado: 'sp', cidade: 'franca', priority: 1.0 },
    { estado: 'sp', cidade: 'ribeirao-preto', priority: 0.9 },
    { estado: 'sp', cidade: 'sao-paulo', priority: 0.9 },
    { estado: 'sp', cidade: 'campinas', priority: 0.9 },
    { estado: 'sp', cidade: 'santos', priority: 0.8 },
    { estado: 'sp', cidade: 'sao-jose-dos-campos', priority: 0.8 },
    { estado: 'sp', cidade: 'praia-grande', priority: 0.7 },
    { estado: 'go', cidade: 'goiania', priority: 0.8 },
    { estado: 'pr', cidade: 'curitiba', priority: 0.8 },
    { estado: 'mg', cidade: 'belo-horizonte', priority: 0.8 },
    { estado: 'rj', cidade: 'rio-de-janeiro', priority: 0.9 },
    { estado: 'ba', cidade: 'salvador', priority: 0.8 },
    { estado: 'df', cidade: 'brasilia', priority: 0.8 },
    { estado: 'ce', cidade: 'fortaleza', priority: 0.7 },
    { estado: 'pe', cidade: 'recife', priority: 0.7 },
    { estado: 'rs', cidade: 'porto-alegre', priority: 0.7 },
    { estado: 'sc', cidade: 'florianopolis', priority: 0.7 },
    { estado: 'pa', cidade: 'belem', priority: 0.6 },
    { estado: 'am', cidade: 'manaus', priority: 0.6 },
    { estado: 'ma', cidade: 'sao-luis', priority: 0.6 },
  ]
  return topCities
}

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get('page') || '0')
  const cities = await getCitySlugs()

  const start = page * URLS_PER_PAGE
  const slice = cities.slice(start, start + URLS_PER_PAGE)

  if (slice.length === 0) {
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  const now = new Date().toISOString().split('T')[0]
  const urls = slice.map(c =>
    `<url><loc>${WEB_URL}/leilao/${c.estado}/${c.cidade}</loc><lastmod>${now}</lastmod><changefreq>daily</changefreq><priority>${c.priority}</priority></url>`
  ).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'text/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
    },
  })
}
