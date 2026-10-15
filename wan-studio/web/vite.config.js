import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// En desarrollo, la API corre aparte (puerto 4100) y Vite le pasa las rutas.
// En producción, el mismo servidor sirve la web y la API.
const api = process.env.VITE_PROXY || "http://localhost:4100";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    proxy: { "/api": api, "/v1": api, "/archivos": api },
  },
});
