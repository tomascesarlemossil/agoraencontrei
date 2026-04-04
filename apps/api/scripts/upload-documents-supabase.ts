import 'dotenv/config'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

const DRY_RUN = process.argv.includes('--dry-run')
const FOLDER_FILTER = (() => {
  const idx = process.argv.indexOf('--folder')
  return idx >= 0 ? process.argv[idx + 1] : null
})()
const BUCKET = 'documents'
const BACKUP_ROOT = process.env.BACKUP_PATH || 'Y:\\'
const BATCH_SIZE = 20

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios no .env')
  process.exit(1)
}

const prisma = new PrismaClient()
const supabase = createClient(supabaseUrl, supabaseKey)

const FOLDER_TYPE_MAP: Record<string, { type: string; category?: string }> = {
  'LOCACAO':         { type: 'BOLETO',     category: 'locacao' },
  'BOLETO':          { type: 'BOLETO',     category: 'locacao' },
  'EXTRATO':         { type: 'EXTRATO',    category: 'locacao' },
  'REAJUSTE':        { type: 'REAJUSTE',   category: 'locacao' },
  'VENDAS':          { type: 'FINANCEIRO', category: 'vendas' },
  'VENDA':           { type: 'FINANCEIRO', category: 'vendas' },
  'CONT. PRESTACAO': { type: 'CONTRATO',   category: 'prestacao_servico' },
  'PRESTACAO':       { type: 'CONTRATO',   category: 'prestacao_servico' },
  'RESCISAO':        { type: 'CONTRATO',   category: 'rescisao' },
  'ADITIVO':         { type: 'CONTRATO',   category: 'aditivo' },
  'VISTORIA':        { type: 'OUTROS',     category: 'vistoria' },
  'JURIDICO':        { type: 'OUTROS',     category: 'juridico' },
  'SEGURO':          { type: 'OUTROS',     category: 'seguro' },
  'ARQUIVO MORTO':   { type: 'OUTROS',     category: 'arquivo_morto' },
  'FINANCEIRO':      { type: 'FINANCEIRO', category: 'financeiro' },
  'CONTRATO':        { type: 'CONTRATO',   category: 'contrato' },
}

const SKIP_FOLDERS = new Set([
  'BACKUP 2025', 'BKP 2024', 'ESCALA 2026', 'LEEDS',
  '$RECYCLE.BIN', 'System Volume Information',
])

const SKIP_EXTENSIONS = new Set([
  '.tmp', '.temp', '.bak', '.log', '.db', '.lnk', '.ini', '.sys',
  '.dll', '.exe', '.bat', '.cmd', '.com', '.thumbs', '.ds_store',
])
const SKIP_FILES = new Set(['thumbs.db', 'desktop.ini', '.ds_store', 'ehthumbs.db'])

function getMimeType(filepath: string): string {
  const ext = path.extname(filepath).toLowerCase()
  const map: Record<string, string> = {
    '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.gif': 'image/gif', '.bmp': 'image/bmp',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain', '.csv': 'text/csv',
    '.zip': 'application/zip', '.rar': 'application/x-rar-compressed',
    '.rtf': 'application/rtf', '.xml': 'application/xml',
    '.html': 'text/html', '.htm': 'text/html',
  }
  return map[ext] || 'application/octet-stream'
}

function classifyFile(folderPath: string): { type: string; category: string } {
  const upper = folderPath.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const [key, val] of Object.entries(FOLDER_TYPE_MAP)) {
    if (upper.includes(key.toUpperCase())) return { type: val.type, category: val.category || 'geral' }
  }
  return { type: 'OUTROS', category: 'geral' }
}

function extractYear(p: string): number | null {
  const m = p.match(/\b(20\d{2})\b/); return m ? parseInt(m[1]) : null
}

function extractMonth(f: string): string | null {
  const months: Record<string,string> = {
    'JANEIRO':'01','FEVEREIRO':'02','MARCO':'03','ABRIL':'04','MAIO':'05','JUNHO':'06',
    'JULHO':'07','AGOSTO':'08','SETEMBRO':'09','OUTUBRO':'10','NOVEMBRO':'11','DEZEMBRO':'12',
  }
  const u = f.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  for (const [name, num] of Object.entries(months)) { if (u.includes(name)) return num }
  const m1 = u.match(/(\d{2})[.\-/](20\d{2})/); if (m1) return m1[1]
  const m2 = u.match(/(20\d{2})[.\-/](\d{2})/); if (m2) return m2[2]
  return null
}

function shouldSkipFile(fp: string): boolean {
  const fn = path.basename(fp).toLowerCase()
  const ext = path.extname(fp).toLowerCase()
  return SKIP_FILES.has(fn) || SKIP_EXTENSIONS.has(ext) || fn.startsWith('.') || fn.startsWith('~$')
}

function normalize(name: string): string {
  return name.toUpperCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
}

function* walkDir(dir: string): Generator<string> {
  let entries: fs.Dirent[]
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!SKIP_FOLDERS.has(entry.name) && !entry.name.startsWith('.')) yield* walkDir(full)
    } else if (entry.isFile() && !shouldSkipFile(full)) {
      yield full
    }
  }
}

async function main() {
  console.log('===========================================================')
  console.log('  UPLOAD DOCUMENTOS BACKUP -> Supabase Storage')
  console.log('===========================================================')
  console.log('Modo:', DRY_RUN ? 'DRY-RUN' : 'UPLOAD REAL')
  console.log('Backup:', BACKUP_ROOT)
  console.log('Filtro:', FOLDER_FILTER || 'todas as pastas')

  if (!DRY_RUN) {
    const { data, error } = await supabase.storage.listBuckets()
    if (error) { console.error('Erro Supabase:', error.message); return }
    if (!data.some(b => b.name === BUCKET)) {
      const { error: e } = await supabase.storage.createBucket(BUCKET, { public: false, fileSizeLimit: 100*1024*1024 })
      if (e) { console.error('Erro criar bucket:', e.message); return }
    }
    console.log('[OK] Supabase conectado')
  }

  const company = await prisma.company.findFirst({ where: { isActive: true } })
  if (!company) { console.error('Sem empresa'); return }
  const companyId = company.id
  console.log('[OK] Empresa:', company.name)

  const clients = await prisma.client.findMany({ where: { companyId }, select: { id: true, name: true } })
  const clientMap = new Map<string, string>()
  for (const c of clients) {
    clientMap.set(normalize(c.name), c.id)
    const parts = normalize(c.name).split(' ')
    if (parts.length >= 2) clientMap.set(parts[parts.length - 1], c.id)
  }
  console.log('[OK] Clientes:', clients.length)

  const existing = await prisma.document.findMany({ where: { companyId }, select: { legacyRef: true } })
  const existingRefs = new Set(existing.filter(d => d.legacyRef).map(d => d.legacyRef!))
  console.log('[OK] Ja importados:', existingRefs.size)

  if (!fs.existsSync(BACKUP_ROOT)) { console.error('Pasta nao encontrada:', BACKUP_ROOT); return }

  let rootFolders = fs.readdirSync(BACKUP_ROOT)
    .filter(f => { try { return fs.statSync(path.join(BACKUP_ROOT, f)).isDirectory() } catch { return false } })
    .filter(f => !SKIP_FOLDERS.has(f))

  if (FOLDER_FILTER) rootFolders = rootFolders.filter(f => normalize(f).includes(normalize(FOLDER_FILTER)))

  console.log('\nPastas:', rootFolders.join(', '))

  const stats = { uploaded: 0, skipped: 0, errors: 0, noClient: 0, total: 0 }
  const errorLog: string[] = []

  for (const folder of rootFolders) {
    const files = [...walkDir(path.join(BACKUP_ROOT, folder))]
    console.log('\n[' + folder + '] ' + files.length + ' arquivos')

    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE)
      await Promise.all(batch.map(async (filepath) => {
        stats.total++
        const rel = path.relative(BACKUP_ROOT, filepath).replace(/\\/g, '/')
        if (existingRefs.has(rel)) { stats.skipped++; return }

        const { type, category } = classifyFile(rel)
        const year = extractYear(rel)
        const month = extractMonth(path.basename(filepath))
        const docName = path.basename(filepath).replace(path.extname(filepath), '')

        let clientId: string | null = null
        const parts = rel.split('/')
        for (let p = parts.length - 2; p >= 0; p--) {
          const clean = normalize(parts[p]).replace(/^[\d.\-\s]+/, '').trim()
          if (clean.length < 3) continue
          if (clientMap.has(clean)) { clientId = clientMap.get(clean)!; break }
          for (const [n, id] of clientMap) {
            if (n.length >= 5 && (clean.includes(n) || n.includes(clean))) { clientId = id; break }
          }
          if (clientId) break
        }
        if (!clientId) stats.noClient++

        const storagePath = (companyId + '/' + rel).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9/._\-]/g, '_')

        if (DRY_RUN) { stats.uploaded++; return }

        try {
          const buf = fs.readFileSync(filepath)
          const mime = getMimeType(filepath)
          const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buf, { contentType: mime, upsert: true })
          if (error) { stats.errors++; errorLog.push(rel + ': ' + error.message); return }

          const { data: u } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
          await prisma.document.create({
            data: {
              companyId, clientId, type, category, name: docName, month, year, mimeType: mime,
              fileSize: buf.length, legacyRef: rel,
              metadata: { storageBucket: BUCKET, storagePath, storageUrl: u.publicUrl, originalPath: filepath, uploadedAt: new Date().toISOString() },
            },
          })
          stats.uploaded++
        } catch (e: any) { stats.errors++; errorLog.push(rel + ': ' + e.message) }
      }))
      process.stdout.write('\r  ' + stats.uploaded + ' ok | ' + stats.skipped + ' skip | ' + stats.errors + ' err | ' + stats.noClient + ' no-client | ' + stats.total + ' total')
    }
  }

  console.log('\n\n=== RESULTADO ===')
  console.log('Enviados:', stats.uploaded, '| Skip:', stats.skipped, '| Erros:', stats.errors, '| Sem cliente:', stats.noClient)
  if (errorLog.length) fs.writeFileSync('upload-errors.log', errorLog.join('\n'))
  console.log('Total no banco:', await prisma.document.count({ where: { companyId } }))
}

main().catch(e => console.error('Fatal:', e)).finally(() => prisma.$disconnect())
