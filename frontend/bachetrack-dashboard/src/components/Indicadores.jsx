function nivelRiesgo(r, total) {
    const n = (r.riesgo || r.risk || '').toLowerCase()
    if (n.includes('alt')) return 'alto'
    if (n.includes('med')) return 'medio'
    if (n) return 'bajo'
    if (total <= 2) return 'bajo'
    if (total <= 5) return 'medio'
    return 'alto'
}

function calcularRiesgo(total) {
    if (total <= 2) return 'bajo'
    if (total <= 5) return 'medio'
    return 'alto'
}

export default function Indicadores({ reportes }) {
    const total = reportes.length
    const riesgo = calcularRiesgo(total)

    let bajo = 0, medio = 0, alto = 0
    reportes.forEach(r => {
        const nivel = nivelRiesgo(r, total)
        if (nivel === 'alto') alto++
        else if (nivel === 'medio') medio++
        else bajo++
    })

    const etiquetas = { bajo: '🟢 Bajo', medio: '🟡 Medio', alto: '🔴 Alto' }

    return (
        <>
            <section className="indicadores">
                <div className="card-indicador">
                    <span className="ind-numero">{total}</span>
                    <span className="ind-label">Total de reportes</span>
                </div>
                <div className="card-indicador bajo">
                    <span className="semaforo-dot bajo"></span>
                    <span className="ind-numero">{bajo}</span>
                    <span className="ind-label">Riesgo bajo</span>
                </div>
                <div className="card-indicador medio">
                    <span className="semaforo-dot medio"></span>
                    <span className="ind-numero">{medio}</span>
                    <span className="ind-label">Riesgo medio</span>
                </div>
                <div className="card-indicador alto">
                    <span className="semaforo-dot alto"></span>
                    <span className="ind-numero">{alto}</span>
                    <span className="ind-label">Riesgo alto</span>
                </div>
            </section>

            <section className="semaforo-global-wrap">
                <span className="semaforo-titulo">Nivel de riesgo general de la ciudad:</span>
                <span className={`semaforo-badge ${riesgo}`}>{etiquetas[riesgo]}</span>
            </section>
        </>
    )
}