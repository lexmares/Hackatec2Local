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

export default function TablaReportes({ reportes }) {
    return (
        <section className="panel tabla-panel">
            <div className="panel-header">
                <span className="panel-title">📋 Reportes recibidos</span>
                <span className="panel-hint">{reportes.length} registro(s)</span>
            </div>
            <div className="tabla-scroll">
                <table>
                    <thead>
                        <tr>
                            <th>#ID</th><th>Descripción</th><th>Latitud</th>
                            <th>Longitud</th><th>Fecha</th><th>Riesgo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportes.length === 0 ? (
                            <tr><td colSpan={6} className="td-vacio">No hay reportes todavía.</td></tr>
                        ) : reportes.map((r, i) => {
                            const nivel = nivelRiesgo(r, reportes.length)
                            const lat = r.latitude || r.lat || r.latitud || '—'
                            const lng = r.longitude || r.lng || r.longitud || '—'
                            return (
                                <tr key={r.id || i}>
                                    <td>{r.id || i + 1}</td>
                                    <td>{r.description || r.descripcion || '—'}</td>
                                    <td>{typeof lat === 'number' ? lat.toFixed(6) : lat}</td>
                                    <td>{typeof lng === 'number' ? lng.toFixed(6) : lng}</td>
                                    <td>{formatearFecha(r.created_at || r.fecha)}</td>
                                    <td><span className={`badge-riesgo ${nivel}`}>{nivel}</span></td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    )
}