/**
 * Banco local embarcado (PostgreSQL portátil) para a edição offline.
 *
 * Por que Postgres embarcado e não SQLite: o schema da plataforma usa arrays
 * (`String[]`), `Decimal` e enums nativos do Postgres em 68 modelos. Trocar por
 * SQLite exigiria reescrever schema + código da aplicação. Com Postgres portátil,
 * **o mesmo schema e o mesmo código** rodam local — sem servidor externo.
 *
 * Usa o pacote `embedded-postgres`, que gerencia um binário do Postgres por
 * plataforma (no Windows, @embedded-postgres/windows-x64). O `electron-builder`
 * empacota esse binário no instalador.
 *
 * Fluxo: initialise (1ª vez) → start → createDatabase → migrate deploy.
 */
const path = require('node:path')
const fs = require('node:fs')

const DB_NAME = 'agora'
const DB_USER = 'agora'
const DB_PASS = 'agora_local' // banco é local-only, sem exposição de rede
const DB_PORT = Number(process.env.AGORA_DB_PORT || 54329)

/**
 * Sobe o Postgres embarcado e devolve a connection string.
 * @param {string} userDataDir  app.getPath('userData')
 */
async function startDatabase(userDataDir) {
  const mod = require('embedded-postgres')
  const EmbeddedPostgres = mod.default || mod // suporta export default (ESM) e CJS
  const databaseDir = path.join(userDataDir, 'pgdata')
  const readyMarker = path.join(userDataDir, 'db-ready.json')
  const ready = fs.existsSync(readyMarker)

  // Auto-recuperação: se o banco NÃO está marcado como pronto (1ª vez ou uma
  // tentativa anterior falhou no meio), começamos do zero. Isso remove resíduo
  // problemático — ex.: um cluster criado em WIN1252 (locale do Windows) que
  // rejeita caracteres UTF-8 do schema (Prestação, ─, etc.). Como o schema ainda
  // não foi aplicado, não há dados reais do usuário para perder.
  if (!ready && fs.existsSync(databaseDir)) {
    try { fs.rmSync(databaseDir, { recursive: true, force: true }) } catch { /* noop */ }
  }
  const needInit = !fs.existsSync(path.join(databaseDir, 'PG_VERSION'))

  const pg = new EmbeddedPostgres({
    databaseDir,
    user: DB_USER,
    password: DB_PASS,
    port: DB_PORT,
    persistent: true,
    // Cluster em UTF-8 (locale C para portabilidade) — o schema e os dados
    // PT-BR exigem UTF-8; sem isso o initdb herda o locale .1252 do Windows.
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    onError: (msg) => { try { console.error('[postgres]', String(msg)) } catch { /* noop */ } },
  })

  if (needInit) {
    await pg.initialise()
  }
  await pg.start()
  if (needInit) {
    await pg.createDatabase(DB_NAME).catch(() => {})
  }

  const url = `postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:${DB_PORT}/${DB_NAME}`
  return { pg, url, ready, readyMarker }
}

/**
 * Cria o schema no banco local aplicando o SQL das migrations diretamente, via
 * o cliente `pg` do Postgres embarcado — SEM depender do CLI/engine do Prisma
 * em runtime (que seria frágil dentro de um instalador). O bundle concatena
 * todas as migrations em ./server/prisma/all-migrations.sql, em ordem.
 *
 * Idempotente o suficiente para a edição offline: só roda no firstRun (banco
 * recém-criado e vazio). Em execuções seguintes o pgdata já existe e pulamos.
 *
 * @param {object} pg        instância do EmbeddedPostgres
 * @param {string} prismaDir caminho de ./server/prisma
 */
async function applySchema(pg, prismaDir) {
  const sqlPath = path.join(prismaDir, 'all-migrations.sql')
  if (!fs.existsSync(sqlPath)) {
    throw new Error('Schema do banco não encontrado no pacote (all-migrations.sql).')
  }
  const sql = fs.readFileSync(sqlPath, 'utf8')
  const client = pg.getPgClient(DB_NAME, '127.0.0.1')
  await client.connect()
  try {
    await client.query("SET client_encoding TO 'UTF8'")
    await client.query(sql)
  } finally {
    await client.end().catch(() => {})
  }
}

module.exports = { startDatabase, applySchema, DB_NAME, DB_PORT }
