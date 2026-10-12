import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { mostrarLanding } from './landing/config.js'
import { disenoDeDemo } from './demo/ruta.js'

// En la raíz de un dominio de Sivú (sin slug ni ?i=) se muestra la landing comercial;
// todo lo demás sigue siendo la invitación, igual que antes.
const Landing = lazy(() => import('./landing/Landing.jsx'))
// /plantillas/<diseño>: demostración pública de un diseño con datos de ejemplo.
const Demo = lazy(() => import('./demo/Demo.jsx'))
const demo = disenoDeDemo()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {demo !== null ? (
      <Suspense fallback={null}><Demo diseno={demo} /></Suspense>
    ) : mostrarLanding() ? (
      <Suspense fallback={null}><Landing /></Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
