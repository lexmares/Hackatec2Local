import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// CSS de Leaflet — obligatorio para que el mapa se vea bien
import 'leaflet/dist/leaflet.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)