import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { mostrarLanding } from './landing/config.js'

// En la raíz de un dominio de Convite (sin slug ni ?i=) se muestra la landing comercial;
// todo lo demás sigue siendo la invitación, igual que antes.
const Landing = lazy(() => import('./landing/Landing.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {mostrarLanding() ? (
      <Suspense fallback={null}><Landing /></Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
