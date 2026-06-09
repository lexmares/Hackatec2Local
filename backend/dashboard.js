/* =============================================
   BacheTrack AI — dashboard.js
   Consume GET http://192.168.1.239:3000/reports
   ============================================= */

// ---- MAPA ----
const mapa = L.map('mapa').setView([20.967, -89.623], 13);

setTimeout(() => {
  mapa.invalidateSize();
}, 300);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap contributors © CARTO',
  maxZoom: 19,
}).addTo(mapa);

// Grupo de marcadores (para limpiar al actualizar)
let marcadoresLayer = L.layerGroup().addTo(mapa);

// ---- COLORES POR RIESGO ----
const COLORES = {
  bajo: '#34d399',
  medio: '#fbbf24',
  alto: '#f87171',
};

// Calcula el nivel de riesgo de una ZONA según cuántos reportes hay cerca
// Regla del líder: 1-2 = bajo, 3-5 = medio, 6+ = alto
// Para reportes individuales usamos el conteo total como proxy simple
function calcularRiesgoGlobal(total) {
  if (total <= 2) return 'bajo';
  if (total <= 5) return 'medio';
  return 'alto';
}

// Icono de marcador personalizado según riesgo
function crearIcono(riesgo) {
  const color = COLORES[riesgo] || '#8888aa';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.84 14 22 14 22S28 23.84 28 14C28 6.27 21.73 0 14 0z"
            fill="${color}" opacity="0.9"/>
      <circle cx="14" cy="14" r="6" fill="white" opacity="0.9"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

// ---- FORMATEAR FECHA ----
function formatearFecha(fechaStr) {
  if (!fechaStr) return '—';
  try {
    const d = new Date(fechaStr);
    return d.toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return fechaStr;
  }
}

// ---- ACTUALIZAR INDICADORES ----
function actualizarIndicadores(reportes) {
  const total = reportes.length;
  const riesgoGlobal = calcularRiesgoGlobal(total);

  // Conteo por nivel (usamos el riesgoGlobal de cada reporte si existe,
  // o distribuimos según la regla global como fallback)
  let bajo = 0, medio = 0, alto = 0;
  reportes.forEach(r => {
    const nivel = r.riesgo || r.risk || r.nivel || null;
    if (nivel) {
      const n = nivel.toLowerCase();
      if (n === 'bajo' || n === 'low') bajo++;
      else if (n === 'medio' || n === 'medium') medio++;
      else if (n === 'alto' || n === 'high') alto++;
      else bajo++;
    } else {
      // Sin campo riesgo: usamos el global como etiqueta de cada registro
      if (riesgoGlobal === 'bajo') bajo++;
      else if (riesgoGlobal === 'medio') medio++;
      else alto++;
    }
  });

  document.getElementById('total-reportes').textContent = total;
  document.getElementById('total-bajo').textContent = bajo;
  document.getElementById('total-medio').textContent = medio;
  document.getElementById('total-alto').textContent = alto;

  // Semáforo global
  const badge = document.getElementById('semaforo-badge');
  badge.className = 'semaforo-badge ' + riesgoGlobal;
  const etiquetas = { bajo: '🟢 Bajo', medio: '🟡 Medio', alto: '🔴 Alto' };
  badge.textContent = etiquetas[riesgoGlobal];

  return { bajo, medio, alto, riesgoGlobal };
}

// ---- RENDERIZAR MARCADORES EN MAPA ----
function renderizarMapa(reportes) {
  marcadoresLayer.clearLayers();

  const coords = [];

  reportes.forEach((r, i) => {
    const lat = parseFloat(r.latitude || r.lat || r.latitud);
    const lng = parseFloat(r.longitude || r.lng || r.longitud);
    if (isNaN(lat) || isNaN(lng)) return;

    const riesgoLocal = r.riesgo || r.risk || r.nivel || calcularRiesgoGlobal(reportes.length);
    const nivel = riesgoLocal.toLowerCase().includes('alt') ? 'alto'
      : riesgoLocal.toLowerCase().includes('med') ? 'medio' : 'bajo';

    const marcador = L.marker([lat, lng], { icon: crearIcono(nivel) });

    const popupHtml = `
      <div class="popup-desc">${r.description || r.descripcion || 'Sin descripción'}</div>
      <div class="popup-fecha">📅 ${formatearFecha(r.created_at || r.fecha || r.date)}</div>
      <span class="popup-riesgo ${nivel}">${nivel.toUpperCase()}</span>
    `;
    marcador.bindPopup(popupHtml);
    marcadoresLayer.addLayer(marcador);
    coords.push([lat, lng]);
  });

  // Centrar mapa en los reportes si hay datos
  if (coords.length > 0) {
    mapa.fitBounds(coords, { padding: [40, 40] });
  }
}

// ---- RENDERIZAR TABLA ----
function renderizarTabla(reportes) {
  const tbody = document.getElementById('tbody-reportes');
  const tablaCount = document.getElementById('tabla-count');

  tablaCount.textContent = `${reportes.length} registro(s)`;

  if (reportes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="td-vacio">No hay reportes todavía.</td></tr>';
    return;
  }

  tbody.innerHTML = reportes.map((r, i) => {
    const id = r.id || (i + 1);
    const desc = r.description || r.descripcion || '—';
    const lat = r.latitude || r.lat || r.latitud || '—';
    const lng = r.longitude || r.lng || r.longitud || '—';
    const fecha = formatearFecha(r.created_at || r.fecha || r.date);
    const riesgoLocal = r.riesgo || r.risk || r.nivel || calcularRiesgoGlobal(reportes.length);
    const nivel = riesgoLocal.toLowerCase().includes('alt') ? 'alto'
      : riesgoLocal.toLowerCase().includes('med') ? 'medio' : 'bajo';

    return `
      <tr>
        <td>${id}</td>
        <td>${desc}</td>
        <td>${typeof lat === 'number' ? lat.toFixed(6) : lat}</td>
        <td>${typeof lng === 'number' ? lng.toFixed(6) : lng}</td>
        <td>${fecha}</td>
        <td><span class="badge-riesgo ${nivel}">${nivel}</span></td>
      </tr>
    `;
  }).join('');
}

// ---- MOSTRAR / OCULTAR ERROR ----
let errorBanner = null;
function mostrarError(msg) {
  if (!errorBanner) {
    errorBanner = document.createElement('div');
    errorBanner.className = 'error-banner';
    document.querySelector('.indicadores').insertAdjacentElement('beforebegin', errorBanner);
  }
  errorBanner.textContent = '⚠ ' + msg;
  errorBanner.classList.add('visible');
}
function ocultarError() {
  if (errorBanner) errorBanner.classList.remove('visible');
}

// ---- FUNCIÓN PRINCIPAL: CARGAR REPORTES ----
async function cargarReportes() {
  const btnRefresh = document.getElementById('btn-refresh');
  const refreshIcon = btnRefresh.querySelector('.refresh-icon');

  // Animación de carga
  btnRefresh.disabled = true;
  refreshIcon.style.display = 'inline-block';
  refreshIcon.style.animation = 'spin 0.6s linear infinite';

  try {
    const res = await fetch("/reports");

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();

    // La API puede devolver un array directo, o { reports: [...] }, o { data: [...] }
    const reportes = Array.isArray(data)
      ? data
      : (data.reports || data.data || data.results || []);

    ocultarError();
    actualizarIndicadores(reportes);
    renderizarMapa(reportes);
    renderizarTabla(reportes);

    // Timestamp de última actualización
    document.getElementById('ultima-actualizacion').textContent =
      'Última actualización: ' + new Date().toLocaleTimeString('es-MX');

  } catch (err) {
    console.error('[BacheTrack] Error al cargar reportes:', err);
    mostrarError(`No se pudo conectar con la API (/reports). ` +
      'Verifica que el servidor esté corriendo y que ambos dispositivos estén en la misma red.');
  } finally {
    btnRefresh.disabled = false;
    refreshIcon.style.animation = '';
  }
}

// ---- ARRANQUE ----
document.addEventListener('DOMContentLoaded', () => {
  cargarReportes();
});
