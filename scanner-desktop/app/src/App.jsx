import { useEffect, useState } from 'react'

function App() {
  const [scanners, setScanners] = useState([])
  const [selected, setSelected] = useState('')

  useEffect(() => {
    fetch('http://localhost:3001/scanners')
      .then(r => r.json())
      .then(setScanners)
  }, [])

  const scan = () => {
    fetch('http://localhost:3001/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scannerName: selected,
        settings: { dpi: 300 }
      })
    })
      .then(r => r.json())
      .then(r => alert('Escaneo terminado'))
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Scanner Desktop</h1>

      <select
        value={selected}
        onChange={e => setSelected(e.target.value)}
      >
        <option value="">Selecciona escáner</option>
        {scanners.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <br /><br />

      <button onClick={scan} disabled={!selected}>
        Escanear
      </button>
    </div>
  )
}

export default App
