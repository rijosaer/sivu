// Copia de ../csp.config.js: el panel se compila en Railway solo con su carpeta
// (admin-panel), así que no puede importar archivos de la raíz. Si cambias
// uno, cambia el otro.

// Content-Security-Policy para los dos front-ends (sitio y panel), inyectada
// como <meta> en el index.html al compilar. Se arma con el origen real de la
// API (VITE_API_URL), así que no hay que mantener la lista a mano.
//
// frame-ancestors no funciona dentro de <meta>: esa directiva va como
// cabecera en Cloudflare (ver docs/seguridad.md).

function origen(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

export function politica(directivas) {
  return Object.entries(directivas)
    .map(([k, v]) => [k, ...v.filter(Boolean)].join(" "))
    .join("; ");
}

// Plugin de Vite: solo en el build (en desarrollo Vite inyecta scripts
// en línea para el recargado en caliente y la CSP los bloquearía).
export function cspPlugin(armar) {
  let env = {};
  return {
    name: "sivu-csp",
    apply: "build",
    configResolved(config) {
      env = config.env;
    },
    transformIndexHtml(html) {
      const api = origen(env.VITE_API_URL);
      if (!api) {
        console.warn("[csp] VITE_API_URL no está definida: se compila SIN Content-Security-Policy.");
        return html;
      }
      const csp = politica(armar({ api, sitio: origen(env.VITE_SITIO_URL) }));
      return html.replace(
        "<head>",
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`
      );
    },
  };
}
