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
  'https://api.agoraencontrei.com.br'

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

export const Properties = {
  list: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
    return api(`/api/v1/public/free-listing${qs ? `?${qs}` : ''}`)
  },
  get: (id: string | number) => api(`/api/v1/public/free-listing/${id}`),
}

export const Auctions = {
  list: (params: Record<string, string | number> = {}) => {
    const qs = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
    return api(`/api/v1/public/auctions${qs ? `?${qs}` : ''}`)
  },
}

export const Valuation = {
  // Avaliação imediata (1ª grátis por CPF) — mesma rota pública da web.
  create: (payload: Record<string, unknown>) =>
    api('/api/v1/public/valuation', { method: 'POST', body: payload }),
}

export const Auth = {
  login: (email: string, password: string) =>
    api('/api/v1/auth/login', { method: 'POST', body: { email, password } }),
  register: (payload: { name: string; email: string; password: string; phone?: string }) =>
    api('/api/v1/auth/register', { method: 'POST', body: payload }),
  me: () => api('/api/v1/auth/me', { auth: true }),
}

export { API_URL }
