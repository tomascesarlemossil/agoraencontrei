/**
 * Google Indexing API Service — Notifica o Google instantaneamente
 * quando páginas são criadas ou atualizadas.
 *
 * Usa a API de Indexação para garantir que novas páginas de imóveis,
 * leilões e bairros sejam rastreadas em horas, não semanas.
 */

import { env } from '../utils/env.js'

const INDEXING_API_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish'

export type IndexingType = 'URL_UPDATED' | 'URL_DELETED'

/**
 * Notifica o Google de que uma URL foi criada ou atualizada.
 * Requer GOOGLE_INDEXING_KEY (Service Account JSON key) configurada.
 */
export async function notifyGoogleIndexing(
  url: string,
  type: IndexingType = 'URL_UPDATED',
): Promise<{ success: boolean; error?: string }> {
  const keyJson = (env as any).GOOGLE_INDEXING_KEY
  if (!keyJson) {
    return { success: false, error: 'GOOGLE_INDEXING_KEY not configured' }
  }

  try {
    // Parse service account key
    const key = typeof keyJson === 'string' ? JSON.parse(keyJson) : keyJson

    // Create JWT for authentication
    const token = await getGoogleAccessToken(key)

    const response = await fetch(INDEXING_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url, type }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return { success: false, error: `Google API error: ${response.status} ${errText}` }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Notifica o Google sobre múltiplas URLs em batch.
 * Respeita o rate limit de 200 requests/dia.
 */
export async function batchNotifyGoogle(
  urls: string[],
  type: IndexingType = 'URL_UPDATED',
): Promise<{ total: number; success: number; errors: string[] }> {
  const results = { total: urls.length, success: 0, errors: [] as string[] }

  // Process in chunks of 10 with delays
  for (let i = 0; i < urls.length; i += 10) {
    const chunk = urls.slice(i, i + 10)
    const promises = chunk.map(url => notifyGoogleIndexing(url, type))
    const chunkResults = await Promise.all(promises)

    for (const r of chunkResults) {
      if (r.success) results.success++
      else if (r.error) results.errors.push(r.error)
    }

    // Rate limit: wait 1s between chunks
    if (i + 10 < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return results
}

/**
 * Gera URLs canônicas para diferentes tipos de páginas.
 */
export function buildPropertyUrl(
  slug: string,
): string {
  return `https://www.agoraencontrei.com.br/imoveis/${slug}`
}

export function buildNeighborhoodUrl(
  state: string,
  city: string,
  bairro: string,
): string {
  return `https://www.agoraencontrei.com.br/${state.toLowerCase()}/${slugifyUrl(city)}/bairro/${slugifyUrl(bairro)}`
}

export function buildAuctionUrl(slug: string): string {
  return `https://www.agoraencontrei.com.br/leiloes/${slug}`
}

export function buildSeoPageUrl(category: string, city: string): string {
  return `https://www.agoraencontrei.com.br/${category}/${slugifyUrl(city)}`
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function slugifyUrl(text: string): string {
  return text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Get Google access token from service account key.
 * Simple JWT-based auth for server-to-server.
 */
async function getGoogleAccessToken(key: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const claims = Buffer.from(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/indexing',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })).toString('base64url')

  const { createSign } = await import('crypto')
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${claims}`)
  const signature = signer.sign(key.private_key, 'base64url')

  const jwt = `${header}.${claims}.${signature}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  const tokenData = await tokenRes.json() as any
  return tokenData.access_token
}
