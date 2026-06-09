import { useState, useEffect } from 'react'
import Header from './components/Header'
import Indicadores from './components/Indicadores'
import MapaReportes from './components/MapaReportes'
import TablaReportes from './components/TablaReportes'
import VistaReportes from './components/VistaReportes'

const API_BASE = 'http://192.168.1.235:3000'
const API_URL = `${API_BASE}/reports`
const API_AUTO_URL = `${API_BASE}/automatic-reports`

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
      const resManual = await fetch(API_URL)
if (!resManual.ok) throw new Error(`HTTP manual ${resManual.status}`)
const dataManual = await resManual.json()
const manuales = Array.isArray(dataManual) ? dataManual : (dataManual.reports || dataManual.data || [])

const resAuto = await fetch(API_AUTO_URL)
if (!resAuto.ok) throw new Error(`HTTP auto ${resAuto.status}`)
const dataAuto = await resAuto.json()
const automaticosRaw = Array.isArray(dataAuto) ? dataAuto : (dataAuto.reports || dataAuto.data || [])

const automaticos = automaticosRaw.map(r => ({
  id: `A-${r.id}`,
  user_id: r.user_id,
  description: `Reporte automático por vibración detectada · Impacto ${Number(r.impact).toFixed(2)}`,
  latitude: r.latitude,
  longitude: r.longitude,
  image_url: null,
  created_at: r.created_at,
  tipo: 'automático',
  impact: r.impact,
  speed: r.speed
}))

const lista = [
  ...manuales.map(r => ({ ...r, tipo: 'manual' })),
  ...automaticos
]

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