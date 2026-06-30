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
const { spawn } = require('node:child_process')

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
  const firstRun = !fs.existsSync(path.join(databaseDir, 'PG_VERSION'))

  const pg = new EmbeddedPostgres({
    databaseDir,
    user: DB_USER,
    password: DB_PASS,
    port: DB_PORT,
    persistent: true,
  })

  if (firstRun) {
    await pg.initialise()
  }
  await pg.start()
  if (firstRun) {
    await pg.createDatabase(DB_NAME).catch(() => {})
  }

  const url = `postgresql://${DB_USER}:${DB_PASS}@127.0.0.1:${DB_PORT}/${DB_NAME}`
  return { pg, url, firstRun }
}

/**
 * Aplica as migrations Prisma no banco local (idempotente — só aplica o que falta).
 * Empacotamos a pasta prisma/ (schema + migrations) e o engine em ./server/prisma.
 */
function runMigrations(databaseUrl, prismaDir) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, DATABASE_URL: databaseUrl, DIRECT_DATABASE_URL: databaseUrl }
    const bin = process.platform === 'win32' ? 'prisma.cmd' : 'prisma'
    const child = spawn(bin, ['migrate', 'deploy', `--schema=${path.join(prismaDir, 'schema.prisma')}`], {
      env, stdio: 'inherit', shell: process.platform === 'win32',
    })
    child.on('error', reject)
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('migrate deploy falhou: ' + code))))
  })
}

module.exports = { startDatabase, runMigrations, DB_NAME, DB_PORT }
