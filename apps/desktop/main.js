/**
 * Sistema Administrador AgoraEncontrei — processo principal Electron (edição offline).
 *
 * Estratégia: sobe a aplicação web (API Fastify + Next standalone) em localhost
 * dentro do próprio app, usando banco SQLite local. A janela carrega essa URL.
 * Antes de abrir, exige ativação de licença (license.js).
 *
 * NB: este é o esqueleto da edição offline. O bundling do servidor Next/Fastify
 * standalone + o schema SQLite são as próximas etapas (ver README.md).
 */
const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { checkLicense, activateLicense } = require('./license')

const WEB_PORT = Number(process.env.AGORA_WEB_PORT || 31763)
const API_PORT = Number(process.env.AGORA_API_PORT || 31764)
const LOCAL_URL = process.env.AGORA_LOCAL_URL || `http://127.0.0.1:${WEB_PORT}`

let mainWindow = null

// Rede de segurança: um erro num processo filho (Postgres/servidor) jamais pode
// derrubar o processo principal com o diálogo cru "A JavaScript error occurred".
// Mostramos uma mensagem amigável e seguimos — o app continua de pé.
function friendlyError(title, err) {
  const msg = String((err && err.stack) || (err && err.message) || err || 'erro desconhecido')
  try { dialog.showErrorBox(title, msg) } catch { /* sem janela ainda */ }
  try { console.error(`[${title}]`, msg) } catch { /* noop */ }
}
process.on('uncaughtException', (err) => friendlyError('Erro inesperado', err))
process.on('unhandledRejection', (err) => friendlyError('Erro inesperado', err))

// Flag de primeira execução: o produto SAI VAZIO. No 1º boot o usuário escolhe
// "começar do zero" ou "importar backup" (onboarding.html).
function initFlagPath() {
  return path.join(app.getPath('userData'), 'initialized.json')
}
function isInitialized() {
  try { return JSON.parse(fs.readFileSync(initFlagPath(), 'utf8')).done === true }
  catch { return false }
}
function markInitialized(mode) {
  try {
    fs.mkdirSync(app.getPath('userData'), { recursive: true })
    fs.writeFileSync(initFlagPath(), JSON.stringify({ done: true, mode, at: new Date().toISOString() }))
  } catch { /* noop */ }
}

function createWindow(startUrl) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: 'Sistema Administrador AgoraEncontrei',
    backgroundColor: '#0a0e1a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  mainWindow.loadURL(startUrl)
  mainWindow.on('closed', () => { mainWindow = null })
}

const { startDatabase, applySchema } = require('./db')
const { spawn } = require('node:child_process')
const net = require('node:net')

let pgHandle = null
let serverStarted = false
const childServers = []

// Sobe um servidor Node empacotado (server/web/.../server.js ou server/api/...)
// usando o próprio runtime do Electron como Node (ELECTRON_RUN_AS_NODE).
function spawnNode(entry, cwd, env, label) {
  const child = spawn(process.execPath, [entry], {
    cwd,
    env: { ...process.env, ...env, ELECTRON_RUN_AS_NODE: '1' },
    stdio: 'inherit',
  })
  child.on('error', (e) => friendlyError(`Falha ao iniciar ${label}`, e))
  childServers.push(child)
  return child
}

// Espera uma porta TCP aceitar conexão (servidor pronto). Timeout ~30s.
function waitForPort(port, timeoutMs = 30000) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const sock = net.connect(port, '127.0.0.1')
      sock.once('connect', () => { sock.destroy(); resolve() })
      sock.once('error', () => {
        sock.destroy()
        if (Date.now() - start > timeoutMs) reject(new Error(`Servidor não respondeu na porta ${port}`))
        else setTimeout(tryOnce, 400)
      })
    }
    tryOnce()
  })
}

// Localiza o entrypoint do Next standalone dentro de server/web (o caminho
// interno varia: .../server/web/apps/web/server.js ou .../server/web/server.js).
function findWebEntry(webDir) {
  const candidates = [
    path.join(webDir, 'apps', 'web', 'server.js'),
    path.join(webDir, 'server.js'),
  ]
  return candidates.find((p) => fs.existsSync(p)) || null
}
function findApiEntry(apiDir) {
  const candidates = [
    path.join(apiDir, 'server.js'),
    path.join(apiDir, 'dist', 'server.js'),
    path.join(apiDir, 'index.js'),
    path.join(apiDir, 'src', 'server.js'),
  ]
  return candidates.find((p) => fs.existsSync(p)) || null
}

/**
 * Sobe os serviços locais embarcados: 1) PostgreSQL portátil, 2) migrations,
 * 3) API Fastify, 4) Web (Next standalone). Retorna a URL local para a janela.
 * Idempotente: só sobe uma vez por sessão.
 */
async function startEmbeddedServer() {
  if (serverStarted) return LOCAL_URL
  const userData = app.getPath('userData')

  // 1) Banco local (Postgres embarcado) — mesmo schema/código da nuvem.
  const { pg, url, ready, readyMarker } = await startDatabase(userData)
  pgHandle = pg
  process.env.DATABASE_URL = url
  process.env.DIRECT_DATABASE_URL = url

  // 2) Schema: enquanto o banco não estiver marcado como pronto, aplicamos o SQL
  //    das migrations direto (sem CLI Prisma) e gravamos o marcador no sucesso.
  const prismaDir = path.join(__dirname, 'server', 'prisma')
  if (!ready) {
    await applySchema(pg, prismaDir)
    fs.writeFileSync(readyMarker, JSON.stringify({ at: new Date().toISOString() }))
  }

  // 3) API Fastify embarcada (se empacotada em ./server/api).
  const apiDir = path.join(__dirname, 'server', 'api')
  const apiEntry = findApiEntry(apiDir)
  if (apiEntry) {
    spawnNode(apiEntry, apiDir, { PORT: String(API_PORT), HOST: '127.0.0.1', DATABASE_URL: url, DIRECT_DATABASE_URL: url }, 'API')
    await waitForPort(API_PORT).catch((e) => friendlyError('API local demorou a responder', e))
  }

  // 4) Web Next standalone (se empacotado em ./server/web).
  const webDir = path.join(__dirname, 'server', 'web')
  const webEntry = findWebEntry(webDir)
  if (!webEntry) {
    throw new Error('Servidor web não encontrado no pacote (server/web). Reinstale o aplicativo.')
  }
  spawnNode(path.basename(webEntry), path.dirname(webEntry), {
    PORT: String(WEB_PORT), HOSTNAME: '127.0.0.1',
    NEXT_PUBLIC_API_URL: `http://127.0.0.1:${API_PORT}`,
    DATABASE_URL: url, DIRECT_DATABASE_URL: url,
  }, 'Web')
  await waitForPort(WEB_PORT)

  serverStarted = true
  return LOCAL_URL
}

// Encerra Postgres e servidores filhos ao sair, evitando lock e processos órfãos.
app.on('before-quit', async () => {
  for (const c of childServers) { try { c.kill() } catch { /* noop */ } }
  try { if (pgHandle) await pgHandle.stop() } catch { /* noop */ }
})

app.whenReady().then(async () => {
  // 1) Licença — sem ativação válida, abre a tela de ativação.
  const lic = await checkLicense(app.getPath('userData'))
  if (!lic.valid) {
    createWindow(`file://${path.join(__dirname, 'renderer', 'activate.html')}`)
  } else if (!isInitialized()) {
    // 2) Primeira execução: onboarding (vazio → começar do zero ou importar).
    createWindow(`file://${path.join(__dirname, 'renderer', 'onboarding.html')}`)
  } else {
    // 3) Sobe serviços locais e abre a aplicação.
    try {
      const url = await startEmbeddedServer()
      createWindow(url)
    } catch (err) {
      dialog.showErrorBox('Erro ao iniciar', String(err && err.message || err))
      app.quit()
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(LOCAL_URL)
  })
})

// IPC: a tela de ativação envia a chave. Validar a licença é uma operação
// LEVE (só verifica a assinatura e grava o arquivo) — NÃO sobe o banco aqui,
// para a ativação nunca falhar/travar por causa do servidor. Em caso de
// sucesso, encaminhamos para o onboarding (1ª execução) ou para o app.
ipcMain.handle('license:activate', async (_evt, key) => {
  try {
    const res = await activateLicense(app.getPath('userData'), key)
    if (res.valid && mainWindow) {
      if (!isInitialized()) {
        mainWindow.loadURL(`file://${path.join(__dirname, 'renderer', 'onboarding.html')}`)
      } else {
        // Já configurado: sobe o servidor em background e carrega quando pronto.
        startEmbeddedServer()
          .then((url) => mainWindow && mainWindow.loadURL(url))
          .catch((e) => friendlyError('Não foi possível iniciar o sistema', e))
      }
    }
    return res
  } catch (e) {
    return { valid: false, error: String((e && e.message) || e) }
  }
})

// IPC: escolha do onboarding (primeira execução). Sobe o servidor com
// tratamento de erro — falha aqui mostra mensagem clara, não derruba o app.
ipcMain.handle('app:onboard', async (_evt, choice) => {
  const mode = choice && choice.mode === 'import' ? 'import' : 'fresh'
  try {
    const url = await startEmbeddedServer()
    markInitialized(mode)
    if (mainWindow) {
      mainWindow.loadURL(mode === 'import' ? `${url}?onboarding=import` : url)
    }
    return { ok: true, mode }
  } catch (e) {
    friendlyError('Não foi possível iniciar o sistema', e)
    return { ok: false, error: String((e && e.message) || e) }
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
