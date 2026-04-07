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

const CAIXA_API_URL = 'https://venda-imoveis.caixa.gov.br/sistema/api/pesquisa-imoveis'
const CAIXA_DETAIL_URL = 'https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp'

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

export class CaixaScraper extends BaseScraper {
  constructor(prisma: PrismaClient) {
    super(prisma, 'CAIXA', 'https://venda-imoveis.caixa.gov.br/')
  }

  async scrape(): Promise<ScrapedAuction[]> {
    const allAuctions: ScrapedAuction[] = []

    for (const estado of ESTADOS) {
      try {
        console.log(`[CaixaScraper] Varrendo ${estado}...`)
        const items = await this.fetchEstado(estado)
        allAuctions.push(...items)
        console.log(`[CaixaScraper] ${estado}: ${items.length} imóveis`)

        // Rate limit entre estados: 500ms
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (err: any) {
        console.error(`[CaixaScraper] Erro ${estado}: ${err.message}`)
      }
    }

    console.log(`[CaixaScraper] Total: ${allAuctions.length} imóveis em todos os estados`)
    return allAuctions
  }

  private async fetchEstado(estado: string): Promise<ScrapedAuction[]> {
    const auctions: ScrapedAuction[] = []

    // Tentar múltiplas abordagens para contornar bloqueio 403
    const approaches = [
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

  // Abordagem 1: API principal com headers stealth
  private async fetchViaApi(estado: string): Promise<ScrapedAuction[]> {
    // Primeiro, obter um cookie de sessão visitando a página principal
    let sessionCookie = ''
    try {
      const homeRes = await fetch('https://venda-imoveis.caixa.gov.br/sistema/busca-imovel.asp', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
      })
      sessionCookie = homeRes.headers.get('set-cookie') || ''
    } catch {}

    const response = await fetch(CAIXA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Origin': 'https://venda-imoveis.caixa.gov.br',
        'Referer': 'https://venda-imoveis.caixa.gov.br/sistema/busca-imovel.asp',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        ...(sessionCookie && { 'Cookie': sessionCookie }),
      },
      body: JSON.stringify({
        strEstado: estado,
        tipoBusca: 'ESTADO',
      }),
    })

    if (!response.ok) {
      console.warn(`[CaixaScraper] API retornou ${response.status} para ${estado}, tentando fallback...`)
      return []
    }

    return this.parseApiResponse(await response.json(), estado)
  }

  // Abordagem 2: URL alternativa da Caixa (endpoint diferente)
  private async fetchViaAlternateApi(estado: string): Promise<ScrapedAuction[]> {
    // Tentar URLs alternativas que a Caixa pode ter
    const altUrls = [
      `https://venda-imoveis.caixa.gov.br/sistema/api/consulta.asp?estado=${estado}`,
      `https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp?sltEstado=${estado}`,
    ]

    for (const url of altUrls) {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/json,*/*',
            'Referer': 'https://venda-imoveis.caixa.gov.br/',
          },
        })
        if (res.ok) {
          const text = await res.text()
          try {
            const data = JSON.parse(text)
            const result = this.parseApiResponse(data, estado)
            if (result.length > 0) return result
          } catch {
            // Não é JSON, pode ser HTML
          }
        }
      } catch {}
    }

    return []
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
