require('dotenv').config();
const cors = require('cors');
const express = require('express')

// CORS config: solo el backend debe agregar estos headers
const corsOptions = {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
};

// Middlewares
const app = express()
app.use(cors(corsOptions));
app.use(express.json())

// health
app.get('/ping', (req, res) => {
    res.json({ ok: true })
})

let cachedScanners = []

async function loadScannersWithRetry(retries = 20) {
    for (let i = 0; i < retries; i++) {
        try {
            const r = await fetch('http://localhost:5000/scanners')
            cachedScanners = await r.json()
            console.log('🖨️ Scanners cargados:', cachedScanners)
            return
        } catch (e) {
            console.log('⏳ Esperando Scanner Service...')
            await new Promise(r => setTimeout(r, 500))
        }
    }
    console.error('❌ Scanner Service no respondió')
}

loadScannersWithRetry()

app.get('/scanners', (req, res) => {
    res.json(cachedScanners)
})

app.post('/scan', async (req, res) => {
    try {
        const r = await fetch('http://localhost:5000/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        })
        const data = await r.json()
        console.log('📄 Scan result:', data)
        res.json(data)
    } catch (e) {
        res.status(500).json({ error: e.message })
    }
})

app.get('/scan/status/:id', async (req, res) => {
    try {
        const r = await fetch(`http://localhost:5000/scan/status/${req.params.id}`);
        const data = await r.json();
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(3001, () =>
    console.log('Backend on http://localhost:3001')
)
