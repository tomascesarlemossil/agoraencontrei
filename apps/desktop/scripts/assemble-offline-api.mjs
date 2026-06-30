/**
 * Monta a API Fastify para rodar OFFLINE dentro do instalador.
 *
 * Num monorepo pnpm, copiar apps/api/node_modules não funciona (symlinks →
 * transitivas se perdem) e o Prisma Client gerado fica de fora. Solução:
 *
 *   1. `pnpm deploy --prod` → node_modules ACHATADO e completo. IMPORTANTE:
 *      deployar para um diretório FORA do workspace — deployar para dentro
 *      (apps/desktop/server/api) confunde os caminhos relativos do pnpm e o
 *      prisma generate não consegue resolver @prisma/client. Depois movemos
 *      (rename, mesmo drive) o resultado para server/api.
 *   2. copia o dist compilado da API.
 *   3. `prisma generate` (cwd no diretório deployado) → gera o Prisma Client
 *      com o engine do Windows em node_modules/.prisma/client.
 *
 * Rodar DEPOIS de bundle-server.mjs e ANTES do electron-builder.
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..', '..')           // raiz do monorepo
const API_OUT = path.resolve(__dirname, '..', 'server', 'api')    // apps/desktop/server/api
const BUILD = path.resolve(ROOT, '..', 'agora-offline-api-build') // FORA do workspace, mesmo drive

function run(cmd, opts = {}) {
  console.log('$', cmd)
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts })
}
function findPrismaCli() {
  const direct = path.join(ROOT, 'node_modules', 'prisma', 'build', 'index.js')
  if (fs.existsSync(direct)) return direct
  const pnpmDir = path.join(ROOT, 'node_modules', '.pnpm')
  if (fs.existsSync(pnpmDir)) {
    const d = fs.readdirSync(pnpmDir).find((n) => /^prisma@/.test(n))
    if (d) {
      const p = path.join(pnpmDir, d, 'node_modules', 'prisma', 'build', 'index.js')
      if (fs.existsSync(p)) return p
    }
  }
  return null
}

console.log('Montando API offline (build em', BUILD + ')')

// 1) pnpm deploy → BUILD (fora do workspace).
//    Settings (validados localmente):
//      - force-legacy-deploy=true       → evita reinstall frozen
//      - inject-workspace-packages=true → satisfaz a checagem de workspace
//      - node-linker=hoisted            → node_modules ACHATADO (sem symlinks do
//        pnpm, que quebrariam dentro do instalador Windows). 0 symlinks no topo.
//    .npmrc EFÊMERO na raiz (não commitado → Railway/Vercel intactos).
const npmrc = path.join(ROOT, '.npmrc')
const npmrcBefore = fs.existsSync(npmrc) ? fs.readFileSync(npmrc, 'utf8') : null
fs.writeFileSync(npmrc, `${npmrcBefore ? npmrcBefore.replace(/\s*$/, '') + '\n' : ''}force-legacy-deploy=true\ninject-workspace-packages=true\nnode-linker=hoisted\n`)
fs.rmSync(BUILD, { recursive: true, force: true })
try {
  run(`pnpm --filter @agoraencontrei/api --prod deploy "${BUILD}"`)
} finally {
  if (npmrcBefore === null) fs.rmSync(npmrc, { force: true })
  else fs.writeFileSync(npmrc, npmrcBefore)
}

// 2) dist compilado da API.
const apiDist = path.join(ROOT, 'apps', 'api', 'dist')
if (fs.existsSync(apiDist)) {
  fs.cpSync(apiDist, path.join(BUILD, 'dist'), { recursive: true, dereference: true })
  console.log('  • dist copiado')
} else {
  console.warn('  ⚠️  apps/api/dist ausente — buildou a API antes?')
}

// 3) Prisma Client (engine do Windows) gerado no BUILD (fora do workspace, onde
//    o @prisma/client resolve limpo, sem auto-install).
fs.copyFileSync(path.join(ROOT, 'packages', 'database', 'prisma', 'schema.prisma'), path.join(BUILD, 'schema.prisma'))
const prismaCli = findPrismaCli()
if (!prismaCli) throw new Error('CLI do prisma não encontrado para gerar o client offline')
execSync(`node "${prismaCli}" generate --schema="${path.join(BUILD, 'schema.prisma')}"`, {
  stdio: 'inherit',
  cwd: BUILD,
  env: { ...process.env, DATABASE_URL: 'postgresql://u:p@127.0.0.1:5432/db', DIRECT_DATABASE_URL: 'postgresql://u:p@127.0.0.1:5432/db' },
})

// 4) Move BUILD → server/api. No Windows, o rename logo após escrever muitos
//    arquivos (engine do prisma / .node do argon2) pode dar EBUSY — o Defender
//    segura handles por instantes. Tentamos algumas vezes; se persistir, copiamos.
function sleepSync(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms) }
fs.rmSync(API_OUT, { recursive: true, force: true })
fs.mkdirSync(path.dirname(API_OUT), { recursive: true })
let moved = false
for (let i = 0; i < 8 && !moved; i++) {
  try { fs.renameSync(BUILD, API_OUT); moved = true }
  catch (e) {
    if (!['EBUSY', 'EPERM', 'ENOTEMPTY', 'EACCES'].includes(e.code)) throw e
    console.log(`  • rename ${e.code} (tentativa ${i + 1}) — aguardando…`)
    sleepSync(2000)
  }
}
if (!moved) {
  console.log('  • rename falhou; copiando como fallback')
  fs.cpSync(BUILD, API_OUT, { recursive: true })
  fs.rmSync(BUILD, { recursive: true, force: true })
}
console.log('  • movido para', API_OUT)

// 5) Verificação — loga o que está (ou não) presente, para diagnóstico no CI.
console.log('\nVerificação da API montada:')
const target = path.join(API_OUT, 'node_modules', '.prisma', 'client')
let allOk = true
for (const c of ['dist/server.js', 'node_modules/fastify', 'node_modules/@prisma/client', 'node_modules/.prisma/client']) {
  const ok = fs.existsSync(path.join(API_OUT, c))
  if (!ok) allOk = false
  console.log(`  ${ok ? '✓' : '✗'} ${c}`)
}
let engine = false
try {
  for (const f of fs.readdirSync(target)) if (/query_engine-windows.*\.node$/.test(f)) engine = true
} catch { /* noop */ }
console.log(`  ${engine ? '✓' : '✗'} query engine (windows)`)

if (!allOk || !engine) {
  throw new Error('API offline incompleta — ver itens ✗ acima.')
}
console.log('\n✅ API offline montada.')
