/**
 * Auction Archive Service — arquivamento durável de documentos públicos de leilão.
 *
 * Os links de edital/matrícula nos sites dos leiloeiros apodrecem assim que o
 * leilão encerra. Aqui baixamos o binário da fonte enquanto ainda está no ar,
 * calculamos o sha256 (dedup + versionamento), subimos para o S3 e registramos
 * em auction_documents. Quando o documento é texto/HTML, extraímos nº de
 * matrícula, cartório e processo e preenchemos o leilão se estiverem vazios.
 *
 * Best-effort e idempotente: mesmo conteúdo (sha256) nunca duplica; rodar de
 * novo é seguro. Sem S3 configurado, ainda gravamos o registro + texto + hash
 * com status PENDING para re-arquivar depois.
 */

import crypto from 'crypto'
import type { PrismaClient } from '@prisma/client'
import { s3Service } from './s3.service.js'

export type AuctionDocType = 'EDITAL' | 'MATRICULA' | 'LAUDO' | 'ATA' | 'OUTRO'

export interface ArchiveDeps {
  fetchImpl?: typeof fetch
  s3?: {
    isConfigured: () => boolean
    upload: (key: string, body: Buffer, contentType: string) => Promise<string>
  }
}

const MAX_BYTES = 25 * 1024 * 1024 // 25MB — evita baixar arquivos gigantes
const MAX_TEXT_CHARS = 200_000

/** Classifica o tipo do documento pelo nome/URL. */
export function classifyDocType(url: string): AuctionDocType {
  const u = url.toLowerCase()
  if (/matr[ií]cula|registro.?imovel|registro.?de.?im[óo]veis/.test(u)) return 'MATRICULA'
  if (/edital/.test(u)) return 'EDITAL'
  if (/laudo|avalia[çc][ãa]o/.test(u)) return 'LAUDO'
  if (/\bata\b|auto.?(de)?.?arremat|arremata[çc][ãa]o/.test(u)) return 'ATA'
  return 'OUTRO'
}

/**
 * Extrai nº de matrícula, cartório e processo de um texto de edital.
 * Determinístico (regex) — sem IA, testável offline.
 */
export function extractRegistryInfo(text: string): {
  registryNumber?: string
  registryOffice?: string
  processNumber?: string
} {
  const out: { registryNumber?: string; registryOffice?: string; processNumber?: string } = {}
  if (!text) return out

  // Matrícula: "matrícula nº 12.345", "matricula n. 12345", "matrícula 90123"
  const mat = text.match(/matr[íi]cula\s*(?:imobili[áa]ria\s*)?(?:n[º°.]*\s*)?([\d][\d.]{2,})/i)
  if (mat) {
    const num = mat[1].replace(/\./g, '').replace(/\D/g, '')
    if (num.length >= 3) out.registryNumber = num
  }

  // Cartório / Oficial de Registro de Imóveis (frase curta)
  const off = text.match(
    /(\d+[ºoª]?\s*)?(?:cart[óo]rio|of[íi]cio|oficial)[^.\n,;]{0,50}registro\s+de\s+im[óo]veis(?:\s+d[aeo]\s+[^.\n,;]{0,40})?/i,
  )
  if (off) out.registryOffice = off[0].replace(/\s+/g, ' ').trim().slice(0, 120)

  // Processo no padrão CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
  const proc = text.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/)
  if (proc) out.processNumber = proc[0]

  return out
}

function extForMime(mime?: string): string {
  if (!mime) return 'bin'
  if (mime.includes('pdf')) return 'pdf'
  if (mime.includes('html')) return 'html'
  if (mime.includes('plain')) return 'txt'
  if (mime.includes('jpeg')) return 'jpg'
  if (mime.includes('png')) return 'png'
  return 'bin'
}

/**
 * Arquiva todos os documentos públicos de um leilão (editalUrl + documentsUrls).
 * Retorna a contagem por resultado.
 */
export async function archiveAuctionDocuments(
  prisma: PrismaClient,
  auctionId: string,
  deps: ArchiveDeps = {},
): Promise<{ archived: number; skipped: number; failed: number }> {
  const fetchImpl = deps.fetchImpl || fetch
  const s3 = deps.s3 || s3Service

  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    select: {
      id: true, editalUrl: true, documentsUrls: true,
      registryNumber: true, registryOffice: true, processNumber: true,
    },
  })
  if (!auction) return { archived: 0, skipped: 0, failed: 0 }

  // URLs únicas: edital (sempre EDITAL) + documentos avulsos.
  const urls = new Map<string, AuctionDocType>()
  if (auction.editalUrl) urls.set(auction.editalUrl, 'EDITAL')
  for (const u of auction.documentsUrls || []) {
    if (u && !urls.has(u)) urls.set(u, classifyDocType(u))
  }

  let archived = 0, skipped = 0, failed = 0
  const collectedText: string[] = []

  for (const [url, type] of urls) {
    try {
      const res = await fetchImpl(url)
      if (!res.ok) { failed++; continue }

      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length === 0 || buf.length > MAX_BYTES) { skipped++; continue }

      const sha256 = crypto.createHash('sha256').update(buf).digest('hex')

      // Dedup: mesmo conteúdo já arquivado para este leilão → pula.
      const existing = await prisma.auctionDocument.findUnique({
        where: { auctionId_sha256: { auctionId, sha256 } },
      }).catch(() => null)
      if (existing) {
        if (existing.extractedText) collectedText.push(existing.extractedText)
        skipped++
        continue
      }

      const mimeType = (res.headers.get('content-type') || '').split(';')[0] || null

      let extractedText: string | null = null
      if (mimeType && /text\/(html|plain)/.test(mimeType)) {
        extractedText = buf.toString('utf-8').slice(0, MAX_TEXT_CHARS)
        collectedText.push(extractedText)
      }

      let s3Key: string | null = null
      let s3Url: string | null = null
      let status = 'PENDING'
      if (s3.isConfigured()) {
        s3Key = `auctions/${auctionId}/${type.toLowerCase()}-${sha256.slice(0, 12)}.${extForMime(mimeType || undefined)}`
        try {
          s3Url = await s3.upload(s3Key, buf, mimeType || 'application/octet-stream')
          status = 'ARCHIVED'
        } catch {
          s3Key = null
          status = 'FAILED'
        }
      }

      await prisma.auctionDocument.create({
        data: {
          auctionId, type, sourceUrl: url,
          s3Key, s3Url, sha256,
          sizeBytes: buf.length, mimeType,
          extractedText, status,
        },
      }).then(() => { archived++ }).catch(() => { skipped++ }) // corrida no unique → skip
    } catch {
      failed++
    }
  }

  // Preenche matrícula/cartório/processo se o leilão estiver sem eles.
  if ((!auction.registryNumber || !auction.registryOffice || !auction.processNumber) && collectedText.length) {
    const info = extractRegistryInfo(collectedText.join('\n'))
    const patch: Record<string, string> = {}
    if (!auction.registryNumber && info.registryNumber) patch.registryNumber = info.registryNumber
    if (!auction.registryOffice && info.registryOffice) patch.registryOffice = info.registryOffice
    if (!auction.processNumber && info.processNumber) patch.processNumber = info.processNumber
    if (Object.keys(patch).length) {
      await prisma.auction.update({ where: { id: auctionId }, data: patch }).catch(() => {})
    }
  }

  return { archived, skipped, failed }
}

/**
 * Passe agendado: arquiva lotes de leilões que têm documentos mas ainda não
 * foram arquivados. Sequencial e limitado — throttle natural (roda no cron).
 */
export async function runAuctionArchiveBatch(
  prisma: PrismaClient,
  limit = 20,
  deps: ArchiveDeps = {},
): Promise<{ processed: number; archived: number }> {
  const pending = await prisma.auction.findMany({
    where: {
      AND: [
        { OR: [{ editalUrl: { not: null } }, { documentsUrls: { isEmpty: false } }] },
        { documents: { none: {} } },
      ],
    },
    select: { id: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  let archived = 0
  for (const a of pending) {
    const r = await archiveAuctionDocuments(prisma, a.id, deps)
    archived += r.archived
  }
  return { processed: pending.length, archived }
}
