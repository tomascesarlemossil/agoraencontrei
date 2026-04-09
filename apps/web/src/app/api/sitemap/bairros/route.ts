/**
 * Sitemap paginado — Páginas de bairro
 * /[estado]/[cidade]/bairro/[bairro]
 *
 * GET /api/sitemap/bairros?page=0
 */
import { NextResponse, type NextRequest } from 'next/server'

const WEB_URL = 'https://www.agoraencontrei.com.br'

const BAIRROS_DATA: Array<{ estado: string; cidade: string; bairro: string; priority: number }> = [
  // Franca — prioridade máxima
  ...['centro','jardim-petraglia','residencial-zanetti','city-petropolis','jardim-luiza',
    'parque-dos-lima','vila-santa-cruz','jardim-francano','sao-jose','santa-rita',
    'vila-aparecida','aeroporto','prolongamento-jardim-petraglia','leporace','brasilandia',
    'jardim-palma','vila-chico-julio','miramontes','jardim-eden','cidade-nova',
    'vila-industrial','jardim-california'].map(b => ({ estado: 'sp', cidade: 'franca', bairro: b, priority: 0.9 })),
  // Ribeirão Preto
  ...['jardim-botanico','alto-da-boa-vista','ribeirania','nova-alianca',
    'santa-cruz-do-jose-jacques','centro','campos-eliseos','lagoinha',
    'vila-virginia','ipiranga','jardim-independencia','vila-seixas',
    'jardim-paulista','jardim-macedo','jardim-america','vila-tiberio',
    'sumare','jardim-paulistano','jardim-nova-alianca-sul','quintino-facci-ii'].map(b => ({ estado: 'sp', cidade: 'ribeirao-preto', bairro: b, priority: 0.8 })),
  // São Paulo — top bairros
  ...['pinheiros','vila-mariana','moema','itaim-bibi','jardins','brooklin',
    'perdizes','lapa','santana','tatuape','mooca','vila-madalena',
    'campo-belo','butanta','liberdade','bela-vista','consolacao','higienopolis'].map(b => ({ estado: 'sp', cidade: 'sao-paulo', bairro: b, priority: 0.7 })),
  // Campinas
  ...['cambuí','taquaral','barao-geraldo','sousas','centro','nova-campinas',
    'jardim-chapadao','vila-industrial','guanabara','botafogo'].map(b => ({ estado: 'sp', cidade: 'campinas', bairro: b, priority: 0.6 })),
  // Goiânia
  ...['setor-bueno','setor-marista','jardim-goias','setor-oeste','setor-central',
    'setor-pedro-ludovico','jardim-america','setor-universitario'].map(b => ({ estado: 'go', cidade: 'goiania', bairro: b, priority: 0.6 })),
  // Curitiba
  ...['batel','centro','agua-verde','bigorrilho','centro-civico','ecoville',
    'juveve','alto-da-xv','merces','cabral'].map(b => ({ estado: 'pr', cidade: 'curitiba', bairro: b, priority: 0.6 })),
]

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get('page') || '0')
  const perPage = 50000
  const start = page * perPage
  const slice = BAIRROS_DATA.slice(start, start + perPage)

  const now = new Date().toISOString().split('T')[0]
  const urls = slice.map(b =>
    `<url><loc>${WEB_URL}/${b.estado}/${b.cidade}/bairro/${b.bairro}</loc><lastmod>${now}</lastmod><changefreq>weekly</changefreq><priority>${b.priority}</priority></url>`
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
