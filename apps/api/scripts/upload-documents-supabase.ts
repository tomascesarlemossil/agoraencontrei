/**
 * upload-documents-supabase.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Faz upload de documentos do backup local para o Supabase Storage e registra
 * os metadados no banco PostgreSQL.
 *
 * Uso:
 *   npx tsx scripts/upload-documents-supabase.ts [--dry-run] [--folder "NOME"]
 *
 * Variáveis de ambiente (.env):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL
 *   BACKUP_PATH  (padrão: Y:\)
 *
 * Pastas suportadas automaticamente:
 *   ARQUIVO MORTO 2025, ADITIVO 2026, FINANCEIRO 2026,
 *   CONT. PRESTAÇÃO SERVIÇO 2026, FOLDER SEGURO 2026, IPTU 2026,
 *   JURIDICO 2026, LOCAÇÃO 2026, RECEPÇÃO 2026, RESCISÃO 2026,
 *   VENDAS 2026, VISTORIAS DE IMÓVEIS, Geraldo, etc.
 */
import 'dotenv/config'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

// ── Config ────────────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes('--dry-run')
const FOLDER_ARG = (() => {
  const idx = process.argv.indexOf('--folder')
  return idx !== -1 ? process.argv[idx + 1] : null
})()
const BUCKET = 'documents'
const BACKUP = process.env.BACKUP_PATH || 'Y:\\'
const MAX_FILE_MB = 50

const prisma = new PrismaClient()
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Sanitiza caminho para chave do Supabase Storage (remove acentos e caracteres inválidos) */
function sanitizeKey(p: string): string {
  const normalized = p.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return normalized.replace(/[^a-zA-Z0-9.\-_/ ]/g, '_')
}

function mime(f: string): string {
  const e = path.extname(f).toLowerCase()
  const map: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
  }
  return map[e] || 'application/octet-stream'
}

/** Mapeia nome de pasta raiz para tipo de documento */
function folderToType(folderName: string): string {
  const n = folderName.toUpperCase()
  if (n.includes('ARQUIVO MORTO'))                                           return 'ARQUIVO_MORTO'
  if (n.includes('ADITIVO'))                                                 return 'ADITIVO'
  if (n.includes('FINANCEIRO'))                                              return 'FINANCEIRO'
  if (n.includes('PRESTACAO') || n.includes('PRESTAÇÃO') ||
      n.includes('SERVICO')   || n.includes('SERVIÇO'))                      return 'CONTRATO_SERVICO'
  if (n.includes('FOLDER') || n.includes('SEGURO'))                          return 'SEGURO'
  if (n.includes('IPTU'))                                                    return 'IPTU'
  if (n.includes('JURIDICO') || n.includes('JURÍDICO'))                      return 'JURIDICO'
  if (n.includes('LOCACAO')  || n.includes('LOCAÇÃO'))                       return 'CONTRATO'
  if (n.includes('RECEPCAO') || n.includes('RECEPÇÃO'))                      return 'RECEPCAO'
  if (n.includes('RESCISAO') || n.includes('RESCISÃO'))                      return 'RESCISAO'
  if (n.includes('VENDA'))                                                   return 'VENDA'
  if (n.includes('VISTORIA'))                                                return 'VISTORIA'
  return 'DOCUMENTO'
}

/** Extrai mês/ano de um nome de pasta ou arquivo */
function extractMonthYear(s: string): { month: string | null; year: number | null } {
  const months: Record<string, string> = {
    'JANEIRO': '01', 'FEVEREIRO': '02', 'MARÇO': '03', 'MARCO': '03',
    'ABRIL': '04', 'MAIO': '05', 'JUNHO': '06', 'JULHO': '07',
    'AGOSTO': '08', 'SETEMBRO': '09', 'OUTUBRO': '10',
    'NOVEMBRO': '11', 'DEZEMBRO': '12',
    'JAN': '01', 'FEV': '02', 'MAR': '03', 'ABR': '04',
    'MAI': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08',
    'SET': '09', 'OUT': '10', 'NOV': '11', 'DEZ': '12',
  }
  const upper = s.toUpperCase()
  let month: string | null = null
  let year: number | null = null
  for (const [name, num] of Object.entries(months)) {
    if (upper.includes(name)) { month = num; break }
  }
  const yearMatch = upper.match(/\b(20\d{2}|19\d{2})\b/)
  if (yearMatch) year = parseInt(yearMatch[1])
  const numMatch = upper.match(/\b(\d{2})[\/\-](\d{4})\b/)
  if (numMatch) { month = numMatch[1]; year = parseInt(numMatch[2]) }
  return { month, year }
}

/** Busca clientId por nome usando correspondência fuzzy */
function findClientId(name: string, cmap: Map<string, string>): string | null {
  const upper = name.toUpperCase().trim()
  if (cmap.has(upper)) return cmap.get(upper)!
  for (const [n, id] of cmap) {
    if (n.includes(upper) || upper.includes(n)) return id
  }
  const parts = upper.split(/\s+/)
  if (parts.length >= 2) {
    const firstTwo = parts.slice(0, 2).join(' ')
    for (const [n, id] of cmap) {
      if (n.startsWith(firstTwo)) return id
    }
  }
  if (parts.length >= 1) {
    for (const [n, id] of cmap) {
      if (n.startsWith(parts[0] + ' ')) return id
    }
  }
  return null
}

/** Remove prefixos numéricos e sufixos de data do nome da pasta */
function extractClientName(folderName: string): string {
  return folderName
    .replace(/^\d+[\.\-]\s*/g, '')
    .replace(/\s*[-–]\s*\d{4}.*$/g, '')
    .replace(/\s*\(.*?\)\s*/g, '')
    .trim()
}

/** Lista todos os arquivos recursivamente em um diretório */
function listFiles(dir: string): string[] {
  const result: string[] = []
  try {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry)
      try {
        if (fs.statSync(full).isDirectory()) result.push(...listFiles(full))
        else result.push(full)
      } catch { /* skip */ }
    }
  } catch { /* skip */ }
  return result
}

// ── Contadores globais ────────────────────────────────────────────────────────
let totalOk = 0, totalSkip = 0, totalErr = 0, totalNoClient = 0

// ── Processar uma pasta raiz ──────────────────────────────────────────────────
async function processFolder(
  rootFolder: string,
  cid: string,
  cmap: Map<string, string>,
  alreadyImported: Set<string>
) {
  const folderPath = path.join(BACKUP, rootFolder)
  if (!fs.existsSync(folderPath)) {
    console.log(`  [SKIP] Pasta não encontrada: ${folderPath}`)
    return
  }

  const docType = folderToType(rootFolder)
  const allFiles = listFiles(folderPath)
  console.log(`[${rootFolder}] ${allFiles.length} arquivos`)

  let ok = 0, skip = 0, err = 0, noClient = 0

  for (const filePath of allFiles) {
    const relativePath = path.relative(folderPath, filePath)
    const legacyRef = `${rootFolder}/${relativePath}`

    // Já importado?
    if (alreadyImported.has(legacyRef)) { skip++; continue }

    // Verificar tamanho
    let fileSize = 0
    try { fileSize = fs.statSync(filePath).size } catch { err++; continue }
    if (fileSize > MAX_FILE_MB * 1024 * 1024) {
      console.log(`  [SKIP-SIZE] ${relativePath} (${Math.round(fileSize / 1024 / 1024)}MB)`)
      skip++
      continue
    }

    // Detectar mês/ano
    const pathParts = relativePath.split(path.sep)
    let month: string | null = null
    let year: number | null = null
    for (const part of pathParts) {
      const my = extractMonthYear(part)
      if (my.month) month = my.month
      if (my.year)  year  = my.year
    }
    if (!year) {
      const my = extractMonthYear(path.basename(filePath))
      if (my.year) year = my.year
    }

    // Vincular cliente
    let clientId: string | null = null
    for (const part of pathParts.slice(0, -1)) {
      const candidateName = extractClientName(part)
      if (candidateName.length > 3) {
        clientId = findClientId(candidateName, cmap)
        if (clientId) break
      }
    }
    if (!clientId) noClient++

    // Sanitizar chave
    const rawKey = `${rootFolder}/${relativePath}`.replace(/\\/g, '/')
    const storageKey = sanitizeKey(rawKey)
    const fileName = path.basename(filePath)
    const docName = sanitizeKey(fileName)

    if (DRY_RUN) { ok++; continue }

    try {
      const buf = fs.readFileSync(filePath)
      const mimeType = mime(fileName)
      let finalKey = storageKey

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(storageKey, buf, { contentType: mimeType, upsert: true })

      if (uploadErr) {
        // Retry com chave mais restritiva
        const safeKey = storageKey.replace(/[^a-zA-Z0-9.\-_/]/g, '_')
        finalKey = safeKey
        const { error: retryErr } = await supabase.storage
          .from(BUCKET)
          .upload(safeKey, buf, { contentType: mimeType, upsert: true })
        if (retryErr) {
          console.log(`  [ERR] ${relativePath}: ${retryErr.message}`)
          err++
          continue
        }
      }

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(finalKey)
      const { nanoid } = await import('nanoid')
      const id = 'c' + nanoid(24).toLowerCase().replace(/[^a-z0-9]/g, 'x')

      await prisma.$executeRawUnsafe(
        `INSERT INTO documents (
          id, "companyId", "clientId", type, category, name, month, year,
          "fileData", "fileSize", "mimeType", "legacyRef", metadata,
          "createdAt", "updatedAt"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,NOW(),NOW())
        ON CONFLICT DO NOTHING`,
        id, cid, clientId, docType, rootFolder, docName,
        month, year, buf, buf.length, mimeType, legacyRef,
        JSON.stringify({
          storageKey: finalKey,
          publicUrl: urlData?.publicUrl ?? null,
          originalPath: legacyRef,
        })
      )
      ok++
      alreadyImported.add(legacyRef)
    } catch (e: any) {
      console.log(`  [ERR] ${relativePath}: ${e?.message ?? e}`)
      err++
    }

    if ((ok + skip + err) % 50 === 0) {
      process.stdout.write(
        `\r  ${ok} ok | ${skip} skip | ${err} err | ${noClient} no-client | ${ok + skip + err} total`
      )
    }
  }

  process.stdout.write(
    `\r  ${ok} ok | ${skip} skip | ${err} err | ${noClient} no-client | ${ok + skip + err} total\n`
  )
  totalOk += ok
  totalSkip += skip
  totalErr += err
  totalNoClient += noClient
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('===========================================================')
  console.log('  UPLOAD DOCUMENTOS BACKUP -> Supabase Storage')
  console.log('===========================================================')
  console.log('Modo:', DRY_RUN ? 'DRY-RUN (nenhum arquivo será enviado)' : 'UPLOAD REAL')
  console.log('Backup:', BACKUP)
  console.log('Filtro:', FOLDER_ARG ?? 'todas as pastas')

  // Verificar conexão Supabase
  const { error: sbErr } = await supabase.storage.getBucket(BUCKET)
  if (sbErr) {
    console.error('[ERRO] Supabase Storage não acessível:', sbErr.message)
    console.error('Verifique SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env')
    process.exit(1)
  }
  console.log('[OK] Supabase conectado')

  // Empresa
  const co = await prisma.company.findFirst({ where: { isActive: true } })
  if (!co) { console.error('[ERRO] Nenhuma empresa ativa encontrada'); process.exit(1) }
  console.log('[OK] Empresa:', co.name)
  const cid = co.id

  // Mapa de clientes
  const clients = await prisma.client.findMany({
    where: { companyId: cid },
    select: { id: true, name: true },
  })
  const cmap = new Map<string, string>()
  for (const c of clients) cmap.set(c.name.toUpperCase().trim(), c.id)
  console.log('[OK] Clientes:', cmap.size)

  // Documentos já importados
  const imported = await prisma.$queryRawUnsafe<{ legacyRef: string }[]>(
    `SELECT "legacyRef" FROM documents WHERE "companyId" = $1 AND "legacyRef" IS NOT NULL`,
    cid
  )
  const alreadyImported = new Set(imported.map(r => r.legacyRef))
  console.log('[OK] Ja importados:', alreadyImported.size)

  // Detectar pastas disponíveis
  if (!fs.existsSync(BACKUP)) {
    console.error('[ERRO] Diretório de backup não encontrado:', BACKUP)
    process.exit(1)
  }

  let folders = fs.readdirSync(BACKUP).filter(f => {
    try { return fs.statSync(path.join(BACKUP, f)).isDirectory() } catch { return false }
  })

  if (FOLDER_ARG) {
    const lower = FOLDER_ARG.toLowerCase()
    folders = folders.filter(f => f.toLowerCase().includes(lower))
    if (folders.length === 0) {
      console.error(`[ERRO] Nenhuma pasta encontrada com filtro: "${FOLDER_ARG}"`)
      const all = fs.readdirSync(BACKUP).filter(f => {
        try { return fs.statSync(path.join(BACKUP, f)).isDirectory() } catch { return false }
      })
      console.log('Pastas disponíveis:', all.join(', '))
      process.exit(1)
    }
  }

  console.log('Pastas:', folders.join(', '))

  for (const folder of folders) {
    await processFolder(folder, cid, cmap, alreadyImported)
  }

  console.log('\n===========================================================')
  console.log('  RESUMO FINAL')
  console.log('===========================================================')
  console.log(`  Enviados:    ${totalOk}`)
  console.log(`  Ignorados:   ${totalSkip} (já importados ou muito grandes)`)
  console.log(`  Erros:       ${totalErr}`)
  console.log(`  Sem cliente: ${totalNoClient} (sem vínculo a cliente)`)
  console.log(`  Total:       ${totalOk + totalSkip + totalErr}`)
  const totalDocs = await prisma.document.count({ where: { companyId: cid } })
  console.log(`\nTotal documentos no banco: ${totalDocs}`)
}

main()
  .catch(e => { console.error('[FATAL]', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
