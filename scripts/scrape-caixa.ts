/**
 * Script Standalone: Scraper da Caixa Econômica Federal
 *
 * Usa a lista CSV pública oficial da Caixa por UF:
 *   https://venda-imoveis.caixa.gov.br/listaweb/Lista_imoveis_SP.csv
 *
 * O endpoint JSON legado `sistema/api/pesquisa-imoveis` retornou 404 em
 * 05/05/2026. Por isso a ingestão foi movida para CSV, que contém preço,
 * avaliação, desconto, financiamento, descrição, modalidade e link oficial.
 *
 * Execução:
 *   npx tsx scripts/scrape-caixa.ts
 *   pnpm tsx scripts/scrape-caixa.ts
 *
 * Variáveis de ambiente necessárias:
 *   DATABASE_URL — PostgreSQL connection string
 *
 * Variáveis opcionais:
 *   CAIXA_ESTADOS=SP,MG,RJ  — restringe UFs para ingestão incremental
 *   CAIXA_CIDADE=FRANCA     — filtra uma cidade específica para testes
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CAIXA_CSV_BASE_URL = 'https://venda-imoveis.caixa.gov.br/listaweb'

const ESTADOS = (process.env.CAIXA_ESTADOS?.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)) ?? [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN',
  'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
]

const CIDADE_FILTRO = process.env.CAIXA_CIDADE?.trim().toUpperCase()

function safeFloat(val: any): number | undefined {
  if (val == null || val === '') return undefined
  const str = String(val).trim().replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
  const n = parseFloat(str)
  return isNaN(n) ? undefined : n
}

function safeInt(val: any): number {
  const n = parseInt(String(val ?? '').trim(), 10)
  return isNaN(n) ? 0 : n
}

function parseType(text?: string): string {
  if (!text) return 'HOUSE'
  const t = text.toUpperCase()
  if (t.includes('APART') || t.includes('APTO')) return 'APARTMENT'
  if (t.includes('TERR') || t.includes('LOTE')) return 'LAND'
  if (t.includes('SALA') || t.includes('COMERC')) return 'OFFICE'
  if (t.includes('LOJA')) return 'STORE'
  if (t.includes('GALPAO') || t.includes('GALPÃO')) return 'WAREHOUSE'
  if (t.includes('SITIO') || t.includes('SÍTIO') || t.includes('FAZENDA') || t.includes('CHACARA') || t.includes('CHÁCARA')) return 'FARM'
  return 'HOUSE'
}

function slugify(text: string, suffix: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80) + '-' + suffix
}

function decodeLatin1(buffer: ArrayBuffer): string {
  return new TextDecoder('iso-8859-1').decode(buffer)
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"' && next === '"') {
      current += '"'
      i++
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ';' && !inQuotes) {
      cells.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  cells.push(current.trim())
  return cells
}

function normalizeHeader(header: string): string {
  return header
    .trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[º°]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(Boolean)
  const headerIndex = lines.findIndex(line => line.includes('N° do imóvel') || line.includes('Nº do imóvel') || line.includes('N do imóvel'))
  if (headerIndex < 0) return []

  const headers = splitCsvLine(lines[headerIndex]).map(normalizeHeader)
  const rows: Record<string, string>[] = []

  for (const line of lines.slice(headerIndex + 1)) {
    const values = splitCsvLine(line)
    if (!values.some(Boolean)) continue

    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() ?? ''
    })
    rows.push(row)
  }

  return rows
}

function get(row: Record<string, string>, key: string): string {
  return row[normalizeHeader(key)]?.trim() ?? ''
}

function extractBedrooms(description: string): number {
  const match = description.match(/(\d+)\s*qto/i)
  return match ? safeInt(match[1]) : 0
}

function extractParking(description: string): number {
  const match = description.match(/(\d+)\s*vaga/i)
  return match ? safeInt(match[1]) : 0
}

function extractTotalArea(description: string): number | undefined {
  const match = description.match(/([\d.,]+)\s*de área total/i)
  return match ? safeFloat(match[1]) : undefined
}

function normalizeStatus(modality: string): 'OPEN' | 'UPCOMING' {
  return modality.toUpperCase().includes('LEILÃO') || modality.toUpperCase().includes('LICITAÇÃO') || modality.toUpperCase().includes('VENDA')
    ? 'OPEN'
    : 'UPCOMING'
}

function normalizeModality(modality: string): 'ONLINE' | 'DIRECT_SALE' | 'JUDICIAL' | 'EXTRAJUDICIAL' {
  const m = modality.toUpperCase()
  if (m.includes('VENDA DIRETA')) return 'DIRECT_SALE'
  if (m.includes('JUDICIAL')) return 'JUDICIAL'
  if (m.includes('SFI') || m.includes('EXTRAJUDICIAL')) return 'EXTRAJUDICIAL'
  return 'ONLINE'
}

async function fetchEstado(estado: string) {
  const url = `${CAIXA_CSV_BASE_URL}/Lista_imoveis_${estado}.csv`
  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'text/csv,text/plain,*/*',
        'User-Agent': 'Mozilla/5.0 (compatible; AgoraEncontreiBot/1.0; +https://www.agoraencontrei.com.br)',
        'Referer': 'https://venda-imoveis.caixa.gov.br/',
      },
    })

    if (!res.ok) {
      console.warn(`  ⚠️  ${estado}: HTTP ${res.status}`)
      return []
    }

    const text = decodeLatin1(await res.arrayBuffer())
    let rows = parseCsv(text)
    if (CIDADE_FILTRO) rows = rows.filter(row => get(row, 'Cidade').toUpperCase() === CIDADE_FILTRO)
    return rows
  } catch (err: any) {
    console.error(`  ❌ ${estado}: ${err.message}`)
    return []
  }
}

async function main() {
  console.log('🚀 Scraper Caixa — CSV oficial por UF')
  console.log('━'.repeat(50))

  const run = await prisma.scraperRun.create({
    data: { source: 'CAIXA', sourceUrl: CAIXA_CSV_BASE_URL, status: 'RUNNING' },
  })

  let totalFound = 0
  let totalCreated = 0
  let totalUpdated = 0
  const errors: string[] = []

  for (const estado of ESTADOS) {
    process.stdout.write(`📦 ${estado}... `)
    const imoveis = await fetchEstado(estado)
    console.log(`${imoveis.length} imóveis`)
    totalFound += imoveis.length

    for (const im of imoveis) {
      try {
        const id = get(im, 'N do imóvel') || get(im, 'N° do imóvel') || get(im, 'Nº do imóvel')
        if (!id) continue

        const externalId = `CAIXA-${id.replace(/\s+/g, '')}`
        const valorVenda = safeFloat(get(im, 'Preço'))
        const valorAvaliacao = safeFloat(get(im, 'Valor de avaliação'))
        const descontoCsv = safeFloat(get(im, 'Desconto'))
        const desconto = descontoCsv ?? (valorAvaliacao && valorVenda && valorAvaliacao > 0
          ? Number(((valorAvaliacao - valorVenda) / valorAvaliacao * 100).toFixed(1))
          : null)

        let score = 50
        if (desconto && desconto > 50) score += 20
        else if (desconto && desconto > 30) score += 15
        else if (desconto && desconto > 20) score += 10
        else if (desconto && desconto > 10) score += 5
        if (get(im, 'Financiamento').toUpperCase().startsWith('SIM')) score += 5
        score = Math.min(100, score)

        const description = get(im, 'Descrição')
        const city = get(im, 'Cidade')
        const neighborhood = get(im, 'Bairro')
        const modality = get(im, 'Modalidade de venda')
        const address = get(im, 'Endereço')
        const type = parseType(description || address)
        const title = `${type === 'APARTMENT' ? 'Apartamento' : type === 'LAND' ? 'Terreno' : 'Imóvel'} Caixa em ${city}${neighborhood ? ` — ${neighborhood}` : ''}`
        const slug = slugify(title, id.replace(/\s+/g, '').substring(0, 12))
        const sourceUrl = get(im, 'Link de acesso') || `https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp?hdnimovel=${id.replace(/\s+/g, '')}`

        const data = {
          externalId,
          source: 'CAIXA' as const,
          sourceUrl,
          auctioneerName: 'Caixa Econômica Federal',
          auctioneerUrl: 'https://venda-imoveis.caixa.gov.br',
          title,
          description: description || null,
          propertyType: type as any,
          category: 'RESIDENTIAL' as const,
          status: normalizeStatus(modality),
          modality: normalizeModality(modality),
          street: address || null,
          neighborhood: neighborhood || null,
          city: city || null,
          state: get(im, 'UF') || estado,
          totalArea: extractTotalArea(description),
          bedrooms: extractBedrooms(description),
          bathrooms: 0,
          parkingSpaces: extractParking(description),
          appraisalValue: valorAvaliacao,
          minimumBid: valorVenda,
          discountPercent: desconto,
          bankName: 'Caixa Econômica Federal',
          financingAvailable: get(im, 'Financiamento').toUpperCase().startsWith('SIM'),
          fgtsAllowed: false,
          opportunityScore: score,
          estimatedROI: desconto ? desconto * 0.7 : null,
          lastScrapedAt: new Date(),
          metadata: { raw_modalidade: modality, csv_source: `${CAIXA_CSV_BASE_URL}/Lista_imoveis_${estado}.csv` },
        }

        const existing = await prisma.auction.findFirst({
          where: { externalId, source: 'CAIXA' },
          select: { id: true },
        })

        if (existing) {
          await prisma.auction.update({ where: { id: existing.id }, data })
          totalUpdated++
        } else {
          await prisma.auction.create({
            data: { ...data, slug },
          }).catch(async () => {
            await prisma.auction.create({
              data: { ...data, slug: `${slug}-${Date.now().toString(36)}` },
            })
          })
          totalCreated++
        }
      } catch (err: any) {
        errors.push(`${estado}: ${err.message}`)
      }
    }

    await new Promise(r => setTimeout(r, 300))
  }

  await prisma.scraperRun.update({
    where: { id: run.id },
    data: {
      status: errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
      finishedAt: new Date(),
      itemsFound: totalFound,
      itemsCreated: totalCreated,
      itemsUpdated: totalUpdated,
      errorMessage: errors.length > 0 ? errors.slice(0, 50).join('\n') : null,
    },
  })

  console.log('━'.repeat(50))
  console.log(`✅ Concluído!`)
  console.log(`   📦 Encontrados: ${totalFound}`)
  console.log(`   🆕 Criados: ${totalCreated}`)
  console.log(`   🔄 Atualizados: ${totalUpdated}`)
  if (errors.length) console.log(`   ⚠️  Erros: ${errors.length}`)

  await prisma.$disconnect()
}

main().catch(async err => {
  console.error(err)
  await prisma.$disconnect()
  process.exit(1)
})
