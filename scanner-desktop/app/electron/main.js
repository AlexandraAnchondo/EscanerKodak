import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { createWriteStream } from 'fs'
import { join } from 'path'
import { get } from 'http'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { spawn } from 'child_process'

let backendProcess
let mainWindow

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

app.whenReady().then(() => {
    // 🔹 Levantar backend .NET
    backendProcess = spawn(
        join(__dirname, '../../scanner/scanner-service.exe'),
        [],
        { stdio: 'inherit', windowsHide: true }
    )

    // 🔹 Ventana Electron
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    mainWindow.loadURL('http://localhost:5173')
})

// 🔹 Guardar PDF nativo
ipcMain.handle('save-pdf', async (_, { url, filename }) => {
    console.log('IPC save-pdf llamado:', url)

    const { canceled, filePath } = await dialog.showSaveDialog({
        defaultPath: filename,
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })

    if (canceled) return { canceled: true }

    const file = createWriteStream(filePath)

    await new Promise((resolve, reject) => {
        get(url, response => {
            response.pipe(file)
            file.on('finish', () => file.close(resolve))
        }).on('error', reject)
    })

    return { saved: true, path: filePath }
})

app.on('window-all-closed', () => {
    if (backendProcess) backendProcess.kill()
    app.quit()
})
