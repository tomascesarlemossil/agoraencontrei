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

/**
 * Normaliza e carrega a chave privada do env de forma tolerante ao formato.
 *
 * Variáveis de ambiente (Railway, Vercel, .env) frequentemente perdem as
 * quebras de linha do PEM: o valor chega numa linha só, com `\n` literais,
 * envolto em aspas ou com espaços. Sem isso, `createPrivateKey` falha com
 * "invalid PEM". Aqui aceitamos:
 *   - PEM com quebras de linha reais (ideal)
 *   - PEM em linha única com `\n` literais (caso comum em env vars)
 *   - valor entre aspas / com espaços nas pontas
 */
export function loadLicensePrivateKey(): crypto.KeyObject {
  let raw = (env.LICENSE_PRIVATE_KEY || '').trim()
  if (!raw) throw new Error('LICENSE_PRIVATE_KEY não configurada')
  // remove aspas externas que alguns painéis adicionam
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1).trim()
  }
  // \n / \r\n literais → quebras reais (env vars costumam achatar o PEM)
  raw = raw.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n').replace(/\\r/g, '\n')
  return crypto.createPrivateKey(raw)
}

/** Emite um token de licença assinado. Lança se a chave privada não estiver configurada. */
export function issueLicense(input: LicensePayload): string {
  const priv = loadLicensePrivateKey()
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
