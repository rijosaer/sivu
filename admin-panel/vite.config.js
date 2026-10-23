import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cspPlugin } from "./csp.config.js";

// Panel: guarda el token de sesión, así que su CSP es la más cerrada. Solo
// habla con la API, carga sus letras de Google Fonts e incrusta el sitio
// (vista previa del editor). Los estilos
// en línea se permiten por la exportación a PDF, que abre una ventana con su
// propio <style>; scripts en línea, ninguno.
const csp = cspPlugin(({ api, sitio }) => ({
  "default-src": ["'self'"],
  "script-src": ["'self'"],
  "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
  "img-src": ["'self'", "data:", "blob:", api],
  "media-src": ["'self'", "data:", "blob:", api],
  "connect-src": ["'self'", api],
  "frame-src": [sitio || "'none'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  // La importación de Excel descomprime en un Worker creado desde un blob.
  "worker-src": ["'self'", "blob:"],
  "upgrade-insecure-requests": [],
}));

export default defineConfig({
  plugins: [react(), csp],
});
