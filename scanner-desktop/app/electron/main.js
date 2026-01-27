import { app, BrowserWindow } from 'electron'
//import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

//let scannerProcess
let win

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: join(__dirname, 'preload.js')
        }
    })

    win.loadURL('http://localhost:5173')
}

app.whenReady().then(async () => {
    try {
        createWindow()

    } catch (err) {
        console.error('❌ Error al iniciar:', err)
        app.quit()
    }
})