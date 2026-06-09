export default function Header({ onRefresh, cargando }) {
    return (
        <header className="header">
            <div className="header-brand">
                <span className="brand-icon">◈</span>
                <div>
                    <h1>BacheTrack <span className="brand-ai">AI</span></h1>
                    <p className="brand-sub">Panel de Control Municipal</p>
                </div>
            </div>
            <div className="header-right">
                <div className="live-dot"></div>
                <span className="live-label">EN VIVO</span>
                <button
                    className="btn-refresh"
                    onClick={onRefresh}
                    disabled={cargando}
                >
                    <span className="refresh-icon">{cargando ? '⏳' : '↻'}</span>
                    {cargando ? 'Cargando...' : 'Actualizar'}
                </button>
            </div>
        </header>
    )
}