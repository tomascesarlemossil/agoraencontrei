/**
 * seo-interlinking.service.ts
 * Motor de interlinking automático para páginas SEO programáticas.
 * Baseado no SEO Growth Pack — adaptado para Prisma + Fastify.
 */
import type { PrismaClient } from '@prisma/client'

export type LinkBlock = {
  title: string
  links: Array<{
    anchor: string
    slug: string
    reason: 'same-bairro' | 'same-cidade' | 'near-city' | 'same-uf' | 'supporting-guide'
    score: number
  }>
}

const LIMITS = {
  sameBairro: 6,
  sameCidade: 8,
  nearCity: 8,
  sameUf: 6,
  supportingGuide: 4,
}

/**
 * Retorna blocos de links internos inteligentes para uma página SEO.
 * Estratégia:
 * 1) Mesmo bairro com intenções complementares
 * 2) Mesma cidade com tipos próximos de intenção
 * 3) Cidades vizinhas (seo_city_neighbors) com mesma intenção
 * 4) Mesma UF + guias de apoio
 */
export async function getSmartInternalLinks(prisma: PrismaClient, pageId: bigint): Promise<LinkBlock[]> {
  const current = await prisma.$queryRaw<Array<{
    id: bigint; slug: string; h1: string; cidade_id: bigint
    bairro_id: bigint | null; cluster: string | null; uf: string
    cidade: string; bairro: string | null
  }>>`
    SELECT
      p.id, p.slug, p.h1, p.cidade_id, p.bairro_id, p.cluster,
      c.uf, c.nome AS cidade, b.nome AS bairro
    FROM seo_paginas p
    JOIN seo_cidades c ON c.id = p.cidade_id
    LEFT JOIN seo_bairros b ON b.id = p.bairro_id
    WHERE p.id = ${pageId}
    LIMIT 1
  `

  if (!current.length) return []
  const cur = current[0]
  const blocks: LinkBlock[] = []

  // 1. Mesmo bairro
  if (cur.bairro_id) {
    const rows = await prisma.$queryRaw<Array<{ anchor: string; slug: string; score: number }>>`
      SELECT p.h1 AS anchor, p.slug,
        (100 + CASE WHEN p.cluster <> ${cur.cluster} THEN 10 ELSE 0 END + COALESCE(p.quality_score, 0)) AS score
      FROM seo_paginas p
      WHERE p.status = 'publicado' AND p.id <> ${pageId} AND p.bairro_id = ${cur.bairro_id}
      ORDER BY score DESC, p.published_at DESC
      LIMIT ${LIMITS.sameBairro}
    `
    if (rows.length) {
      blocks.push({ title: `Mais buscas no ${cur.bairro}`, links: rows.map(x => ({ ...x, reason: 'same-bairro' as const })) })
    }
  }

  // 2. Mesma cidade
  const sameCidade = await prisma.$queryRaw<Array<{ anchor: string; slug: string; score: number }>>`
    SELECT p.h1 AS anchor, p.slug,
      (80 + CASE WHEN p.cluster <> ${cur.cluster} THEN 15 ELSE 0 END + COALESCE(p.quality_score, 0)) AS score
    FROM seo_paginas p
    WHERE p.status = 'publicado' AND p.id <> ${pageId} AND p.cidade_id = ${cur.cidade_id}
    ORDER BY score DESC, p.published_at DESC
    LIMIT ${LIMITS.sameCidade}
  `
  if (sameCidade.length) {
    blocks.push({ title: `Oportunidades relacionadas em ${cur.cidade}`, links: sameCidade.map(x => ({ ...x, reason: 'same-cidade' as const })) })
  }

  // 3. Cidades vizinhas
  const nearCity = await prisma.$queryRaw<Array<{ anchor: string; slug: string; score: number }>>`
    SELECT p.h1 AS anchor, p.slug,
      (70 - COALESCE(cn.distance_km, 0) / 10 + COALESCE(p.quality_score, 0)) AS score
    FROM seo_city_neighbors cn
    JOIN seo_paginas p ON p.cidade_id = cn.neighbor_city_id AND p.status = 'publicado' AND p.cluster = ${cur.cluster}
    WHERE cn.city_id = ${cur.cidade_id} AND p.id <> ${pageId}
    ORDER BY score DESC, p.published_at DESC
    LIMIT ${LIMITS.nearCity}
  `
  if (nearCity.length) {
    blocks.push({ title: 'Cidades próximas com buscas parecidas', links: nearCity.map(x => ({ ...x, reason: 'near-city' as const })) })
  }

  // 4. Mesma UF
  const sameUf = await prisma.$queryRaw<Array<{ anchor: string; slug: string; score: number }>>`
    SELECT p.h1 AS anchor, p.slug,
      (55 + CASE WHEN p.cluster = ${cur.cluster} THEN 8 ELSE 0 END + COALESCE(p.quality_score, 0)) AS score
    FROM seo_paginas p
    JOIN seo_cidades c ON c.id = p.cidade_id
    WHERE p.status = 'publicado' AND p.id <> ${pageId} AND c.uf = ${cur.uf}
    ORDER BY score DESC, p.published_at DESC
    LIMIT ${LIMITS.sameUf}
  `
  if (sameUf.length) {
    blocks.push({ title: `Mais páginas fortes em ${cur.uf}`, links: sameUf.map(x => ({ ...x, reason: 'same-uf' as const })) })
  }

  // 5. Guias de apoio
  const guides = await prisma.$queryRaw<Array<{ anchor: string; slug: string; score: number }>>`
    SELECT p.h1 AS anchor, p.slug, (50 + COALESCE(p.quality_score, 0)) AS score
    FROM seo_paginas p
    WHERE p.status = 'publicado' AND p.id <> ${pageId}
      AND p.page_type IN ('guia', 'comparativo', 'faq') AND p.cidade_id = ${cur.cidade_id}
    ORDER BY score DESC, p.published_at DESC
    LIMIT ${LIMITS.supportingGuide}
  `
  if (guides.length) {
    blocks.push({ title: 'Guias que ajudam a converter', links: guides.map(x => ({ ...x, reason: 'supporting-guide' as const })) })
  }

  return dedupeBlocks(blocks)
}

/** Remove slugs duplicados entre blocos (máx 24 links por página) */
export function dedupeBlocks(blocks: LinkBlock[]): LinkBlock[] {
  const seen = new Set<string>()
  return blocks
    .map(block => ({
      ...block,
      links: block.links.filter(link => {
        if (seen.has(link.slug)) return false
        seen.add(link.slug)
        return true
      }),
    }))
    .filter(block => block.links.length > 0)
    .slice(0, 5) // máx 5 blocos = ~24 links
}

/**
 * Calcula o quality_score de uma página SEO.
 * Regra: só indexar páginas com score >= 65.
 */
export function calcQualityScore(page: {
  conteudo?: string | null
  faq?: unknown
  intro?: string | null
  bairro_id?: bigint | null
  listingsCount?: number
}): number {
  let score = 0
  const wordCount = (page.conteudo || '').split(/\s+/).filter(Boolean).length
  if (wordCount >= 250) score += 30
  if (wordCount >= 500) score += 10
  if (wordCount >= 800) score += 10
  if (page.intro && page.intro.length > 50) score += 10
  if (Array.isArray(page.faq) && (page.faq as unknown[]).length >= 3) score += 15
  if (page.bairro_id) score += 5 // bairro = mais específico
  if ((page.listingsCount || 0) >= 1) score += 10
  if ((page.listingsCount || 0) >= 8) score += 10
  return Math.min(score, 100)
}
