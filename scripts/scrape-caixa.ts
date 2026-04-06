/**
 * Script Standalone: Scraper da Caixa Econômica Federal
 *
 * Usa a API direta da Caixa (JSON) para buscar TODOS os imóveis.
 * Salva direto no banco via Prisma (mesmo banco da API).
 *
 * Execução:
 *   npx tsx scripts/scrape-caixa.ts
 *   ou
 *   pnpm tsx scripts/scrape-caixa.ts
 *
 * Variáveis de ambiente necessárias:
 *   DATABASE_URL — PostgreSQL connection string
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CAIXA_API_URL = 'https://venda-imoveis.caixa.gov.br/sistema/api/pesquisa-imoveis'

const ESTADOS = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN',
  'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
]

function safeFloat(val: any): number | undefined {
  if (val == null || val === '') return undefined
  const str = String(val).replace(/[R$\s.]/g, '').replace(',', '.')
  const n = parseFloat(str)
  return isNaN(n) ? undefined : n
}

function safeInt(val: any): number {
  const n = parseInt(String(val))
  return isNaN(n) ? 0 : n
}

function parseType(tipo?: string): string {
  if (!tipo) return 'HOUSE'
  const t = tipo.toUpperCase()
  if (t.includes('APART')) return 'APARTMENT'
  if (t.includes('TERR')) return 'LAND'
  if (t.includes('SALA') || t.includes('COMERC')) return 'OFFICE'
  if (t.includes('LOJA')) return 'STORE'
  if (t.includes('GALPAO')) return 'WAREHOUSE'
  if (t.includes('SITIO') || t.includes('FAZENDA')) return 'FARM'
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

async function fetchEstado(estado: string) {
  try {
    const res = await fetch(CAIXA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://venda-imoveis.caixa.gov.br',
        'Referer': 'https://venda-imoveis.caixa.gov.br/sistema/busca-imovel.asp',
      },
      body: JSON.stringify({ strEstado: estado, tipoBusca: 'ESTADO' }),
    })

    if (!res.ok) {
      console.warn(`  ⚠️  ${estado}: HTTP ${res.status}`)
      return []
    }

    const data = await res.json()
    return data.listaImoveis || data.lista || data.imoveis || []
  } catch (err: any) {
    console.error(`  ❌ ${estado}: ${err.message}`)
    return []
  }
}

async function main() {
  console.log('🚀 Scraper Caixa — API Direta')
  console.log('━'.repeat(50))

  const run = await prisma.scraperRun.create({
    data: { source: 'CAIXA', sourceUrl: CAIXA_API_URL, status: 'RUNNING' },
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
        const id = im.id || im.codigo || im.idImovel
        if (!id) continue

        const externalId = `CAIXA-${id}`
        const valorVenda = safeFloat(im.valor_venda || im.valorVenda || im.vlrVenda)
        const valorAvaliacao = safeFloat(im.valor_avaliacao || im.valorAvaliacao || im.vlrAvaliacao)
        const desconto = valorAvaliacao && valorVenda && valorAvaliacao > 0
          ? Number(((valorAvaliacao - valorVenda) / valorAvaliacao * 100).toFixed(1))
          : null

        // Score de oportunidade
        let score = 50
        if (desconto && desconto > 50) score += 20
        else if (desconto && desconto > 30) score += 15
        else if (desconto && desconto > 20) score += 10
        else if (desconto && desconto > 10) score += 5
        const occ = String(im.ocupacao || '').toUpperCase()
        if (occ.includes('DESOCUP')) score += 10
        if (im.aceita_financiamento || im.financiamento) score += 5
        if (im.aceita_fgts || im.fgts) score += 5
        score = Math.min(100, score)

        const title = im.nome || im.titulo || im.descricao || `Imóvel Caixa - ${im.cidade || estado}`
        const slug = slugify(title, String(id).substring(0, 8))

        const data = {
          externalId,
          source: 'CAIXA' as const,
          sourceUrl: `https://venda-imoveis.caixa.gov.br/sistema/detalhe-imovel.asp?idImo=${id}`,
          auctioneerName: 'Caixa Econômica Federal',
          auctioneerUrl: 'https://venda-imoveis.caixa.gov.br',
          title,
          description: im.descricao || im.observacao || null,
          propertyType: parseType(im.tipo || im.tipoImovel) as any,
          category: 'RESIDENTIAL' as const,
          status: 'OPEN' as const,
          modality: 'DIRECT_SALE' as const,
          street: im.endereco || im.logradouro || null,
          number: im.numero || null,
          neighborhood: im.bairro || null,
          city: im.cidade || im.municipio || null,
          state: estado,
          zipCode: im.cep || null,
          totalArea: safeFloat(im.area || im.areaTotal),
          bedrooms: safeInt(im.quartos || im.dormitorios),
          bathrooms: safeInt(im.banheiros),
          parkingSpaces: safeInt(im.vagas || im.garagem),
          appraisalValue: valorAvaliacao,
          minimumBid: valorVenda,
          discountPercent: desconto,
          occupation: occ.includes('DESOCUP') ? 'DESOCUPADO' : occ.includes('OCUP') ? 'OCUPADO' : 'DESCONHECIDO',
          bankName: 'Caixa Econômica Federal',
          financingAvailable: Boolean(im.aceita_financiamento || im.financiamento),
          fgtsAllowed: Boolean(im.aceita_fgts || im.fgts),
          coverImage: im.imagem || im.foto || im.urlImagem || null,
          editalUrl: im.edital || im.urlEdital || null,
          registryNumber: im.matricula || null,
          opportunityScore: score,
          estimatedROI: desconto ? desconto * 0.7 : null,
          lastScrapedAt: new Date(),
          metadata: { raw_id: id, raw_modalidade: im.modalidade },
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
            // Slug duplicado - adicionar timestamp
            await prisma.auction.create({
              data: { ...data, slug: `${slug}-${Date.now().toString(36)}` },
            })
          })
          totalCreated++
        }
      } catch (err: any) {
        errors.push(`${estado}-${im.id}: ${err.message}`)
      }
    }

    // Rate limit
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

main().catch(console.error)
