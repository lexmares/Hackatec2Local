export default function Header({ onRefresh, cargando, vistaActual, onCambiarVista }) {
    return (
        <header className="header">
            <div className="header-brand">
                <span className="brand-icon">◈</span>
                <div>
                    <h1>Bache<span className="brand-ai">Track</span></h1>
                    <p className="brand-sub">Panel de Control Municipal</p>
                </div>
            </div>

            {/* TABS DE NAVEGACIÓN */}
            <nav className="header-nav">
                <button
                    className={`nav-tab ${vistaActual === 'dashboard' ? 'activo' : ''}`}
                    onClick={() => onCambiarVista('dashboard')}
                >
                    <span className="tab-icon">▦</span>
                    Dashboard
                </button>
                <button
                    className={`nav-tab ${vistaActual === 'reportes' ? 'activo' : ''}`}
                    onClick={() => onCambiarVista('reportes')}
                >
                    <span className="tab-icon">☰</span>
                    Reportes
                </button>
            </nav>

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
