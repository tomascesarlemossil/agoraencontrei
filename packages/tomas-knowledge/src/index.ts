/**
 * @agoraencontrei/tomas-knowledge
 *
 * Fonte única de verdade para o conhecimento local do agente Tomás.
 * Consumido por apps/api (Fastify / Anthropic) e apps/web (Next / OpenAI).
 *
 * Arquitetura: tudo é TS puro (constantes tipadas). Nada de readFileSync,
 * nada de JSON imports — assim funciona igualmente em:
 *  - Fastify em produção (node dist/*.js ESM)
 *  - Fastify dev (tsx watch)
 *  - Next.js build (webpack com transpilePackages)
 *  - Next.js dev
 */

import {
  FRANCA_LOCAL_KNOWLEDGE,
  type FrancaLocalKnowledge,
} from './franca_local_knowledge.js'
import {
  LEMOS_INVENTORY_COMPARABLES,
  type LemosComparable,
} from './lemos_inventory_comparables.js'
import { SYSTEM_PROMPT_TOMAS } from './system_prompt_tomas.js'

export { SYSTEM_PROMPT_TOMAS } from './system_prompt_tomas.js'
export {
  FRANCA_LOCAL_KNOWLEDGE,
  type FrancaLocalKnowledge,
} from './franca_local_knowledge.js'
export {
  LEMOS_INVENTORY_COMPARABLES,
  type LemosComparable,
} from './lemos_inventory_comparables.js'

// Aliases curtos (compat)
export const francaLocalKnowledge: FrancaLocalKnowledge = FRANCA_LOCAL_KNOWLEDGE
export const lemosInventoryComparables: { comparables: LemosComparable[] } =
  LEMOS_INVENTORY_COMPARABLES

// ── Derived strings — formatados para injeção em prompt ─────────────────────

/**
 * Snapshot compacto dos comparáveis ativos da carteira Lemos.
 */
export function buildComparablesBrief(): string {
  const items = LEMOS_INVENTORY_COMPARABLES.comparables
  if (!items.length) return ''
  const lines = items.map((c) => {
    const parts: string[] = [
      `• ${c.reference} — ${c.property_type} em ${c.neighborhood}, ${c.city}`,
    ]
    if (c.building) parts.push(`no ${c.building}`)
    if (c.area_private_m2) parts.push(`${c.area_private_m2} m²`)
    if (c.bedrooms != null) parts.push(`${c.bedrooms} dorm${c.bedrooms === 1 ? '' : 's'}`)
    parts.push(`pedido R$ ${c.price_asking.toLocaleString('pt-BR')}`)
    parts.push(`(${c.segment}, ${c.status})`)
    return parts.join(' — ')
  })
  return [
    '════════════════════════════════════════════════════',
    'CARTEIRA ATIVA LEMOS — SNAPSHOT EM TEMPO REAL',
    '════════════════════════════════════════════════════',
    ...lines,
    '',
    'Regra: estes preços são ANÚNCIO (pedido), não fechamento.',
  ].join('\n')
}

/**
 * System prompt completo do Tomás — base unificada com snapshot de carteira.
 */
export function buildTomasSystemPrompt(): string {
  return [SYSTEM_PROMPT_TOMAS.trim(), '', buildComparablesBrief()].join('\n')
}

/**
 * JSON estruturado do conhecimento local — útil para modelos que
 * preferem JSON no contexto.
 */
export function buildLocalKnowledgeBrief(): string {
  return JSON.stringify(FRANCA_LOCAL_KNOWLEDGE, null, 2)
}
