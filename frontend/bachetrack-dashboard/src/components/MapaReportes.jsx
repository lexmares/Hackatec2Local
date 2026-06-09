import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

// Fix del bug de iconos que tiene Leaflet con Webpack/Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function crearIcono(riesgo) {
    const colores = { bajo: '#34d399', medio: '#fbbf24', alto: '#f87171' }
    const color = colores[riesgo] || '#8888aa'
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.84 14 22 14 22S28 23.84 28 14C28 6.27 21.73 0 14 0z"
            fill="${color}" opacity="0.9"/>
      <circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/>
    </svg>`
    return L.divIcon({ html: svg, className: '', iconSize: [28, 36], iconAnchor: [14, 36], popupAnchor: [0, -36] })
}

function formatearFecha(str) {
    if (!str) return '—'
    try {
        return new Date(str).toLocaleString('es-MX', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    } catch { return str }
}

function nivelRiesgo(r, total) {
    const n = (r.riesgo || r.risk || '').toLowerCase()
    if (n.includes('alt')) return 'alto'
    if (n.includes('med')) return 'medio'
    if (n) return 'bajo'
    if (total <= 2) return 'bajo'
    if (total <= 5) return 'medio'
    return 'alto'
}

export default function MapaReportes({ reportes }) {
    const centro = reportes.length > 0
        ? [
            parseFloat(reportes[0].latitude || reportes[0].lat || 20.967),
            parseFloat(reportes[0].longitude || reportes[0].lng || -89.623)
        ]
        : [20.967, -89.623]

    return (
        <section className="panel mapa-panel">
            <div className="panel-header">
                <span className="panel-title">🗺 Mapa de reportes</span>
                <span className="panel-hint">Haz clic en un marcador para ver detalle</span>
            </div>
            <MapContainer center={centro} zoom={13} style={{ height: '440px', width: '100%' }}>
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution="© OpenStreetMap contributors © CARTO"
                />
                {reportes.map((r, i) => {
                    const lat = parseFloat(r.latitude || r.lat || r.latitud)
                    const lng = parseFloat(r.longitude || r.lng || r.longitud)
                    if (isNaN(lat) || isNaN(lng)) return null
                    const nivel = nivelRiesgo(r, reportes.length)
                    return (
                        <Marker key={r.id || i} position={[lat, lng]} icon={crearIcono(nivel)}>
                            <Popup>
                                <div className="popup-desc">{r.description || r.descripcion || 'Sin descripción'}</div>
                                <div className="popup-fecha">📅 {formatearFecha(r.created_at || r.fecha)}</div>
                                <span className={`popup-riesgo ${nivel}`}>{nivel.toUpperCase()}</span>
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>
        </section>
    )
}