import { useEffect, useState } from 'react'

function App() {
  const [scanners, setScanners] = useState([])
  const [selected, setSelected] = useState('')
  const [jobId, setJobId] = useState(null)
  const [images, setImages] = useState([])
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetch('http://localhost:3001/scanners')
      .then(r => r.json())
      .then(setScanners)
  }, [])

  useEffect(() => {
    let interval
    if (jobId) {
      interval = setInterval(() => {
        fetch(`http://localhost:3001/scan/status/${jobId}`)
          .then(r => r.json())
          .then(data => {
            setStatus(data.status)
            if (data.status === 'done') {
              setImages(data.images) // array de base64
              clearInterval(interval)
            }
          })
      }, 1000) // cada segundo revisa
    }
    return () => clearInterval(interval)
  }, [jobId])

  const scan = () => {
    fetch('http://localhost:3001/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scannerName: selected })
    })
      .then(r => r.json())
      .then(r => setJobId(r.jobId))
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Scanner Desktop</h1>

      <select value={selected} onChange={e => setSelected(e.target.value)}>
        <option value="">Selecciona escáner</option>
        {scanners.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      <br /><br />

      <button onClick={scan} disabled={!selected}>
        Escanear
      </button>

      {status && <p>Estado: {status}</p>}

      <div>
        {images.map((b64, i) => (
          <img key={i} src={`data:image/jpeg;base64,${b64}`} alt={`Escaneo ${i + 1}`} style={{ margin: 10, maxWidth: 300 }} />
        ))}
      </div>
    </div>
  )
}

export default App
