/**
 * upload-documents-supabase.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Faz upload de documentos do backup local para o Supabase Storage e registra
 * os metadados no banco PostgreSQL (SEM salvar fileData no banco — apenas URL).
 *
 * Uso (no diretório apps/api):
 *   npx tsx scripts/upload-documents-supabase.ts [--dry-run] [--folder "NOME"] [--year 2025]
 *
 * Variáveis de ambiente (.env):
 *   SUPABASE_URL              https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY eyJ...
 *   DATABASE_URL              postgresql://...
 *   BACKUP_PATH               Caminho raiz do backup (ex: Y:\a lemos 2024)
 *
 * Pastas suportadas automaticamente (detectadas por nome):
 *   ARQUIVO MORTO, ADITIVO, FINANCEIRO, CONT. PRESTAÇÃO SERVIÇO,
 *   FOLDER SEGURO, IPTU, JURIDICO, LOCAÇÃO, RECEPÇÃO, RESCISÃO,
 *   VENDAS, VISTORIAS DE IMÓVEIS, Geraldo, e qualquer outra pasta.
 */
import 'dotenv/config'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

// ── Config ────────────────────────────────────────────────────────────────────
const DRY_RUN    = process.argv.includes('--dry-run')
const FOLDER_ARG = (() => {
  const idx = process.argv.indexOf('--folder')
  return idx !== -1 ? process.argv[idx + 1] : null
})()
const YEAR_ARG = (() => {
  const idx = process.argv.indexOf('--year')
  return idx !== -1 ? parseInt(process.argv[idx + 1]) : null
})()

const BUCKET      = 'documents'
const BACKUP      = (process.env.BACKUP_PATH || 'Y:\\').replace(/\\/g, path.sep)
const MAX_FILE_MB = 100   // aumentado para 100 MB (PDFs grandes, planilhas)
const CONCURRENCY = 3     // uploads paralelos por pasta

const prisma    = new PrismaClient()
const supabase  = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } }
)

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Sanitiza caminho para chave do Supabase Storage.
 * Remove acentos, substitui caracteres inválidos por underscore.
 * Supabase aceita: a-z A-Z 0-9 . - _ / e espaço
 */
function sanitizeKey(p: string): string {
  // Normaliza unicode (remove acentos)
  const normalized = p.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  // Substitui barras invertidas por /
  const slashed = normalized.replace(/\\/g, '/')
  // Remove caracteres inválidos (mantém letras, números, . - _ / e espaço)
  return slashed.replace(/[^a-zA-Z0-9.\-_/ ]/g, '_')
}

function mime(f: string): string {
  const e = path.extname(f).toLowerCase()
  const map: Record<string, string> = {
    '.pdf':  'application/pdf',
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png':  'image/png',
    '.gif':  'image/gif',
    '.webp': 'image/webp',
    '.doc':  'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls':  'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv':  'text/csv',
    '.txt':  'text/plain',
    '.zip':  'application/zip',
    '.rar':  'application/x-rar-compressed',
    '.7z':   'application/x-7z-compressed',
    '.mp4':  'video/mp4',
    '.mp3':  'audio/mpeg',
    '.msg':  'application/vnd.ms-outlook',
    '.eml':  'message/rfc822',
  }
  return map[e] || 'application/octet-stream'
}

/** Mapeia nome de pasta raiz para tipo de documento */
function folderToType(folderName: string): string {
  const n = folderName.toUpperCase()
  if (n.includes('ARQUIVO MORTO'))                                            return 'ARQUIVO_MORTO'
  if (n.includes('ADITIVO'))                                                  return 'ADITIVO'
  if (n.includes('FINANCEIRO'))                                               return 'FINANCEIRO'
  if (n.includes('PRESTACAO') || n.includes('PRESTAÇÃO') ||
      n.includes('SERVICO')   || n.includes('SERVIÇO'))                       return 'CONTRATO_SERVICO'
  if (n.includes('FOLDER') || n.includes('SEGURO'))                           return 'SEGURO'
  if (n.includes('IPTU'))                                                     return 'IPTU'
  if (n.includes('JURIDICO') || n.includes('JURÍDICO'))                       return 'JURIDICO'
  if (n.includes('LOCACAO')  || n.includes('LOCAÇÃO'))                        return 'CONTRATO'
  if (n.includes('RECEPCAO') || n.includes('RECEPÇÃO'))                       return 'RECEPCAO'
  if (n.includes('RESCISAO') || n.includes('RESCISÃO'))                       return 'RESCISAO'
  if (n.includes('VENDA'))                                                    return 'VENDA'
  if (n.includes('VISTORIA'))                                                 return 'VISTORIA'
  if (n.includes('GERALDO'))                                                  return 'DOCUMENTO'
  if (n.includes('PREFEITURA') || n.includes('CREDENCIAMENTO'))               return 'DOCUMENTO'
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
  // Formato MM/YYYY ou MM-YYYY
  const numMatch = upper.match(/\b(\d{2})[\/\-](20\d{2}|19\d{2})\b/)
  if (numMatch) { month = numMatch[1]; year = parseInt(numMatch[2]) }
  return { month, year }
}

/** Busca clientId por nome usando correspondência fuzzy */
function findClientId(name: string, cmap: Map<string, string>): string | null {
  const upper = name.toUpperCase().trim()
  if (upper.length < 3) return null
  // Correspondência exata
  if (cmap.has(upper)) return cmap.get(upper)!
  // Correspondência parcial (nome contido ou contém)
  for (const [n, id] of cmap) {
    if (n.includes(upper) || upper.includes(n)) return id
  }
  // Primeiras duas palavras
  const parts = upper.split(/\s+/)
  if (parts.length >= 2) {
    const firstTwo = parts.slice(0, 2).join(' ')
    for (const [n, id] of cmap) {
      if (n.startsWith(firstTwo)) return id
    }
  }
  // Primeira palavra (sobrenome ou nome)
  if (parts.length >= 1 && parts[0].length >= 4) {
    for (const [n, id] of cmap) {
      if (n.startsWith(parts[0] + ' ')) return id
    }
  }
  return null
}

/** Remove prefixos numéricos, sufixos de data e parênteses do nome da pasta */
function extractClientName(folderName: string): string {
  return folderName
    .replace(/^\d+[\.\-\s]+/g, '')           // remove "001. " ou "1- "
    .replace(/\s*[-–]\s*\d{4}.*$/g, '')      // remove " - 2026..."
    .replace(/\s*\(.*?\)\s*/g, '')            // remove "(conteúdo)"
    .replace(/\s*\d{2}\/\d{4}.*$/g, '')      // remove "01/2026..."
    .trim()
}

/** Lista todos os arquivos recursivamente em um diretório, excluindo .rar e .zip */
function listFiles(dir: string): string[] {
  const result: string[] = []
  const SKIP_EXTS = new Set(['.rar', '.zip', '.7z', '.tar', '.gz', '.bak', '.tmp'])
  try {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry)
      try {
        const stat = fs.statSync(full)
        if (stat.isDirectory()) {
          result.push(...listFiles(full))
        } else {
          const ext = path.extname(entry).toLowerCase()
          if (!SKIP_EXTS.has(ext)) result.push(full)
        }
      } catch { /* skip inacessível */ }
    }
  } catch { /* skip diretório inacessível */ }
  return result
}

/** Gera ID único no formato usado pelo sistema */
function genId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let id = 'c'
  for (let i = 0; i < 24; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}

// ── Contadores globais ────────────────────────────────────────────────────────
let totalOk = 0, totalSkip = 0, totalErr = 0, totalNoClient = 0, totalSkipSize = 0

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

  // Filtrar por ano se especificado
  const filesToProcess = YEAR_ARG
    ? allFiles.filter(f => {
        const rel = path.relative(folderPath, f)
        const my = extractMonthYear(rel)
        return my.year === YEAR_ARG || rel.toUpperCase().includes(String(YEAR_ARG))
      })
    : allFiles

  console.log(`\n[${rootFolder}] ${filesToProcess.length} arquivos${YEAR_ARG ? ` (filtro: ${YEAR_ARG})` : ''}`)

  let ok = 0, skip = 0, err = 0, noClient = 0, skipSize = 0

  // Processar em lotes de CONCURRENCY
  const chunks: string[][] = []
  for (let i = 0; i < filesToProcess.length; i += CONCURRENCY) {
    chunks.push(filesToProcess.slice(i, i + CONCURRENCY))
  }

  for (const chunk of chunks) {
    await Promise.all(chunk.map(async (filePath) => {
      const relativePath = path.relative(folderPath, filePath)
      // Normalizar separadores para legacyRef (sempre usar /)
      const legacyRef = `${rootFolder}/${relativePath.replace(/\\/g, '/')}`

      // Já importado?
      if (alreadyImported.has(legacyRef)) { skip++; return }

      // Verificar tamanho
      let fileSize = 0
      try { fileSize = fs.statSync(filePath).size } catch { err++; return }
      if (fileSize === 0) { skip++; return }  // arquivo vazio
      if (fileSize > MAX_FILE_MB * 1024 * 1024) {
        if (ok + skip + err + skipSize < 10 || skipSize % 20 === 0) {
          console.log(`  [SKIP-SIZE] ${relativePath} (${Math.round(fileSize / 1024 / 1024)}MB)`)
        }
        skipSize++
        return
      }

      // Detectar mês/ano a partir do caminho
      const pathParts = relativePath.replace(/\\/g, '/').split('/')
      let month: string | null = null
      let year: number | null = null
      for (const part of pathParts) {
        const my = extractMonthYear(part)
        if (my.month && !month) month = my.month
        if (my.year  && !year)  year  = my.year
      }
      // Tentar extrair do nome do arquivo também
      if (!year) {
        const my = extractMonthYear(path.basename(filePath))
        if (my.year) year = my.year
        if (my.month && !month) month = my.month
      }

      // Vincular cliente (percorre partes do caminho, excluindo o arquivo)
      let clientId: string | null = null
      for (const part of pathParts.slice(0, -1)) {
        const candidateName = extractClientName(part)
        if (candidateName.length > 3) {
          clientId = findClientId(candidateName, cmap)
          if (clientId) break
        }
      }
      if (!clientId) noClient++

      // Sanitizar chave do Storage
      const rawKey = legacyRef
      const storageKey = sanitizeKey(rawKey)
      const fileName = path.basename(filePath)
      const docName = sanitizeKey(fileName)

      if (DRY_RUN) { ok++; return }

      try {
        const buf = fs.readFileSync(filePath)
        const mimeType = mime(fileName)
        let finalKey = storageKey

        // Upload para Supabase Storage
        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(storageKey, buf, { contentType: mimeType, upsert: false })

        if (uploadErr) {
          if (uploadErr.message?.includes('already exists') || uploadErr.message?.includes('Duplicate')) {
            // Arquivo já existe no Storage — registrar metadados mesmo assim
            finalKey = storageKey
          } else {
            // Retry com chave ainda mais restritiva (só alfanumérico + . - _ /)
            const safeKey = storageKey.replace(/[^a-zA-Z0-9.\-_/]/g, '_')
            finalKey = safeKey
            const { error: retryErr } = await supabase.storage
              .from(BUCKET)
              .upload(safeKey, buf, { contentType: mimeType, upsert: true })
            if (retryErr) {
              console.log(`  [ERR-UPLOAD] ${relativePath}: ${retryErr.message}`)
              err++
              return
            }
          }
        }

        // Obter URL pública
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(finalKey)
        const id = genId()

        // Inserir metadados no banco (SEM fileData — apenas URL do Storage)
        await prisma.$executeRawUnsafe(
          `INSERT INTO documents (
            id, "companyId", "clientId", type, category, name, month, year,
            "fileSize", "mimeType", "legacyRef", metadata,
            "createdAt", "updatedAt"
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,NOW(),NOW())
          ON CONFLICT DO NOTHING`,
          id, cid, clientId, docType, rootFolder, docName,
          month, year ? year : null, fileSize, mimeType, legacyRef,
          JSON.stringify({
            storageKey: finalKey,
            publicUrl:  urlData?.publicUrl ?? null,
            originalPath: legacyRef,
          })
        )

        ok++
        alreadyImported.add(legacyRef)
      } catch (e: any) {
        console.log(`  [ERR] ${relativePath}: ${e?.message ?? e}`)
        err++
      }
    }))

    // Progresso a cada lote
    const total = ok + skip + err + skipSize
    if (total % 100 === 0 || total === filesToProcess.length) {
      process.stdout.write(
        `\r  ${ok} ok | ${skip} skip | ${skipSize} skip-size | ${err} err | ${noClient} no-client | ${total}/${filesToProcess.length}`
      )
    }
  }

  process.stdout.write(
    `\r  ${ok} ok | ${skip} skip | ${skipSize} skip-size | ${err} err | ${noClient} no-client | ${ok + skip + skipSize + err}/${filesToProcess.length}\n`
  )

  totalOk        += ok
  totalSkip      += skip
  totalErr       += err
  totalNoClient  += noClient
  totalSkipSize  += skipSize
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('===========================================================')
  console.log('  UPLOAD DOCUMENTOS BACKUP -> Supabase Storage')
  console.log('===========================================================')
  console.log('Modo:   ', DRY_RUN ? 'DRY-RUN (nenhum arquivo será enviado)' : 'UPLOAD REAL')
  console.log('Backup: ', BACKUP)
  console.log('Filtro: ', FOLDER_ARG ?? 'todas as pastas')
  if (YEAR_ARG) console.log('Ano:    ', YEAR_ARG)

  // Verificar variáveis de ambiente
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('\n[ERRO] Variáveis de ambiente faltando!')
    console.error('  Crie o arquivo apps/api/.env com:')
    console.error('  SUPABASE_URL=https://xxxx.supabase.co')
    console.error('  SUPABASE_SERVICE_ROLE_KEY=eyJ...')
    console.error('  DATABASE_URL=postgresql://...')
    console.error('  BACKUP_PATH=Y:\\a lemos 2024')
    process.exit(1)
  }

  // Verificar conexão Supabase
  const { error: sbErr } = await supabase.storage.getBucket(BUCKET)
  if (sbErr) {
    // Tentar criar o bucket se não existir
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_MB * 1024 * 1024,
    })
    if (createErr) {
      console.error('[ERRO] Supabase Storage não acessível:', sbErr.message)
      console.error('Verifique SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env')
      process.exit(1)
    }
    console.log('[OK] Bucket "documents" criado no Supabase Storage')
  } else {
    console.log('[OK] Supabase conectado — bucket "documents" encontrado')
  }

  // Empresa
  const co = await prisma.company.findFirst({ where: { isActive: true } })
  if (!co) { console.error('[ERRO] Nenhuma empresa ativa encontrada no banco'); process.exit(1) }
  console.log('[OK] Empresa:', co.name)
  const cid = co.id

  // Mapa de clientes (nome → id)
  const clients = await prisma.client.findMany({
    where: { companyId: cid },
    select: { id: true, name: true },
  })
  const cmap = new Map<string, string>()
  for (const c of clients) cmap.set(c.name.toUpperCase().trim(), c.id)
  console.log('[OK] Clientes:', cmap.size)

  // Documentos já importados (para evitar duplicatas)
  const imported = await prisma.$queryRawUnsafe<{ legacyRef: string }[]>(
    `SELECT "legacyRef" FROM documents WHERE "companyId" = $1 AND "legacyRef" IS NOT NULL`,
    cid
  )
  const alreadyImported = new Set(imported.map(r => r.legacyRef))
  console.log('[OK] Ja importados:', alreadyImported.size)

  // Verificar diretório de backup
  if (!fs.existsSync(BACKUP)) {
    console.error('[ERRO] Diretório de backup não encontrado:', BACKUP)
    console.error('  Verifique BACKUP_PATH no .env')
    process.exit(1)
  }

  // Detectar pastas disponíveis
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

  console.log('\nPastas:', folders.join(', '))
  console.log('-----------------------------------------------------------')

  const startTime = Date.now()

  for (const folder of folders) {
    await processFolder(folder, cid, cmap, alreadyImported)
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000)
  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60

  console.log('\n===========================================================')
  console.log('  RESUMO FINAL')
  console.log('===========================================================')
  console.log(`  Enviados:        ${totalOk}`)
  console.log(`  Já importados:   ${totalSkip}`)
  console.log(`  Muito grandes:   ${totalSkipSize} (>${MAX_FILE_MB}MB — ignorados)`)
  console.log(`  Erros:           ${totalErr}`)
  console.log(`  Sem cliente:     ${totalNoClient} (sem vínculo a cliente)`)
  console.log(`  Total:           ${totalOk + totalSkip + totalSkipSize + totalErr}`)
  console.log(`  Tempo:           ${mins}m ${secs}s`)

  const totalDocs = await prisma.document.count({ where: { companyId: cid } })
  console.log(`\nTotal documentos no banco: ${totalDocs}`)
}

main()
  .catch(e => { console.error('[FATAL]', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
