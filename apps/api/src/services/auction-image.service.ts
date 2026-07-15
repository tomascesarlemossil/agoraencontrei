/**
 * Auction Image Capture Agent — captura automática da imagem do leilão.
 *
 * A maior parte dos leilões entra na base sem foto (o CSV/lista da fonte não
 * traz imagem), e o card/landing acaba mostrando o banner ilustrativo padrão.
 * Este agente resolve isso em três camadas, na ordem de melhor procedência:
 *
 *   1. AUCTIONEER  — foto oficial do imóvel:
 *        • Caixa: derivada do código oficial do imóvel (padrão de URL conhecido);
 *        • demais leiloeiros SSR: og:image / primeira foto da galeria do lote.
 *   2. STREETVIEW  — fachada via Google Street View a partir do endereço/coords
 *        do leilão (fallback quando não há foto do leiloeiro).
 *
 * Grava `coverImage` (se estiver vazia), `streetViewUrl` (sempre que houver
 * fachada), e a procedência em `imageSource` — a página do leilão usa isso para
 * sinalizar a confiabilidade da imagem (foto do leiloeiro x fachada aproximada).
 *
 * Best-effort e throttled: cada tentativa incrementa `imageCaptureAttempts` e
 * grava `imageCapturedAt`, evitando martelar fontes que não têm imagem.
 */

import type { PrismaClient } from '@prisma/client'
import { getStreetViewForProperty } from './streetview.service.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36'

export interface ImageCaptureDeps {
  fetchImpl?: typeof fetch
}

export type ImageSource = 'AUCTIONEER' | 'STREETVIEW' | 'NONE'

/**
 * Deriva a URL da foto oficial da Caixa a partir do código do imóvel — mesma
 * lógica usada no frontend (`fotos-imoveis/{id}_1.jpg`). Não depende de HTTP:
 * a origem recusa datacenters, mas o mesmo arquivo abre para o usuário final.
 */
export function deriveCaixaPhotoUrl(
  externalId: string | null | undefined,
  sourceUrl: string | null | undefined,
): string | undefined {
  let id = ''
  if (externalId && /^CAIXA[-_:]/i.test(externalId)) {
    id = externalId.replace(/^CAIXA[-_:]/i, '').replace(/^HTML[-_:]/i, '')
  }
  if (!id && sourceUrl && /caixa\.gov\.br/i.test(sourceUrl)) {
    const m = sourceUrl.match(/[?&](?:hdnimovel|idImo)=([^&#]+)/i)
    id = m?.[1] || ''
  }
  const digits = id.replace(/\D/g, '')
  if (!digits) return undefined
  return `https://venda-imoveis.caixa.gov.br/fotos-imoveis/${digits}_1.jpg`
}

/** Extrai a melhor imagem de uma página de detalhe SSR (og:image + galeria). */
export function extractImageFromHtml(html: string, baseUrl?: string): string | undefined {
  const abs = (u: string): string | undefined => {
    if (!u) return undefined
    if (/^https?:\/\//i.test(u)) return u
    if (u.startsWith('//')) return `https:${u}`
    if (baseUrl && u.startsWith('/')) {
      try { return new URL(u, baseUrl).toString() } catch { return undefined }
    }
    return undefined
  }

  // 1. og:image / twitter:image — o que o próprio leiloeiro escolheu como capa.
  const og =
    html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)(?::url)?["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|twitter:image)["']/i)
  const ogUrl = og && abs(og[1].trim())
  if (ogUrl && !/logo|placeholder|sprite|icon|banner|selo/i.test(ogUrl)) return ogUrl

  // 2. Primeira foto de imóvel na galeria (jpg/png/webp com cara de foto do lote).
  const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+\.(?:jpe?g|png|webp))(?:\?[^"']*)?["']/gi)].map((m) => m[1])
  for (const src of imgs) {
    if (/logo|placeholder|sprite|icon|avatar|banner|selo|bandeira|favicon/i.test(src)) continue
    const u = abs(src)
    if (u) return u
  }
  return ogUrl || undefined
}

/** Confirma que a URL responde como imagem (best-effort; falha vira "sem imagem"). */
async function urlLooksLikeImage(url: string, fetchImpl: typeof fetch): Promise<boolean> {
  try {
    const res = await fetchImpl(url, { method: 'GET', headers: { 'User-Agent': UA, Range: 'bytes=0-2048' } })
    if (!res.ok) return false
    const ct = res.headers.get('content-type') || ''
    return /image\//i.test(ct)
  } catch {
    return false
  }
}

/**
 * Captura a imagem de UM leilão. Idempotente: só preenche o que falta. Marca
 * a tentativa (imageCapturedAt/attempts) mesmo quando não encontra imagem.
 */
export async function captureAuctionImage(
  prisma: PrismaClient,
  auctionId: string,
  deps: ImageCaptureDeps = {},
): Promise<{ updated: boolean; source: ImageSource }> {
  const fetchImpl = deps.fetchImpl || fetch
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: {
      id: true, externalId: true, source: true, sourceUrl: true,
      coverImage: true, streetViewUrl: true, imageSource: true,
      latitude: true, longitude: true, street: true, number: true,
      city: true, state: true,
    },
  })
  if (!auction) return { updated: false, source: 'NONE' }

  const data: Record<string, unknown> = {
    imageCapturedAt: new Date(),
    imageCaptureAttempts: { increment: 1 },
  }
  let cover: string | undefined
  let coverSource: ImageSource = 'NONE'
  let streetView: string | undefined = auction.streetViewUrl ?? undefined

  const hasRealCover = !!auction.coverImage && auction.imageSource !== 'STREETVIEW'

  // ── Camada 1: foto oficial do leiloeiro ──────────────────────────────────
  if (!hasRealCover) {
    // Caixa: URL derivada do código do imóvel (sem HTTP — a origem bloqueia DC).
    if (/caixa/i.test(auction.source) || /caixa\.gov\.br/i.test(auction.sourceUrl || '')) {
      const caixa = deriveCaixaPhotoUrl(auction.externalId, auction.sourceUrl)
      if (caixa) { cover = caixa; coverSource = 'AUCTIONEER' }
    }
    // Demais leiloeiros SSR: extrai og:image / galeria da página de detalhe.
    if (!cover && auction.sourceUrl && /^https?:\/\//i.test(auction.sourceUrl)) {
      try {
        const res = await fetchImpl(auction.sourceUrl, { headers: { 'User-Agent': UA } })
        if (res.ok) {
          const html = await res.text()
          const found = extractImageFromHtml(html, auction.sourceUrl)
          if (found && (await urlLooksLikeImage(found, fetchImpl))) {
            cover = found
            coverSource = 'AUCTIONEER'
          }
        }
      } catch { /* rede falhou — tenta Street View / próxima rodada */ }
    }
  }

  // ── Camada 2: fachada via Street View ────────────────────────────────────
  // Sempre buscamos a fachada quando ainda não temos — serve de capa (se não
  // houver foto do leiloeiro) e como camada extra na landing.
  if (!streetView && (auction.latitude || auction.street || auction.city)) {
    try {
      const sv = await getStreetViewForProperty({
        latitude: auction.latitude, longitude: auction.longitude,
        street: auction.street, number: auction.number,
        city: auction.city, state: auction.state,
      })
      if (sv.available && sv.imageUrl) streetView = sv.imageUrl
    } catch { /* Street View é best-effort */ }
  }
  if (!cover && !hasRealCover && streetView) {
    cover = streetView
    coverSource = 'STREETVIEW'
  }

  if (streetView && streetView !== auction.streetViewUrl) data.streetViewUrl = streetView
  if (cover && !hasRealCover) {
    data.coverImage = cover
    data.imageSource = coverSource
  }

  await prisma.auction.update({ where: { id: auctionId }, data }).catch(() => {})
  const updated = !!data.coverImage || !!data.streetViewUrl
  return { updated, source: coverSource }
}

/**
 * Passe agendado: captura imagem dos leilões sem foto real (ou nunca tentados),
 * priorizando ativos. Sequencial + throttled para respeitar Street View e as
 * páginas dos leiloeiros.
 */
export async function runAuctionImageBatch(
  prisma: PrismaClient,
  limit = 40,
  deps: ImageCaptureDeps = {},
): Promise<{ processed: number; withCover: number; withStreetView: number }> {
  const activeStatuses = ['OPEN', 'UPCOMING', 'FIRST_ROUND', 'SECOND_ROUND']
  // Falta capa real (nula ou só Street View) OU nunca passou pelo agente.
  const needsImage = {
    OR: [
      { coverImage: null },
      { imageSource: 'STREETVIEW', streetViewUrl: null },
      { imageCapturedAt: null },
    ],
    // Anti-hammer: no máximo 5 tentativas por leilão.
    imageCaptureAttempts: { lt: 5 },
    status: { notIn: ['CANCELLED'] as any },
  }

  const activeLimit = Math.ceil(limit / 2)
  const active = await prisma.auction.findMany({
    where: { ...needsImage, status: { in: activeStatuses as any } },
    select: { id: true },
    orderBy: [{ imageCapturedAt: { sort: 'asc', nulls: 'first' } }, { createdAt: 'desc' }],
    take: activeLimit,
  })
  const historical = await prisma.auction.findMany({
    where: { ...needsImage, status: { notIn: [...activeStatuses, 'CANCELLED'] as any } },
    select: { id: true },
    orderBy: [{ imageCapturedAt: { sort: 'asc', nulls: 'first' } }, { createdAt: 'desc' }],
    take: limit - activeLimit,
  })
  const pending = [...active, ...historical]

  let withCover = 0
  let withStreetView = 0
  for (const a of pending) {
    const r = await captureAuctionImage(prisma, a.id, deps).catch(() => ({ updated: false, source: 'NONE' as ImageSource }))
    if (r.source === 'AUCTIONEER' || r.source === 'STREETVIEW') withCover++
    if (r.source === 'STREETVIEW') withStreetView++
    // Throttle leve entre leilões (respeita Street View e páginas dos leiloeiros).
    await new Promise((res) => setTimeout(res, 120))
  }
  return { processed: pending.length, withCover, withStreetView }
}
