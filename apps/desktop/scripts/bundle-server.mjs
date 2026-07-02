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
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..')      // raiz do monorepo
const SERVER = path.resolve(__dirname, '..', 'server')       // apps/desktop/server

function exists(p) { return fs.existsSync(p) }

// Localiza o CLI do Prisma no monorepo (mesma lógica de assemble-offline-api.mjs).
function findPrismaCli() {
  const direct = path.join(ROOT, 'node_modules', 'prisma', 'build', 'index.js')
  if (exists(direct)) return direct
  const pnpmDir = path.join(ROOT, 'node_modules', '.pnpm')
  if (exists(pnpmDir)) {
    const d = fs.readdirSync(pnpmDir).find((n) => /^prisma@/.test(n))
    if (d) {
      const p = path.join(pnpmDir, d, 'node_modules', 'prisma', 'build', 'index.js')
      if (exists(p)) return p
    }
  }
  return null
}

/**
 * Gera o SQL que cria o schema INTEIRO a partir do schema.prisma (fonte da
 * verdade), via `prisma migrate diff --from-empty --to-schema-datamodel`.
 *
 * Por que NÃO concatenar os migration.sql: a base do projeto foi criada com
 * `prisma db push` (não por migrations), então os arquivos de migration só
 * cobrem alterações incrementais — faltam ~33 tabelas (owner_repasses,
 * scheduled_repasses, financings, proposals, documents, tenants, etc.) e há
 * migrations que referenciam tabelas por nomes que não existem (ex.: "Contract"
 * em vez de "contracts"). Concatená-las produz um banco QUEBRADO e incompleto.
 * O `migrate diff --from-empty` deriva o DDL completo direto do schema — o mesmo
 * schema da nuvem — garantindo 115/115 tabelas no 1º boot offline.
 *
 * Retorna o SQL, ou null se o Prisma não estiver disponível (o chamador então
 * cai no fallback de concatenação, melhor do que nenhum schema).
 */
function generateSchemaSqlFromPrisma(schemaPath) {
  const cli = findPrismaCli()
  if (!cli) { console.warn('  ⚠️  prisma CLI não encontrado — usando fallback de concatenação'); return null }
  try {
    const out = execSync(
      `node "${cli}" migrate diff --from-empty --to-schema-datamodel "${schemaPath}" --script`,
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 64 * 1024 * 1024 },
    )
    if (out && /CREATE TABLE/i.test(out)) return out
    console.warn('  ⚠️  migrate diff não retornou DDL válido — usando fallback')
    return null
  } catch (e) {
    console.warn(`  ⚠️  migrate diff falhou (${e.message}) — usando fallback de concatenação`)
    return null
  }
}

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
  // db.js aplica este SQL no 1º boot (uma única transação), sem CLI/engine do
  // Prisma em runtime. Preferimos derivar o schema COMPLETO do schema.prisma
  // (via migrate diff --from-empty); só caímos na concatenação de migrations se
  // o Prisma não estiver disponível — e avisamos, pois a concatenação é
  // incompleta (a base foi criada com db push, não com migrations).
  const schemaPath = path.join(prismaSrc, 'schema.prisma')
  let sql = generateSchemaSqlFromPrisma(schemaPath)
  let source = 'schema.prisma (migrate diff --from-empty)'
  if (!sql) {
    source = 'concatenação de migrations (FALLBACK — schema pode ficar incompleto)'
    const migDir = path.join(prismaSrc, 'migrations')
    sql = ''
    if (exists(migDir)) {
      const dirs = fs.readdirSync(migDir, { withFileTypes: true })
        .filter((d) => d.isDirectory()).map((d) => d.name).sort()
      for (const d of dirs) {
        const f = path.join(migDir, d, 'migration.sql')
        if (exists(f)) sql += `\n-- ===== ${d} =====\n` + fs.readFileSync(f, 'utf8') + '\n'
      }
    }
  }
  const tables = (sql.match(/CREATE TABLE/gi) || []).length
  fs.writeFileSync(path.join(SERVER, 'prisma', 'all-migrations.sql'), sql)
  console.log(`✓ (${sql.length} bytes, ${tables} tabelas) — fonte: ${source}`) ; ok++
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
