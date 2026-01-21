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
async function waitFor(url, name, retries = 30, delay = 1000) {
    for (let i = 1; i <= retries; i++) {
        try {
            const res = await fetch(url)
            if (res.ok) {
                console.log(`✅ ${name} listo`)
                return
            }
        } catch { /* empty */ }

        console.log(`⏳ ${name} intento ${i}/${retries}`)
        await new Promise(r => setTimeout(r, delay))
    }

    throw new Error(`${name} no respondió`)
}


app.whenReady().then(async () => {
    // 🟩 Scanner .NET PRIMERO
    scannerProcess = spawn(
        join(__dirname, '../../scanner/scanner-service.exe'),
        [],
        {
            stdio: 'inherit',
            windowsHide: true,
            shell: true
        },
        { stdio: 'inherit', windowsHide: true }
    )

    scannerProcess.on('exit', (code) => {
        console.error('❌ Scanner service salió con código', code)
        app.quit()
    })

    try {
        await waitFor('http://localhost:5000/health', 'Scanner Service', 40)

        // 🟦 Backend Node DESPUÉS
        backendProcess = spawn(
            'node',
            [join(__dirname, '../../backend/server.js')],
            { stdio: 'inherit', windowsHide: true }
        )

        backendProcess.on('exit', (code) => {
            console.error('❌ Backend salió con código', code)
            app.quit()
        })

        await waitFor('http://localhost:3001/ping', 'Backend', 20)

        // 🪟 Renderer AL FINAL
        createWindow()

    } catch (err) {
        console.error('❌ Error al iniciar:', err)
        app.quit()
    }
})

app.on('before-quit', () => {
    backendProcess?.kill()
    scannerProcess?.kill()
})
