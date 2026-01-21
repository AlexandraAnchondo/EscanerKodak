import { useEffect, useState } from 'react'

function App() {
  const [scanners, setScanners] = useState([])
  const [selected, setSelected] = useState('')
  const [jobId, setJobId] = useState(null)
  const [files, setFiles] = useState([]);
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
              setFiles(data.files);
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
        {files.map((f, i) => (
          <img
            key={i}
            src={`http://localhost:3001/files/${f}`}
            style={{ maxWidth: 300, margin: 10 }}
          />
        ))}
      </div>
    </div>
  )
}

export default App
