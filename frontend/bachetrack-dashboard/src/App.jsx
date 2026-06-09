import { useState, useEffect } from 'react'
import Header from './components/Header'
import Indicadores from './components/Indicadores'
import MapaReportes from './components/MapaReportes'
import TablaReportes from './components/TablaReportes'
import VistaReportes from './components/VistaReportes'

const API_URL = 'http://192.168.1.239:3000/reports'
// Base para construir URLs de imágenes (sin /reports)
const API_BASE = 'http://192.168.1.239:3000'

export default function App() {
  const [reportes, setReportes] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [ultimaActualizacion, setUltima] = useState(null)
  const [vista, setVista] = useState('dashboard') // 'dashboard' | 'reportes'

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

  useEffect(() => { cargarReportes() }, [])

  return (
    <>
      <Header
        onRefresh={cargarReportes}
        cargando={cargando}
        vistaActual={vista}
        onCambiarVista={setVista}
      />

      {error && <div className="error-banner visible">{error}</div>}

      {/* ── DASHBOARD ── */}
      {vista === 'dashboard' && (
        <>
          <Indicadores reportes={reportes} />
          <main className="main-grid">
            <MapaReportes reportes={reportes} />
            <TablaReportes reportes={reportes} />
          </main>
        </>
      )}

      {/* ── REPORTES POR ZONA ── */}
      {vista === 'reportes' && (
        <VistaReportes reportes={reportes} apiBase={API_BASE} />
      )}

      <footer className="footer">
        <span>BacheTrack © 2025 — Hackathon</span>
        <span>{ultimaActualizacion ? `Última actualización: ${ultimaActualizacion}` : '—'}</span>
      </footer>
    </>
  )
}