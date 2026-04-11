/**
 * Asaas Service — emissão de boletos / PIX e split de pagamentos
 * Docs: https://docs.asaas.com/
 */

import { env } from '../utils/env.js'

const BASE_URL   = env.ASAAS_BASE_URL  ?? 'https://www.asaas.com/api/v3'
const API_KEY    = env.ASAAS_API_KEY   ?? ''
export const WALLET_ID = env.ASAAS_WALLET_ID ?? ''

// ── Types ────────────────────────────────────────────────────────────────────

export type AsaasBillingType = 'BOLETO' | 'PIX' | 'CREDIT_CARD' | 'UNDEFINED'

export interface AsaasCustomerPayload {
  name: string
  cpfCnpj: string
  email?: string
  phone?: string
  mobilePhone?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string   // bairro
  postalCode?: string
}

export interface AsaasChargePayload {
  customer: string        // Asaas customer ID
  billingType: AsaasBillingType
  value: number
  dueDate: string         // YYYY-MM-DD
  description?: string
  externalReference?: string  // nosso legacyId
  discount?: { value: number; dueDateLimitDays: number; type: 'FIXED' | 'PERCENTAGE' }
  interest?: { value: number }  // % ao mês
  fine?: { value: number }      // % multa
  postalService?: boolean
}

export interface AsaasCustomer {
  id: string
  name: string
  cpfCnpj: string
  email?: string
}

export interface AsaasCharge {
  id: string
  customer: string
  billingType: string
  value: number
  dueDate: string
  status: string
  bankSlipUrl?: string
  invoiceUrl?: string
  pixCode?: string       // PIX Copia e Cola
  pixQrCodeUrl?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function asaasFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      access_token: API_KEY,
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Asaas API ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

// ── Customer API ─────────────────────────────────────────────────────────────

export async function findOrCreateCustomer(
  payload: AsaasCustomerPayload,
): Promise<AsaasCustomer> {
  // Tenta buscar por CPF/CNPJ primeiro
  const list = await asaasFetch<{ data: AsaasCustomer[] }>(
    `/customers?cpfCnpj=${payload.cpfCnpj.replace(/\D/g, '')}`,
  )

  if (list.data.length > 0) return list.data[0]

  // Cria novo cliente
  return asaasFetch<AsaasCustomer>('/customers', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      cpfCnpj: payload.cpfCnpj.replace(/\D/g, ''),
    }),
  })
}

// ── Charges (Cobranças) ──────────────────────────────────────────────────────

export async function createCharge(
  payload: AsaasChargePayload,
): Promise<AsaasCharge> {
  return asaasFetch<AsaasCharge>('/payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getCharge(asaasId: string): Promise<AsaasCharge> {
  return asaasFetch<AsaasCharge>(`/payments/${asaasId}`)
}

export async function getPixQrCode(
  asaasId: string,
): Promise<{ encodedImage: string; payload: string; expirationDate: string }> {
  return asaasFetch(`/payments/${asaasId}/pixQrCode`)
}

export async function cancelCharge(asaasId: string): Promise<{ deleted: boolean }> {
  return asaasFetch(`/payments/${asaasId}`, { method: 'DELETE' })
}

// ── Split Payment (Repasse automático proprietário/imobiliária) ──────────────

export interface AsaasSplitPayload {
  walletId: string           // Wallet do proprietário (subconta Asaas)
  fixedValue?: number        // Valor fixo para o proprietário
  percentualValue?: number   // Percentual para o proprietário (ex: 90)
}

export interface AsaasChargeWithSplitPayload extends AsaasChargePayload {
  split?: AsaasSplitPayload[]
}

/**
 * Cria cobrança com split automático: ao receber, o Asaas separa
 * automaticamente a comissão da imobiliária e o repasse do proprietário.
 */
export async function createChargeWithSplit(
  payload: AsaasChargeWithSplitPayload,
): Promise<AsaasCharge> {
  return asaasFetch<AsaasCharge>('/payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ── Subaccounts (Subcontas para proprietários) ──────────────────────────────

export interface AsaasSubaccountPayload {
  name: string
  cpfCnpj: string
  email: string
  phone?: string
  mobilePhone?: string
  address?: string
  addressNumber?: string
  province?: string
  postalCode?: string
  birthDate?: string       // YYYY-MM-DD
  companyType?: 'MEI' | 'LIMITED' | 'INDIVIDUAL' | 'ASSOCIATION'
}

export interface AsaasSubaccount {
  id: string
  name: string
  email: string
  cpfCnpj: string
  walletId: string         // ID usado no split
  apiKey?: string
}

/**
 * Cria uma subconta no Asaas para um proprietário.
 * O walletId retornado é usado no split de pagamentos.
 */
export async function createSubaccount(
  payload: AsaasSubaccountPayload,
): Promise<AsaasSubaccount> {
  return asaasFetch<AsaasSubaccount>('/accounts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/**
 * Lista subcontas existentes (proprietários cadastrados).
 */
export async function listSubaccounts(
  params?: { limit?: number; offset?: number },
): Promise<{ data: AsaasSubaccount[]; totalCount: number }> {
  const qs = new URLSearchParams()
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.offset) qs.set('offset', String(params.offset))
  return asaasFetch(`/accounts?${qs}`)
}

// ── Account / Balance ────────────────────────────────────────────────────────

export interface AsaasBalance {
  balance: number
  totalBalance: number
  withdrawnBalance: number
}

export async function getBalance(): Promise<AsaasBalance> {
  return asaasFetch<AsaasBalance>('/finance/balance')
}

export interface AsaasTransfer {
  id: string
  value: number
  status: string
  transferDate: string
  type: string
  bankAccount?: { bank: { code: string; name: string }; agency: string; account: string }
}

export async function listTransfers(
  params?: { limit?: number; offset?: number },
): Promise<{ data: AsaasTransfer[]; totalCount: number }> {
  const qs = new URLSearchParams()
  if (params?.limit)  qs.set('limit',  String(params.limit))
  if (params?.offset) qs.set('offset', String(params.offset))
  return asaasFetch(`/transfers?${qs}`)
}

export async function getPaymentsList(params?: {
  status?: string; limit?: number; offset?: number; customer?: string; externalReference?: string
}): Promise<{ data: AsaasCharge[]; totalCount: number }> {
  const qs = new URLSearchParams()
  if (params?.status)            qs.set('status', params.status)
  if (params?.limit)             qs.set('limit',  String(params.limit))
  if (params?.offset)            qs.set('offset', String(params.offset))
  if (params?.customer)          qs.set('customer', params.customer)
  if (params?.externalReference) qs.set('externalReference', params.externalReference)
  return asaasFetch(`/payments?${qs}`)
}

// ── Webhook payload type ─────────────────────────────────────────────────────

export interface AsaasWebhookEvent {
  event: string   // PAYMENT_RECEIVED | PAYMENT_OVERDUE | PAYMENT_DELETED | ...
  payment: AsaasCharge & {
    confirmedDate?: string
    clientPaymentDate?: string
    value: number
    netValue: number
  }
}

// ── NFS-e (Nota Fiscal de Serviço) ──────────────────────────────────────────

export interface AsaasInvoicePayload {
  payment?: string              // ID do pagamento vinculado (opcional)
  serviceDescription: string    // descrição do serviço
  observations?: string
  value: number
  deductions?: number
  effectiveDate: string         // data de competência YYYY-MM-DD
  municipalServiceId?: string   // código do serviço municipal
  municipalServiceCode?: string // código de tributação municipal
  municipalServiceName?: string // nome do serviço
  taxes?: {
    retainIss: boolean
    iss?: number
    cofins?: number
    csll?: number
    inss?: number
    ir?: number
    pis?: number
  }
  externalReference?: string
}

export interface AsaasInvoice {
  id: string
  status: string  // PENDING | SCHEDULED | PROCESSING | AUTHORIZED | CANCELLED | ERROR
  number?: string
  rpsBatch?: string
  rpsNumber?: string
  rpsSeries?: string
  serviceDescription: string
  observations?: string
  value: number
  effectiveDate: string
  pdfUrl?: string
  xmlUrl?: string
  externalReference?: string
  taxes?: Record<string, any>
}

export async function createInvoice(payload: AsaasInvoicePayload): Promise<AsaasInvoice> {
  return asaasFetch<AsaasInvoice>('/invoices', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getInvoice(invoiceId: string): Promise<AsaasInvoice> {
  return asaasFetch<AsaasInvoice>(`/invoices/${invoiceId}`)
}

export async function cancelInvoice(invoiceId: string): Promise<{ deleted: boolean }> {
  return asaasFetch(`/invoices/${invoiceId}`, { method: 'DELETE' })
}

export async function listInvoices(params?: {
  status?: string; limit?: number; offset?: number; effectiveDateGE?: string; effectiveDateLE?: string
}): Promise<{ data: AsaasInvoice[]; totalCount: number }> {
  const qs = new URLSearchParams()
  if (params?.status)           qs.set('status', params.status)
  if (params?.limit)            qs.set('limit', String(params.limit))
  if (params?.offset)           qs.set('offset', String(params.offset))
  if (params?.effectiveDateGE)  qs.set('effectiveDate[ge]', params.effectiveDateGE)
  if (params?.effectiveDateLE)  qs.set('effectiveDate[le]', params.effectiveDateLE)
  return asaasFetch(`/invoices?${qs}`)
}

export async function scheduleInvoice(paymentId: string): Promise<AsaasInvoice> {
  return asaasFetch<AsaasInvoice>(`/invoices`, {
    method: 'POST',
    body: JSON.stringify({ payment: paymentId }),
  })
}

// ── Subscriptions (Assinaturas recorrentes) ────────────────────────────────

export interface AsaasSubscriptionPayload {
  customer: string
  billingType: AsaasBillingType
  value: number
  nextDueDate: string               // YYYY-MM-DD (próximo vencimento)
  cycle: 'MONTHLY' | 'YEARLY'
  description?: string
  externalReference?: string
  discount?: { value: number; dueDateLimitDays: number; type: 'FIXED' | 'PERCENTAGE' }
  interest?: { value: number }
  fine?: { value: number }
  maxPayments?: number              // null = indefinido
}

export interface AsaasSubscription {
  id: string
  customer: string
  billingType: string
  value: number
  nextDueDate: string
  cycle: string
  status: string                    // ACTIVE | INACTIVE | EXPIRED
  description?: string
  externalReference?: string
  dateCreated: string
}

export async function createSubscription(
  payload: AsaasSubscriptionPayload,
): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>('/subscriptions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(`/subscriptions/${subscriptionId}`)
}

export async function cancelSubscription(subscriptionId: string): Promise<{ deleted: boolean }> {
  return asaasFetch(`/subscriptions/${subscriptionId}`, { method: 'DELETE' })
}

export async function updateSubscription(
  subscriptionId: string,
  data: Partial<AsaasSubscriptionPayload>,
): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>(`/subscriptions/${subscriptionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// ── Payment Links (Links de pagamento) ─────────────────────────────────────

export interface AsaasPaymentLinkPayload {
  name: string
  value: number
  billingType: AsaasBillingType
  chargeType: 'DETACHED' | 'RECURRENT' | 'INSTALLMENT'
  description?: string
  externalReference?: string
  maxInstallmentCount?: number
  subscriptionCycle?: 'MONTHLY' | 'YEARLY'
  dueDateLimitDays?: number
  notificationEnabled?: boolean
}

export interface AsaasPaymentLink {
  id: string
  name: string
  value: number
  url: string
  billingType: string
  chargeType: string
  status: string
}

export async function createPaymentLink(
  payload: AsaasPaymentLinkPayload,
): Promise<AsaasPaymentLink> {
  return asaasFetch<AsaasPaymentLink>('/paymentLinks', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
