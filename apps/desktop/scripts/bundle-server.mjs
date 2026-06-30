/**
 * Monta o servidor embarcado da edição offline em apps/desktop/server/.
 *
 * Copia para ./server:
 *   - prisma/  (schema + migrations)            → `migrate deploy` local
 *   - api/     (build standalone do Fastify + node_modules)
 *   - web/     (Next standalone: server.js + node_modules + .next/static + public)
 *
 * IMPORTANTE: o Next standalone e a API precisam dos respectivos node_modules
 * para rodar — por isso COPIAMOS node_modules (com dereference, pois no pnpm
 * são symlinks). O Next também exige copiar .next/static e public ao lado do
 * server.js manualmente (não vão no standalone por padrão).
 *
 * Pré-requisito: ter buildado os apps antes (pnpm build na raiz).
 * Uso: node scripts/bundle-server.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..')      // raiz do monorepo
const SERVER = path.resolve(__dirname, '..', 'server')       // apps/desktop/server

function exists(p) { return fs.existsSync(p) }

// cpSync com dereference resolve os symlinks do pnpm copiando os arquivos reais.
// Resiliente: um erro de cópia (ex.: node_modules do pnpm) nunca quebra o build.
function copy(src, dest, { optional = false } = {}) {
  if (!exists(src)) {
    if (!optional) console.warn(`  ⚠️  ausente: ${src} (build feito?)`)
    return false
  }
  try {
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.cpSync(src, dest, { recursive: true, dereference: true })
    return true
  } catch (e) {
    console.warn(`  ⚠️  falha ao copiar ${src}: ${e.message}`)
    return false
  }
}

console.log('Montando apps/desktop/server ...')
fs.rmSync(SERVER, { recursive: true, force: true })
fs.mkdirSync(SERVER, { recursive: true })

let ok = 0, total = 0

// 1) Prisma (schema + migrations) + SQL concatenado para aplicar offline.
total++
process.stdout.write('  • prisma: ')
const prismaSrc = path.join(ROOT, 'packages', 'database', 'prisma')
if (copy(prismaSrc, path.join(SERVER, 'prisma'))) {
  // Concatena migrations/<ts>_nome/migration.sql em ordem cronológica → all-migrations.sql.
  // db.js aplica esse SQL no 1º boot, sem precisar do CLI/engine do Prisma.
  const migDir = path.join(prismaSrc, 'migrations')
  let sql = ''
  if (exists(migDir)) {
    const dirs = fs.readdirSync(migDir, { withFileTypes: true })
      .filter((d) => d.isDirectory()).map((d) => d.name).sort()
    for (const d of dirs) {
      const f = path.join(migDir, d, 'migration.sql')
      if (exists(f)) sql += `\n-- ===== ${d} =====\n` + fs.readFileSync(f, 'utf8') + '\n'
    }
  }
  fs.writeFileSync(path.join(SERVER, 'prisma', 'all-migrations.sql'), sql)
  console.log(`✓ (${sql.length} bytes de schema)`) ; ok++
} else console.log('pulado')

// 2) Web — Next standalone (self-contained com node_modules) + static + public.
total++
process.stdout.write('  • web (Next standalone): ')
const standalone = path.join(ROOT, 'apps', 'web', '.next', 'standalone')
if (copy(standalone, path.join(SERVER, 'web'))) {
  // O server.js do monorepo fica em server/web/apps/web/server.js.
  const webAppDir = path.join(SERVER, 'web', 'apps', 'web')
  copy(path.join(ROOT, 'apps', 'web', '.next', 'static'), path.join(webAppDir, '.next', 'static'), { optional: true })
  copy(path.join(ROOT, 'apps', 'web', 'public'), path.join(webAppDir, 'public'), { optional: true })
  ok++; console.log('✓')
} else console.log('pulado')

// 3) API — montada à parte por scripts/assemble-offline-api.mjs (pnpm deploy +
//    Prisma client com engine do Windows). Aqui só web + prisma SQL.

console.log(`\n${ok}/${total} componentes copiados para ./server`)
console.log('Em seguida: node scripts/assemble-offline-api.mjs  → monta a API; depois electron-builder')
