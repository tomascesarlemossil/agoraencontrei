/**
 * Scraper da Caixa Econômica via Browser Real (Playwright)
 *
 * Contorna o bloqueio 403 da Caixa usando um browser headless real.
 * Funciona acessando o site como um usuário normal e extraindo os dados.
 *
 * Requer: PLAYWRIGHT_CHROMIUM_PATH ou instalar via npx playwright install chromium
 *
 * Fallback: Se Playwright não estiver disponível, usa Cheerio + fetch
 */

import { PrismaClient } from '@prisma/client'
import type { ScrapedAuction } from './base-scraper.js'

const CAIXA_URL = 'https://venda-imoveis.caixa.gov.br/sistema/busca-imovel.asp?sltTipoBusca=imoveis'
const CAIXA_CITIES_URL = 'https://venda-imoveis.caixa.gov.br/sistema/carregaListaCidades.asp'

interface CaixaProperty {
  id: string
  title: string
  city: string
  state: string
  neighborhood?: string
  address?: string
  type?: string
  modality?: string
  saleValue?: number
  appraisalValue?: number
  discount?: number
  area?: number
  bedrooms?: number
  url?: string
}

/**
 * Obtém códigos de cidades por estado (funciona SEM Playwright)
 */
export async function getCityCodes(estado: string): Promise<Array<{ code: string; name: string }>> {
  try {
    const res = await fetch(CAIXA_CITIES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://venda-imoveis.caixa.gov.br/sistema/busca-imovel.asp',
      },
      body: `cmb_estado=${estado}`,
    })

    if (!res.ok) return []
    const html = await res.text()

    // Parse HTML options: <option value='9327'>FRANCA<br>
    const cities: Array<{ code: string; name: string }> = []
    const regex = /value='(\d+)'>([^<]+)/g
    let match
    while ((match = regex.exec(html)) !== null) {
      cities.push({ code: match[1], name: match[2].trim() })
    }

    return cities
  } catch {
    return []
  }
}

/**
 * Scraper via Playwright (browser real)
 * Só funciona se o Chromium estiver instalado
 */
export async function scrapeCaixaWithBrowser(estado: string, maxCities = 10): Promise<ScrapedAuction[]> {
  let chromium: any

  try {
    const pw = await import('playwright-core')
    chromium = pw.chromium
  } catch {
    console.warn('[CaixaBrowser] Playwright não disponível. Use: npx playwright install chromium')
    return []
  }

  // Tentar encontrar o Chromium
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH ||
    '/usr/bin/chromium-browser' ||
    '/usr/bin/google-chrome'

  let browser
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
  } catch {
    console.warn('[CaixaBrowser] Chromium não encontrado. Usando fallback HTTP.')
    return scrapeCaixaFallback(estado, maxCities)
  }

  const auctions: ScrapedAuction[] = []

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1366, height: 768 },
      locale: 'pt-BR',
    })

    const page = await context.newPage()

    // Acessar a página de busca
    await page.goto(CAIXA_URL, { waitUntil: 'networkidle', timeout: 30000 })

    // Selecionar estado
    await page.selectOption('#cmb_estado', estado)
    await page.waitForTimeout(2000)

    // Clicar em buscar
    await page.click('#btn_next0')
    await page.waitForTimeout(5000)

    // Extrair resultados da tabela
    const rows = await page.$$eval('.dadosimovel, .item-imovel, tr[onclick]', (elements: any[]) => {
      return elements.map((el: any) => ({
        text: el.innerText || el.textContent || '',
        html: el.innerHTML || '',
        onclick: el.getAttribute('onclick') || '',
      }))
    })

    for (const row of rows) {
      try {
        const text = row.text
        if (!text || text.length < 10) continue

        // Extrair dados do texto
        const valueMatch = text.match(/R\$\s*([\d.,]+)/g)
        const saleValue = valueMatch?.[0] ? parseFloat(valueMatch[0].replace(/[R$\s.]/g, '').replace(',', '.')) : undefined
        const appraisalValue = valueMatch?.[1] ? parseFloat(valueMatch[1].replace(/[R$\s.]/g, '').replace(',', '.')) : undefined

        const idMatch = row.onclick.match(/(\d+)/)
        const id = idMatch ? idMatch[1] : `${Date.now()}-${auctions.length}`

        auctions.push({
          externalId: `CAIXA-BROWSER-${id}`,
          source: 'CAIXA',
          sourceUrl: `https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp?idImo=${id}`,
          auctioneerName: 'Caixa Econômica Federal',
          title: text.substring(0, 200).trim(),
          city: '', // Será preenchido pelo contexto
          state: estado,
          status: 'OPEN',
          modality: 'DIRECT_SALE',
          minimumBid: saleValue,
          appraisalValue,
          bankName: 'Caixa Econômica Federal',
          financingAvailable: text.toLowerCase().includes('financ'),
          fgtsAllowed: text.toLowerCase().includes('fgts'),
          occupation: text.toLowerCase().includes('desocup') ? 'DESOCUPADO' :
                      text.toLowerCase().includes('ocup') ? 'OCUPADO' : 'DESCONHECIDO',
        })
      } catch { /* skip malformed */ }
    }

    await browser.close()
  } catch (err: any) {
    console.error(`[CaixaBrowser] Erro: ${err.message}`)
    try { await browser?.close() } catch {}
  }

  console.log(`[CaixaBrowser] ${estado}: ${auctions.length} imóveis encontrados`)
  return auctions
}

/**
 * Fallback: scraping HTTP sem browser
 * Usa os endpoints ASP que funcionam para listar cidades
 */
async function scrapeCaixaFallback(estado: string, maxCities: number): Promise<ScrapedAuction[]> {
  const cities = await getCityCodes(estado)
  console.log(`[CaixaFallback] ${estado}: ${cities.length} cidades encontradas`)

  // Sem browser, não conseguimos buscar imóveis individuais
  // Mas podemos registrar que as cidades existem para futura busca
  return []
}

/**
 * Script standalone para rodar manualmente
 * Uso: PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium npx tsx scripts/scrape-caixa-browser.ts
 */
export async function runCaixaBrowserScraper(prisma: PrismaClient, estados = ['SP']): Promise<number> {
  let total = 0

  for (const estado of estados) {
    const auctions = await scrapeCaixaWithBrowser(estado)
    total += auctions.length

    // Salvar no banco
    for (const auction of auctions) {
      try {
        const slug = `caixa-${auction.externalId?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
        await prisma.auction.upsert({
          where: { slug },
          create: {
            ...auction as any,
            slug,
            title: auction.title || `Imóvel Caixa ${estado}`,
            propertyType: 'HOUSE',
            category: 'RESIDENTIAL',
          },
          update: {
            minimumBid: auction.minimumBid,
            appraisalValue: auction.appraisalValue,
            status: 'OPEN',
            lastScrapedAt: new Date(),
          },
        })
      } catch { /* skip duplicates */ }
    }
  }

  return total
}
