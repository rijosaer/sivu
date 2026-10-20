import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cspPlugin } from './csp.config.js'

// Sitio público: sin scripts en línea ni eval; scripts solo de la propia web
// y de la analítica de Cloudflare. Imágenes, audio y mapas sí pueden venir de
// cualquier https: el contenido de cada evento admite «fotos por enlace
// externo», música por URL y el mapa que pegue el cliente, y las invitaciones
// que ya existen los usan. Eso no ejecuta código, así que no abre la puerta a
// un XSS.
const csp = cspPlugin(({ api }) => ({
  'default-src': ["'self'"],
  'script-src': ["'self'", 'https://static.cloudflareinsights.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'blob:', 'https:'],
  'media-src': ["'self'", 'data:', 'blob:', 'https:'],
  'connect-src': ["'self'", api, 'https://cloudflareinsights.com'],
  'frame-src': ["'self'", 'https:'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'manifest-src': ["'self'"],
  'worker-src': ["'none'"],
  'upgrade-insecure-requests': [],
}))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), csp],
})
