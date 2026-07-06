/**
 * Normalização e validação de telefones brasileiros para campanhas de WhatsApp.
 *
 * O WhatsApp Business Platform só entrega para números móveis no formato E.164.
 * Este utilitário é puro (sem I/O) para ser facilmente testável e reutilizável
 * tanto na API quanto em workers.
 */

/** DDDs válidos no Brasil (Anatel). Números com DDD fora desta lista são rejeitados. */
export const VALID_DDDS = new Set<string>([
  '11', '12', '13', '14', '15', '16', '17', '18', '19',
  '21', '22', '24', '27', '28',
  '31', '32', '33', '34', '35', '37', '38',
  '41', '42', '43', '44', '45', '46', '47', '48', '49',
  '51', '53', '54', '55',
  '61', '62', '63', '64', '65', '66', '67', '68', '69',
  '71', '73', '74', '75', '77', '79',
  '81', '82', '83', '84', '85', '86', '87', '88', '89',
  '91', '92', '93', '94', '95', '96', '97', '98', '99',
])

export type PhoneType = 'mobile' | 'landline'

export interface NormalizedPhone {
  /** Entrada original, preservada para auditoria. */
  raw: string
  /** true apenas quando é um móvel válido (WhatsApp exige móvel). */
  valid: boolean
  /** Formato E.164 (+55DDDNUMERO) quando válido; null caso contrário. */
  e164: string | null
  /** Motivo da rejeição (código estável para UI/testes). */
  reason?:
    | 'empty'
    | 'too_short'
    | 'too_long'
    | 'invalid_ddd'
    | 'landline_not_whatsapp'
    | 'invalid_format'
  type?: PhoneType
  ddd?: string
}

/**
 * Normaliza um telefone brasileiro para E.164.
 *
 * Aceita variações comuns de listas coladas: "(11) 91234-5678",
 * "11912345678", "+55 11 91234-5678", "5511912345678", "011 91234-5678".
 * Corrige móveis antigos de 8 dígitos inserindo o nono dígito ("9").
 */
export function normalizePhoneBR(raw: string): NormalizedPhone {
  const original = (raw ?? '').toString()
  let digits = original.replace(/\D/g, '')

  if (!digits) return { raw: original, valid: false, e164: null, reason: 'empty' }

  // Prefixo internacional "00" (ex.: "0055...")
  if (digits.startsWith('00')) digits = digits.slice(2)

  // Código do país 55 — só remove se o restante ficar com 10 ou 11 dígitos.
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2)
  }

  // Prefixo de operadora "0" (ex.: "011...") — remove um zero à esquerda.
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  if (digits.length === 12 && digits.startsWith('0')) digits = digits.slice(1)

  if (digits.length < 10) return { raw: original, valid: false, e164: null, reason: 'too_short' }
  if (digits.length > 11) return { raw: original, valid: false, e164: null, reason: 'too_long' }

  const ddd = digits.slice(0, 2)
  let subscriber = digits.slice(2)

  if (!VALID_DDDS.has(ddd)) {
    return { raw: original, valid: false, e164: null, reason: 'invalid_ddd', ddd }
  }

  // 10 dígitos: pode ser fixo (inicia 2-5) ou móvel antigo sem o 9 (inicia 6-9).
  if (subscriber.length === 8) {
    const first = subscriber[0]
    if (['6', '7', '8', '9'].includes(first)) {
      // Móvel antigo — insere o nono dígito.
      subscriber = '9' + subscriber
    } else {
      // Fixo — não é entregável no WhatsApp.
      return { raw: original, valid: false, e164: null, reason: 'landline_not_whatsapp', type: 'landline', ddd }
    }
  }

  // Móvel válido: 9 dígitos começando com 9.
  if (subscriber.length === 9 && subscriber[0] === '9') {
    return { raw: original, valid: true, e164: `+55${ddd}${subscriber}`, type: 'mobile', ddd }
  }

  return { raw: original, valid: false, e164: null, reason: 'invalid_format', ddd }
}

/**
 * Quebra um texto colado (uma coluna, CSV simples, separado por vírgula/;/
 * quebras de linha/espaços) em telefones individuais brutos.
 */
export function parsePhoneList(text: string): string[] {
  if (!text) return []
  return text
    .split(/[\n\r,;|\t]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export interface NormalizeReport {
  valid: NormalizedPhone[]
  invalid: NormalizedPhone[]
  duplicates: string[] // E.164 removidos por duplicidade
}

/**
 * Normaliza uma lista, remove duplicados (por E.164) e separa válidos/inválidos.
 * Mantém a primeira ocorrência de cada número válido.
 */
export function normalizeAndDedupe(rawPhones: string[]): NormalizeReport {
  const valid: NormalizedPhone[] = []
  const invalid: NormalizedPhone[] = []
  const duplicates: string[] = []
  const seen = new Set<string>()

  for (const raw of rawPhones) {
    const n = normalizePhoneBR(raw)
    if (!n.valid || !n.e164) {
      invalid.push(n)
      continue
    }
    if (seen.has(n.e164)) {
      duplicates.push(n.e164)
      continue
    }
    seen.add(n.e164)
    valid.push(n)
  }

  return { valid, invalid, duplicates }
}
