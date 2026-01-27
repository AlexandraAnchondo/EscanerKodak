import { useState } from 'react'
import { Box, Button, Typography } from '@mui/material'

export default function App() {
  const [pdf, setPdf] = useState(null)

  const scan = async () => {
    try {
      const r = await fetch('http://localhost:5069/scan', {
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
    }
  }

  return (
    <Box p={3}>
      <Typography variant="h4">📄 Scanner Desktop</Typography>

      <Button
        variant="contained"
        size="large"
        onClick={scan}
        sx={{ mt: 3 }}
      >
        Escanear
      </Button>

      {pdf && (
        <Box mt={3} height="80vh">
          <iframe
            src={`http://localhost:5069/files/${pdf}`}
            width="300%"
            height="100%"
          />
        </Box>
      )}
    </Box>
  )
}
