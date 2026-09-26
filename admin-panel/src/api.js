export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
export const SITIO_URL = import.meta.env.VITE_SITIO_URL || "http://localhost:5173";

// El servidor devuelve rutas relativas para imágenes y audio.
export function urlMedia(ruta) {
  return ruta ? `${API_URL}${ruta}` : ruta;
}

function getToken() {
  return localStorage.getItem("admin_token") || "";
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem("admin_token");
    window.location.reload();
    throw new Error("Sesión expirada");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Error de servidor");
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  login: (usuario, password) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify({ usuario, password }) }),

  resumen: () => request("/api/admin/resumen"),
  // Respuestas y aperturas más nuevas que "desde" (ISO). Para los avisos.
  novedades: (desde) =>
    request(`/api/admin/novedades${desde ? `?desde=${encodeURIComponent(desde)}` : ""}`),

  secciones: () => request("/api/admin/secciones"),
  actualizarSeccion: (id, cambios) =>
    request(`/api/admin/secciones/${id}`, { method: "PUT", body: JSON.stringify(cambios) }),
  reordenarSecciones: (orden) =>
    request("/api/admin/secciones/reordenar", { method: "POST", body: JSON.stringify({ orden }) }),

  tema: () => request("/api/admin/tema"),
  actualizarTema: (clave, valor) =>
    request(`/api/admin/tema/${clave}`, { method: "PUT", body: JSON.stringify({ valor }) }),

  // Fotos de la galería y audio de fondo
  medios: (tipo) => request(`/api/admin/medios${tipo ? `?tipo=${tipo}` : ""}`),
  subirMedio: (tipo, nombre, datos) =>
    request("/api/admin/medios", { method: "POST", body: JSON.stringify({ tipo, nombre, datos }) }),
  reordenarMedios: (orden) =>
    request("/api/admin/medios/reordenar", { method: "POST", body: JSON.stringify({ orden }) }),
  borrarMedio: (id) => request(`/api/admin/medios/${id}`, { method: "DELETE" }),

  decoraciones: () => request("/api/admin/decoraciones"),
  crearDecoracion: (etiqueta, datos) =>
    request("/api/admin/decoraciones", { method: "POST", body: JSON.stringify({ etiqueta, datos }) }),
  actualizarDecoracion: (clave, datos) =>
    request(`/api/admin/decoraciones/${clave}`, { method: "PUT", body: JSON.stringify({ datos }) }),
  borrarDecoracion: (clave) => request(`/api/admin/decoraciones/${clave}`, { method: "DELETE" }),

  // Dónde va colocada cada decoración
  ubicaciones: () => request("/api/admin/ubicaciones"),
  crearUbicacion: (datos) =>
    request("/api/admin/ubicaciones", { method: "POST", body: JSON.stringify(datos) }),
  actualizarUbicacion: (id, cambios) =>
    request(`/api/admin/ubicaciones/${id}`, { method: "PUT", body: JSON.stringify(cambios) }),
  borrarUbicacion: (id) => request(`/api/admin/ubicaciones/${id}`, { method: "DELETE" }),

  // Invitaciones y las personas que cubre cada una
  invitados: () => request("/api/admin/invitados"),
  crearInvitado: (datos) =>
    request("/api/admin/invitados", { method: "POST", body: JSON.stringify(datos) }),
  actualizarInvitado: (id, datos) =>
    request(`/api/admin/invitados/${id}`, { method: "PUT", body: JSON.stringify(datos) }),
  borrarInvitado: (id) => request(`/api/admin/invitados/${id}`, { method: "DELETE" }),

  // "acompanante" solo aplica a las invitaciones por cupos: ocupa uno de los
  // cupos y entra como confirmado (lo agregamos cuando nos avisan por fuera,
  // por ejemplo por WhatsApp).
  agregarMiembro: (invitadoId, nombre, acompanante = false) =>
    request(`/api/admin/invitados/${invitadoId}/miembros`, {
      method: "POST",
      body: JSON.stringify({ nombre, acompanante }),
    }),
  actualizarMiembro: (id, cambios) =>
    request(`/api/admin/miembros/${id}`, { method: "PUT", body: JSON.stringify(cambios) }),
  borrarMiembro: (id) => request(`/api/admin/miembros/${id}`, { method: "DELETE" }),
};

export function setToken(token) {
  localStorage.setItem("admin_token", token);
}
export function clearToken() {
  localStorage.removeItem("admin_token");
}
export function hasToken() {
  return Boolean(getToken());
}
