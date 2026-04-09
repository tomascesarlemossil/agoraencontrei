/**
 * BCB (Banco Central do Brasil) — Integração de Taxas em Tempo Real
 *
 * Busca SELIC, IPCA, IGP-M, CDI, TR via API pública do BCB
 * Com cache e fallback para valores padrão quando API indisponível
 */

import type { MacroRates } from './financial-engine'
import { DEFAULT_MACRO_RATES } from './financial-engine'

// BCB SGS (Sistema Gerenciador de Séries Temporais) Series IDs
const BCB_SERIES = {
  SELIC_META: 432,     // Taxa SELIC meta (% a.a.)
  SELIC_DIARIA: 11,    // Taxa SELIC diária (% a.a.)
  CDI: 12,             // CDI acumulado mensal (% a.a.)
  IPCA: 433,           // IPCA acumulado 12 meses
  IGPM: 189,           // IGP-M acumulado 12 meses
  TR: 226,             // TR acumulado mensal
  POUPANCA: 195,       // Poupança (% a.m.)
} as const

interface BCBResponse {
  data: string
  valor: string
}

// Cache in-memory (client-side)
let cachedRates: MacroRates | null = null
let cacheTimestamp = 0
const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours

/**
 * Busca uma série do BCB SGS
 */
async function fetchBCBSeries(seriesId: number): Promise<number | null> {
  try {
    const endDate = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).replace(/\//g, '/')

    // Get last 30 days to ensure we get at least one value
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      }).replace(/\//g, '/')

    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${seriesId}/dados?formato=json&dataInicial=${startDate}&dataFinal=${endDate}`

    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { 'Accept': 'application/json' },
    })

    if (!res.ok) return null

    const data: BCBResponse[] = await res.json()
    if (!data || data.length === 0) return null

    // Return most recent value
    const latest = data[data.length - 1]
    return parseFloat(latest.valor.replace(',', '.'))
  } catch {
    return null
  }
}

/**
 * Busca todas as taxas macro do BCB em paralelo
 * Com cache de 6h e fallback para valores padrão
 */
export async function fetchMacroRates(): Promise<MacroRates> {
  // Check cache
  if (cachedRates && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedRates
  }

  try {
    const [selic, cdi, ipca, igpm, tr, poupanca] = await Promise.all([
      fetchBCBSeries(BCB_SERIES.SELIC_META),
      fetchBCBSeries(BCB_SERIES.CDI),
      fetchBCBSeries(BCB_SERIES.IPCA),
      fetchBCBSeries(BCB_SERIES.IGPM),
      fetchBCBSeries(BCB_SERIES.TR),
      fetchBCBSeries(BCB_SERIES.POUPANCA),
    ])

    const rates: MacroRates = {
      selic: selic ?? DEFAULT_MACRO_RATES.selic,
      cdi: cdi ?? DEFAULT_MACRO_RATES.cdi,
      ipca: ipca ?? DEFAULT_MACRO_RATES.ipca,
      igpm: igpm ?? DEFAULT_MACRO_RATES.igpm,
      tr: tr ?? DEFAULT_MACRO_RATES.tr,
      poupanca: poupanca ? poupanca * 12 : DEFAULT_MACRO_RATES.poupanca, // Convert monthly to annual
      financingRate: selic ? selic * 0.67 : DEFAULT_MACRO_RATES.financingRate, // Approx: SELIC * 0.67
    }

    cachedRates = rates
    cacheTimestamp = Date.now()
    return rates
  } catch {
    return cachedRates || DEFAULT_MACRO_RATES
  }
}

/**
 * Hook-friendly: returns cached rates immediately, fetches in background
 */
export function getCachedRates(): MacroRates {
  return cachedRates || DEFAULT_MACRO_RATES
}

/**
 * Format rate for display
 */
export function formatRate(rate: number, name: string): { label: string; value: string; color: string } {
  const colors: Record<string, string> = {
    selic: 'text-blue-400',
    cdi: 'text-cyan-400',
    ipca: 'text-yellow-400',
    igpm: 'text-orange-400',
    tr: 'text-gray-400',
    poupanca: 'text-green-400',
  }

  const labels: Record<string, string> = {
    selic: 'SELIC',
    cdi: 'CDI',
    ipca: 'IPCA',
    igpm: 'IGP-M',
    tr: 'TR',
    poupanca: 'Poupança',
    financingRate: 'Financ.',
  }

  return {
    label: labels[name] || name.toUpperCase(),
    value: `${rate.toFixed(2)}% a.a.`,
    color: colors[name] || 'text-gray-300',
  }
}
