/**
 * Lead Recommender — sugere os melhores imóveis para um lead.
 *
 * Estratégia: filtra Property pelos hard constraints (purpose match,
 * price range, status=ACTIVE, exclui já vinculados via LeadProperty),
 * depois pontua em memória cada candidato e devolve os top N.
 *
 * Sinais usados:
 * - interest (buy/rent) → purpose match
 * - budget (±30%) → price match
 * - notes — extrai bairro/tipo se mencionado
 * - LeadProperty existente — exclui (já apresentado)
 */

import type { PrismaClient } from '@prisma/client'

interface ScoredProperty {
  id: string
  title: string
  slug: string | null
  type: string
  purpose: string
  city: string | null
  neighborhood: string | null
  price: unknown
  priceRent: unknown
  bedrooms: number
  coverImage: string | null
  /** Score 0-100 + reasons explicáveis */
  matchScore: number
  matchReasons: string[]
}

const TYPE_KEYWORDS: Record<string, string[]> = {
  HOUSE:     ['casa', 'sobrado'],
  APARTMENT: ['apartamento', 'ap ', 'apto'],
  LAND:      ['terreno', 'lote'],
  FARM:      ['sítio', 'sitio', 'chácara', 'chacara'],
  RANCH:     ['fazenda'],
  COMMERCIAL: ['sala', 'comercial', 'loja'],
  STUDIO:    ['studio', 'kitnet'],
}

function num(v: unknown): number | null {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

export async function recommendForLead(
  prisma: PrismaClient,
  leadId: string,
  limit = 3,
): Promise<ScoredProperty[]> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true, companyId: true, interest: true, budget: true, notes: true,
      properties: { select: { propertyId: true } },
    },
  }).catch(() => null)
  if (!lead) return []

  const alreadyLinkedIds = lead.properties.map(lp => lp.propertyId)
  const budget = lead.budget ? Number(lead.budget) : null
  const interest = lead.interest ?? null

  // Hard constraints na query.
  const where: Record<string, unknown> = {
    companyId: lead.companyId,
    status: 'ACTIVE',
    authorizedPublish: true,
    ...(alreadyLinkedIds.length > 0 && { id: { notIn: alreadyLinkedIds } }),
  }

  if (interest === 'buy') {
    where.purpose = { in: ['SALE', 'BOTH'] }
  } else if (interest === 'rent') {
    where.purpose = { in: ['RENT', 'BOTH'] }
  }

  if (budget) {
    const min = budget * 0.7
    const max = budget * 1.3
    // Aplica o filtro no campo certo (price para compra, priceRent para
    // aluguel; se interest indefinido, deixa passar).
    if (interest === 'rent') {
      where.priceRent = { gte: min, lte: max }
    } else if (interest === 'buy') {
      where.price = { gte: min, lte: max }
    }
  }

  // Pega mais candidatos do que vamos retornar — espaço para re-rank.
  const candidates = await prisma.property.findMany({
    where: where as never,
    select: {
      id: true, title: true, slug: true, type: true, purpose: true,
      city: true, neighborhood: true, price: true, priceRent: true,
      bedrooms: true, coverImage: true,
      description: true,
    },
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    take: 30,
  }).catch(() => [])

  if (candidates.length === 0) return []

  const notesLower = (lead.notes ?? '').toLowerCase()

  const scored: ScoredProperty[] = candidates.map(p => {
    let score = 0
    const reasons: string[] = []

    // Purpose match — já filtrado, mas damos peso pra reforçar.
    if (interest === 'buy' && (p.purpose === 'SALE' || p.purpose === 'BOTH')) {
      score += 20
      reasons.push('Para comprar')
    } else if (interest === 'rent' && (p.purpose === 'RENT' || p.purpose === 'BOTH')) {
      score += 20
      reasons.push('Para alugar')
    }

    // Price match — quanto mais perto do budget, mais pontos.
    if (budget) {
      const price = interest === 'rent' ? num(p.priceRent) : num(p.price)
      if (price) {
        const ratio = Math.abs(price - budget) / budget
        if (ratio <= 0.1) { score += 30; reasons.push('Preço alinhado ao orçamento') }
        else if (ratio <= 0.2) { score += 20; reasons.push('Próximo do orçamento') }
        else { score += 10; reasons.push('Dentro da faixa') }
      }
    }

    // Notes → neighborhood match
    if (notesLower && p.neighborhood) {
      if (notesLower.includes(p.neighborhood.toLowerCase())) {
        score += 20
        reasons.push(`Bairro ${p.neighborhood} citado nas anotações`)
      }
    }

    // Notes → city match (peso menor)
    if (notesLower && p.city) {
      if (notesLower.includes(p.city.toLowerCase())) {
        score += 8
      }
    }

    // Notes → type match
    const typeKws = TYPE_KEYWORDS[p.type] ?? []
    for (const kw of typeKws) {
      if (notesLower.includes(kw)) {
        score += 15
        reasons.push(`Tipo ${kw} mencionado`)
        break
      }
    }

    // Description keyword match (peso baixo)
    if (notesLower && p.description) {
      const descWords = p.description.toLowerCase().split(/\W+/).filter(w => w.length > 4)
      const noteWords = notesLower.split(/\W+/).filter(w => w.length > 4)
      const overlap = noteWords.filter(w => descWords.includes(w)).length
      if (overlap > 0) score += Math.min(overlap * 3, 10)
    }

    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      type: p.type,
      purpose: p.purpose,
      city: p.city,
      neighborhood: p.neighborhood,
      price: p.price,
      priceRent: p.priceRent,
      bedrooms: p.bedrooms,
      coverImage: p.coverImage,
      matchScore: Math.min(score, 100),
      matchReasons: reasons.length ? reasons : ['Imóvel ativo no catálogo'],
    }
  })

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit)
}
