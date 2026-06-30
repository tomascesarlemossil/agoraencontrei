/**
 * AgoraEncontrei Software — processo principal Electron (edição offline).
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
const { checkLicense, activateLicense } = require('./license')

const LOCAL_URL = process.env.AGORA_LOCAL_URL || 'http://127.0.0.1:3100/app'

let mainWindow = null

function createWindow(startUrl) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: 'AgoraEncontrei Software',
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

/**
 * Sobe os serviços locais (API + web) embarcados. Placeholder: na versão final,
 * inicia o Fastify standalone apontando para DATABASE_URL=file:./agora.db (SQLite)
 * e o Next standalone. Por ora, retorna a URL local esperada.
 */
async function startEmbeddedServer() {
  // TODO(offline): spawn do servidor standalone empacotado em ./server
  //   const { startServer } = require('./server/index.js')
  //   await startServer({ databaseUrl: `file:${path.join(app.getPath('userData'), 'agora.db')}` })
  return LOCAL_URL
}

app.whenReady().then(async () => {
  // 1) Licença — sem ativação válida, abre a tela de ativação.
  const lic = await checkLicense(app.getPath('userData'))
  if (!lic.valid) {
    createWindow(`file://${path.join(__dirname, 'renderer', 'activate.html')}`)
  } else {
    // 2) Sobe serviços locais e abre a aplicação.
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

// IPC: a tela de ativação envia a chave; validamos e, se ok, reiniciamos.
ipcMain.handle('license:activate', async (_evt, key) => {
  const res = await activateLicense(app.getPath('userData'), key)
  if (res.valid && mainWindow) {
    const url = await startEmbeddedServer().catch(() => LOCAL_URL)
    mainWindow.loadURL(url)
  }
  return res
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
