import { PrismaClient } from '@prisma/client'
import { BaseScraper, ScrapedAuction } from './base-scraper.js'

/**
 * Scraper da Caixa Econômica Federal — API DIRETA
 *
 * Descoberta: A Caixa tem uma API interna JSON em:
 * https://venda-imoveis.caixa.gov.br/sistema/api/pesquisa-imoveis
 *
 * Esta API aceita POST com { strEstado, tipoBusca: "ESTADO" }
 * e retorna JSON com TODOS os imóveis do estado de uma vez.
 *
 * Isso é 100x mais rápido que raspar HTML e consome zero banda.
 */

// Endpoints reais da Caixa (ASP clássico, form POST)
// Descobertos via engenharia reversa do caixa-auction-api
const CAIXA_CITIES_URL = 'https://venda-imoveis.caixa.gov.br/sistema/carregaListaCidades.asp'
const CAIXA_SEARCH_URL = 'https://venda-imoveis.caixa.gov.br/sistema/carregaPesquisaImoveis.asp'
const CAIXA_DETAIL_URL = 'https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp'
const CAIXA_API_URL = 'https://venda-imoveis.caixa.gov.br/sistema/api/pesquisa-imoveis' // Backup
const CAIXA_CSV_URL = 'https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_{UF}.csv'

// Todos os estados brasileiros
const ESTADOS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN',
  'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
]

function parseCaixaType(tipo?: string): string {
  if (!tipo) return 'HOUSE'
  const t = tipo.toUpperCase()
  if (t.includes('APART')) return 'APARTMENT'
  if (t.includes('TERR')) return 'LAND'
  if (t.includes('SALA') || t.includes('COMERC')) return 'OFFICE'
  if (t.includes('LOJA')) return 'STORE'
  if (t.includes('GALPAO') || t.includes('ARMAZEM')) return 'WAREHOUSE'
  if (t.includes('SITIO') || t.includes('FAZENDA') || t.includes('CHACAR')) return 'FARM'
  return 'HOUSE'
}

function parseCaixaModality(mod?: string): string {
  if (!mod) return 'DIRECT_SALE'
  const m = mod.toUpperCase()
  if (m.includes('LICITACAO') || m.includes('LICITAÇÃO')) return 'DIRECT_SALE'
  if (m.includes('VENDA DIRETA')) return 'DIRECT_SALE'
  if (m.includes('ONLINE')) return 'ONLINE'
  if (m.includes('1') && m.includes('LEIL')) return 'ONLINE'
  if (m.includes('2') && m.includes('LEIL')) return 'ONLINE'
  return 'DIRECT_SALE'
}

function parseOccupation(occ?: string): string {
  if (!occ) return 'DESCONHECIDO'
  const o = occ.toUpperCase()
  if (o.includes('DESOCUP')) return 'DESOCUPADO'
  if (o.includes('OCUP')) return 'OCUPADO'
  return 'DESCONHECIDO'
}

function safeParseFloat(val: any): number | undefined {
  if (val === null || val === undefined || val === '') return undefined
  const str = String(val).replace(/[R$\s.]/g, '').replace(',', '.')
  const num = parseFloat(str)
  return isNaN(num) ? undefined : num
}

function safeParseInt(val: any): number {
  if (val === null || val === undefined || val === '') return 0
  const num = parseInt(String(val))
  return isNaN(num) ? 0 : num
}

function normalizeCsvKey(value: string): string {
  return String(value || '')
    .replace(/^\uFEFF/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[º°]/g, '')
    .toLowerCase()
    .trim()
}

function getCsvValue(row: Record<string, string>, ...names: string[]): string | undefined {
  const normalized: Record<string, string> = {}
  for (const [key, value] of Object.entries(row)) normalized[normalizeCsvKey(key)] = value
  for (const name of names) {
    const value = normalized[normalizeCsvKey(name)]
    if (value !== undefined && value !== '') return value.trim()
  }
  return undefined
}

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    const next = line[i + 1]
    if (ch === '"') {
      if (quoted && next === '"') {
        cur += '"'
        i++
      } else {
        quoted = !quoted
      }
    } else if (ch === ';' && !quoted) {
      out.push(cur.trim())
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur.trim())
  return out
}

function parseCsvRows(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
  const headerIndex = lines.findIndex(line => normalizeCsvKey(line).includes('n do imovel') && normalizeCsvKey(line).includes('cidade'))
  if (headerIndex < 0) return []

  const headers = parseCsvLine(lines[headerIndex])
  const rows: Record<string, string>[] = []
  for (const line of lines.slice(headerIndex + 1)) {
    const values = parseCsvLine(line)
    const row: Record<string, string> = {}
    headers.forEach((header, idx) => { row[header] = values[idx] || '' })
    rows.push(row)
  }
  return rows
}

export class CaixaScraper extends BaseScraper {
  constructor(prisma: PrismaClient) {
    super(prisma, 'CAIXA', 'https://venda-imoveis.caixa.gov.br/')
  }

  async scrape(): Promise<ScrapedAuction[]> {
    const allAuctions: ScrapedAuction[] = []
    const CONCURRENCY = 3 // 3 estados em paralelo para não sobrecarregar a Caixa
    const DELAY_MS = 300  // delay entre lotes

    console.log(`[CaixaScraper] Iniciando varredura paralela (${CONCURRENCY} estados simultâneos)...`)
    const startTime = Date.now()

    // Divide os estados em lotes de CONCURRENCY
    for (let i = 0; i < ESTADOS.length; i += CONCURRENCY) {
      const lote = ESTADOS.slice(i, i + CONCURRENCY)
      const results = await Promise.allSettled(
        lote.map(async (estado) => {
          const items = await this.fetchEstado(estado)
          console.log(`[CaixaScraper] ${estado}: ${items.length} imóveis`)
          return items
        })
      )

      for (const result of results) {
        if (result.status === 'fulfilled') {
          allAuctions.push(...result.value)
        } else {
          console.error(`[CaixaScraper] Lote falhou:`, result.reason?.message)
        }
      }

      // Delay entre lotes para evitar rate limiting
      if (i + CONCURRENCY < ESTADOS.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS))
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[CaixaScraper] Total: ${allAuctions.length} imóveis em ${elapsed}s (paralelo ${CONCURRENCY}x)`)
    return allAuctions
  }

  private async fetchEstado(estado: string): Promise<ScrapedAuction[]> {
    const auctions: ScrapedAuction[] = []

    // Tentar múltiplas abordagens para contornar bloqueio 403
    const approaches = [
      () => this.fetchViaCsv(estado),
      () => this.fetchViaApi(estado),
      () => this.fetchViaAlternateApi(estado),
      () => this.fetchEstadoHtml(estado),
    ]

    for (const approach of approaches) {
      try {
        const result = await approach()
        if (result.length > 0) return result
      } catch {}
    }

    return auctions
  }

  // Abordagem 0: CSV oficial por estado (fonte mais estável da Caixa)
  private async fetchViaCsv(estado: string): Promise<ScrapedAuction[]> {
    const auctions: ScrapedAuction[] = []

    try {
      const response = await fetch(CAIXA_CSV_URL.replace('{UF}', estado), {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 AgoraEncontreiBot',
          'Accept': 'text/csv,text/plain,*/*',
          'Referer': 'https://venda-imoveis.caixa.gov.br/sistema/busca-imovel.asp',
        },
      })

      if (!response.ok) {
        console.warn(`[CaixaScraper] CSV retornou ${response.status} para ${estado}`)
        return auctions
      }

      const buffer = await response.arrayBuffer()
      const text = new TextDecoder('iso-8859-1').decode(buffer)
      const rows = parseCsvRows(text)

      for (const row of rows) {
        try {
          const uf = (getCsvValue(row, 'UF') || estado).toUpperCase()
          if (uf !== estado) continue

          const id = getCsvValue(row, 'N° do imóvel', 'Nº do imóvel', 'N do imóvel')
          const cidade = getCsvValue(row, 'Cidade')
          const bairro = getCsvValue(row, 'Bairro')
          const endereco = getCsvValue(row, 'Endereço', 'Endereco')
          const modalidade = getCsvValue(row, 'Modalidade de venda')
          const tipo = getCsvValue(row, 'Tipo de imóvel', 'Tipo de imovel')
          const descricao = getCsvValue(row, 'Descrição', 'Descricao')
          const valorVenda = safeParseFloat(getCsvValue(row, 'Preço', 'Preco'))
          const valorAvaliacao = safeParseFloat(getCsvValue(row, 'Valor de avaliação', 'Valor de avaliacao'))
          const financiamento = (getCsvValue(row, 'Financiamento') || '').toUpperCase()

          if (!id || !cidade || (!valorVenda && !valorAvaliacao)) continue

          auctions.push({
            externalId: `CAIXA-${id.replace(/\D/g, '') || id}`,
            source: 'CAIXA',
            sourceUrl: `${CAIXA_DETAIL_URL}?hdnimovel=${id.replace(/\D/g, '')}`,
            auctioneerName: 'Caixa Econômica Federal',
            auctioneerUrl: 'https://venda-imoveis.caixa.gov.br',
            title: `${tipo || 'Imóvel Caixa'} em ${cidade}/${estado}${bairro ? ` - ${bairro}` : ''}`,
            description: descricao || endereco || undefined,
            propertyType: parseCaixaType(tipo),
            category: 'RESIDENTIAL',
            status: 'OPEN',
            modality: parseCaixaModality(modalidade),
            street: endereco,
            neighborhood: bairro,
            city: cidade,
            state: estado,
            appraisalValue: valorAvaliacao,
            minimumBid: valorVenda,
            bankName: 'Caixa Econômica Federal',
            financingAvailable: financiamento.includes('SIM'),
            fgtsAllowed: financiamento.includes('SIM'),
            metadata: {
              raw_id: id,
              raw_modalidade: modalidade,
              raw_tipo: tipo,
              source_format: 'caixa_csv',
            },
          })
        } catch {
          // Skip malformed CSV row
        }
      }
    } catch (err: any) {
      console.warn(`[CaixaScraper] CSV falhou para ${estado}: ${err.message}`)
    }

    return auctions
  }

  // Abordagem 1: Endpoints ASP reais da Caixa (form POST)
  // Mesmo método usado pelo LeilãoImóvel e caixa-auction-api
  private async fetchViaApi(estado: string): Promise<ScrapedAuction[]> {
    const browserHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9',
      'Origin': 'https://venda-imoveis.caixa.gov.br',
      'Referer': 'https://venda-imoveis.caixa.gov.br/sistema/busca-imovel.asp',
    }

    // Passo 1: Obter lista de cidades do estado
    try {
      const citiesRes = await fetch(CAIXA_CITIES_URL, {
        method: 'POST',
        headers: { ...browserHeaders, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `cmb_estado=${estado}`,
      })

      if (!citiesRes.ok) {
        console.warn(`[CaixaScraper] Cities endpoint retornou ${citiesRes.status} para ${estado}`)
        return []
      }

      const citiesText = await citiesRes.text()

      // Passo 2: Buscar imóveis do estado inteiro
      const searchRes = await fetch(CAIXA_SEARCH_URL, {
        method: 'POST',
        headers: { ...browserHeaders, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `cmb_estado=${estado}&cmb_cidade=&cmb_tp_imovel=`,
      })

      if (!searchRes.ok) {
        // Tentar o endpoint JSON como fallback
        return this.fetchViaJsonApi(estado)
      }

      const searchText = await searchRes.text()

      // Tentar parsear como JSON (a Caixa pode retornar JSON ou HTML)
      try {
        const data = JSON.parse(searchText)
        return this.parseApiResponse(data, estado)
      } catch {
        // É HTML — parsear como HTML
        return this.parseHtmlResponse(searchText, estado)
      }
    } catch (err: any) {
      console.warn(`[CaixaScraper] Form POST falhou para ${estado}: ${err.message}`)
      return []
    }
  }

  // Abordagem 2: API JSON (backup)
  private async fetchViaJsonApi(estado: string): Promise<ScrapedAuction[]> {
    try {
      const response = await fetch(CAIXA_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Origin': 'https://venda-imoveis.caixa.gov.br',
          'Referer': 'https://venda-imoveis.caixa.gov.br/sistema/busca-imovel.asp',
        },
        body: JSON.stringify({ strEstado: estado, tipoBusca: 'ESTADO' }),
      })

      if (!response.ok) return []
      return this.parseApiResponse(await response.json(), estado)
    } catch {
      return []
    }
  }

  // Parsear resposta HTML da Caixa
  private parseHtmlResponse(html: string, estado: string): ScrapedAuction[] {
    const auctions: ScrapedAuction[] = []
    // Extrair dados de tabelas ou divs de imóveis
    const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || []
    for (const row of rows) {
      try {
        const getText = (pattern: RegExp) => {
          const m = row.match(pattern)
          return m ? m[1].replace(/<[^>]+>/g, '').trim() : undefined
        }
        const title = getText(/<td[^>]*>([\s\S]*?)<\/td>/i)
        if (!title || title.length < 5) continue

        auctions.push({
          externalId: `CAIXA-HTML-${estado}-${auctions.length}`,
          source: 'CAIXA',
          auctioneerName: 'Caixa Econômica Federal',
          title: title.substring(0, 200),
          state: estado,
          status: 'OPEN',
          modality: 'DIRECT_SALE',
        })
      } catch {}
    }
    return auctions
  }

  // Abordagem 3 mantida como fallback
  private async fetchViaAlternateApi(estado: string): Promise<ScrapedAuction[]> {
    return this.fetchViaJsonApi(estado)
  }

  private parseApiResponse(data: any, estado: string): ScrapedAuction[] {
    const auctions: ScrapedAuction[] = []
    const imoveis = data.listaImoveis || data.lista || data.imoveis || data.items || data.data || []

    if (!Array.isArray(imoveis)) return auctions

    for (const imovel of imoveis) {
        try {
          const id = imovel.id || imovel.codigo || imovel.idImovel || `${Date.now()}-${auctions.length}`
          const valorVenda = safeParseFloat(imovel.valor_venda || imovel.valorVenda || imovel.vlrVenda)
          const valorAvaliacao = safeParseFloat(imovel.valor_avaliacao || imovel.valorAvaliacao || imovel.vlrAvaliacao)

          const auction: ScrapedAuction = {
            externalId: `CAIXA-${id}`,
            source: 'CAIXA',
            sourceUrl: `${CAIXA_DETAIL_URL}?idImo=${id}`,
            auctioneerName: 'Caixa Econômica Federal',
            auctioneerUrl: 'https://venda-imoveis.caixa.gov.br',

            title: imovel.nome || imovel.titulo || imovel.descricao || `Imóvel Caixa - ${imovel.cidade || estado}`,
            description: imovel.descricao || imovel.observacao || undefined,
            propertyType: parseCaixaType(imovel.tipo || imovel.tipoImovel),
            category: 'RESIDENTIAL',
            status: 'OPEN',
            modality: parseCaixaModality(imovel.modalidade),

            street: imovel.endereco || imovel.logradouro || undefined,
            number: imovel.numero || undefined,
            neighborhood: imovel.bairro || undefined,
            city: imovel.cidade || imovel.municipio || undefined,
            state: estado,
            zipCode: imovel.cep || undefined,

            totalArea: safeParseFloat(imovel.area || imovel.areaTotal || imovel.areaPrivativa),
            bedrooms: safeParseInt(imovel.quartos || imovel.dormitorios),
            bathrooms: safeParseInt(imovel.banheiros),
            parkingSpaces: safeParseInt(imovel.vagas || imovel.garagem),

            appraisalValue: valorAvaliacao,
            minimumBid: valorVenda,

            occupation: parseOccupation(imovel.ocupacao),
            bankName: 'Caixa Econômica Federal',
            financingAvailable: Boolean(imovel.aceita_financiamento || imovel.financiamento),
            fgtsAllowed: Boolean(imovel.aceita_fgts || imovel.fgts),

            coverImage: imovel.imagem || imovel.foto || imovel.urlImagem || undefined,
            editalUrl: imovel.edital || imovel.urlEdital || undefined,
            registryNumber: imovel.matricula || undefined,

            metadata: {
              raw_id: id,
              raw_modalidade: imovel.modalidade,
              raw_tipo: imovel.tipo || imovel.tipoImovel,
            },
          }

          // Calcular desconto
          if (valorAvaliacao && valorVenda && valorAvaliacao > 0) {
            auction.discountPercent = Number(((valorAvaliacao - valorVenda) / valorAvaliacao * 100).toFixed(1))
          }

          auctions.push(auction)
        } catch {
          // Skip malformed item
        }
    }

    return auctions
  }

  /** Fallback: HTML scraping quando a API JSON não funciona */
  private async fetchEstadoHtml(estado: string): Promise<ScrapedAuction[]> {
    const auctions: ScrapedAuction[] = []

    try {
      const url = `https://venda-imoveis.caixa.gov.br/sistema/busca-imovel.asp?sltTipoBusca=imoveis&sltEstado=${estado}`
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html',
        },
      })

      if (!response.ok) return auctions

      const html = await response.text()

      // Extrair dados básicos do HTML
      const blocks = html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/gi) || []

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i]
        const getText = (pat: RegExp) => {
          const m = block.match(pat)
          return m ? m[1].replace(/<[^>]+>/g, '').trim() : undefined
        }

        const title = getText(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i)
        if (!title || title.length < 5) continue

        auctions.push({
          externalId: `CAIXA-HTML-${estado}-${i}`,
          source: 'CAIXA',
          sourceUrl: url,
          auctioneerName: 'Caixa Econômica Federal',
          title,
          state: estado,
          status: 'OPEN',
          modality: 'DIRECT_SALE',
          bankName: 'Caixa Econômica Federal',
        })
      }
    } catch {
      // Silencioso
    }

    return auctions
  }
}
