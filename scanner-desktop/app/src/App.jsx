import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Typography
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import {
  DndContext,
  closestCenter
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const statusMap = {
  starting: { text: 'Iniciando', progress: 20 },
  pending: { text: 'Escaneando', progress: 60 },
  done: { text: 'Completado', progress: 100 },
  completed: { text: 'Completado', progress: 100 },
  error: { text: 'Error', progress: 100 }
}

function SortableImage({ file, index, selected, onToggle, onRemove, onZoom }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: file })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      sx={{
        p: 1,
        border: selected ? '2px solid #1976d2' : '1px solid #ccc',
        boxShadow: selected ? 4 : 1
      }}
    >
      {/* HEADER */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        {/* HANDLE DRAG */}
        <Box
          {...attributes}
          {...listeners}
          sx={{
            cursor: 'grab',
            fontSize: 12,
            fontWeight: 'bold',
            color: '#1976d2'
          }}
        >
          #{index + 1}
        </Box>

        <IconButton
          color="error"
          onClick={onRemove}
          size="small"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* CHECKBOX */}
      <FormControlLabel
        control={
          <Checkbox
            checked={selected}
            onChange={onToggle}
            size="small"
          />
        }
        sx={{ mt: -1 }}
      />

      {/* IMAGE */}
      <Box sx={{ cursor: 'zoom-in' }} onClick={onZoom}>
        <img
          src={`http://localhost:3001/files/${file}`}
          style={{ width: '100%', borderRadius: 4 }}
        />
      </Box>

      <Box textAlign="center" mt={0.5}>
        <ZoomInIcon fontSize="small" />
      </Box>
    </Paper>
  )
}

function App() {
  const [scanners, setScanners] = useState([])
  const [selectedScanner, setSelectedScanner] = useState('')
  const [jobId, setJobId] = useState(null)
  const [images, setImages] = useState([])
  const [selectedImages, setSelectedImages] = useState([])
  const [status, setStatus] = useState('')

  const [dpi, setDpi] = useState(300)
  const [colorMode, setColorMode] = useState('color')
  const [duplex, setDuplex] = useState(true)
  const [feeder, setFeeder] = useState(true)

  const [zoomImage, setZoomImage] = useState(null)

  useEffect(() => {
    fetch('http://localhost:3001/scanners')
      .then(r => r.json())
      .then(data => {
        if (data.length > 0) {
          setSelectedScanner(data[0])
        }
      })
  }, [])

  useEffect(() => {
    let interval
    if (jobId) {
      interval = setInterval(() => {
        fetch(`http://localhost:3001/scan/status/${jobId}`)
          .then(r => r.json())
          .then(data => {
            setStatus(data.status)
            if (data.status === 'done' || data.status === 'completed') {
              setImages(data.files || [])
              setSelectedImages(data.files || [])
              clearInterval(interval)
            }
          })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [jobId])

  const scan = () => {
    setImages([])
    setSelectedImages([])
    setStatus('starting')

    fetch('http://localhost:3001/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scannerName: selectedScanner,
        settings: { dpi, colorMode, duplex, useFeeder: feeder }
      })
    })
      .then(r => r.json())
      .then(r => setJobId(r.jobId))
  }

  const toggleSelect = (file) => {
    setSelectedImages(prev =>
      prev.includes(file)
        ? prev.filter(f => f !== file)
        : [...prev, file]
    )
  }

  const removeImage = (file) => {
    setImages(prev => prev.filter(f => f !== file))
    setSelectedImages(prev => prev.filter(f => f !== file))
  }

  const statusInfo = statusMap[status]

  return (
    <Box p={3} maxWidth={1200} mx="auto">
      {/* HEADER */}
      <Typography variant="h3" fontWeight="bold" gutterBottom>
        📄 Scanner Desktop
      </Typography>

      {/* CONFIG */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#474747' }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: '#fcfcfc' }}>
          Seleccione el escáner
        </Typography>

        <Typography
          sx={{ color: '#fcfcfc', mb: 2 }}
        >
          Escáner seleccionado:
          <br />
          <b>
            {selectedScanner || 'Ninguno'}
          </b>
        </Typography>

        <Button
          variant="contained"
          color="warning"
          onClick={async () => {
            const res = await fetch('http://localhost:3001/select-scanner', { method: 'POST' });
            const data = await res.json(); // data = ["KODAK S3060"]

            if (data && data.length > 0) {
              setSelectedScanner(data[0]);
              setScanners(data);
            }
          }}
        >
          Seleccionar escáner
        </Button>

        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: '#fcfcfc' }}>
          Opciones de escaneo
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#fcfcfc' }}>DPI</InputLabel>
              <Select value={dpi} label="DPI" sx={{ color: '#fcfcfc' }} onChange={e => setDpi(Number(e.target.value))}>
                <MenuItem value={200}>200</MenuItem>
                <MenuItem value={300}>300</MenuItem>
                <MenuItem value={600}>600</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={3}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#fcfcfc' }}>Color</InputLabel>
              <Select value={colorMode} label="Color" sx={{ color: '#fcfcfc' }} onChange={e => setColorMode(e.target.value)}>
                <MenuItem value="color">Color</MenuItem>
                <MenuItem value="grayscale">Escala de grises</MenuItem>
                <MenuItem value="bw">Blanco y negro</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={6} md={3}>
            <FormControlLabel
              control={<Checkbox checked={feeder} onChange={e => setFeeder(e.target.checked)} />}
              label="Alimentador automático"
              sx={{ color: '#fcfcfc' }}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <FormControlLabel
              control={<Checkbox checked={duplex} onChange={e => setDuplex(e.target.checked)} />}
              label="Dúplex"
              sx={{ color: '#fcfcfc' }}
            />
          </Grid>
        </Grid>

        {/* BOTÓN + ESTADO */}
        <Box mt={3}>
          <Button
            variant="contained"
            size="large"
            onClick={scan}
            disabled={!selectedScanner}
          >
            Escanear
          </Button>

          {statusInfo && (
            <Box mt={2}>
              <Typography gutterBottom sx={{ color: '#fcfcfc' }}>
                Estado: <b>{statusInfo.text}</b>
              </Typography>
              <LinearProgress
                variant="determinate"
                value={statusInfo.progress}
              />
            </Box>
          )}
        </Box>
      </Paper>

      <Box mt={3} mb={3}>
        <Button
          variant="contained"
          color="success"
          disabled={selectedImages.length === 0}
          onClick={async () => {
            const res = await fetch('http://localhost:3001/create-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                files: images.filter(f => selectedImages.includes(f))
              })
            })

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)

            const a = document.createElement('a')
            a.href = url
            a.download = 'documento_escaneado.pdf'
            document.body.appendChild(a)
            a.click()
            a.remove()

            window.URL.revokeObjectURL(url)
          }}
        >
          Crear PDF
        </Button>
      </Box>

      {/* GALERÍA */}
      <DndContext
        collisionDetection={closestCenter}
        onDragEnd={(event) => {
          const { active, over } = event
          if (over && active.id !== over.id) {
            setImages((items) => {
              const oldIndex = items.indexOf(active.id)
              const newIndex = items.indexOf(over.id)
              return arrayMove(items, oldIndex, newIndex)
            })
          }
        }}
      >
        <SortableContext items={images} strategy={rectSortingStrategy}>
          <Grid container spacing={2}>
            {images.map((f, index) => {
              const selected = selectedImages.includes(f)

              return (
                <Grid
                  item
                  key={f}
                  sx={{
                    width: '20%',   // 👈 RESPETAMOS TU REQUERIMIENTO
                    minWidth: 180
                  }}
                >
                  <SortableImage
                    file={f}
                    index={index}
                    selected={selected}
                    onToggle={() => toggleSelect(f)}
                    onRemove={() => removeImage(f)}
                    onZoom={() => setZoomImage(f)}
                  />
                </Grid>
              )
            })}
          </Grid>
        </SortableContext>
      </DndContext>

      {/* ZOOM */}
      {zoomImage && (
        <Box
          onClick={() => setZoomImage(null)}
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(0,0,0,.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300
          }}
        >
          <img
            src={`http://localhost:3001/files/${zoomImage}`}
            style={{ maxWidth: '90%', maxHeight: '90%' }}
          />
        </Box>
      )}
    </Box>
  )
}

export default App
