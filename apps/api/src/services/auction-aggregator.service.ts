/**
 * Serviço de Agregação de Leilões Multi-Fonte
 *
 * Fontes suportadas:
 * 1. Caixa Econômica Federal — CSV público por estado
 * 2. Banco do Brasil — API de licitações de imóveis
 * 3. Leiloeiros oficiais — scraping autorizado
 *
 * O agregador busca todas as fontes em paralelo, normaliza os dados
 * e retorna uma lista unificada ordenada por desconto.
 */

const CAIXA_BASE = 'https://venda-imoveis.caixa.gov.br/listaweb'
const BB_BASE = 'https://licitacoes-imoveis.bb.com.br'
const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

export interface AuctionItem {
  id: string
  source: 'CAIXA' | 'BANCO_DO_BRASIL' | 'BRADESCO' | 'SANTANDER' | 'ITAU' | 'LEILOEIRO'
  bankName: string
  city: string
  state: string
  neighborhood: string
  address: string
  price: number
  appraisalValue: number
  discount: number
  financeable: boolean
  fgtsAllowed: boolean
  description: string
  saleType: string
  link: string
  propertyType: string
  bedrooms: number
  totalArea: number
  privateArea: number
  landArea: number
  parkingSpots: number
  coverImageUrl: string | null
  auctionDate: string | null
  leiloeiro: string | null
}

// ── CAIXA ECONÔMICA FEDERAL ──────────────────────────────────────────────

function parseCaixaCSV(csvText: string, uf: string): AuctionItem[] {
  const items: AuctionItem[] = []
  const lines = csvText.split('\n').slice(2)

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
    const fgtsMatch = description.match(/fgts/i)

    items.push({
      id: `caixa-${id}`,
      source: 'CAIXA',
      bankName: 'Caixa Econômica Federal',
      city, state: uf, neighborhood, address,
      price, appraisalValue, discount, financeable,
      fgtsAllowed: !!fgtsMatch,
      description, saleType, link, propertyType,
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

  return items
}

export async function fetchCaixaNacional(): Promise<AuctionItem[]> {
  const allItems: AuctionItem[] = []

  // Buscar em batches de 5 estados
  for (let i = 0; i < UFS.length; i += 5) {
    const batch = UFS.slice(i, i + 5)
    const results = await Promise.allSettled(
      batch.map(async (uf) => {
        try {
          const res = await fetch(`${CAIXA_BASE}/Lista_imoveis_${uf}.csv`, {
            headers: FETCH_HEADERS,
            signal: AbortSignal.timeout(15000),
          })
          if (!res.ok) return []
          const buffer = await res.arrayBuffer()
          const csvText = new TextDecoder('latin1').decode(buffer)
          return parseCaixaCSV(csvText, uf)
        } catch { return [] }
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value)
      }
    }
  }

  return allItems
}

// ── BANCO DO BRASIL ──────────────────────────────────────────────────────

export async function fetchBancoDoBrasil(): Promise<AuctionItem[]> {
  // O BB não tem CSV público como a Caixa
  // A fonte é: https://licitacoes-imoveis.bb.com.br/
  // Precisa de scraping da página HTML ou acesso à API interna
  // Por enquanto, retornamos vazio — será implementado com Playwright/Puppeteer
  return []
}

// ── AGREGADOR PRINCIPAL ──────────────────────────────────────────────────

export interface AggregatedResult {
  total: number
  updatedAt: string
  sources: string[]
  states: string[]
  items: AuctionItem[]
}

export async function fetchAllAuctions(): Promise<AggregatedResult> {
  // Buscar todas as fontes em paralelo
  const [caixaItems, bbItems] = await Promise.all([
    fetchCaixaNacional(),
    fetchBancoDoBrasil(),
  ])

  const allItems = [...caixaItems, ...bbItems]

  // Ordenar por desconto (maior primeiro)
  allItems.sort((a, b) => b.discount - a.discount)

  // Extrair estados e fontes únicas
  const states = [...new Set(allItems.map(i => i.state))].sort()
  const sources = [...new Set(allItems.map(i => i.bankName))]

  return {
    total: allItems.length,
    updatedAt: new Date().toISOString(),
    sources,
    states,
    items: allItems,
  }
}

// ── LEILOEIROS (Estrutura preparada para expansão) ───────────────────────

export const LEILOEIROS_OFICIAIS = [
  { slug: 'mega-leiloes', name: 'Mega Leilões', url: 'https://www.megaleiloes.com.br', tipo: 'judicial' },
  { slug: 'e-leiloes-market', name: 'E-Leilões Market', url: 'https://www.eleiloesmarket.com.br', tipo: 'judicial' },
  { slug: 'lance-no-leilao', name: 'Lance no Leilão', url: 'https://www.lancenoleilao.com.br', tipo: 'judicial' },
  { slug: 'agostinho-leiloes', name: 'Agostinho Leilões', url: 'https://www.agostinholeiloes.com.br', tipo: 'judicial' },
  { slug: 'rodolfo-schontag', name: 'Rodolfo Schontag', url: 'https://www.schontag.com.br', tipo: 'judicial' },
  { slug: 'luis-leiloeiro', name: 'Luis Leiloeiro', url: 'https://www.luisleiloeiro.com.br', tipo: 'judicial' },
  { slug: 'trileiloes', name: 'TriLeilões', url: 'https://www.trileiloes.com.br', tipo: 'judicial' },
  { slug: 'freitas-leiloes', name: 'Freitas Leilões', url: 'https://www.freitasleiloes.com.br', tipo: 'judicial' },
  { slug: 'alberto-macedo', name: 'Alberto Macedo', url: 'https://www.albertomacedo.com.br', tipo: 'judicial' },
]

export const BANCOS_FONTE = [
  { slug: 'caixa', name: 'Caixa Econômica Federal', url: 'https://venda-imoveis.caixa.gov.br', status: 'ativo' },
  { slug: 'banco-do-brasil', name: 'Banco do Brasil', url: 'https://licitacoes-imoveis.bb.com.br', status: 'pendente' },
  { slug: 'bradesco', name: 'Bradesco', url: 'https://www.bradescoimoveis.com.br', status: 'pendente' },
  { slug: 'santander', name: 'Santander', url: 'https://www.santanderimoveis.com.br', status: 'pendente' },
  { slug: 'itau', name: 'Itaú Unibanco', url: 'https://www.itau.com.br/imoveis', status: 'pendente' },
  { slug: 'btg-pactual', name: 'BTG Pactual', url: 'https://www.btgpactual.com', status: 'pendente' },
  { slug: 'brb', name: 'Banco BRB', url: 'https://www.brb.com.br', status: 'pendente' },
]
