/**
 * Integration Config — per-tenant credential resolver.
 *
 * Resolves a tenant's OWN integration credentials (IntegrationCredential
 * table) and falls back to the platform-wide env vars when the tenant has
 * not configured its own. This is the single source services should call
 * instead of reading `env.*` directly, so each partner can plug in their
 * own WhatsApp / Asaas / Cloudinary / SMTP / etc.
 */

import type { PrismaClient } from '@prisma/client'
import { env } from '../utils/env.js'

export type IntegrationProvider =
  | 'whatsapp' | 'asaas' | 'cloudinary' | 'smtp' | 'google_maps' | 'instagram' | 'openai'

export interface IntegrationField {
  key: string
  label: string
  secret: boolean
}

export interface IntegrationDescriptor {
  provider: IntegrationProvider
  label: string
  description: string
  fields: IntegrationField[]
}

/** Catalogue used by the dashboard UI to render a connect form per provider. */
export const INTEGRATION_CATALOG: IntegrationDescriptor[] = [
  {
    provider: 'whatsapp',
    label: 'WhatsApp Cloud API',
    description: 'Envio e recebimento de mensagens via WhatsApp Business.',
    fields: [
      { key: 'token', label: 'Token de acesso', secret: true },
      { key: 'phoneId', label: 'Phone Number ID', secret: false },
    ],
  },
  {
    provider: 'asaas',
    label: 'Asaas (pagamentos)',
    description: 'Boletos, Pix e cobranças. Use sua própria conta para receber direto.',
    fields: [
      { key: 'apiKey', label: 'API Key', secret: true },
      { key: 'walletId', label: 'Wallet ID (split)', secret: false },
    ],
  },
  {
    provider: 'cloudinary',
    label: 'Cloudinary',
    description: 'Otimização de imagens e marca d’água.',
    fields: [
      { key: 'cloudName', label: 'Cloud Name', secret: false },
      { key: 'apiKey', label: 'API Key', secret: true },
      { key: 'apiSecret', label: 'API Secret', secret: true },
    ],
  },
  {
    provider: 'smtp',
    label: 'E-mail (SMTP)',
    description: 'Servidor de e-mail para notificações e alertas.',
    fields: [
      { key: 'host', label: 'Host', secret: false },
      { key: 'port', label: 'Porta', secret: false },
      { key: 'user', label: 'Usuário', secret: false },
      { key: 'pass', label: 'Senha', secret: true },
      { key: 'from', label: 'Remetente', secret: false },
    ],
  },
  {
    provider: 'google_maps',
    label: 'Google Maps',
    description: 'Mapas, geocodificação e Street View.',
    fields: [{ key: 'apiKey', label: 'API Key', secret: true }],
  },
  {
    provider: 'instagram',
    label: 'Instagram',
    description: 'Publicação automática de posts e stories.',
    fields: [
      { key: 'accessToken', label: 'Page Access Token', secret: true },
      { key: 'businessId', label: 'Business Account ID', secret: false },
    ],
  },
  {
    provider: 'openai',
    label: 'OpenAI',
    description: 'Transcrição de áudio (Whisper) e recursos de IA.',
    fields: [{ key: 'apiKey', label: 'API Key', secret: true }],
  },
]

/** Platform-wide defaults read from env, used when a tenant has no own config. */
function envFallback(provider: IntegrationProvider): Record<string, string> {
  switch (provider) {
    case 'whatsapp':    return clean({ token: env.WHATSAPP_TOKEN, phoneId: env.WHATSAPP_PHONE_ID })
    case 'asaas':       return clean({ apiKey: env.ASAAS_API_KEY, walletId: env.ASAAS_WALLET_ID })
    case 'cloudinary':  return clean({ cloudName: env.CLOUDINARY_CLOUD_NAME })
    case 'smtp':        return clean({
      host: env.SMTP_HOST, port: env.SMTP_PORT != null ? String(env.SMTP_PORT) : undefined,
      user: env.SMTP_USER, pass: env.SMTP_PASS, from: env.SMTP_FROM,
    })
    case 'google_maps': return clean({ apiKey: env.GOOGLE_MAPS_API_KEY })
    case 'instagram':   return clean({
      accessToken: env.INSTAGRAM_PAGE_ACCESS_TOKEN, businessId: env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
    })
    case 'openai':      return clean({ apiKey: env.OPENAI_API_KEY })
    default:            return {}
  }
}

function clean(obj: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) if (v) out[k] = v
  return out
}

/**
 * Resolve a integração de um tenant: credenciais próprias (DB) sobrepõem o
 * fallback global do env. Retorna apenas valores não-vazios.
 */
export async function getIntegrationConfig(
  prisma: PrismaClient,
  companyId: string | null | undefined,
  provider: IntegrationProvider,
): Promise<Record<string, string>> {
  const merged: Record<string, string> = { ...envFallback(provider) }

  if (companyId) {
    const row = await prisma.integrationCredential
      .findUnique({ where: { companyId_provider: { companyId, provider } } })
      .catch(() => null)
    if (row && row.isActive && row.credentials) {
      for (const [k, v] of Object.entries(row.credentials as Record<string, unknown>)) {
        if (typeof v === 'string' && v) merged[k] = v
      }
    }
  }
  return merged
}

/** True quando a integração tem credencial utilizável (tenant ou env). */
export async function isIntegrationConfigured(
  prisma: PrismaClient,
  companyId: string | null | undefined,
  provider: IntegrationProvider,
): Promise<boolean> {
  const cfg = await getIntegrationConfig(prisma, companyId, provider)
  return Object.keys(cfg).length > 0
}
