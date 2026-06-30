/**
 * Bridge seguro entre a tela (renderer) e o processo principal.
 * Expõe apenas a ativação de licença — nada de Node cru no renderer.
 */
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('agora', {
  activateLicense: (key) => ipcRenderer.invoke('license:activate', key),
})
