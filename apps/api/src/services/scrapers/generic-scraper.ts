import { PrismaClient } from '@prisma/client'
import { BaseScraper, ScrapedAuction } from './base-scraper.js'

/**
 * Scraper genérico para sites de leiloeiros
 *
 * Estratégia:
 * 1. Acessar a página principal do leiloeiro
 * 2. Encontrar links para páginas de leilão/imóvel
 * 3. Parsear cada página individual
 * 4. Normalizar dados para o formato padrão
 *
 * Este scraper é configurável para diferentes padrões HTML
 * através de "templates" que definem seletores CSS/regex
 */

export interface LeiloeirConfig {
  name: string
  baseUrl: string
  listUrl: string
  source: string // Identifier for this auctioneer
  // CSS selectors or regex patterns for data extraction
  selectors: {
    itemList?: string        // Container of auction items
    itemLink?: string        // Link to individual auction page
    title?: string
    price?: string
    appraisal?: string
    address?: string
    neighborhood?: string
    city?: string
    state?: string
    area?: string
    bedrooms?: string
    description?: string
    image?: string
    date?: string
    edital?: string
    processNumber?: string
    modality?: string
  }
  // Additional headers for requests
  headers?: Record<string, string>
  // Pagination
  paginationParam?: string
  maxPages?: number
}

// ── Configurações de leiloeiros conhecidos ──────────────────────────────────

export const LEILOEIROS_CONFIG: LeiloeirConfig[] = [
  {
    name: 'Sodré Santoro',
    baseUrl: 'https://www.sodresantoro.com.br',
    listUrl: 'https://www.sodresantoro.com.br/leiloes',
    source: 'SODRE_SANTORO',
    selectors: {
      itemList: 'div.leilao-card',
      title: 'h3,h2,.titulo',
      price: '.valor,.preco,.lance-minimo',
      image: 'img',
      date: '.data,.data-leilao',
      address: '.endereco,.local',
    },
  },
  {
    name: 'Zukerman Leilões',
    baseUrl: 'https://www.zfranca.com.br',
    listUrl: 'https://www.zfranca.com.br/leiloes',
    source: 'ZUKERMAN',
    selectors: {
      itemList: '.leilao-item,.auction-item',
      title: 'h3,h2,.titulo,.title',
      price: '.valor,.price,.lance',
      image: 'img.foto,img.thumb',
      date: '.data,.date',
    },
  },
  {
    name: 'Frazão Leilões',
    baseUrl: 'https://www.frazaoleiloes.com.br',
    listUrl: 'https://www.frazaoleiloes.com.br/leiloes',
    source: 'FRAZAO',
    selectors: {
      itemList: '.lot-card,.leilao',
      title: '.lot-title,h3',
      price: '.lot-price,.valor',
      image: 'img',
      date: '.lot-date,.data',
    },
  },
  {
    name: 'Lance no Leilão',
    baseUrl: 'https://www.lancenoleilao.com.br',
    listUrl: 'https://www.lancenoleilao.com.br/leiloes/imoveis',
    source: 'LANCE_NO_LEILAO',
    selectors: {
      itemList: '.card-leilao,.lot',
      title: 'h3,h4,.titulo',
      price: '.valor,.lance-minimo',
      image: 'img',
      date: '.data',
    },
  },
  {
    name: 'Mega Leilões',
    baseUrl: 'https://www.megaleiloes.com.br',
    listUrl: 'https://www.megaleiloes.com.br/imoveis',
    source: 'MEGA_LEILOES',
    selectors: {
      itemList: '.product-item,.lote-card',
      title: '.product-name,h3',
      price: '.price,.valor',
      image: 'img.product-image',
      date: '.auction-date,.data',
    },
  },
  {
    name: 'Sold Leilões',
    baseUrl: 'https://www.sold.com.br',
    listUrl: 'https://www.sold.com.br/leiloes?categoria=imoveis',
    source: 'SOLD',
    selectors: {
      itemList: '.card,.auction-card',
      title: '.card-title,h3',
      price: '.card-price,.valor',
      image: 'img',
      date: '.card-date,.data',
    },
  },
  {
    name: 'Vip Leilões',
    baseUrl: 'https://www.vipleiloes.com.br',
    listUrl: 'https://www.vipleiloes.com.br/leiloes',
    source: 'VIP_LEILOES',
    selectors: {
      itemList: '.lot,.leilao-item',
      title: 'h3,.titulo',
      price: '.valor,.price',
      image: 'img',
      date: '.data,.date',
    },
  },
  {
    name: 'Milan Leilões',
    baseUrl: 'https://www.milanleiloes.com.br',
    listUrl: 'https://www.milanleiloes.com.br/leiloes/imoveis',
    source: 'MILAN',
    selectors: {
      itemList: '.card-lote,.lote-card,.auction-item',
      title: 'h3,h2,.titulo,.card-title',
      price: '.valor,.lance-minimo,.price,.card-price',
      appraisal: '.avaliacao,.appraisal,.valor-avaliacao',
      image: 'img.foto,img.thumb,img',
      date: '.data,.date,.data-leilao',
      address: '.endereco,.address,.local',
      area: '.area,.metragem',
      bedrooms: '.quartos,.dormitorios,.bedrooms',
    },
    headers: {
      'Referer': 'https://www.milanleiloes.com.br/',
    },
  },
  {
    name: 'Leilão do Bem',
    baseUrl: 'https://www.leilaodobem.com.br',
    listUrl: 'https://www.leilaodobem.com.br/imoveis',
    source: 'LEILAO_DO_BEM',
    selectors: {
      itemList: '.card,.lote,.produto',
      title: 'h3,h4,.titulo,.nome',
      price: '.preco,.valor,.lance',
      image: 'img',
      date: '.data,.encerramento',
      address: '.local,.endereco',
    },
  },
  {
    name: 'Biasi Leilões',
    baseUrl: 'https://www.biasileiloes.com.br',
    listUrl: 'https://www.biasileiloes.com.br/leiloes',
    source: 'BIASI',
    selectors: {
      itemList: '.leilao-card,.item-leilao',
      title: 'h3,.titulo',
      price: '.valor,.lance-minimo',
      image: 'img',
      date: '.data',
      address: '.endereco',
    },
  },
]

// ── Bancos com venda direta ──────────────────────────────────────────────────

export const BANCOS_CONFIG: LeiloeirConfig[] = [
  {
    name: 'Banco do Brasil - Venda de Imóveis',
    baseUrl: 'https://www.licitacoes-e.com.br',
    listUrl: 'https://www.licitacoes-e.com.br/aop/pesquisar/detalhes/imoveis',
    source: 'BANCO_DO_BRASIL',
    selectors: {
      itemList: '.item-licitacao,.card',
      title: '.titulo,h3',
      price: '.valor-referencia,.preco',
      date: '.data-inicio,.data',
    },
  },
  {
    name: 'Bradesco - Imóveis à Venda',
    baseUrl: 'https://banco.bradesco/html/classic/produtos-servicos/leilao-imoveis.shtm',
    listUrl: 'https://banco.bradesco/html/classic/produtos-servicos/leilao-imoveis.shtm',
    source: 'BRADESCO',
    selectors: {
      itemList: '.imovel-card,.item',
      title: '.titulo,h3',
      price: '.valor,.preco',
    },
  },
  {
    name: 'Itaú - Imóveis',
    baseUrl: 'https://www.itau.com.br/imoveis-a-venda',
    listUrl: 'https://www.itau.com.br/imoveis-a-venda',
    source: 'ITAU',
    selectors: {
      itemList: '.card-imovel,.property',
      title: '.title,h3',
      price: '.price,.valor',
    },
  },
  {
    name: 'Santander - Imóveis',
    baseUrl: 'https://www.santanderimoveis.com.br',
    listUrl: 'https://www.santanderimoveis.com.br/busca',
    source: 'SANTANDER',
    selectors: {
      itemList: '.card,.imovel',
      title: '.titulo,h3',
      price: '.valor,.preco',
    },
  },
]

function parseValue(value?: string): number | undefined {
  if (!value) return undefined
  const clean = value.replace(/[R$\s.]/g, '').replace(',', '.')
  const num = parseFloat(clean)
  return isNaN(num) ? undefined : num
}

function parseDate(dateStr?: string): Date | undefined {
  if (!dateStr) return undefined
  const parts = dateStr.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{4})/)
  if (parts) {
    return new Date(`${parts[3]}-${parts[2]}-${parts[1]}T12:00:00Z`)
  }
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? undefined : d
}

function extractText(html: string, selector: string): string | undefined {
  // Simple extraction by tag or class
  const patterns = selector.split(',').map(s => s.trim())
  for (const pat of patterns) {
    let regex: RegExp
    if (pat.startsWith('.')) {
      // Class selector
      const cls = pat.substring(1)
      regex = new RegExp(`<[^>]*class="[^"]*${cls}[^"]*"[^>]*>([\\s\\S]*?)<\\/`, 'i')
    } else {
      // Tag selector
      regex = new RegExp(`<${pat}[^>]*>([\\s\\S]*?)<\\/${pat}>`, 'i')
    }
    const match = html.match(regex)
    if (match) return match[1].replace(/<[^>]+>/g, '').trim()
  }
  return undefined
}

function extractLink(html: string, selector: string): string | undefined {
  const patterns = selector.split(',').map(s => s.trim())
  for (const pat of patterns) {
    let regex: RegExp
    if (pat.startsWith('.')) {
      const cls = pat.substring(1)
      regex = new RegExp(`<[^>]*class="[^"]*${cls}[^"]*"[^>]*src="([^"]+)"`, 'i')
    } else {
      regex = new RegExp(`<${pat}[^>]*src="([^"]+)"`, 'i')
    }
    const match = html.match(regex)
    if (match) return match[1]
  }
  return undefined
}

export class GenericLeiloeiroScraper extends BaseScraper {
  private config: LeiloeirConfig

  // Pool de User-Agents para rotação anti-bloqueio (stealth mode)
  private static readonly UA_POOL = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Mobile/15E148 Safari/604.1',
  ]

  private getStealthHeaders(): Record<string, string> {
    const ua = GenericLeiloeiroScraper.UA_POOL[Math.floor(Math.random() * GenericLeiloeiroScraper.UA_POOL.length)]
    return {
      'User-Agent': ua,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0',
      ...this.config.headers,
    }
  }

  private async stealthDelay(min = 800, max = 3000): Promise<void> {
    const ms = min + Math.random() * (max - min)
    await new Promise(r => setTimeout(r, ms))
  }

  constructor(prisma: PrismaClient, config: LeiloeirConfig) {
    super(prisma, config.source, config.listUrl)
    this.config = config
  }

  async scrape(): Promise<ScrapedAuction[]> {
    const auctions: ScrapedAuction[] = []

    try {
      await this.stealthDelay(500, 2000) // delay inicial anti-bot
      const response = await fetch(this.config.listUrl, {
        headers: this.getStealthHeaders(),
      })

      if (!response.ok) {
        console.warn(`[GenericScraper] ${this.config.name}: HTTP ${response.status}`)
        return auctions
      }

      const html = await response.text()

      // Tentar dividir em blocos de itens
      const sel = this.config.selectors
      if (sel.itemList) {
        const patterns = sel.itemList.split(',').map(s => s.trim())
        for (const pat of patterns) {
          const cls = pat.startsWith('.') ? pat.substring(1) : pat
          const blockRegex = new RegExp(
            `<div[^>]*class="[^"]*${cls}[^"]*"[^>]*>[\\s\\S]*?<\\/div>\\s*(?:<\\/div>)?`,
            'gi'
          )
          const blocks = html.match(blockRegex) || []

          for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i]
            try {
              const title = sel.title ? extractText(block, sel.title) : undefined
              if (!title || title.length < 3) continue

              const item: ScrapedAuction = {
                externalId: `${this.config.source}-${i}-${Date.now().toString(36)}`,
                source: this.config.source,
                sourceUrl: this.config.listUrl,
                auctioneerName: this.config.name,
                auctioneerUrl: this.config.baseUrl,
                title,
                description: sel.description ? extractText(block, sel.description) : undefined,
                city: sel.city ? extractText(block, sel.city) : undefined,
                state: sel.state ? extractText(block, sel.state) : undefined,
                neighborhood: sel.neighborhood ? extractText(block, sel.neighborhood) : undefined,
                status: 'UPCOMING',
                modality: 'ONLINE',
              }

              if (sel.price) {
                const priceText = extractText(block, sel.price)
                item.minimumBid = parseValue(priceText)
              }
              if (sel.appraisal) {
                const apprText = extractText(block, sel.appraisal)
                item.appraisalValue = parseValue(apprText)
              }
              if (sel.area) {
                const areaText = extractText(block, sel.area)
                if (areaText) item.totalArea = parseFloat(areaText.replace(',', '.'))
              }
              if (sel.bedrooms) {
                const bedrText = extractText(block, sel.bedrooms)
                if (bedrText) item.bedrooms = parseInt(bedrText)
              }
              if (sel.date) {
                const dateText = extractText(block, sel.date)
                item.auctionDate = parseDate(dateText)
              }
              if (sel.image) {
                item.coverImage = extractLink(block, sel.image)
                if (item.coverImage && !item.coverImage.startsWith('http')) {
                  item.coverImage = `${this.config.baseUrl}${item.coverImage}`
                }
              }

              // Extrair endereço se disponível
              if (sel.address) {
                const addr = extractText(block, sel.address)
                if (addr) {
                  item.street = addr
                  // Tentar extrair cidade/estado do endereço
                  const cityMatch = addr.match(/[-–]\s*([^-–,]+?)\s*[-–\/]\s*([A-Z]{2})\s*$/i)
                  if (cityMatch) {
                    item.city = cityMatch[1].trim()
                    item.state = cityMatch[2].trim().toUpperCase()
                  }
                }
              }

              auctions.push(item)
            } catch { /* skip malformed block */ }
          }

          if (auctions.length > 0) break // Found items with this pattern
        }
      }
    } catch (err: any) {
      console.error(`[GenericScraper] ${this.config.name} error: ${err.message}`)
    }

    return auctions
  }
}
