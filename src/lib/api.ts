const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Store JWT token
let authToken: string | null = localStorage.getItem('auth_token')

export function setAuthToken(token: string | null) {
  authToken = token
  if (token) localStorage.setItem('auth_token', token)
  else localStorage.removeItem('auth_token')
}

export function getAuthToken() { return authToken }

// Base fetch with auth header and error handling
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (authToken) (headers as any)['Authorization'] = `Bearer ${authToken}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erro na requisição' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }

  return res.json()
}

// ============ AUTH ============
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password })
    }),

  me: () => apiFetch<{ user: any }>('/api/auth/me'),

  updateProfile: (data: any) =>
    apiFetch('/api/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch('/api/auth/change-password', {
      method: 'POST', body: JSON.stringify({ currentPassword, newPassword })
    }),

  logout: () => setAuthToken(null)
}

// ============ PROPERTIES ============
export const propertiesApi = {
  list: (params?: Record<string, any>) => {
    const qs = params ? '?' + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => [k, String(v)])
    ).toString() : ''
    return apiFetch<{ properties: any[]; total: number; page: number; totalPages: number }>(`/api/properties${qs}`)
  },

  featured: () => apiFetch<{ properties: any[] }>('/api/properties/featured'),

  cities: () => apiFetch<{ cities: any[] }>('/api/properties/cities'),

  getById: (id: string) => apiFetch<{ property: any }>(`/api/properties/${id}`),

  create: (data: any) =>
    apiFetch('/api/properties', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiFetch(`/api/properties/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/api/properties/${id}`, { method: 'DELETE' }),

  incrementView: (id: string) =>
    apiFetch(`/api/properties/${id}/views`, { method: 'POST' }).catch(() => null),
}

// ============ LEADS ============
export const leadsApi = {
  list: (params?: Record<string, any>) => {
    const qs = params ? '?' + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : ''
    return apiFetch<{ leads: any[]; total: number }>(`/api/leads${qs}`)
  },

  create: (data: any) =>
    apiFetch('/api/leads', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiFetch(`/api/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  convert: (id: string) =>
    apiFetch(`/api/leads/${id}/convert`, { method: 'POST' }),
}

// ============ CLIENTS ============
export const clientsApi = {
  list: (params?: Record<string, any>) => {
    const qs = params ? '?' + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : ''
    return apiFetch<{ clients: any[]; total: number }>(`/api/clients${qs}`)
  },

  getById: (id: string) => apiFetch<{ client: any }>(`/api/clients/${id}`),

  create: (data: any) =>
    apiFetch('/api/clients', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: string, data: any) =>
    apiFetch(`/api/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiFetch(`/api/clients/${id}`, { method: 'DELETE' }),

  getMatches: (id: string) =>
    apiFetch<{ properties: any[] }>(`/api/clients/${id}/matches`),
}

// ============ NEGOTIATIONS ============
export const negotiationsApi = {
  list: (params?: Record<string, any>) => {
    const qs = params ? '?' + new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ).toString() : ''
    return apiFetch<{ negotiations: any[] }>(`/api/negotiations${qs}`)
  },

  kanban: () => apiFetch<{ kanban: Record<string, any[]> }>('/api/negotiations/kanban'),

  create: (data: any) =>
    apiFetch('/api/negotiations', { method: 'POST', body: JSON.stringify(data) }),

  updateStage: (id: string, stage: string) =>
    apiFetch(`/api/negotiations/${id}/stage`, {
      method: 'PUT', body: JSON.stringify({ stage })
    }),

  update: (id: string, data: any) =>
    apiFetch(`/api/negotiations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
}

// ============ DASHBOARD ============
export const dashboardApi = {
  stats: () => apiFetch<any>('/api/dashboard/stats'),
  negotiationsByMonth: () => apiFetch<any>('/api/dashboard/charts/negotiations-by-month'),
  leadsByOrigin: () => apiFetch<any>('/api/dashboard/charts/leads-by-origin'),
  activity: () => apiFetch<any>('/api/dashboard/activity'),
  agendaToday: () => apiFetch<any>('/api/dashboard/agenda-today'),
}

// ============ AI ============
export const aiApi = {
  search: (query: string, filters?: any) =>
    apiFetch<{ properties: any[]; total: number; correctedQuery?: string; parsedFilters?: any }>(
      '/api/ai/search', { method: 'POST', body: JSON.stringify({ query, filters }) }
    ),

  propertyScore: (propertyId: string) =>
    apiFetch<{ score: number; breakdown: any; analysis: string }>(
      '/api/ai/property-score', { method: 'POST', body: JSON.stringify({ propertyId }) }
    ),

  valuation: (data: any) =>
    apiFetch<{ priceRange: any; analysis: string; comparables: any[] }>(
      '/api/ai/valuation', { method: 'POST', body: JSON.stringify(data) }
    ),

  generateContent: (data: any) =>
    apiFetch<{ content: any }>(
      '/api/ai/content', { method: 'POST', body: JSON.stringify(data) }
    ),

  chat: (message: string, history?: any[]) =>
    apiFetch<{ response: string }>(
      '/api/ai/chat', { method: 'POST', body: JSON.stringify({ message, history }) }
    ),
}
