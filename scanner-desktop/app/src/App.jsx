import { useState } from 'react'
import {
  Box,
  Button,
  Typography,
  LinearProgress
} from '@mui/material'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';

export default function App() {
  const [pdf, setPdf] = useState(null)
  const [loading, setLoading] = useState(false)

  const scan = async () => {
    setLoading(true)
    setPdf(null)

    try {
      const r = await fetch('http://localhost:5000/scan', {
        method: 'POST'
      })

      const d = await r.json()

      if (d.file) {
        setPdf(d.file)
      } else {
        alert(d.message || 'Error al escanear')
      }
    } catch (err) {
      console.error(err)
      alert('No se pudo conectar con el servicio de escaneo')
    } finally {
      setLoading(false)
    }
  }

  const savePdf = async () => {
    if (!window.electronAPI) {
      alert('Electron API no disponible')
      return
    }

    const url = `http://localhost:5000/files/${pdf}`

    const result = await window.electronAPI.savePdf(url, pdf)

    if (result?.saved) {
      await fetch(`http://localhost:5000/scan/${pdf}`, {
        method: 'DELETE'
      })

      setPdf(null)
    }
  }

  return (
    <Box p={3} height="100vh" width="90vw">
      <Typography variant="h4" mb={3}>
        📄 Scanner Desktop
      </Typography>

      <Box display="flex" gap={3} height="calc(100% - 64px)">
        {/* PANEL IZQUIERDO */}
        <Box width={280} display="flex" flexDirection="column" gap={2}>
          <Button
            variant="contained"
            size="large"
            onClick={scan}
            disabled={loading}
            fullWidth
            endIcon={<LocalPrintshopIcon />}
          >
            Escanear
          </Button>

          {loading && <LinearProgress />}

          {pdf && (
            <Button
              variant="contained"
              color="success"
              onClick={savePdf}
              fullWidth
              endIcon={<PictureAsPdfIcon />}

            >
              Guardar PDF
            </Button>
          )}
        </Box>

        {/* VISOR PDF */}
        <Box
          flex={1}
          border="1px solid #ddd"
          borderRadius={2}
          overflow="hidden"
          bgcolor="#fafafa"
        >
          {pdf ? (
            <iframe
              title="PDF Viewer"
              src={`http://localhost:5000/files/${pdf}`}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          ) : (
            <Box
              height="100%"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="text.secondary"
            >
              {loading ? 'Escaneando documento…' : 'No hay documento'}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
