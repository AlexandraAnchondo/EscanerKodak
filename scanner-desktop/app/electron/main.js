import { app, BrowserWindow } from 'electron'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let scannerProcess
let backendProcess
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

// ⏳ Espera a que un endpoint responda
async function waitFor(url, name, retries = 20) {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url)
            if (res.ok) {
                console.log(`✅ ${name} listo`)
                return
            }
        } catch (_) { }

        console.log(`⏳ Esperando ${name}...`)
        await new Promise(r => setTimeout(r, 500))
    }

    throw new Error(`❌ ${name} no respondió`)
}

app.whenReady().then(async () => {
    // 🟦 Backend Node
    backendProcess = spawn(
        'node',
        [join(__dirname, '../../backend/server.js')],
        { stdio: 'inherit', windowsHide: true }
    )

    // 🟩 Scanner .NET
    scannerProcess = spawn(
        join(__dirname, '../../scanner/scanner-service.exe'),
        [],
        { stdio: 'inherit', windowsHide: true }
    )

    try {
        // ⏳ Esperar a que ambos estén listos
        await waitFor('http://localhost:5000/scanners', 'Scanner Service')
        await waitFor('http://localhost:3001/ping', 'Backend')

        // 🪟 Crear ventana SOLO cuando todo está listo
        createWindow()

    } catch (err) {
        console.error(err)
        app.quit()
    }
})

app.on('before-quit', () => {
    backendProcess?.kill()
    scannerProcess?.kill()
})
