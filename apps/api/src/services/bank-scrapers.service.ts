/**
 * Scrapers individuais para cada banco/leiloeiro
 *
 * Cada scraper implementa a interface BankScraper e retorna
 * dados normalizados no formato AuctionItem.
 *
 * Status:
 * - Caixa: ✅ Ativo (CSV público)
 * - Banco do Brasil: 🔄 Em desenvolvimento
 * - Bradesco: 📋 Catalogado
 * - Santander: 📋 Catalogado
 * - Itaú: 📋 Catalogado
 * - BTG Pactual: 📋 Catalogado
 * - BRB: 📋 Catalogado
 */

import type { AuctionItem } from './auction-aggregator.service.js'

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

// ── BANCO DO BRASIL ──────────────────────────────────────────────────────
// Fonte: https://licitacoes-imoveis.bb.com.br/
// O BB usa uma SPA com API interna JSON

export async function scrapeBancoDoBrasil(): Promise<AuctionItem[]> {
  const items: AuctionItem[] = []

  try {
    // A API interna do BB para imóveis
    // URL base: https://licitacoes-imoveis.bb.com.br/api/imoveis
    const estados = ['SP', 'MG', 'RJ', 'PR', 'GO', 'MS', 'RS', 'SC', 'BA', 'CE', 'PE', 'DF']

    for (const uf of estados) {
      try {
        const res = await fetch(
          `https://licitacoes-imoveis.bb.com.br/wp-json/jesuspended/v1/busca?uf=${uf}&pagina=1&porpagina=100`,
          {
            headers: {
              ...FETCH_HEADERS,
              'Accept': 'application/json',
              'Referer': 'https://licitacoes-imoveis.bb.com.br/',
            },
            signal: AbortSignal.timeout(10000),
          }
        )

        if (!res.ok) continue
        const data = await res.json()
        if (!data?.imoveis?.length) continue

        for (const im of data.imoveis) {
          items.push({
            id: `bb-${im.id || im.codigo}`,
            source: 'BANCO_DO_BRASIL',
            bankName: 'Banco do Brasil',
            city: im.cidade || '',
            state: im.uf || uf,
            neighborhood: im.bairro || '',
            address: im.endereco || '',
            price: parseFloat(im.valor_minimo || im.valor || '0') || 0,
            appraisalValue: parseFloat(im.valor_avaliacao || '0') || 0,
            discount: im.desconto ? parseFloat(im.desconto) : 0,
            financeable: !!im.aceita_financiamento,
            fgtsAllowed: !!im.aceita_fgts,
            description: im.descricao || `${im.tipo} em ${im.cidade}/${im.uf}`,
            saleType: im.modalidade || 'Venda Direta',
            link: im.link || `https://licitacoes-imoveis.bb.com.br/imovel/${im.id || im.codigo}`,
            propertyType: im.tipo || 'Imóvel',
            bedrooms: parseInt(im.quartos || '0') || 0,
            totalArea: parseFloat(im.area_total || '0') || 0,
            privateArea: parseFloat(im.area_privativa || '0') || 0,
            landArea: parseFloat(im.area_terreno || '0') || 0,
            parkingSpots: parseInt(im.vagas || '0') || 0,
            coverImageUrl: im.foto || im.imagem || null,
            auctionDate: im.data_leilao || null,
            leiloeiro: 'Banco do Brasil',
          })
        }
      } catch {
        // Skip estado com erro
      }
    }
  } catch (err) {
    console.error('[BB Scraper] Error:', err)
  }

  return items
}

// ── BRADESCO ─────────────────────────────────────────────────────────────
// Fonte: https://www.bradescoimoveis.com.br/

export async function scrapeBradesco(): Promise<AuctionItem[]> {
  // O Bradesco usa uma plataforma proprietária
  // Precisa de scraping HTML ou acesso à API interna
  // Estrutura preparada para implementação futura
  return []
}

// ── SANTANDER ────────────────────────────────────────────────────────────
// Fonte: https://www.santanderimoveis.com.br/

export async function scrapeSantander(): Promise<AuctionItem[]> {
  return []
}

// ── ITAÚ ─────────────────────────────────────────────────────────────────
// Fonte: https://www.itau.com.br/imoveis

export async function scrapeItau(): Promise<AuctionItem[]> {
  return []
}

// ── LEILOEIROS ───────────────────────────────────────────────────────────

export async function scrapeMegaLeiloes(): Promise<AuctionItem[]> {
  // Mega Leilões tem uma API pública de busca
  // https://www.megaleiloes.com.br/api/lotes
  return []
}

export async function scrapeELeiloesMarket(): Promise<AuctionItem[]> {
  return []
}

export async function scrapeLanceNoLeilao(): Promise<AuctionItem[]> {
  return []
}

// ── AGREGADOR DE TODOS OS SCRAPERS ───────────────────────────────────────

export async function scrapeAllBanks(): Promise<AuctionItem[]> {
  const results = await Promise.allSettled([
    scrapeBancoDoBrasil(),
    scrapeBradesco(),
    scrapeSantander(),
    scrapeItau(),
    scrapeMegaLeiloes(),
    scrapeELeiloesMarket(),
    scrapeLanceNoLeilao(),
  ])

  const allItems: AuctionItem[] = []
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      allItems.push(...result.value)
    }
  }

  return allItems
}
