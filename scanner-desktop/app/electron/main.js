import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { spawn } from 'child_process'
import { join } from 'path'
import { createWriteStream } from 'fs'
import { get } from 'http'
import process from 'node:process'

let backendProcess
let mainWindow

const isDev = !app.isPackaged

function getScannerPaths() {
    if (isDev) {
        const base = join(process.cwd(), '../scanner')
        return {
            exe: join(base, 'scanner-service.exe'),
            cwd: base
        }
    }

    const base = join(process.resourcesPath, 'scanner')
    return {
        exe: join(base, 'scanner-service.exe'),
        cwd: base
    }
}

app.whenReady().then(() => {
    const { exe, cwd } = getScannerPaths()
    console.log('🖨️ Scanner exe:', exe)
    console.log('📁 Scanner cwd:', cwd)

    backendProcess = spawn(exe, [], {
        cwd,
        windowsHide: true,
        stdio: 'ignore'
    })

    backendProcess.on('error', err => {
        console.error('❌ Backend error:', err)
    })

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            preload: join(app.getAppPath(), 'electron/preload.js'),
            contextIsolation: true
        }
    })

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173')
    } else {
        mainWindow.loadFile(join(app.getAppPath(), 'dist/index.html'))
    }

    // mainWindow.webContents.openDevTools()
})

ipcMain.handle('save-pdf', async (_, { url, filename }) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
        defaultPath: filename,
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })

    if (canceled) return { canceled: true }

    const file = createWriteStream(filePath)

    await new Promise((resolve, reject) => {
        get(url, res => {
            res.pipe(file)
            file.on('finish', () => file.close(resolve))
        }).on('error', reject)
    })

    return { saved: true }
})

app.on('window-all-closed', () => {
    if (backendProcess) backendProcess.kill()
    app.quit()
})
