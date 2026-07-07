/**
 * Detecta se o código está rodando durante o `next build` (fase de geração
 * estática) em vez de em uma requisição real (ISR/SSR).
 *
 * As páginas programáticas de SEO buscam imóveis na API para renderizar. Fazer
 * essa chamada durante o build multiplicada por milhares de cidades deixa o
 * build refém da API: uma resposta lenta/fria estoura o limite de tempo por
 * página do Next (60s) e quebra o deploy inteiro.
 *
 * Pulando o fetch no build, a página é gerada instantaneamente (sem dados) e o
 * ISR preenche os imóveis na primeira revalidação. As páginas geradas sob
 * demanda (fora do generateStaticParams) continuam buscando normalmente, pois
 * aí não é fase de build.
 */
export function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build'
    || process.env.SSG_SKIP_FETCH === '1'
}

export function getSeoStaticLimit(envName: string, fallback: number): number {
  if (process.env.MINIMAL_SSG === '1') return 0
  if (process.env.SEO_FULL_SSG === '1') return Number.POSITIVE_INFINITY

  const raw = process.env[envName]
  if (!raw) return fallback

  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  return Math.floor(parsed)
}

export function limitSeoStaticItems<T>(items: T[], envName: string, fallback: number): T[] {
  const limit = getSeoStaticLimit(envName, fallback)
  if (limit === 0) return []
  if (!Number.isFinite(limit)) return items
  return items.slice(0, limit)
}
