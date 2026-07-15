/**
 * City Resolver — resolve dados de cidade a partir de múltiplas fontes:
 * 1. Data layer estático (152 cidades com dados IBGE completos — instant)
 * 2. API do backend (5.570 cidades do banco — fallback ISR)
 *
 * Usado pelas rotas dinâmicas [estado]/[cidade] para suportar
 * qualquer cidade do Brasil sem precisar de build estático.
 */
import { IBGE_CITY_BY_SLUG, type IbgeCityData } from '@/data/seo-ibge-cities-expanded'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.agoraencontrei.com.br'

export interface ResolvedCity {
  slug: string
  name: string
  state: string
  stateSlug: string
  stateName: string
  ibgeId: number
  populacao: number
  areakm2: number
  pibPerCapita: number
  salarioMedioSM: number
  region: string
  source: 'static' | 'api'
}

/**
 * Resolve uma cidade por slug + estado.
 * Primeiro tenta o data layer estático (rápido).
 * Se não encontrar, busca da API (ISR cached por 24h).
 */
export async function resolveCity(estado: string, cidadeSlug: string): Promise<ResolvedCity | null> {
  // 1. Tentar data layer estático (152 cidades)
  const staticCity = IBGE_CITY_BY_SLUG[cidadeSlug]
  if (staticCity && staticCity.stateSlug === estado) {
    return {
      slug: staticCity.slug,
      name: staticCity.name,
      state: staticCity.state,
      stateSlug: staticCity.stateSlug,
      stateName: staticCity.stateName,
      ibgeId: staticCity.ibgeId,
      populacao: staticCity.populacao,
      areakm2: staticCity.areakm2,
      pibPerCapita: staticCity.pibPerCapita,
      salarioMedioSM: staticCity.salarioMedioSM,
      region: staticCity.region,
      source: 'static',
    }
  }

  // 2. Buscar da API (5.570 cidades)
  try {
    const res = await fetch(
      `${API_URL}/api/v1/seo/cities?slug=${cidadeSlug}&estado=${estado}`,
      { next: { revalidate: 86400 } } // Cache ISR 24h
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!data || !data.nome) return null

    return {
      slug: cidadeSlug,
      name: data.nome,
      state: estado.toUpperCase(),
      stateSlug: estado,
      stateName: data.estado_nome || estado.toUpperCase(),
      ibgeId: data.id_ibge || 0,
      populacao: data.populacao || 0,
      areakm2: data.area_territorial || 0,
      pibPerCapita: data.pib_per_capita || 0,
      salarioMedioSM: data.salario_medio_sm || 0,
      region: `interior-${estado}`,
      source: 'api',
    }
  } catch {
    return null
  }
}

/**
 * Gera snippet SEO para uma cidade resolvida
 */
export function getCitySnippet(city: ResolvedCity): string {
  const pop = city.populacao > 0 ? city.populacao.toLocaleString('pt-BR') : '?'
  const pib = city.pibPerCapita > 0
    ? city.pibPerCapita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
    : ''
  const area = city.areakm2 > 0 ? city.areakm2.toLocaleString('pt-BR') : '?'

  let snippet = `${city.name}/${city.state} tem ${pop} habitantes`
  if (pib) snippet += `, PIB per capita de ${pib}`
  snippet += ` e área de ${area} km² (IBGE).`
  return snippet
}
