import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cspPlugin } from './csp.config.js'

// Sitio público: sin scripts en línea ni eval. Solo se permiten la propia
// web, la API, las letras de Google Fonts (el cliente puede elegir otras),
// el mapa incrustado de Google y la analítica de Cloudflare.
const csp = cspPlugin(({ api }) => ({
  'default-src': ["'self'"],
  'script-src': ["'self'", 'https://static.cloudflareinsights.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'blob:', api],
  'media-src': ["'self'", 'blob:', api],
  'connect-src': ["'self'", api, 'https://cloudflareinsights.com'],
  'frame-src': ["'self'", 'https://www.google.com', 'https://maps.google.com'],
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
