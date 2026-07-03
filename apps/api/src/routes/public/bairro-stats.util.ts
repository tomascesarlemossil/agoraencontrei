/**
 * Lógica pura do endpoint /bairro-stats — isolada para teste unitário.
 */

export interface PriceRow {
  price?: number | { toString(): string } | null
  builtArea?: number | null
  totalArea?: number | null
  landArea?: number | null
}

/**
 * Mediana do preço por m² (robusta a outliers). Usa área construída; na
 * ausência, área total; por fim, terreno. Ignora linhas sem preço/área válidos.
 */
export function medianPricePerM2(rows: PriceRow[]): { precoMedioM2: number | null; amostra: number } {
  const perM2: number[] = []
  for (const p of rows) {
    const price = Number(p.price ?? 0)
    const area = Number(p.builtArea ?? 0) || Number(p.totalArea ?? 0) || Number(p.landArea ?? 0)
    if (price > 0 && area > 0) perM2.push(price / area)
  }
  if (perM2.length === 0) return { precoMedioM2: null, amostra: 0 }
  perM2.sort((a, b) => a - b)
  return {
    precoMedioM2: Math.round(perM2[Math.floor(perM2.length / 2)]),
    amostra: perM2.length,
  }
}
