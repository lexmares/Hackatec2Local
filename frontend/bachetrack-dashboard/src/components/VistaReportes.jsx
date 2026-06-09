import { useState, useMemo } from 'react'
import ModalReporte from './ModalReporte'

// ─── CLUSTERING POR ZONA ────────────────────────────────────────────────────
// Agrupa reportes en zonas usando distancia geográfica simple.
// Radio de 0.008 grados ≈ ~800m — ajustable según la ciudad.
const RADIO_ZONA = 0.008

function calcularCentro(reportes) {
  const lats = reportes.map(r => parseFloat(r.latitude))
  const lngs = reportes.map(r => parseFloat(r.longitude))
  return {
    lat: lats.reduce((a, b) => a + b, 0) / lats.length,
    lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
  }
}

function distancia(lat1, lng1, lat2, lng2) {
  return Math.sqrt((lat1 - lat2) ** 2 + (lng1 - lng2) ** 2)
}

function agruparPorZona(reportes) {
  const zonas = []

  reportes.forEach(reporte => {
    const lat = parseFloat(reporte.latitude)
    const lng = parseFloat(reporte.longitude)
    if (isNaN(lat) || isNaN(lng)) return

    // Busca una zona existente cercana
    const zonaExistente = zonas.find(z =>
      distancia(lat, lng, z.centro.lat, z.centro.lng) < RADIO_ZONA
    )

    if (zonaExistente) {
      zonaExistente.reportes.push(reporte)
      // Recalcula centro con el nuevo punto
      zonaExistente.centro = calcularCentro(zonaExistente.reportes)
    } else {
      zonas.push({
        id: zonas.length + 1,
        centro: { lat, lng },
        reportes: [reporte],
      })
    }
  })

  return zonas
}

function etiquetaZona(zona, index) {
  // Etiqueta descriptiva basada en índice y coordenadas
  const nombres = ['Zona Norte', 'Zona Centro', 'Zona Sur', 'Zona Oriente', 'Zona Poniente']
  return nombres[index] || `Zona ${index + 1}`
}

// ─── UTILIDADES ─────────────────────────────────────────────────────────────
function nivelRiesgo(total) {
  if (total <= 2) return 'bajo'
  if (total <= 5) return 'medio'
  return 'alto'
}

function formatearFecha(str) {
  if (!str) return '—'
  try {
    return new Date(str).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return str }
}

// ─── TARJETA DE REPORTE ──────────────────────────────────────────────────────
function TarjetaReporte({ reporte, totalZona, apiBase, onClick }) {
  const nivel = nivelRiesgo(totalZona)
  const tieneImagen = reporte.image_url && reporte.image_url !== 'null'
  const urlImagen = tieneImagen
    ? (reporte.image_url.startsWith('http') ? reporte.image_url : `${apiBase}${reporte.image_url}`)
    : null

  return (
    <article className="tarjeta-reporte" onClick={() => onClick(reporte)}>
      {/* Miniatura de imagen */}
      <div className="tarjeta-imagen">
        {urlImagen ? (
          <img src={urlImagen} alt="Foto del reporte" className="tarjeta-img" />
        ) : (
          <div className="tarjeta-sin-imagen">
            <span>📷</span>
            <span>Sin imagen</span>
          </div>
        )}
        <span className={`tarjeta-badge ${nivel}`}>{nivel}</span>
      </div>

      {/* Contenido */}
      <div className="tarjeta-body">
        <p className="tarjeta-desc">
          {reporte.description || reporte.descripcion || 'Sin descripción'}
        </p>
        <div className="tarjeta-meta">
          <span className="tarjeta-fecha">
            📅 {formatearFecha(reporte.created_at || reporte.fecha)}
          </span>
          <span className="tarjeta-coords">
            📍 {parseFloat(reporte.latitude).toFixed(4)}, {parseFloat(reporte.longitude).toFixed(4)}
          </span>
        </div>
        <div className="tarjeta-id">ID #{reporte.id}</div>
      </div>

      <div className="tarjeta-arrow">›</div>
    </article>
  )
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function VistaReportes({ reportes, apiBase }) {
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null)
  const [zonaAbierta, setZonaAbierta] = useState(null)

  const zonas = useMemo(() => {
    const agrupadas = agruparPorZona(reportes)
    // Ordena zonas: más reportes primero
    agrupadas.sort((a, b) => b.reportes.length - a.reportes.length)
    // Dentro de cada zona, ordena por fecha descendente
    agrupadas.forEach(z => {
      z.reportes.sort((a, b) =>
        new Date(b.created_at || 0) - new Date(a.created_at || 0)
      )
    })
    return agrupadas
  }, [reportes])

  // Abre la primera zona por defecto si no hay ninguna abierta
  const zonaActivaId = zonaAbierta ?? (zonas[0]?.id || null)

  return (
    <div className="vista-reportes">

      {/* ENCABEZADO DE PÁGINA */}
      <div className="reportes-header">
        <div>
          <h2 className="reportes-titulo">Reportes por zona</h2>
          <p className="reportes-sub">
            {zonas.length} zona(s) detectada(s) · {reportes.length} reporte(s) en total
          </p>
        </div>
      </div>

      {reportes.length === 0 ? (
        <div className="reportes-vacio">
          <span>📭</span>
          <p>No hay reportes todavía.</p>
        </div>
      ) : (
        <div className="zonas-layout">

          {/* SIDEBAR DE ZONAS */}
          <aside className="zonas-sidebar">
            {zonas.map((zona, index) => {
              const nivel = nivelRiesgo(zona.reportes.length)
              const activa = zona.id === zonaActivaId
              return (
                <button
                  key={zona.id}
                  className={`zona-item ${activa ? 'activa' : ''}`}
                  onClick={() => setZonaAbierta(zona.id)}
                >
                  <div className="zona-item-top">
                    <span className="zona-nombre">{etiquetaZona(zona, index)}</span>
                    <span className={`semaforo-dot ${nivel}`}></span>
                  </div>
                  <div className="zona-item-bottom">
                    <span className="zona-count">{zona.reportes.length} reporte(s)</span>
                    <span className={`badge-riesgo ${nivel}`}>{nivel}</span>
                  </div>
                </button>
              )
            })}
          </aside>

          {/* GRID DE TARJETAS */}
          <section className="zonas-contenido">
            {zonas
              .filter(z => z.id === zonaActivaId)
              .map((zona, index) => (
                <div key={zona.id}>
                  <div className="zona-contenido-header">
                    <h3 className="zona-contenido-titulo">
                      {etiquetaZona(zona, zonas.indexOf(zona))}
                    </h3>
                    <span className="zona-coords-label">
                      Centro: {zona.centro.lat.toFixed(4)}, {zona.centro.lng.toFixed(4)}
                    </span>
                  </div>
                  <div className="tarjetas-grid">
                    {zona.reportes.map(r => (
                      <TarjetaReporte
                        key={r.id}
                        reporte={r}
                        totalZona={zona.reportes.length}
                        apiBase={apiBase}
                        onClick={setReporteSeleccionado}
                      />
                    ))}
                  </div>
                </div>
              ))}
          </section>

        </div>
      )}

      {/* MODAL */}
      {reporteSeleccionado && (
        <ModalReporte
          reporte={reporteSeleccionado}
          apiBase={apiBase}
          onCerrar={() => setReporteSeleccionado(null)}
        />
      )}
    </div>
  )
}
