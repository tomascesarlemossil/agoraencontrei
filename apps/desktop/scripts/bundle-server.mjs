/**
 * Monta o servidor embarcado da edição offline em apps/desktop/server/.
 *
 * Copia para ./server:
 *   - prisma/ (schema + 36 migrations) → para `migrate deploy` local
 *   - o build standalone da API (Fastify) e do Web (Next standalone)
 *
 * Pré-requisito: ter buildado os apps antes (pnpm build na raiz).
 * Uso: node scripts/bundle-server.mjs
 *
 * NB: este script assume os caminhos de saída padrão. Ajuste DIRS conforme a
 * config de build de cada app (ex.: Next `output: 'standalone'`).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..')      // raiz do monorepo
const SERVER = path.resolve(__dirname, '..', 'server')       // apps/desktop/server

function copyDir(src, dest) {
  if (!fs.existsSync(src)) { console.warn(`  ⚠️  ausente: ${src} (build feito?)`); return false }
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.name === 'node_modules' || entry.name === '.git') continue
    if (entry.isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
  return true
}

console.log('Montando apps/desktop/server ...')
fs.mkdirSync(SERVER, { recursive: true })

const steps = [
  ['prisma',     path.join(ROOT, 'packages', 'database', 'prisma'), path.join(SERVER, 'prisma')],
  ['api build',  path.join(ROOT, 'apps', 'api', 'dist'),            path.join(SERVER, 'api')],
  ['web standalone', path.join(ROOT, 'apps', 'web', '.next', 'standalone'), path.join(SERVER, 'web')],
]

let ok = 0
for (const [label, src, dest] of steps) {
  process.stdout.write(`  • ${label}: `)
  const done = copyDir(src, dest)
  console.log(done ? '✓' : 'pulado')
  if (done) ok++
}

console.log(`\n${ok}/${steps.length} componentes copiados para ./server`)
console.log('Em seguida: pnpm --filter @agoraencontrei/desktop dist  → gera o instalador .exe')
