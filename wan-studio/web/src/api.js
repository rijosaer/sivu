// Cliente de la API. La web usa las mismas rutas /v1 que cualquier cliente
// externo, con el token de sesión en lugar de una llave.
const BASE = import.meta.env.VITE_API_URL || "";
const CLAVE = "ws_token";

const leer = () => {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
};
let token = leer();

export const haySesion = () => !!token;

export function guardarToken(t) {
  token = t;
  try {
    if (t) localStorage.setItem(CLAVE, t);
    else localStorage.removeItem(CLAVE);
  } catch {
    // sin almacenamiento: la sesión dura lo que la pestaña
  }
}

// Se avisa a la app cuando el token deja de servir, para mandar a "Entrar".
let alVencer = () => {};
export const alVencerSesion = (fn) => (alVencer = fn);

export async function api(ruta, { metodo = "GET", cuerpo } = {}) {
  const r = await fetch(BASE + ruta, {
    method: metodo,
    headers: {
      ...(cuerpo ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  if (r.status === 204) return null;
  const datos = await r.json().catch(() => ({}));
  if (r.status === 401 && token) {
    guardarToken(null);
    alVencer();
  }
  if (!r.ok) throw new Error(datos.error || `Error ${r.status}`);
  return datos;
}

export const urlBase = () => (BASE || window.location.origin).replace(/\/$/, "");
