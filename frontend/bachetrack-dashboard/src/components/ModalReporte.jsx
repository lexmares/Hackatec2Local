import { useEffect } from 'react'

function nivelRiesgo(r) {
  const n = (r.riesgo || r.risk || '').toLowerCase()
  if (n.includes('alt')) return 'alto'
  if (n.includes('med')) return 'medio'
  return 'bajo'
}

function formatearFecha(str) {
  if (!str) return '—'
  try {
    return new Date(str).toLocaleString('es-MX', {
      weekday: 'long', day: '2-digit', month: 'long',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch { return str }
}

export default function ModalReporte({ reporte, apiBase, onCerrar }) {
  const nivel = nivelRiesgo(reporte)
  const tieneImagen = reporte.image_url && reporte.image_url !== 'null'
  const urlImagen = tieneImagen
    ? (reporte.image_url.startsWith('http') ? reporte.image_url : `${apiBase}${reporte.image_url}`)
    : null

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCerrar])

  // Bloquear scroll del body mientras el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal-hoja">

        {/* HEADER DEL MODAL */}
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="modal-id">Reporte #{reporte.id}</span>
            <span className={`badge-riesgo ${nivel}`}>{nivel}</span>
          </div>
          <button className="modal-cerrar" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </div>

        {/* CONTENIDO */}
        <div className="modal-body">

          {/* IMAGEN */}
          <div className="modal-imagen-wrap">
            {urlImagen ? (
              <img
                src={urlImagen}
                alt="Fotografía del bache reportado"
                className="modal-imagen"
              />
            ) : (
              <div className="modal-sin-imagen">
                <span>📷</span>
                <p>Sin imagen adjunta</p>
              </div>
            )}
          </div>

          {/* DETALLES */}
          <div className="modal-detalles">

            <div className="modal-campo">
              <span className="modal-campo-label">Descripción</span>
              <p className="modal-campo-valor grande">
                {reporte.description || reporte.descripcion || 'Sin descripción'}
              </p>
            </div>

            <div className="modal-fila-dos">
              <div className="modal-campo">
                <span className="modal-campo-label">Fecha del reporte</span>
                <p className="modal-campo-valor">
                  {formatearFecha(reporte.created_at || reporte.fecha)}
                </p>
              </div>
              <div className="modal-campo">
                <span className="modal-campo-label">Usuario</span>
                <p className="modal-campo-valor">ID #{reporte.user_id || '—'}</p>
              </div>
            </div>

            <div className="modal-fila-dos">
              <div className="modal-campo">
                <span className="modal-campo-label">Latitud</span>
                <p className="modal-campo-valor mono">
                  {parseFloat(reporte.latitude).toFixed(6)}
                </p>
              </div>
              <div className="modal-campo">
                <span className="modal-campo-label">Longitud</span>
                <p className="modal-campo-valor mono">
                  {parseFloat(reporte.longitude).toFixed(6)}
                </p>
              </div>
            </div>

            <div className="modal-campo">
              <span className="modal-campo-label">Estado de sincronización</span>
              <p className="modal-campo-valor">
                {reporte.synced === 1 || reporte.synced === true
                  ? '✅ Sincronizado'
                  : '🕐 Pendiente de sincronización'}
              </p>
            </div>

            {/* Enlace a Maps */}
            <a
              className="modal-btn-maps"
              href={`https://www.google.com/maps?q=${reporte.latitude},${reporte.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>🗺</span> Ver ubicación en Google Maps
            </a>

          </div>
        </div>

      </div>
    </div>
  )
}
