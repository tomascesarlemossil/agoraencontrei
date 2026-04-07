import type { FastifyInstance } from 'fastify'
import { calculateDealScore } from '../../services/market-intelligence.service.js'

// ── In-memory cache helpers (reuse from parent if available) ──────────────────
const _memCache = new Map<string, { value: unknown; expiresAt: number }>()

function memCacheGet(key: string): unknown | null {
  const entry = _memCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { _memCache.delete(key); return null }
  return entry.value
}

function memCacheSet(key: string, value: unknown, ttlSeconds: number): void {
  _memCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
}

async function cacheGet(redis: FastifyInstance['redis'], key: string): Promise<unknown | null> {
  if (redis) {
    try {
      const raw = await redis.get(key)
      if (raw) return JSON.parse(raw)
    } catch { /* fall through */ }
  }
  return memCacheGet(key)
}

async function cacheSet(redis: FastifyInstance['redis'], key: string, value: unknown, ttl = 600): Promise<void> {
  if (redis) {
    try { await redis.setex(key, ttl, JSON.stringify(value)) } catch { /* ignore */ }
  }
  memCacheSet(key, value, ttl)
}

// ── Cidades alvo: Franca e região ─────────────────────────────────────────────
const TARGET_CITIES = [
  'FRANCA', 'BATATAIS', 'CRISTAIS PAULISTA', 'PATROCINIO PAULISTA',
  'ITIRAPUA', 'RESTINGA', 'JERIQUARA', 'PEDREGULHO', 'ALTINOPOLIS',
  'BRODOWSKI', 'NUPORANGA', 'SALES OLIVEIRA', 'CLARAVAL', 'RIFAINA',
  'IBIRACI', 'CAPETINGA', 'ITAMOGI', 'PASSOS',
]

interface AuctionItem {
  id: string
  city: string
  neighborhood: string
  address: string
  price: number
  appraisalValue: number
  discount: number
  financeable: boolean
  description: string
  saleType: string
  link: string
  propertyType: string
  bedrooms: number
  totalArea: number
  privateArea: number
  landArea: number
  parkingSpots: number
}

function parsePropertyType(description: string): string {
  const d = description.toLowerCase()
  if (d.includes('apartamento')) return 'Apartamento'
  if (d.includes('casa')) return 'Casa'
  if (d.includes('terreno') || d.includes('lote')) return 'Terreno'
  if (d.includes('galpao') || d.includes('galp')) return 'Galpão'
  if (d.includes('predio') || d.includes('pr')) return 'Prédio'
  if (d.includes('sitio') || d.includes('s')) return 'Sítio'
  if (d.includes('fazenda')) return 'Fazenda'
  if (d.includes('chacara') || d.includes('ch')) return 'Chácara'
  return 'Imóvel'
}

function parseNumber(s: string): number {
  return parseFloat(s.replace(/\./g, '').replace(',', '.').trim()) || 0
}

function parseAreaFromDesc(description: string, keyword: string): number {
  // Match pattern like "72.62 de área total"
  const re = new RegExp('([\\d,.]+)\\s*de\\s*' + keyword, 'i')
  const m = description.match(re)
  return m ? parseFloat(m[1].replace(',', '.')) : 0
}

export async function auctionsRoute(app: FastifyInstance) {
  app.get('/auctions', async (_req, reply) => {
    try {
      const cacheKey = 'pub:caixa:auctions:SP:v3'
      const cached = await cacheGet(app.redis, cacheKey)
      if (cached) return reply.send(cached)

      // Download CSV from Caixa
      const csvUrl = 'https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_SP.csv'
      const response = await fetch(csvUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://venda-imoveis.caixa.gov.br/',
          'Accept': 'text/csv,*/*',
        },
        signal: AbortSignal.timeout(25000),
      })

      if (!response.ok) {
        app.log.warn({ status: response.status }, '[auctions] Caixa returned non-OK status')
        return reply.status(502).send({ error: 'CAIXA_UNAVAILABLE', status: response.status })
      }

      // Decode latin1 -> utf8
      const buffer = await response.arrayBuffer()
      const decoder = new TextDecoder('latin1')
      const csvText = decoder.decode(buffer)

      // Parse CSV (skip 2 header lines)
      const lines = csvText.split('\n').slice(2)
      const auctions: AuctionItem[] = []

      for (const line of lines) {
        if (!line.trim()) continue
        const cols = line.split(';')
        if (cols.length < 11) continue

        const cityRaw = (cols[2] ?? '').trim().toUpperCase()
        if (!TARGET_CITIES.some(c => cityRaw.includes(c))) continue

        const id = (cols[0] ?? '').trim()
        const city = (cols[2] ?? '').trim()
        const neighborhood = (cols[3] ?? '').trim()
        const address = (cols[4] ?? '').trim()
        const price = parseNumber(cols[5] ?? '0')
        const appraisalValue = parseNumber(cols[6] ?? '0')
        const discount = parseFloat(((cols[7] ?? '0').replace(',', '.').trim())) || 0
        const financeable = (cols[8] ?? '').trim().toLowerCase() === 'sim'
        const description = (cols[9] ?? '').trim()
        const saleType = (cols[10] ?? '').trim()
        const link = (cols[11] ?? '').trim()

        const propertyType = parsePropertyType(description)
        const bedroomsMatch = description.match(/(\d+)\s*qto/i)
        const bedrooms = bedroomsMatch ? parseInt(bedroomsMatch[1]) : 0
        const totalArea = parseAreaFromDesc(description, 'área\\s*total')
        const privateArea = parseAreaFromDesc(description, 'área\\s*privativa')
        const landArea = parseAreaFromDesc(description, 'área\\s*do\\s*terreno')
        const parkingMatch = description.match(/(\d+)\s*vaga/i)
        const parkingSpots = parkingMatch ? parseInt(parkingMatch[1]) : 0

        const dealScore = calculateDealScore({
          precoVenda: price,
          precoAvaliacao: appraisalValue,
          area: privateArea || totalArea || undefined,
          bairro: neighborhood,
          cidade: city,
          uf: 'SP',
          modalidade: saleType,
        })

        auctions.push({
          id, city, neighborhood, address,
          price, appraisalValue, discount, financeable,
          description, saleType, link, propertyType,
          bedrooms, totalArea, privateArea, landArea, parkingSpots,
          dealScore,
        } as AuctionItem & { dealScore: typeof dealScore })
      }

      // Sort by discount descending
      auctions.sort((a, b) => b.discount - a.discount)

      const result = {
        total: auctions.length,
        updatedAt: new Date().toISOString(),
        items: auctions,
      }

      // Cache for 6 hours
      await cacheSet(app.redis, cacheKey, result, 21600)
      return reply.send(result)
    } catch (err) {
      app.log.error({ err }, '[auctions] Error fetching Caixa auctions')
      return reply.status(500).send({ error: 'INTERNAL_ERROR' })
    }
  })
}
