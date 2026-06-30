/**
 * Licenciamento da edição offline — emite chaves de licença assinadas (ed25519).
 *
 * A chave PRIVADA vem de env.LICENSE_PRIVATE_KEY (PEM PKCS8). O app desktop
 * valida o token LOCALMENTE com a chave pública embutida (apps/desktop/license.js).
 *
 * Token = base64(payloadJSON) + '.' + base64(assinatura).
 * Mesmo formato do gerador CLI (apps/desktop/tools/license-cli.js).
 */
import crypto from 'node:crypto'
import { env } from '../utils/env.js'

export interface LicensePayload {
  customer: string
  plan: string
  expires?: string // ISO date; ausente = vitalícia
  email?: string
}

export function isLicensingConfigured(): boolean {
  return !!env.LICENSE_PRIVATE_KEY
}

/** Emite um token de licença assinado. Lança se a chave privada não estiver configurada. */
export function issueLicense(input: LicensePayload): string {
  if (!env.LICENSE_PRIVATE_KEY) {
    throw new Error('LICENSE_PRIVATE_KEY não configurada')
  }
  const priv = crypto.createPrivateKey(env.LICENSE_PRIVATE_KEY)
  const payload = Buffer.from(JSON.stringify({ issued: new Date().toISOString(), ...input }))
  const sig = crypto.sign(null, payload, priv)
  return payload.toString('base64') + '.' + sig.toString('base64')
}

/** Validade padrão da licença anual (1 ano a partir de hoje), em ISO. */
export function oneYearFromNow(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}
