/**
 * Cliente da API — fala com o MESMO backend Fastify da plataforma web.
 * Por isso o app é "espelhado": imóveis, leads, cadastros, compras e tudo mais
 * vêm do mesmo Postgres ao vivo, em qualquer acesso (web ou mobile).
 *
 * A URL vem de app.json → expo.extra.apiUrl (configurável por ambiente).
 */
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL: string =
  (Constants.expoConfig?.extra as any)?.apiUrl ||
  'https://api-production-669c.up.railway.app'

const TOKEN_KEY = '@auth_token'

export async function getToken(): Promise<string | null> {
  try { return await AsyncStorage.getItem(TOKEN_KEY) } catch { return null }
}
export async function setToken(token: string | null): Promise<void> {
  try {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token)
    else await AsyncStorage.removeItem(TOKEN_KEY)
  } catch { /* noop */ }
}

type ReqOpts = { method?: string; body?: unknown; auth?: boolean; signal?: AbortSignal }

export async function api<T = any>(path: string, opts: ReqOpts = {}): Promise<T> {
  const { method = 'GET', body, auth = false, signal } = opts
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = await getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  const res = await fetch(`${API_URL}${path.startsWith('/') ? path : `/${path}`}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })
  const text = await res.text()
  const data = text ? safeJson(text) : null
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `Erro ${res.status}`
    throw new ApiError(msg, res.status, data)
  }
  return data as T
}

function safeJson(t: string) { try { return JSON.parse(t) } catch { return t } }

export class ApiError extends Error {
  status: number
  data: any
  constructor(message: string, status: number, data?: any) {
    super(message)
    this.status = status
    this.data = data
  }
}

// ── Endpoints de alto nível (mesmas rotas /api/v1 da web) ──────────────────
export const Catalog = {
  // catálogo público de planos/módulos (igual à /parceiros/cadastro da web)
  get: () => api('/api/v1/public/catalog'),
}

/**
 * Normaliza um imóvel da API pública para os campos que a UI do app usa.
 * A API devolve `coverImage`/`images` (URLs) e `totalArea`; o card e a tela de
 * detalhe leem `imageUrl` e `area`. Mapeamos aqui para não espalhar isso na UI.
 */
function normalizeProperty(p: any) {
  if (!p || typeof p !== 'object') return p
  return {
    ...p,
    imageUrl: p.imageUrl || p.coverImage || (Array.isArray(p.images) ? p.images[0] : undefined),
    images: Array.isArray(p.images) ? p.images : (p.coverImage ? [p.coverImage] : []),
    area: p.area ?? p.totalArea ?? p.builtArea ?? p.landArea ?? undefined,
  }
}

export const Properties = {
  // Marketplace público (mesma rota da web). Aceita `q`/`search`, `city`,
  // `limit` (máx. 50), `page`, `ids` (CSV). Resposta: { data, meta }.
  list: async (params: Record<string, string | number> = {}) => {
    const mapped: Record<string, string> = {}
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue
      mapped[k === 'q' ? 'search' : k] = String(v)
    }
    const qs = new URLSearchParams(mapped).toString()
    const res: any = await api(`/api/v1/public/properties${qs ? `?${qs}` : ''}`)
    const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])
    return { data: list.map(normalizeProperty), meta: res?.meta }
  },
  // Busca 1 imóvel por ID (usado nos favoritos) via filtro `ids` da lista —
  // a rota de detalhe é por slug, mas os favoritos guardam o ID.
  get: async (id: string | number) => {
    const res: any = await api(`/api/v1/public/properties?ids=${encodeURIComponent(String(id))}&limit=1`)
    const item = Array.isArray(res?.data) ? res.data[0] : null
    return item ? normalizeProperty(item) : null
  },
  // Detalhe por slug (objeto único), quando houver slug em vez do objeto completo.
  bySlug: async (slug: string) => normalizeProperty(await api(`/api/v1/public/properties/${encodeURIComponent(slug)}`)),
}

// "12/05/2026 - 11:53" (formato do leilão) → ISO, para o contador de dias.
function parseBrDateTime(s: any): string | undefined {
  if (typeof s !== 'string') return undefined
  const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s*-\s*(\d{2}):(\d{2}))?/)
  if (!m) return undefined
  const [, d, mo, y, hh = '00', mi = '00'] = m
  const dt = new Date(Number(y), Number(mo) - 1, Number(d), Number(hh), Number(mi))
  return isNaN(dt.getTime()) ? undefined : dt.toISOString()
}

// A API de leilões devolve coverImageUrl/price/link/auctionDate; a tela usa
// imageUrl/minBid/url/endsAt/title. Mapeamos aqui.
function normalizeAuction(a: any) {
  if (!a || typeof a !== 'object') return a
  return {
    ...a,
    title: a.title || a.description || a.propertyType || 'Imóvel em leilão',
    imageUrl: a.imageUrl || a.coverImageUrl || (Array.isArray(a.images) ? a.images[0] : undefined),
    minBid: a.minBid ?? a.price ?? undefined,
    url: a.url || a.link,
    endsAt: a.endsAt || parseBrDateTime(a.auctionDate),
  }
}

export const Auctions = {
  list: async (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
    const res: any = await api(`/api/v1/public/auctions${qs ? `?${qs}` : ''}`)
    const list = Array.isArray(res?.items) ? res.items : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []))
    return { data: list.map(normalizeAuction), meta: { total: res?.total, updatedAt: res?.updatedAt } }
  },
}

function median(nums: number[]): number {
  if (!nums.length) return 0
  const s = [...nums].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

export const Valuation = {
  /**
   * Avaliação imediata pelo MÉTODO COMPARATIVO usando imóveis reais à venda na
   * cidade (mesma base da web). Não existe endpoint que devolva um valor pronto
   * — a web calcula no cliente —, então buscamos comparáveis e estimamos por
   * mediana de R$/m² × área. Retorna { estimatedValue }.
   */
  create: async (payload: Record<string, any>) => {
    const area = Number(payload.area)
    if (!area || area <= 0) throw new ApiError('Informe a área (m²) para estimar o valor.', 400)

    const fetchComps = async (withPurpose: boolean) => {
      const q: Record<string, string> = { limit: '50' }
      if (payload.city) q.city = String(payload.city)
      if (withPurpose) q.purpose = 'SALE'
      const res: any = await api(`/api/v1/public/properties?${new URLSearchParams(q).toString()}`)
      return (Array.isArray(res?.data) ? res.data : [])
        .map((p: any) => ({ price: Number(p.price), a: Number(p.totalArea || p.builtArea || p.landArea) }))
        .filter((x: any) => x.price > 0 && x.a > 0)
    }

    let comps = await fetchComps(true)
    if (comps.length < 3) comps = await fetchComps(false) // amplia a amostra
    if (comps.length < 1) {
      throw new ApiError('Ainda não temos imóveis comparáveis nessa cidade para estimar. Fale com um corretor.', 404)
    }

    const ppm = median(comps.map((x: any) => x.price / x.a))
    const estimatedValue = Math.round((ppm * area) / 1000) * 1000 // arredonda ao milhar
    return { estimatedValue, comparables: comps.length, pricePerM2: Math.round(ppm) }
  },
}

export const Auth = {
  login: (email: string, password: string) =>
    api('/api/v1/auth/login', { method: 'POST', body: { email, password } }),
  register: (payload: { name: string; email: string; password: string; phone?: string }) =>
    api('/api/v1/auth/register', { method: 'POST', body: payload }),
  me: () => api('/api/v1/auth/me', { auth: true }),
}

export { API_URL }
