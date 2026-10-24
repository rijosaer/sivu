import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { mostrarLanding } from './landing/config.js'
import { disenoDeDemo } from './demo/ruta.js'
import { paginaNegocio } from './negocio/ruta.js'

// En la raíz de un dominio de Sivú (sin slug ni ?i=) se muestra la landing comercial;
// todo lo demás sigue siendo la invitación, igual que antes.
const Landing = lazy(() => import('./landing/Landing.jsx'))
// /plantillas/<diseño>: demostración pública de un diseño con datos de ejemplo.
const Demo = lazy(() => import('./demo/Demo.jsx'))
const demo = disenoDeDemo()
// /cotizacion/<token> y /datos/<token>: lo que Sivú le manda a un cliente.
const Cotizacion = lazy(() => import('./negocio/Cotizacion.jsx'))
const DatosEvento = lazy(() => import('./negocio/DatosEvento.jsx'))
const negocio = paginaNegocio()

// Invitaciones y demos se ven sin barra de desplazamiento (se sigue bajando con
// el dedo, la rueda o el teclado). La landing y las páginas de negocio la conservan.
if (!negocio && (demo !== null || !mostrarLanding())) document.documentElement.classList.add('invitacion')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {negocio ? (
      <Suspense fallback={null}>
        {negocio.pagina === 'cotizacion' ? <Cotizacion token={negocio.token} /> : <DatosEvento token={negocio.token} />}
      </Suspense>
    ) : demo !== null ? (
      <Suspense fallback={null}><Demo diseno={demo} /></Suspense>
    ) : mostrarLanding() ? (
      <Suspense fallback={null}><Landing /></Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
