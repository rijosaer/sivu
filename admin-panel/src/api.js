export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
export const SITIO_URL = import.meta.env.VITE_SITIO_URL || "http://localhost:5173";
// Origen del sitio incrustado en la vista previa: es el único del que se
// aceptan mensajes y el único al que se le mandan.
export const ORIGEN_SITIO = new URL(SITIO_URL).origin;

// ¿Este mensaje viene de verdad del sitio que está dentro de este iframe?
// Sin esta comprobación, cualquier página que abriera el panel en otra
// pestaña podía mandarle órdenes («mueve esta decoración») que el panel
// guardaba con la sesión del usuario.
export function mensajeDelSitio(e, iframe) {
  return e.origin === ORIGEN_SITIO && Boolean(iframe) && e.source === iframe.contentWindow;
}

// El servidor devuelve rutas relativas para imágenes y audio.
export function urlMedia(ruta) {
  return ruta ? `${API_URL}${ruta}` : ruta;
}

// Un archivo que llega de afuera (WhatsApp, comprobantes) se convierte en un
// blob: con el origen del panel. Si fuera HTML o SVG y se abriera en una
// pestaña, correría con la sesión del dueño. Solo se conserva el tipo si es
// imagen, audio, video o PDF; lo demás queda como binario (se descarga).
const TIPOS_VISIBLES = /^(image\/(jpeg|png|gif|webp|avif|heic|heif)|audio\/[a-z0-9.+-]+|video\/(mp4|webm|3gpp|quicktime)|application\/pdf)$/;
async function blobSeguro(res) {
  const blob = await res.blob();
  const tipo = blob.type.split(";")[0].trim().toLowerCase();
  return TIPOS_VISIBLES.test(tipo) && tipo !== "image/svg+xml"
    ? blob
    : new Blob([blob], { type: "application/octet-stream" });
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
  // Avisos por WhatsApp al cliente cuando un invitado responde (solo dueño).
  obtenerAvisos: (id) => request(`/api/admin/invitaciones/${id}/avisos`),
  guardarAvisos: (id, datos) =>
    request(`/api/admin/invitaciones/${id}/avisos`, { method: "PUT", body: JSON.stringify(datos) }),
  probarAvisos: (id) => request(`/api/admin/invitaciones/${id}/avisos/prueba`, { method: "POST" }),
  enviarResumen: (id) => request(`/api/admin/invitaciones/${id}/avisos/resumen`, { method: "POST" }),
  // El número de WhatsApp de Sivú que manda esos avisos, vinculado con QR.
  estadoWhatsapp: () => request("/api/admin/whatsapp"),
  conectarWhatsapp: () => request("/api/admin/whatsapp/conectar", { method: "POST" }),
  desconectarWhatsapp: () => request("/api/admin/whatsapp/desconectar", { method: "POST" }),

  // ---------- Negocio de Sivú (solo dueño): clientes potenciales,
  // configuración, cotizaciones y producción ----------
  crm: {
    tablero: () => request("/api/admin/crm/tablero"),
    prospectos: (filtros = {}) => {
      const q = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v)).toString();
      return request(`/api/admin/crm/prospectos${q ? `?${q}` : ""}`);
    },
    prospecto: (id) => request(`/api/admin/crm/prospectos/${id}`),
    crearProspecto: (datos) =>
      request("/api/admin/crm/prospectos", { method: "POST", body: JSON.stringify(datos) }),
    actualizarProspecto: (id, cambios) =>
      request(`/api/admin/crm/prospectos/${id}`, { method: "PUT", body: JSON.stringify(cambios) }),
    borrarProspecto: (id, ignorar) =>
      request(`/api/admin/crm/prospectos/${id}${ignorar ? "?ignorar=1" : ""}`, { method: "DELETE" }),
    marcarLeido: (id) => request(`/api/admin/crm/prospectos/${id}/leido`, { method: "POST" }),
    enviarMensaje: (id, texto) =>
      request(`/api/admin/crm/prospectos/${id}/mensaje`, { method: "POST", body: JSON.stringify({ texto }) }),
    crearCotizacion: (id, datos) =>
      request(`/api/admin/crm/prospectos/${id}/cotizaciones`, { method: "POST", body: JSON.stringify(datos) }),
    actualizarCotizacion: (id, datos) =>
      request(`/api/admin/crm/cotizaciones/${id}`, { method: "PUT", body: JSON.stringify(datos) }),
    borrarCotizacion: (id) => request(`/api/admin/crm/cotizaciones/${id}`, { method: "DELETE" }),
    ajustes: () => request("/api/admin/crm/ajustes"),
    guardarAjuste: (clave, valor) =>
      request(`/api/admin/crm/ajustes/${clave}`, { method: "PUT", body: JSON.stringify({ valor }) }),
    vistaSaludo: (ejemplo) =>
      request("/api/admin/crm/ajustes/vista-saludo", { method: "POST", body: JSON.stringify(ejemplo) }),
    vistaReporte: () => request("/api/admin/crm/reporte/vista"),
    enviarReporte: () => request("/api/admin/crm/reporte/enviar", { method: "POST" }),
    exportar: () => request("/api/admin/crm/exportar"),
    produccion: () => request("/api/admin/crm/produccion"),
    actualizarProduccion: (id, cambios) =>
      request(`/api/admin/crm/produccion/${id}`, { method: "PUT", body: JSON.stringify(cambios) }),
    pagos: (id) => request(`/api/admin/crm/produccion/${id}/pagos`),
    agregarPago: (id, datos) =>
      request(`/api/admin/crm/produccion/${id}/pagos`, { method: "POST", body: JSON.stringify(datos) }),
    borrarPago: (id) => request(`/api/admin/crm/pagos/${id}`, { method: "DELETE" }),
    enlaceDatos: (id) => request(`/api/admin/crm/produccion/${id}/enlace-datos`, { method: "POST" }),
    datosEvento: (id) => request(`/api/admin/crm/produccion/${id}/datos`),
    usarArchivo: (id) => request(`/api/admin/crm/archivos/${id}/usar`, { method: "POST" }),
    // El archivo viaja con la sesión: se baja como blob y se abre/guarda.
    descargarArchivo: async (id, nombre) => {
      const res = await fetch(`${API_URL}/api/admin/crm/archivos/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("No se pudo descargar");
      const url = URL.createObjectURL(await blobSeguro(res));
      const a = document.createElement("a");
      a.href = url;
      a.download = nombre || "archivo";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    },
    mensajesInvitados: () => request("/api/admin/crm/mensajes-invitados"),
    // Catálogo de diseños (panel → Diseños).
    disenos: () => request("/api/admin/crm/disenos"),
    actualizarDiseno: (id, cambios) =>
      request(`/api/admin/crm/disenos/${id}`, { method: "PUT", body: JSON.stringify(cambios) }),
    crearVariante: (id, nombre) =>
      request(`/api/admin/crm/disenos/${id}/variante`, { method: "POST", body: JSON.stringify({ nombre }) }),
    borrarDiseno: (id) => request(`/api/admin/crm/disenos/${id}`, { method: "DELETE" }),
    // Bandeja de WhatsApp (como WhatsApp Web).
    chats: () => request("/api/admin/crm/bandeja/chats"),
    chat: (tel) => request(`/api/admin/crm/bandeja/chats/${tel}`),
    chatLeido: (tel) => request(`/api/admin/crm/bandeja/chats/${tel}/leido`, { method: "POST" }),
    chatEnviar: (tel, texto) =>
      request(`/api/admin/crm/bandeja/chats/${tel}/enviar`, { method: "POST", body: JSON.stringify({ texto }) }),
    chatArchivo: (tel, datos) =>
      request(`/api/admin/crm/bandeja/chats/${tel}/archivo`, { method: "POST", body: JSON.stringify(datos) }),
    // Los archivos piden el token, así que se bajan con fetch y se muestran
    // como blob (un <img src> normal no lo manda).
    chatMedia: async (id) => {
      const res = await fetch(`${API_URL}/api/admin/crm/bandeja/media/${id}`, {
        headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
      });
      if (!res.ok) throw new Error("No se pudo abrir el archivo");
      return URL.createObjectURL(await blobSeguro(res));
    },
    pagosPorConfirmar: (recientes) => request(`/api/admin/crm/pagos-por-confirmar${recientes ? "?recientes=1" : ""}`),
    confirmarPago: (id, datos) =>
      request(`/api/admin/crm/pagos-reportados/${id}/confirmar`, { method: "POST", body: JSON.stringify(datos) }),
    rechazarPago: (id) => request(`/api/admin/crm/pagos-reportados/${id}/rechazar`, { method: "POST" }),
    // El comprobante viaja con la sesión: se baja como blob para mostrarlo.
    comprobante: async (id) => {
      const res = await fetch(`${API_URL}/api/admin/crm/pagos-reportados/${id}/comprobante`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Sin comprobante");
      const blob = await blobSeguro(res);
      return { url: URL.createObjectURL(blob), tipo: blob.type };
    },
  },

  // ---------- Todo lo de abajo es del evento seleccionado (scoped()) ----------

  // Lo que los invitados le escriben al WhatsApp de Sivú.
  mensajesEvento: () => request(scoped("/mensajes")),
  marcarMensajesLeidos: () => request(scoped("/mensajes/leidos"), { method: "POST" }),

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

  // Envío automático por el WhatsApp de Sivú (solo el dueño)
  envioAutomatico: () => request(scoped("/envio-automatico")),
  iniciarEnvioAutomatico: (tipo, items) =>
    request(scoped("/envio-automatico"), { method: "POST", body: JSON.stringify({ tipo, items }) }),
  accionEnvioAutomatico: (accion) =>
    request(scoped(`/envio-automatico/${accion}`), { method: "POST" }),

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
// Salir avisa al servidor, que invalida el token ahí mismo: si alguien lo
// hubiera copiado, deja de servirle. Si la llamada falla, igual se sale.
export function clearToken() {
  const token = getToken();
  if (token) {
    fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      keepalive: true,
    }).catch(() => {});
  }
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
