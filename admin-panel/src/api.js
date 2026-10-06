export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
export const SITIO_URL = import.meta.env.VITE_SITIO_URL || "http://localhost:5173";

// El servidor devuelve rutas relativas para imágenes y audio.
export function urlMedia(ruta) {
  return ruta ? `${API_URL}${ruta}` : ruta;
}

function getToken() {
  return localStorage.getItem("admin_token") || "";
}

// El sistema aloja muchos eventos (multi-invitación): todo lo que cuelga de
// uno solo (secciones, tema, invitados...) viaja bajo
// /api/admin/invitaciones/:invitacionId/... El panel recuerda cuál se está
// editando ahora mismo, igual que recuerda el token de sesión. Se guarda
// también el slug (para armar el enlace público y la vista previa) y el
// nombre (para mostrarlo sin pedirlo de nuevo al servidor).
export function setInvitacionActual(inv) {
  localStorage.setItem("invitacion_id", inv.id);
  localStorage.setItem("invitacion_slug", inv.slug);
  localStorage.setItem("invitacion_nombre", inv.nombre);
  localStorage.setItem("invitacion_tipo", inv.tipo_evento || "");
}
export function getInvitacionActual() {
  const id = localStorage.getItem("invitacion_id");
  if (!id) return null;
  return {
    id,
    slug: localStorage.getItem("invitacion_slug") || "",
    nombre: localStorage.getItem("invitacion_nombre") || "",
    tipo_evento: localStorage.getItem("invitacion_tipo") || "",
  };
}
export function clearInvitacionActual() {
  localStorage.removeItem("invitacion_id");
  localStorage.removeItem("invitacion_slug");
  localStorage.removeItem("invitacion_nombre");
  localStorage.removeItem("invitacion_tipo");
}
export function hasInvitacionActual() {
  return Boolean(localStorage.getItem("invitacion_id"));
}

// El enlace público de una invitación concreta: dominio.com/<slug>.
export function sitioUrlInvitacion(slug) {
  return `${SITIO_URL}/${slug}`;
}

// Base de enlace del evento que se está editando ahora mismo. Las pantallas
// que arman enlaces para compartir o para la vista previa (Invitados,
// Mensajes, Contenido, Decoraciones, EditorServidores) usan esta variable en
// vez de SITIO_URL directo, así el mismo panel sirve para cualquier evento
// sin tocar cada pantalla una por una. Es un "let" exportado (no una
// función) para que un simple re-render la recoja con su valor más
// reciente, igual que ya pasa con cualquier otro estado de React.
export let SITIO_BASE = SITIO_URL;
export function actualizarSitioBase(slug) {
  SITIO_BASE = slug ? sitioUrlInvitacion(slug) : SITIO_URL;
}

// Antepone /invitaciones/:id a una ruta ya scoped a un evento concreto.
function scoped(path) {
  return `/api/admin/invitaciones/${localStorage.getItem("invitacion_id") || ""}${path}`;
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

  // ---------- Invitaciones (los eventos en sí): sin scoping, es lo que hay
  // por ENCIMA de un evento concreto — crear, listar, editar, borrar. ----------
  listarInvitaciones: () => request("/api/admin/invitaciones"),
  crearInvitacion: (datos) =>
    request("/api/admin/invitaciones", { method: "POST", body: JSON.stringify(datos) }),
  obtenerInvitacion: (id) => request(`/api/admin/invitaciones/${id}`),
  actualizarInvitacion: (id, datos) =>
    request(`/api/admin/invitaciones/${id}`, { method: "PUT", body: JSON.stringify(datos) }),
  borrarInvitacion: (id) => request(`/api/admin/invitaciones/${id}`, { method: "DELETE" }),
  // Acceso del cliente a un evento: qué usuarios lo tienen y crear/restablecer
  // usuario y contraseña (el servidor los amarra solo a ese evento).
  obtenerAcceso: (id) => request(`/api/admin/invitaciones/${id}/acceso`),
  crearUsuarioCliente: (id, datos) =>
    request(`/api/admin/invitaciones/${id}/usuario`, { method: "POST", body: JSON.stringify(datos) }),

  // ---------- Todo lo de abajo es del evento seleccionado (scoped()) ----------

  resumen: () => request(scoped("/resumen")),
  // Respuestas y aperturas más nuevas que "desde" (ISO). Para los avisos.
  novedades: (desde) =>
    request(scoped(`/novedades${desde ? `?desde=${encodeURIComponent(desde)}` : ""}`)),

  secciones: () => request(scoped("/secciones")),
  actualizarSeccion: (id, cambios) =>
    request(scoped(`/secciones/${id}`), { method: "PUT", body: JSON.stringify(cambios) }),
  reordenarSecciones: (orden) =>
    request(scoped("/secciones/reordenar"), { method: "POST", body: JSON.stringify({ orden }) }),

  tema: () => request(scoped("/tema")),
  restaurarTema: () => request(scoped("/tema/restaurar"), { method: "POST" }),
  actualizarTema: (clave, valor) =>
    request(scoped(`/tema/${clave}`), { method: "PUT", body: JSON.stringify({ valor }) }),

  // Fotos de la galería y audio de fondo
  medios: (tipo) => request(scoped(`/medios${tipo ? `?tipo=${tipo}` : ""}`)),
  subirMedio: (tipo, nombre, datos) =>
    request(scoped("/medios"), { method: "POST", body: JSON.stringify({ tipo, nombre, datos }) }),
  reordenarMedios: (orden) =>
    request(scoped("/medios/reordenar"), { method: "POST", body: JSON.stringify({ orden }) }),
  borrarMedio: (id) => request(scoped(`/medios/${id}`), { method: "DELETE" }),

  decoraciones: () => request(scoped("/decoraciones")),
  crearDecoracion: (etiqueta, datos) =>
    request(scoped("/decoraciones"), { method: "POST", body: JSON.stringify({ etiqueta, datos }) }),
  actualizarDecoracion: (clave, datos) =>
    request(scoped(`/decoraciones/${clave}`), { method: "PUT", body: JSON.stringify({ datos }) }),
  borrarDecoracion: (clave) => request(scoped(`/decoraciones/${clave}`), { method: "DELETE" }),

  // Dónde va colocada cada decoración
  ubicaciones: () => request(scoped("/ubicaciones")),
  crearUbicacion: (datos) =>
    request(scoped("/ubicaciones"), { method: "POST", body: JSON.stringify(datos) }),
  actualizarUbicacion: (id, cambios) =>
    request(scoped(`/ubicaciones/${id}`), { method: "PUT", body: JSON.stringify(cambios) }),
  borrarUbicacion: (id) => request(scoped(`/ubicaciones/${id}`), { method: "DELETE" }),

  // Invitados de este evento y las personas que cubre cada uno
  invitados: () => request(scoped("/invitados")),
  crearInvitado: (datos) =>
    request(scoped("/invitados"), { method: "POST", body: JSON.stringify(datos) }),
  actualizarInvitado: (id, datos) =>
    request(scoped(`/invitados/${id}`), { method: "PUT", body: JSON.stringify(datos) }),
  borrarInvitado: (id) => request(scoped(`/invitados/${id}`), { method: "DELETE" }),

  // "acompanante" solo aplica a las invitaciones por cupos: ocupa uno de los
  // cupos y entra como confirmado (lo agregamos cuando nos avisan por fuera,
  // por ejemplo por WhatsApp).
  agregarMiembro: (invitadoId, nombre, acompanante = false) =>
    request(scoped(`/invitados/${invitadoId}/miembros`), {
      method: "POST",
      body: JSON.stringify({ nombre, acompanante }),
    }),
  actualizarMiembro: (id, cambios) =>
    request(scoped(`/miembros/${id}`), { method: "PUT", body: JSON.stringify(cambios) }),
  borrarMiembro: (id) => request(scoped(`/miembros/${id}`), { method: "DELETE" }),
};

export function setToken(token) {
  localStorage.setItem("admin_token", token);
}
export function clearToken() {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("evento_fijo");
}

// Un usuario cliente está amarrado a un solo evento: el panel no le ofrece
// cambiar de evento. Es solo para la interfaz; quien lo hace cumplir es el
// servidor, que rechaza cualquier otro evento aunque se pida a mano.
export function setEventoFijo(fijo) {
  if (fijo) localStorage.setItem("evento_fijo", "1");
  else localStorage.removeItem("evento_fijo");
}
export function esEventoFijo() {
  return localStorage.getItem("evento_fijo") === "1";
}
export function hasToken() {
  return Boolean(getToken());
}
