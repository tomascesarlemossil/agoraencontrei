/**
 * Typed API client for AgoraEncontrei API
 * Uses fetch with automatic token refresh
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3100'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toQS(params: any): string {
  if (!params) return ''
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
  return new URLSearchParams(clean as Record<string, string>).toString()
}

class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(fetchOptions.headers as Record<string, string>),
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.error ?? 'UNKNOWN', body.message ?? 'Request failed')
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (body: {
    name: string; email: string; password: string
    companyName?: string; phone?: string
  }) => request<{ user: User; accessToken: string; expiresIn: number }>(
    '/api/v1/auth/register', { method: 'POST', body: JSON.stringify(body) }
  ),

  login: (email: string, password: string) =>
    request<{ user: User; accessToken: string; refreshToken: string; expiresIn: number }>(
      '/api/v1/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }
    ),

  logout: () => request('/api/v1/auth/logout', { method: 'POST' }),

  refresh: (refreshToken?: string | null) =>
    request<{ user: User; accessToken: string; refreshToken: string; expiresIn: number }>(
      '/api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify(refreshToken ? { refreshToken } : {}),
      }
    ),

  me: (token: string) =>
    request<User & { company: Company }>('/api/v1/auth/me', { token }),

  googleLogin: (credential: string) =>
    request<{ user: User; accessToken: string; refreshToken: string; expiresIn: number }>(
      '/api/v1/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }
    ),

  changePassword: (token: string, currentPassword: string, newPassword: string) =>
    request('/api/v1/auth/change-password', {
      method: 'POST', token,
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
}

// ── Properties ──────────────────────────────────────────────────────────────

export const propertiesApi = {
  list: (params?: PropertyFilters) => {
    const qs = toQS(params)
    return request<PaginatedResponse<PropertySummary>>(`/api/v1/properties?${qs}`)
  },

  listProtected: (token: string, params?: PropertyFilters) => {
    const qs = toQS(params)
    return request<PaginatedResponse<PropertySummary>>(`/api/v1/properties?${qs}`, { token })
  },

  get: (slug: string) =>
    request<PropertyDetail>(`/api/v1/properties/${slug}`),

  getById: (token: string, id: string) =>
    request<PropertyDetail>(`/api/v1/properties/by-id/${id}`, { token }),

  create: (token: string, body: Partial<Property>) =>
    request<Property>('/api/v1/properties', {
      method: 'POST', token, body: JSON.stringify(body),
    }),

  update: (token: string, id: string, body: Partial<Property>) =>
    request<Property>(`/api/v1/properties/${id}`, {
      method: 'PATCH', token, body: JSON.stringify(body),
    }),

  delete: (token: string, id: string) =>
    request(`/api/v1/properties/${id}`, { method: 'DELETE', token }),

  stats: (token: string) =>
    request<PropertyStats>('/api/v1/properties/stats/summary', { token }),
}

// ── Leads ───────────────────────────────────────────────────────────────────

export const leadsApi = {
  list: (token: string, params?: any) => {
    const qs = toQS(params)
    return request<PaginatedResponse<Lead>>(`/api/v1/leads?${qs}`, { token })
  },

  get: (token: string, id: string) =>
    request<Lead & { activities: Activity[]; properties: any[]; deals: any[]; contact?: Contact }>(`/api/v1/leads/${id}`, { token }),

  create: (token: string, body: Partial<Lead>) =>
    request<Lead>('/api/v1/leads', { method: 'POST', token, body: JSON.stringify(body) }),

  update: (token: string, id: string, body: Partial<Lead>) =>
    request<Lead>(`/api/v1/leads/${id}`, { method: 'PATCH', token, body: JSON.stringify(body) }),
}

// ── Contacts ─────────────────────────────────────────────────────────────────

export const contactsApi = {
  list: (token: string, params?: any) => {
    const qs = toQS(params)
    return request<PaginatedResponse<Contact>>(`/api/v1/contacts?${qs}`, { token })
  },

  get: (token: string, id: string) =>
    request<ContactDetail>(`/api/v1/contacts/${id}`, { token }),

  create: (token: string, body: Partial<Contact>) =>
    request<Contact>('/api/v1/contacts', { method: 'POST', token, body: JSON.stringify(body) }),

  update: (token: string, id: string, body: Partial<Contact>) =>
    request<Contact>(`/api/v1/contacts/${id}`, { method: 'PATCH', token, body: JSON.stringify(body) }),

  delete: (token: string, id: string) =>
    request(`/api/v1/contacts/${id}`, { method: 'DELETE', token }),
}

// ── Deals ─────────────────────────────────────────────────────────────────────

export const dealsApi = {
  list: (token: string, params?: any) => {
    const qs = toQS(params)
    return request<PaginatedResponse<Deal>>(`/api/v1/deals?${qs}`, { token })
  },

  pipeline: (token: string) =>
    request<Record<string, Deal[]>>('/api/v1/deals/pipeline', { token }),

  get: (token: string, id: string) =>
    request<DealDetail>(`/api/v1/deals/${id}`, { token }),

  create: (token: string, body: Partial<Deal> & { propertyIds?: string[] }) =>
    request<Deal>('/api/v1/deals', { method: 'POST', token, body: JSON.stringify(body) }),

  update: (token: string, id: string, body: Partial<Deal>) =>
    request<Deal>(`/api/v1/deals/${id}`, { method: 'PATCH', token, body: JSON.stringify(body) }),

  createCommission: (token: string, dealId: string, body: { commissionRate: number; splitRate?: number; dueAt?: string }) =>
    request<Commission>(`/api/v1/deals/${dealId}/commission`, {
      method: 'POST', token, body: JSON.stringify(body),
    }),
}

// ── Activities ────────────────────────────────────────────────────────────────

export const activitiesApi = {
  list: (token: string, params?: any) => {
    const qs = toQS(params)
    return request<PaginatedResponse<Activity>>(`/api/v1/activities?${qs}`, { token })
  },

  create: (token: string, body: { type: string; title: string; description?: string; leadId?: string; dealId?: string; contactId?: string }) =>
    request<Activity>('/api/v1/activities', { method: 'POST', token, body: JSON.stringify(body) }),
}

// ── Portals ───────────────────────────────────────────────────────────────────

export const portalsApi = {
  list: (token: string) =>
    request<PortalConfig[]>('/api/v1/portals', { token }),

  upsertConfig: (token: string, portalId: string, body: Partial<PortalConfig>) =>
    request<PortalConfig>(`/api/v1/portals/${portalId}`, {
      method: 'PUT', token, body: JSON.stringify(body),
    }),

  publications: (token: string, params?: any) => {
    const qs = toQS(params)
    return request<PaginatedResponse<PortalPublication>>(`/api/v1/portals/publications?${qs}`, { token })
  },

  publish: (token: string, body: { propertyId: string; portalId: string; description?: string }) =>
    request<PortalPublication>('/api/v1/portals/publish', {
      method: 'POST', token, body: JSON.stringify(body),
    }),

  removePublication: (token: string, id: string) =>
    request(`/api/v1/portals/publications/${id}`, { method: 'DELETE', token }),
}

// ── Users ─────────────────────────────────────────────────────────────────────

export const usersApi = {
  list: (token: string) =>
    request<User[]>('/api/v1/users', { token }),

  get: (token: string, id: string) =>
    request<User & { _count: { leads: number; deals: number; properties: number } }>(`/api/v1/users/${id}`, { token }),

  create: (token: string, body: { name: string; email: string; password: string; role: string; phone?: string; creciNumber?: string }) =>
    request<User>('/api/v1/users', { method: 'POST', token, body: JSON.stringify(body) }),

  update: (token: string, id: string, body: { name?: string; phone?: string; bio?: string; creciNumber?: string; avatarUrl?: string; role?: string }) =>
    request<User>(`/api/v1/users/${id}`, { method: 'PATCH', token, body: JSON.stringify(body) }),

  delete: (token: string, id: string) =>
    request(`/api/v1/users/${id}`, { method: 'DELETE', token }),

  resetPassword: (token: string, id: string, newPassword: string) =>
    request<{ success: boolean; message: string }>(`/api/v1/users/${id}/reset-password`, {
      method: 'POST', token, body: JSON.stringify({ newPassword }),
    }),

  updateSiteSettings: (token: string, body: { heroVideoUrl?: string; heroVideoType?: string }) =>
    request<{ success: boolean; settings: Record<string, unknown> }>('/api/v1/users/site-settings', {
      method: 'PATCH', token, body: JSON.stringify(body),
    }),
}

// ── Reports ───────────────────────────────────────────────────────────────────

export const reportsApi = {
  overview: (token: string, params?: { year?: number; month?: number }) => {
    const qs = toQS(params)
    return request<ReportOverview>(`/api/v1/reports/overview?${qs}`, { token })
  },

  commissions: (token: string, params?: any) => {
    const qs = toQS(params)
    return request<PaginatedResponse<Commission>>(`/api/v1/reports/commissions?${qs}`, { token })
  },

  broker: (token: string, brokerId: string, params?: { year?: number; month?: number }) => {
    const qs = toQS(params)
    return request<any>(`/api/v1/reports/broker/${brokerId}?${qs}`, { token })
  },
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  companyId: string
  name: string
  email: string
  phone?: string
  avatarUrl?: string
  role: string
  status: string
  creciNumber?: string
  bio?: string
  lastLoginAt?: string
  createdAt: string
}

export interface Company {
  id: string
  name: string
  tradeName?: string
  logoUrl?: string
  plan: string
}

export interface PropertySummary {
  id: string
  reference?: string
  title: string
  slug: string
  type: string
  purpose: string
  category?: string
  status: string
  price?: number
  priceRent?: number
  neighborhood?: string
  city?: string
  state?: string
  totalArea?: number
  landArea?: number
  latitude?: number | null
  longitude?: number | null
  bedrooms: number
  bathrooms: number
  parkingSpaces: number
  coverImage?: string
  images: string[]
  isFeatured: boolean
  views: number
  createdAt: string
  captorName?: string
}

export interface PropertyDetail extends PropertySummary {
  description?: string
  condoFee?: number
  iptu?: number
  street?: string
  number?: string
  complement?: string
  zipCode?: string
  builtArea?: number
  suites: number
  floor?: number
  yearBuilt?: number
  features: string[]
  videoUrl?: string
  virtualTourUrl?: string
  metaTitle?: string
  metaDescription?: string
  user: { id: string; name: string; avatarUrl?: string; phone?: string; creciNumber?: string }
  owners?: Array<{ contact: { id: string; name: string; phone?: string; email?: string; cpf?: string; cnpj?: string } }>
}

export type Property = PropertyDetail

export interface PropertyStats {
  total: number
  active: number
  sold: number
  rented: number
  byType: Array<{ type: string; _count: number }>
  byCityTop5: Array<{ city: string; _count: number }>
}

export interface PropertyFilters {
  page?: number
  limit?: number
  search?: string
  type?: string
  purpose?: string
  status?: string
  city?: string
  neighborhood?: string
  state?: string
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  minArea?: number
  maxArea?: number
  sortBy?: string
  sortOrder?: string
}

export interface Lead {
  id: string
  name: string
  email?: string
  phone?: string
  status: string
  source?: string
  interest?: string
  budget?: number
  score: number
  assignedTo?: { id: string; name: string }
  createdAt: string
}

export interface Contact {
  id: string
  name: string
  type: 'INDIVIDUAL' | 'COMPANY'
  email?: string
  phone?: string
  cpf?: string
  cnpj?: string
  city?: string
  state?: string
  isOwner: boolean
  isTenant: boolean
  tags: string[]
  createdAt: string
}

export interface ContactDetail extends Contact {
  rg?: string
  birthDate?: string
  address?: string
  neighborhood?: string
  zipCode?: string
  notes?: string
  leads: Lead[]
  deals: Deal[]
  activities: Activity[]
}

export interface Deal {
  id: string
  title: string
  type: 'SALE' | 'RENT'
  status: string
  value?: number
  commission?: number
  notes?: string
  brokerId: string
  broker?: { id: string; name: string; avatarUrl?: string }
  contactId?: string
  contact?: { id: string; name: string }
  lead?: { id: string; name: string; status: string }
  expectedCloseAt?: string
  closedAt?: string
  createdAt: string
  updatedAt: string
}

export interface DealDetail extends Deal {
  properties: Array<{ property: PropertySummary }>
  commissions: Commission[]
  activities: Activity[]
}

export interface Commission {
  id: string
  dealId: string
  brokerId: string
  broker?: { id: string; name: string }
  dealValue: number
  commissionRate: number
  grossValue: number
  splitRate: number
  netValue: number
  status: string
  paidAmount: number
  paidAt?: string
  dueAt?: string
  notes?: string
  createdAt: string
}

export interface Activity {
  id: string
  type: string
  title: string
  description?: string
  leadId?: string
  dealId?: string
  contactId?: string
  propertyId?: string
  userId?: string
  user?: { id: string; name: string; avatarUrl?: string }
  scheduledAt?: string
  completedAt?: string
  createdAt: string
}

export interface ReportOverview {
  period: { year: number; month?: number; startDate: string; endDate: string }
  deals: {
    total: number
    closedWon: number
    closedLost: number
    open: number
    conversionRate: number
    closedValue: number
    closedCount: number
  }
  commissions: {
    total: number
    grossTotal: number
    netTotal: number
    paid: number
    pending: number
    pendingCount: number
  }
  brokerRanking: Array<{
    broker: { id: string; name: string; avatarUrl?: string }
    dealsCount: number
    totalValue: number
  }>
  dealsByMonth: Array<{ month: string; count: number; total: number }>
  recentDeals: Deal[]
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

// ── Inbox (Lemos.chat) ────────────────────────────────────────────────────────

export const inboxApi = {
  list: (token: string, params?: any) => {
    const qs = toQS(params)
    return request<PaginatedResponse<Conversation>>(`/api/v1/inbox?${qs}`, { token })
  },

  get: (token: string, id: string) =>
    request<Conversation & { messages: Message[] }>(`/api/v1/inbox/${id}`, { token }),

  update: (token: string, id: string, body: { status?: string; assignedToId?: string | null }) =>
    request<Conversation>(`/api/v1/inbox/${id}`, { method: 'PATCH', token, body: JSON.stringify(body) }),

  stats: (token: string) =>
    request<{ total: number; open: number; bot: number; unreadTotal: number }>('/api/v1/inbox/stats/summary', { token }),

  send: (token: string, body: { to: string; text: string; conversationId?: string }) =>
    request('/api/v1/whatsapp/send', { method: 'POST', token, body: JSON.stringify(body) }),
}

// ── Agents ────────────────────────────────────────────────────────────────────

export const agentsApi = {
  extractPdf: (token: string, base64Pdf: string, propertyId?: string) =>
    request<{ jobId: string; result: any }>('/api/v1/agents/pdf', {
      method: 'POST', token, body: JSON.stringify({ base64Pdf, propertyId }),
    }),

  transcribe: (token: string, base64Audio: string, opts?: { leadId?: string; contactId?: string; dealId?: string }) =>
    request<{ jobId: string; result: any }>('/api/v1/agents/transcribe', {
      method: 'POST', token, body: JSON.stringify({ base64Audio, ...opts }),
    }),

  copywrite: (token: string, propertyId: string, portal: string) =>
    request<{ jobId: string; result: { title: string; description: string; hashtags?: string[] } }>('/api/v1/agents/copywrite', {
      method: 'POST', token, body: JSON.stringify({ propertyId, portal }),
    }),

  scoreLead: (token: string, leadId: string) =>
    request<{ score: number; reasoning: string }>('/api/v1/agents/score-lead', {
      method: 'POST', token, body: JSON.stringify({ leadId }),
    }),

  jobs: (token: string, params?: any) => {
    const qs = toQS(params)
    return request<AgentJob[]>(`/api/v1/agents/jobs?${qs}`, { token })
  },
}

export interface Conversation {
  id: string
  companyId: string
  phone: string
  contactName?: string
  channel: string
  status: string
  assignedToId?: string
  assignedTo?: { id: string; name: string; avatarUrl?: string }
  leadId?: string
  lead?: { id: string; name: string; status: string }
  contactId?: string
  contact?: { id: string; name: string; phone?: string; email?: string }
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
  botState: Record<string, unknown>
  createdAt: string
  updatedAt: string
  _count?: { messages: number }
}

export interface Message {
  id: string
  conversationId: string
  whatsappId?: string
  direction: 'inbound' | 'outbound'
  type: string
  content?: string
  mediaUrl?: string
  status: string
  sentBy?: string
  metadata: Record<string, unknown>
  createdAt: string
}

export interface AgentJob {
  id: string
  companyId: string
  type: string
  status: string
  input: Record<string, unknown>
  output?: Record<string, unknown>
  errorMsg?: string
  propertyId?: string
  leadId?: string
  dealId?: string
  contactId?: string
  createdAt: string
  updatedAt: string
}

export interface PortalConfig {
  id: string
  companyId: string
  portalId: string
  portalName: string
  apiKey?: string
  apiSecret?: string
  settings: Record<string, unknown>
  isActive: boolean
  isPaid: boolean
  lastSyncAt?: string
  createdAt: string
  updatedAt: string
}

export interface PortalPublication {
  id: string
  propertyId: string
  property?: { id: string; title: string; slug: string; coverImage?: string }
  portalId: string
  externalId?: string
  status: string
  publishedAt?: string
  errorMsg?: string
  description?: string
  createdAt: string
  updatedAt: string
}

// ── Automation Engine ─────────────────────────────────────────────────────────

export interface AutomationRule {
  id: string
  companyId: string
  name: string
  description?: string
  trigger: string
  conditions: Array<{ field: string; op: string; value: unknown }>
  actions: Array<{ type: string; params: Record<string, unknown> }>
  isActive: boolean
  lastTriggeredAt?: string
  createdAt: string
  updatedAt: string
  logs?: AutomationLog[]
}

export interface AutomationLog {
  id: string
  ruleId: string
  triggeredBy: string
  payload: Record<string, unknown>
  status: 'pending' | 'running' | 'done' | 'failed'
  result?: unknown
  errorMsg?: string
  createdAt: string
}

export const automationsApi = {
  list: (token: string, params?: Record<string, string>) =>
    request<{ data: AutomationRule[]; meta: { total: number; page: number; limit: number; pages: number } }>(
      `/api/v1/automations${params ? '?' + toQS(params) : ''}`,
      { token },
    ),

  get: (token: string, id: string) =>
    request<AutomationRule & { logs: AutomationLog[] }>(`/api/v1/automations/${id}`, { token }),

  create: (token: string, body: Partial<AutomationRule>) =>
    request<AutomationRule>('/api/v1/automations', {
      method: 'POST', token, body: JSON.stringify(body),
    }),

  update: (token: string, id: string, body: Partial<AutomationRule>) =>
    request<AutomationRule>(`/api/v1/automations/${id}`, {
      method: 'PATCH', token, body: JSON.stringify(body),
    }),

  delete: (token: string, id: string) =>
    request(`/api/v1/automations/${id}`, { method: 'DELETE', token }),

  logs: (token: string, id: string, params?: Record<string, string>) =>
    request<{ data: AutomationLog[]; meta: { total: number; page: number; limit: number; pages: number } }>(
      `/api/v1/automations/${id}/logs${params ? '?' + toQS(params) : ''}`,
      { token },
    ),

  test: (token: string, id: string) =>
    request<{ queued: boolean }>(`/api/v1/automations/${id}/test`, {
      method: 'POST', token, body: '{}',
    }),
}

export { ApiError }

// ── Finance / Lemosbank ──────────────────────────────────────────────────────

export interface FinanceSummary {
  period: { start: string; end: string }
  income: number
  expenses: number
  balance: number
  expectedIncome: number
  activeContracts: number
  totalClients: number
  lateRentals: number
  totalRentals: number
  inadimplencia: number
  upcomingRentals: UpcomingRental[]
  // UnilocWeb stats
  newContractsThisMonth: number
  contractsFinishedThisMonth: number
  contractsExpiringSoon: number
  contractsWithRepasse: number
  totalContracts: number
  finishedContracts: number
  canceledContracts: number
  contractsWithIptu: number
  lateRentalsList: UpcomingRental[]
  cobrancasAReceber: number
  cobrancasRecebidas: number
}

export interface UpcomingRental {
  id: string
  dueDate: string
  totalAmount: number | null
  rentAmount: number | null
  status: string
  contract: {
    tenantName: string | null
    propertyAddress: string | null
    landlordName: string | null
  } | null
}

export interface CashflowPoint {
  label: string
  year: number
  month: number
  income: number
  expenses: number
  balance: number
  forecast: number
}

export interface CashflowData {
  data: CashflowPoint[]
  monthlyForecast: number
}

export interface LegacyClient {
  id: string
  legacyId: string | null
  name: string
  document: string | null
  rg: string | null
  email: string | null
  phone: string | null
  phoneMobile: string | null
  phoneWork: string | null
  address: string | null
  addressComplement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  profession: string | null
  birthDate: string | null
  roles: string[]
  notes: string | null
  maritalStatus: string | null
  nationality: string | null
  spouseName: string | null
  spouseDocument: string | null
  spouseProfession: string | null
  income: number | null
  spouseIncome: number | null
  bankName: string | null
  bankBranch: string | null
  bankAccount: string | null
  bankAccountType: string | null
  pixKey: string | null
  observations: string | null
  isArchived: boolean
  archivedAt: string | null
  archivedReason: string | null
  createdAt: string
  contractsAsTenant?: LegacyContract[]
  contractsAsLandlord?: LegacyContract[]
  contractsAsGuarantor?: LegacyContract[]
}

export interface LegacyContract {
  id: string
  legacyId: string | null
  propertyAddress: string | null
  landlordName: string | null
  tenantName: string | null
  startDate: string | null
  rentValue: number | null
  status: string
  isActive: boolean
  iptuCode: string | null
  tenant: { id: string; name: string; phone: string | null; email: string | null } | null
  landlord: { id: string; name: string; phone: string | null } | null
}

export interface LegacyRental {
  id: string
  dueDate: string | null
  paymentDate: string | null
  rentAmount: number | null
  totalAmount: number | null
  paidAmount: number | null
  status: string
}

export interface LegacyContractDetail extends LegacyContract {
  adjustmentIndex: string | null
  tenantDueDay: number | null
  landlordDueDay: number | null
  duration: number | null
  commission: number | null
  penalty: number | null
  adjustmentPercent: number | null
  initialValue: number | null
  rescissionDate: string | null
  rentals: LegacyRental[]
  tenant: { id: string; name: string; phone: string | null; email: string | null; document: string | null; roles: string[] } | null
  landlord: { id: string; name: string; phone: string | null; email: string | null; document: string | null; roles: string[] } | null
}

export const financeApi = {
  summary: (token: string) =>
    request<FinanceSummary>('/api/v1/finance/summary', { token }),

  cashflow: (token: string) =>
    request<CashflowData>('/api/v1/finance/cashflow', { token }),

  clients: (token: string, params?: Record<string, string>) =>
    request<{ data: LegacyClient[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `/api/v1/finance/clients${params ? '?' + toQS(params) : ''}`,
      { token },
    ),

  client: (token: string, id: string) =>
    request<LegacyClient>(`/api/v1/finance/clients/${id}`, { token }),
  createClient: (token: string, body: Partial<LegacyClient> & { name: string }) =>
    request<LegacyClient>('/api/v1/finance/clients', {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),
  updateClient: (token: string, id: string, body: Partial<LegacyClient>) =>
    request<LegacyClient>(`/api/v1/finance/clients/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(body),
    }),

  contracts: (token: string, params?: Record<string, string>) =>
    request<{ data: LegacyContract[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `/api/v1/finance/contracts${params ? '?' + toQS(params) : ''}`,
      { token },
    ),

  contract: (token: string, id: string) =>
    request<LegacyContractDetail>(`/api/v1/finance/contracts/${id}`, { token }),

  rentals: (token: string, params?: Record<string, string>) =>
    request<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `/api/v1/finance/rentals${params ? '?' + toQS(params) : ''}`,
      { token },
    ),

  repasses: (token: string, params?: Record<string, string>) =>
    request<{ data: any[]; meta: { total: number; totalRepasseAReceber: number; totalRepassePago: number } }>(
      `/api/v1/finance/repasses${params ? '?' + toQS(params) : ''}`,
      { token },
    ),

  registrarRescisao: (token: string, contractId: string, body: { rescissionDate?: string; status?: 'FINISHED' | 'CANCELED'; motivo?: string; multaRescisao?: number }) =>
    request<any>(`/api/v1/finance/contracts/${contractId}/rescisao`, {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),

  renovarContrato: (token: string, contractId: string, body: { duration: number; novoValor?: number; indiceReajuste?: string }) =>
    request<any>(`/api/v1/finance/contracts/${contractId}/renovar`, {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),

  aplicarReajuste: (token: string, contractId: string, body: { percentual: number; motivo?: string; dataAplicacao?: string }) =>
    request<any>(`/api/v1/finance/contracts/${contractId}/reajuste`, {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),

  pagarAluguel: (token: string, rentalId: string, body: { paidAmount?: number; paymentDate?: string; paymentMethod?: string; bankName?: string; docNumber?: string; observations?: string }) =>
    request<any>(`/api/v1/finance/rentals/${rentalId}/pay`, {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),

  estornarAluguel: (token: string, rentalId: string) =>
    request<any>(`/api/v1/finance/rentals/${rentalId}/estorno`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({}),
    }),

  summaryMonth: (token: string, month: string) =>
    request<{
      period: string
      paid:    { count: number; total: number }
      pending: { count: number; total: number }
      late:    { count: number; total: number }
      totalRentals: number
      inadimplencia: number
    }>(`/api/v1/finance/summary/month?month=${month}`, { token }),

  rentalsByMonth: (token: string, params: Record<string, string>) =>
    request<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `/api/v1/finance/rentals/by-month?${toQS(params)}`,
      { token },
    ),

  recibo: (token: string, rentalId: string) =>
    request<{ html: string }>(`/api/v1/finance/rentals/${rentalId}/recibo`, { token }),

  sendEmail: (token: string, rentalId: string, body: { to: string; subject?: string; message?: string }) =>
    request<{ sent: boolean }>(`/api/v1/finance/rentals/${rentalId}/send-email`, {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),

  sendWhatsapp: (token: string, rentalId: string, body: { phone: string; message?: string }) =>
    request<{ sent: boolean }>(`/api/v1/finance/rentals/${rentalId}/send-whatsapp`, {
      method: 'POST',
      token,
      body: JSON.stringify(body),
    }),

  marcarRepassePago: (token: string, rentalId: string, repassePaidAt?: string) =>
    request<any>(`/api/v1/finance/rentals/${rentalId}/repasse-paid`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ repassePaidAt }),
    }),

  estornarRepasse: (token: string, rentalId: string) =>
    request<any>(`/api/v1/finance/rentals/${rentalId}/repasse-estorno`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({}),
    }),

  contractHistory: (token: string, contractId: string) =>
    request<{ data: any[]; total: number }>(`/api/v1/finance/contracts/${contractId}/history`, { token }),
}

// ── Upload ─────────────────────────────────────────────────────────────────────

export const uploadApi = {
  upload: async (token: string, file: File): Promise<{ url: string; key: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${API_URL}/api/v1/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
      body: formData,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new ApiError(res.status, body.error ?? 'UPLOAD_FAILED', body.message ?? 'Upload failed')
    }
    return res.json()
  },
}

// ── Corretor (Broker) ──────────────────────────────────────────────────────────

export const corretorApi = {
  stats: (token: string) =>
    request<{
      leads: { total: number; new: number; active: number; won: number; lost: number }
      deals: { total: number; active: number; won: number }
      activities: { total: number; thisMonth: number; pending: number }
      conversionRate: number
    }>('/api/v1/corretor/stats', { token }),

  leads: (token: string, params?: Record<string, string>) =>
    request<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `/api/v1/corretor/leads${params ? '?' + toQS(params) : ''}`,
      { token },
    ),

  deals: (token: string, params?: Record<string, string>) =>
    request<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `/api/v1/corretor/deals${params ? '?' + toQS(params) : ''}`,
      { token },
    ),

  activities: (token: string, params?: Record<string, string>) =>
    request<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `/api/v1/corretor/activities${params ? '?' + toQS(params) : ''}`,
      { token },
    ),

  ranking: (token: string) =>
    request<Array<{ id: string; name: string; avatarUrl: string | null; leads: number; wonDeals: number; monthLeads: number; score: number }>>(
      '/api/v1/corretor/ranking',
      { token },
    ),
}

// ── CRM Renovações ─────────────────────────────────────────────────────────────

export const renovacoesApi = {
  list: (token: string) =>
    request<{
      vencendo30: any[]
      vencendo60: any[]
      vencendo90: any[]
      semContato: any[]
      stats: { urgente: number; atencao: number; aviso: number; semContato: number }
    }>('/api/v1/crm/renovacoes', { token }),

  marcaContatado: (token: string, clientId: string) =>
    request<{ success: boolean }>(`/api/v1/crm/renovacoes/contato/${clientId}`, {
      token,
      method: 'PATCH',
    }),
}

// ── Marketing Campanhas ────────────────────────────────────────────────────────

export const campanhasApi = {
  list: (token: string, params?: Record<string, string>) =>
    request<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `/api/v1/marketing/campanhas${params ? '?' + toQS(params) : ''}`,
      { token },
    ),

  create: (token: string, body: { nome: string; tipo: string; segmento: string; mensagem: string; agendadoPara?: string }) =>
    request<any>('/api/v1/marketing/campanhas', { token, method: 'POST', body: JSON.stringify(body) }),

  previewCount: (token: string, segmento: string) =>
    request<{ count: number }>(`/api/v1/marketing/campanhas/preview-count?segmento=${encodeURIComponent(segmento)}`, { token }),

  update: (token: string, id: string, body: Partial<{ nome: string; tipo: string; segmento: string; mensagem: string; agendadoPara: string }>) =>
    request<any>(`/api/v1/marketing/campanhas/${id}`, { token, method: 'PUT', body: JSON.stringify(body) }),

  enviar: (token: string, id: string) =>
    request<{ queued: number }>(`/api/v1/marketing/campanhas/${id}/enviar`, { token, method: 'POST' }),

  cancelar: (token: string, id: string) =>
    request<any>(`/api/v1/marketing/campanhas/${id}/cancelar`, { token, method: 'POST' }),

  delete: (token: string, id: string) =>
    request<void>(`/api/v1/marketing/campanhas/${id}`, { token, method: 'DELETE' }),
}

// ── IA Visual ─────────────────────────────────────────────────────────────────

export const aiVisualApi = {
  createJob: (token: string, body: { propertyId: string; tipo: 'render' | 'staging' | 'enhance_batch'; inputUrl: string; style?: string }) =>
    request<any>('/api/v1/ai-visual/jobs', { token, method: 'POST', body: JSON.stringify(body) }),

  listJobs: (token: string, params?: Record<string, string>) =>
    request<{ data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `/api/v1/ai-visual/jobs${params ? '?' + toQS(params) : ''}`,
      { token },
    ),

  getJob: (token: string, id: string) =>
    request<any>(`/api/v1/ai-visual/jobs/${id}`, { token }),

  deleteJob: (token: string, id: string) =>
    request<void>(`/api/v1/ai-visual/jobs/${id}`, { token, method: 'DELETE' }),

  stats: (token: string) =>
    request<{ PENDING: number; PROCESSING: number; DONE: number; ERROR: number }>(
      '/api/v1/ai-visual/stats',
      { token },
    ),
}

// ── Financiamentos ─────────────────────────────────────────────────────────────

export type FinancingStage = 'SIMULACAO' | 'ANALISE_CREDITO' | 'ANALISE_JURIDICA' | 'EMISSAO_CONTRATO' | 'REGISTRO_CONTRATO' | 'CONCLUIDO' | 'CANCELADO'

export interface Financing {
  id: string
  companyId: string
  brokerId: string
  contactId?: string
  propertyId?: string
  dealId?: string
  stage: FinancingStage
  bank?: string
  propertyValue?: number
  financedValue?: number
  downPayment?: number
  fgtsValue?: number
  monthlyPayment?: number
  term?: number
  rate?: number
  notes?: string
  simulatorLink?: string
  clientName?: string
  clientPhone?: string
  clientEmail?: string
  completedAt?: string
  cancelledAt?: string
  createdAt: string
  updatedAt: string
  contact?: { id: string; name: string; phone?: string; email?: string }
  property?: { id: string; reference?: string; title: string; coverImage?: string }
  broker?: { id: string; name: string }
  deal?: { id: string; title: string; status: string }
}

export interface FinancingSummary {
  total: number
  active: number
  completed: number
  cancelled: number
  totalFinancedValue: number
  totalPropertyValue: number
  byStage: { stage: FinancingStage; count: number; value: number }[]
}

export const financingsApi = {
  list: (token: string, params?: Record<string, string>) =>
    request<{ data: Financing[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `/api/v1/financings${params ? '?' + toQS(params) : ''}`,
      { token },
    ),

  summary: (token: string) =>
    request<FinancingSummary>('/api/v1/financings/summary', { token }),

  get: (token: string, id: string) =>
    request<Financing>(`/api/v1/financings/${id}`, { token }),

  create: (token: string, body: Partial<Financing>) =>
    request<Financing>('/api/v1/financings', { token, method: 'POST', body: JSON.stringify(body) }),

  update: (token: string, id: string, body: Partial<Financing>) =>
    request<Financing>(`/api/v1/financings/${id}`, { token, method: 'PATCH', body: JSON.stringify(body) }),

  delete: (token: string, id: string) =>
    request<void>(`/api/v1/financings/${id}`, { token, method: 'DELETE' }),
}

// ── Invoice / Boleto API ─────────────────────────────────────────────────────
export interface Invoice {
  id:              string
  companyId:       string
  contractId?:     string | null
  legacyContractCode?: string | null
  legacyTenantCode?:   string | null
  cedente?:        string | null
  numBoleto?:      string | null
  banco?:          string | null
  carteira?:       string | null
  codigoBarras?:   string | null
  linhaDigitavel?: string | null
  nossoNumero?:    string | null
  issueDate?:      string | null
  dueDate?:        string | null
  amount?:         number | null
  mensagem?:       string | null
  instrucoes?:     string | null
  asaasId?:        string | null
  asaasStatus?:    string | null
  asaasBankSlipUrl?: string | null
  asaasPixCode?:   string | null
  createdAt:       string
  contract?: {
    tenantName?:      string | null
    propertyAddress?: string | null
    landlordName?:    string | null
  } | null
}

export const invoiceApi = {
  list: (token: string, params?: Record<string, string>) =>
    request<{ data: Invoice[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      `/api/v1/finance/invoices${params ? '?' + toQS(params) : ''}`,
      { token },
    ),
  get: (token: string, id: string) =>
    request<Invoice>(`/api/v1/finance/invoices/${id}`, { token }),
  create: (token: string, body: Partial<Invoice> & { dueDate: string; amount: number }) =>
    request<Invoice>('/api/v1/finance/invoices', { token, method: 'POST', body: JSON.stringify(body) }),
  update: (token: string, id: string, body: Partial<Invoice>) =>
    request<Invoice>(`/api/v1/finance/invoices/${id}`, { token, method: 'PATCH', body: JSON.stringify(body) }),
  charge: (token: string, body: { invoiceId: string; billingType?: string; dueDate?: string; discount?: number }) =>
    request<{ invoice: Invoice; charge: Record<string, unknown> }>('/api/v1/finance/invoices/charge', { token, method: 'POST', body: JSON.stringify(body) }),
  syncStatus: (token: string, id: string) =>
    request<{ invoice: Invoice; charge: Record<string, unknown> }>(`/api/v1/finance/invoices/${id}/status`, { token }),
  cancel: (token: string, id: string) =>
    request<{ invoice: Invoice }>(`/api/v1/finance/invoices/${id}/charge`, { token, method: 'DELETE' }),
  balance: (token: string) =>
    request<{ balance: number; availableBalance: number; transferredThisMonth: number }>('/api/v1/finance/invoices/asaas/balance', { token }),
}

// ── Finance Automation API ────────────────────────────────────────────────────
export const financeAutomationApi = {
  dashboard: (token: string) =>
    request<any>('/api/v1/finance/automation/dashboard', { token }),

  previewMes: (token: string, month?: string) =>
    request<any>(`/api/v1/finance/automation/preview-mes${month ? `?month=${month}` : ''}`, { token }),

  gerarCobrancasMes: (token: string, body: { month?: string; preview?: boolean; contractIds?: string[] }) =>
    request<any>('/api/v1/finance/automation/gerar-cobracas-mes', { token, method: 'POST', body: JSON.stringify(body) }),

  atualizarStatusLote: (token: string) =>
    request<any>('/api/v1/finance/automation/atualizar-status-lote', { token, method: 'POST', body: JSON.stringify({}) }),

  cobrarLoteAsaas: (token: string, body: { rentalIds?: string[]; billingType?: 'PIX' | 'BOLETO'; month?: string }) =>
    request<any>('/api/v1/finance/automation/cobrar-lote-asaas', { token, method: 'POST', body: JSON.stringify(body) }),

  repassesLote: (token: string, body: { rentalIds?: string[]; repassePaidAt?: string; month?: string }) =>
    request<any>('/api/v1/finance/automation/repasses-lote', { token, method: 'POST', body: JSON.stringify(body) }),

  notificarLote: (token: string, body: { rentalIds?: string[]; canal: 'whatsapp' | 'email'; mensagem?: string }) =>
    request<any>('/api/v1/finance/automation/notificar-lote', { token, method: 'POST', body: JSON.stringify(body) }),

  relatorioMensal: (token: string, month?: string) =>
    request<any>(`/api/v1/finance/automation/relatorio-mensal${month ? `?month=${month}` : ''}`, { token }),
}

// ── Auctions API (Leilões) ────────────────────────────────────────────────────
export const auctionsApi = {
  list: (params?: {
    page?: number; limit?: number; city?: string; state?: string;
    source?: string; status?: string; propertyType?: string;
    minPrice?: number; maxPrice?: number; minDiscount?: number;
    minScore?: number; bedrooms?: number; search?: string;
    sortBy?: string; sortOrder?: string;
  }) =>
    request<{ data: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/api/v1/auctions?${toQS(params)}`
    ),

  getBySlug: (slug: string) =>
    request<any>(`/api/v1/auctions/${slug}`),

  stats: () =>
    request<any>('/api/v1/auctions/stats'),

  map: (params?: { city?: string; state?: string; source?: string; propertyType?: string }) =>
    request<{ data: any[]; total: number }>(`/api/v1/auctions/map?${toQS(params)}`),

  calculate: (data: {
    bidValue: number; appraisalValue?: number; city?: string; state?: string;
    propertyType?: string; totalArea?: number; needsReform?: boolean;
    reformEstimate?: number; isOccupied?: boolean; monthlyRentEstimate?: number;
  }) =>
    request<any>('/api/v1/auctions/calculate', { method: 'POST', body: JSON.stringify(data) }),

  analysis: (idOrSlug: string) =>
    request<any>(`/api/v1/auctions/${idOrSlug}/analysis`),

  createAlert: (data: {
    email?: string; phone?: string; city?: string; state?: string;
    propertyType?: string; minDiscount?: number; maxPrice?: number;
    minScore?: number; source?: string; keywords?: string[]; frequency?: string;
  }) =>
    request<any>('/api/v1/auctions/alerts', { method: 'POST', body: JSON.stringify(data) }),

  cancelAlert: (token: string) =>
    request<any>(`/api/v1/auctions/alerts/${token}`, { method: 'DELETE' }),

  sources: () =>
    request<any>('/api/v1/auctions/sources'),

  scraperStatus: () =>
    request<any>('/api/v1/auctions/scraper-status'),
}

// ── Hunter Mode ──────────────────────────────────────────────────────────────

export const hunterApi = {
  list: (token: string, params?: { status?: string; limit?: string; offset?: string }) => {
    const qs = toQS(params)
    return request<{ data: any[]; meta: { total: number; limit: number; offset: number } }>(`/api/v1/hunter/leads?${qs}`, { token })
  },

  create: (token: string, body: {
    leadId?: string; contactId?: string; visitorId?: string;
    name?: string; phone?: string; email?: string;
    filters: Record<string, any>; source?: string
  }) =>
    request<{ data: any }>('/api/v1/hunter/leads', { method: 'POST', token, body: JSON.stringify(body) }),

  update: (token: string, id: string, body: { status?: string; notes?: string }) =>
    request<{ data: any }>(`/api/v1/hunter/leads/${id}`, { method: 'PUT', token, body: JSON.stringify(body) }),

  stats: (token: string) =>
    request<{ total: number; active: number; fulfilled: number; expired: number; contacted: number }>('/api/v1/hunter/stats', { token }),
}

// ── Affiliates ───────────────────────────────────────────────────────────────

export const affiliateApi = {
  list: (token: string, params?: { limit?: string; offset?: string; isActive?: string }) => {
    const qs = toQS(params)
    return request<{ data: any[]; meta: { total: number; limit: number; offset: number } }>(`/api/v1/affiliates?${qs}`, { token })
  },

  create: (token: string, body: { name: string; email: string; phone?: string }) =>
    request<{ data: any }>('/api/v1/affiliates', { method: 'POST', token, body: JSON.stringify(body) }),

  get: (token: string, id: string) =>
    request<{ data: any }>(`/api/v1/affiliates/${id}`, { token }),

  update: (token: string, id: string, body: { name?: string; phone?: string; level?: string; isActive?: boolean }) =>
    request<{ data: any }>(`/api/v1/affiliates/${id}`, { method: 'PUT', token, body: JSON.stringify(body) }),

  byCode: (code: string) =>
    request<{ data: any }>(`/api/v1/affiliates/by-code/${code}`),

  earnings: (token: string, id: string, params?: { limit?: string; status?: string }) => {
    const qs = toQS(params)
    return request<{ data: any[] }>(`/api/v1/affiliates/${id}/earnings?${qs}`, { token })
  },

  stats: (token: string, id: string) =>
    request<{ totalEarnings: number; pendingEarnings: number; paidEarnings: number; totalClients: number; level: string; commissionRate: number; code: string }>(`/api/v1/affiliates/${id}/stats`, { token }),
}

// ── SaaS Finance ─────────────────────────────────────────────────────────────

export const saasFinanceApi = {
  transactions: (token: string, params?: { status?: string; type?: string; limit?: string; offset?: string }) => {
    const qs = toQS(params)
    return request<{ data: any[]; meta: { total: number; limit: number; offset: number } }>(`/api/v1/saas-finance/transactions?${qs}`, { token })
  },

  summary: (token: string) =>
    request<{
      totalReceived: number; totalPending: number; totalOverdue: number;
      todayReceived: number; monthReceived: number; monthPending: number;
      mrr: number; arr: number
    }>('/api/v1/saas-finance/summary', { token }),

  intelligence: (token: string) =>
    request<{
      revenue: { today: number; month: number; mrr: number; arr: number; forecast: number; dailyAvg: number };
      tenants: { byStatus: Record<string, number>; byPlan: any[]; total: number; active: number };
      affiliates: { active: number; monthCommissions: number; monthTransactions: number };
      transactions: { byType: any[] }
    }>('/api/v1/saas-finance/intelligence', { token }),

  syncPayment: (token: string, body: {
    asaasId: string; tenantId?: string; type: string; status: string; amount: number;
    dueDate?: string; description?: string; externalRef?: string; billingType?: string;
    pixCode?: string; bankSlipUrl?: string; affiliateId?: string; commissionAmount?: number
  }) =>
    request<{ data: any }>('/api/v1/saas-finance/sync-payment', { method: 'POST', token, body: JSON.stringify(body) }),
}

// ── Preview ──────────────────────────────────────────────────────────────────

export const previewApi = {
  generate: (siteName: string, theme?: string) => {
    const qs = toQS({ theme })
    return request<{ data: any }>(`/api/v1/preview/${encodeURIComponent(siteName)}?${qs}`)
  },
}
