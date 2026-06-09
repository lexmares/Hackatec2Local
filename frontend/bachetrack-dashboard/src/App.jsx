import { useState, useEffect } from 'react'
import Header from './components/Header'
import Indicadores from './components/Indicadores'
import MapaReportes from './components/MapaReportes'
import TablaReportes from './components/TablaReportes'

const API_URL = 'http://192.168.1.239:3000/reports'

export default function App() {
  const [reportes, setReportes] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [ultimaActualizacion, setUltima] = useState(null)

  async function cargarReportes() {
    setCargando(true)
    setError(null)
    try {
      const res = await fetch(API_URL)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const lista = Array.isArray(data) ? data : (data.reports || data.data || [])
      setReportes(lista)
      setUltima(new Date().toLocaleTimeString('es-MX'))
    } catch (err) {
      setError(`No se pudo conectar con la API (${API_URL}). Verifica que el servidor esté corriendo.`)
    } finally {
      setCargando(false)
    }
  }

  // Carga automática al iniciar
  useEffect(() => { cargarReportes() }, [])

  return (
    <>
      <Header onRefresh={cargarReportes} cargando={cargando} />

      {error && <div className="error-banner visible">{error}</div>}

      <Indicadores reportes={reportes} />

      <main className="main-grid">
        <MapaReportes reportes={reportes} />
        <TablaReportes reportes={reportes} />
      </main>

      <footer className="footer">
        <span>AquaRoad AI © 2025 — Hackathon</span>
        <span>{ultimaActualizacion ? `Última actualización: ${ultimaActualizacion}` : '—'}</span>
      </footer>
    </>
  )
}