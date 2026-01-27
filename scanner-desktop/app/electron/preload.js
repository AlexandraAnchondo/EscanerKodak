// eslint-disable-next-line no-undef
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    savePdf: (url, filename) =>
        ipcRenderer.invoke('save-pdf', { url, filename })
})
