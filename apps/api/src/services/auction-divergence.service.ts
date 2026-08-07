/**
 * Detector de Divergências (plano §23).
 *
 * Aponta inconsistências nos dados do próprio leilão e entre as ocorrências do
 * mesmo imóvel — gera credibilidade e alerta o comprador para checar antes de
 * decidir. Usa apenas sinais confiáveis (campos + título + linha do tempo);
 * divergências que exigem OCR de matrícula/edital ficam para uma fase futura.
 */

export type DivergenceSeverity = 'ALTA' | 'MEDIA' | 'BAIXA'

export interface Divergence {
  key: string
  severity: DivergenceSeverity
  message: string
}

export interface DivergenceInput {
  title: string | null
  description: string | null
  propertyType: string | null
  totalArea: number | null
  builtArea: number | null
  landArea: number | null
  bedrooms: number
  appraisalValue: number | null
  minimumBid: number | null
  discountPercent: number | null
  timeline?: { appraisalValue: number | null; totalArea: number | null }[] | null
}

function bedroomsInText(text: string | null): number | null {
  if (!text) return null
  const m = text.match(/(\d+)\s*(?:qto|quarto|dorm|dormit)/i)
  return m ? parseInt(m[1], 10) : null
}

export function computeDivergences(a: DivergenceInput): { divergences: Divergence[]; count: number } {
  const out: Divergence[] = []

  // 1. Desconto declarado x calculado (sobre a avaliação).
  const bid = a.minimumBid && a.minimumBid > 0 ? a.minimumBid : null
  const appr = a.appraisalValue && a.appraisalValue > 0 ? a.appraisalValue : null
  if (bid && appr && a.discountPercent != null) {
    const computed = (1 - bid / appr) * 100
    const diff = Math.abs(computed - a.discountPercent)
    if (diff >= 8) {
      out.push({
        key: 'discount', severity: diff >= 20 ? 'ALTA' : 'MEDIA',
        message: `Desconto anunciado (${Math.round(a.discountPercent)}%) diverge do calculado sobre a avaliação (${Math.round(computed)}%).`,
      })
    }
  }

  // 2. Áreas impossíveis / inconsistentes.
  const built = a.builtArea && a.builtArea > 0 ? a.builtArea : null
  const total = a.totalArea && a.totalArea > 0 ? a.totalArea : null
  if (built && total && built > total * 1.05) {
    out.push({ key: 'area_built_gt_total', severity: 'MEDIA', message: `Área construída (${Math.round(built)}m²) maior que a área total (${Math.round(total)}m²).` })
  }
  const land = a.landArea && a.landArea > 0 ? a.landArea : null
  if (land && built && built > land * 3) {
    out.push({ key: 'area_built_gt_land', severity: 'BAIXA', message: `Área construída (${Math.round(built)}m²) muito maior que o terreno (${Math.round(land)}m²) — confira o número de pavimentos.` })
  }

  // 3. Quartos no título/descrição x campo.
  const titleBeds = bedroomsInText(a.title) ?? bedroomsInText(a.description)
  if (titleBeds != null && a.bedrooms > 0 && titleBeds !== a.bedrooms) {
    out.push({ key: 'bedrooms', severity: 'BAIXA', message: `Quartos divergem: texto indica ${titleBeds}, cadastro indica ${a.bedrooms}.` })
  }

  // 4. Variação de avaliação/área entre ocorrências do mesmo imóvel.
  if (a.timeline && a.timeline.length > 1) {
    const apprs = a.timeline.map((t) => t.appraisalValue).filter((v): v is number => v != null && v > 0)
    if (apprs.length > 1) {
      const min = Math.min(...apprs), max = Math.max(...apprs)
      if (min > 0 && max / min >= 1.3) {
        out.push({ key: 'appraisal_variance', severity: 'MEDIA', message: `A avaliação do imóvel variou entre ocorrências (de R$ ${Math.round(min).toLocaleString('pt-BR')} a R$ ${Math.round(max).toLocaleString('pt-BR')}).` })
      }
    }
    const areas = a.timeline.map((t) => t.totalArea).filter((v): v is number => v != null && v > 0)
    if (areas.length > 1) {
      const min = Math.min(...areas), max = Math.max(...areas)
      if (min > 0 && max / min >= 1.1) {
        out.push({ key: 'area_variance', severity: 'ALTA', message: `A área informada variou entre ocorrências (de ${Math.round(min)}m² a ${Math.round(max)}m²) — confirme na matrícula.` })
      }
    }
  }

  const order: Record<DivergenceSeverity, number> = { ALTA: 0, MEDIA: 1, BAIXA: 2 }
  out.sort((x, y) => order[x.severity] - order[y.severity])
  return { divergences: out, count: out.length }
}
