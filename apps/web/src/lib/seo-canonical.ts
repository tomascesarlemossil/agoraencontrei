import { IBGE_CITY_BY_SLUG } from '@/data/seo-ibge-cities-expanded'

/**
 * Consolidação de URLs de cidade duplicadas.
 *
 * O sistema `/{estado}/{cidade}[/cluster]` é o CANÔNICO oficial (rota mais
 * rica, pré-renderizada, com schema.org). As rotas legadas
 * (`/imoveis-a-venda/{cidade}-{uf}`, `/imoveis-para-alugar/...`,
 * `/leilao-imoveis-em/...`, `/imoveis/em/{cidade}`) apontam seu canonical
 * para a rota oficial — MAS só quando a cidade existe no conjunto IBGE.
 *
 * A rota `/{estado}/{cidade}/[cluster]` faz notFound() para cidades fora do
 * IBGE, então NUNCA podemos apontar um canonical para uma página inexistente:
 * quando não há match, retornamos null e o chamador mantém o auto-canonical.
 */

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL ?? 'https://www.agoraencontrei.com.br'

/** Faz parse de um slug `{cidade}-{uf}` (ex: 'ribeirao-preto-sp'). */
export function parseCityUf(slug: string): { citySlug: string; stateSlug: string } | null {
  const m = /^(.+)-([a-z]{2})$/.exec(slug)
  if (!m) return null
  return { citySlug: m[1], stateSlug: m[2] }
}

/**
 * URL canônica `/{estado}/{cidade}[/cluster]` para um slug legado no formato
 * `{cidade}-{uf}`. Retorna null se a cidade/UF não existir no IBGE.
 */
export function canonicalFromCityUf(cityUfSlug: string, cluster?: string): string | null {
  const parsed = parseCityUf(cityUfSlug)
  if (!parsed) return null
  const city = IBGE_CITY_BY_SLUG[parsed.citySlug]
  if (!city || city.stateSlug !== parsed.stateSlug) return null
  const base = `${WEB_URL}/${city.stateSlug}/${city.slug}`
  return cluster ? `${base}/${cluster}` : base
}

/**
 * URL canônica para um slug só de cidade, sem UF (ex: `/imoveis/em/franca`).
 * Retorna null se o slug não existir no IBGE.
 */
export function canonicalFromCitySlug(citySlug: string, cluster?: string): string | null {
  const city = IBGE_CITY_BY_SLUG[citySlug]
  if (!city) return null
  const base = `${WEB_URL}/${city.stateSlug}/${city.slug}`
  return cluster ? `${base}/${cluster}` : base
}
