/**
 * API Route — Proxy para CSV da Caixa
 * Roda no Vercel (servidores no Brasil) para evitar geo-bloqueio
 * GET /api/caixa-csv?state=SP
 */
import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const revalidate = 21600 // 6h cache

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get('state') || 'SP'

  try {
    const csvUrl = `https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_${state.toUpperCase()}.csv`
    const response = await fetch(csvUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://venda-imoveis.caixa.gov.br/',
        'Accept': 'text/csv,text/plain,*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(45000),
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'CAIXA_UNAVAILABLE', status: response.status }, { status: 502 })
    }

    const buffer = await response.arrayBuffer()
    const csvText = new TextDecoder('latin1').decode(buffer)
    const lines = csvText.split('\n').slice(2)

    const auctions: Array<Record<string, unknown>> = []

    for (const line of lines) {
      if (!line.trim()) continue
      const cols = line.split(';')
      if (cols.length < 11) continue

      const id = (cols[0] ?? '').trim()
      if (!id) continue

      const city = (cols[2] ?? '').trim()
      const neighborhood = (cols[3] ?? '').trim()
      const address = (cols[4] ?? '').trim()
      const price = parseFloat(((cols[5] ?? '0').replace(/\./g, '').replace(',', '.').trim())) || 0
      const appraisalValue = parseFloat(((cols[6] ?? '0').replace(/\./g, '').replace(',', '.').trim())) || 0
      const discount = parseFloat(((cols[7] ?? '0').replace(',', '.').trim())) || 0
      const financeable = (cols[8] ?? '').trim().toLowerCase() === 'sim'
      const description = (cols[9] ?? '').trim()
      const saleType = (cols[10] ?? '').trim()
      const link = (cols[11] ?? '').trim()

      const d = description.toLowerCase()
      let propertyType = 'Imóvel'
      if (d.includes('apartamento')) propertyType = 'Apartamento'
      else if (d.includes('casa')) propertyType = 'Casa'
      else if (d.includes('terreno') || d.includes('lote')) propertyType = 'Terreno'
      else if (d.includes('galpao') || d.includes('galp')) propertyType = 'Galpão'

      const bedroomsMatch = description.match(/(\d+)\s*qto/i)
      const totalAreaMatch = description.match(/([\d,.]+)\s*de\s*área\s*total/i)
      const privateAreaMatch = description.match(/([\d,.]+)\s*de\s*área\s*privativa/i)
      const landAreaMatch = description.match(/([\d,.]+)\s*de\s*área\s*do\s*terreno/i)
      const parkingMatch = description.match(/(\d+)\s*vaga/i)

      auctions.push({
        id: `caixa-${id}`,
        source: 'CAIXA',
        bankName: 'Caixa Econômica Federal',
        city,
        state: state.toUpperCase(),
        neighborhood,
        address,
        price,
        appraisalValue,
        discount,
        financeable,
        fgtsAllowed: d.includes('fgts'),
        description,
        saleType,
        link,
        propertyType,
        bedrooms: bedroomsMatch ? parseInt(bedroomsMatch[1]) : 0,
        totalArea: totalAreaMatch ? parseFloat(totalAreaMatch[1].replace(',', '.')) : 0,
        privateArea: privateAreaMatch ? parseFloat(privateAreaMatch[1].replace(',', '.')) : 0,
        landArea: landAreaMatch ? parseFloat(landAreaMatch[1].replace(',', '.')) : 0,
        parkingSpots: parkingMatch ? parseInt(parkingMatch[1]) : 0,
        coverImageUrl: `https://venda-imoveis.caixa.gov.br/fotos-imoveis/${id}_1.jpg`,
        auctionDate: null,
        leiloeiro: 'Caixa Econômica Federal',
      })
    }

    // Sort: Franca first
    auctions.sort((a, b) => {
      const cA = (a.city as string || '').toUpperCase()
      const cB = (b.city as string || '').toUpperCase()
      if (cA.includes('FRANCA') && !cB.includes('FRANCA')) return -1
      if (!cA.includes('FRANCA') && cB.includes('FRANCA')) return 1
      return ((b.discount as number) || 0) - ((a.discount as number) || 0)
    })

    return NextResponse.json({
      total: auctions.length,
      updatedAt: new Date().toISOString(),
      source: 'caixa-csv-vercel',
      state: state.toUpperCase(),
      items: auctions,
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=43200' },
    })
  } catch (err) {
    return NextResponse.json({ error: 'FETCH_ERROR', message: String(err) }, { status: 500 })
  }
}
