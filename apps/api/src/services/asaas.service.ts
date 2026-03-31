/**
 * Asaas Service — emissão de boletos / PIX e split de pagamentos
 * Docs: https://docs.asaas.com/
 */

import { env } from '../utils/env.js'

const BASE_URL = env.ASAAS_BASE_URL ?? 'https://www.asaas.com/api/v3'
const API_KEY  = env.ASAAS_API_KEY  ?? ''

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
