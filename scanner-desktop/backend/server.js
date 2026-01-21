require('dotenv').config();
const cors = require('cors');
const express = require('express');
const path = require('path');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

// CORS config: solo el backend debe agregar estos headers
const corsOptions = {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
};

const scansDir = path.join(__dirname, '../scanner/scans');

// Middlewares
const app = express()
app.use(cors(corsOptions));
app.use(express.json())

app.use('/files', express.static(scansDir));

// health
app.get('/ping', (req, res) => {
    res.json({ ok: true })
})

let cachedScanners = []

async function loadScannersWithRetry(retries = 20) {
    for (let i = 0; i < retries; i++) {
        try {
            const r = await fetch('http://localhost:5000/scanners')
            const data = await r.json()

            cachedScanners = data.filter(
                s => s !== null && s !== undefined && s !== ''
            )

            console.log('Escáners cargados:', cachedScanners)
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

app.post('/create-pdf', async (req, res) => {
    try {
        const { files } = req.body
        const pdfDoc = await PDFDocument.create()

        for (const file of files) {
            const imgPath = path.join(scansDir, file)
            const imgBytes = fs.readFileSync(imgPath)

            const image = file.endsWith('.png')
                ? await pdfDoc.embedPng(imgBytes)
                : await pdfDoc.embedJpg(imgBytes)

            const page = pdfDoc.addPage([image.width, image.height])
            page.drawImage(image, {
                x: 0,
                y: 0,
                width: image.width,
                height: image.height
            })
        }

        const pdfBytes = await pdfDoc.save()

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader(
            'Content-Disposition',
            'attachment; filename="documento_escaneado.pdf"'
        )

        res.send(Buffer.from(pdfBytes))
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Error al crear PDF' })
    }
})


app.listen(3001, () =>
    console.log('Backend corriendo en http://localhost:3001')
)
