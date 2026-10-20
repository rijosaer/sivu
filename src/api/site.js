export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// El servidor devuelve rutas relativas ("/api/public/medio/3") para que no
// dependan del dominio; aquí se completan con la URL del backend.
function absoluta(ruta) {
  return ruta ? `${API_URL}${ruta}` : ruta;
}

// Todo lo público cuelga de la invitación a la que pertenece el enlace
// (multi-invitación: el sistema aloja muchos eventos, no solo uno). "slug"
// identifica cuál — ver useInvitacionSlug() en App.jsx.
function base(slug) {
  return `${API_URL}/api/public/invitaciones/${encodeURIComponent(slug)}`;
}

// Un evento «solo con enlace personal» únicamente se abre con el código del
// invitado (?i=) o, en la vista previa del panel, con su token (?vista=).
export async function getSite(slug, { codigo = "", vista = "" } = {}) {
  const params = new URLSearchParams();
  if (codigo) params.set("i", codigo);
  if (vista) params.set("vista", vista);
  const qs = params.toString();
  const res = await fetch(`${base(slug)}/site${qs ? `?${qs}` : ""}`);
  if (res.status === 404) throw new Error("Invitación no encontrada");
  if (!res.ok) throw new Error("No se pudo cargar el sitio");
  const site = await res.json();

  return {
    ...site,
    decoraciones: Object.fromEntries(
      Object.entries(site.decoraciones || {}).map(([clave, ruta]) => [clave, absoluta(ruta)])
    ),
    fotosSubidas: (site.fotosSubidas || []).map(absoluta),
    audioUrl: absoluta(site.audioUrl),
    fondoUrl: absoluta(site.fondoUrl),
  };
}

export async function getInvitado(slug, codigo) {
  const res = await fetch(`${base(slug)}/invitado/${encodeURIComponent(codigo)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("No se pudo cargar la invitación");
  return res.json();
}

// Avisa al servidor que se abrió esta invitación. Silencioso: si falla, no
// pasa nada (es solo para las estadísticas del panel).
export async function registrarApertura(slug, codigo) {
  try {
    await fetch(`${base(slug)}/visto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo }),
      keepalive: true,
    });
  } catch {
    // sin ruido: la apertura es un extra, no debe afectar la carga
  }
}

// respuestas: [{ id, estado, restriccion, comentario }] — una por persona.
// acompanantes: [{ nombre, restriccion }] — solo en invitaciones por cupos,
// donde los nombres los escribe el propio invitado al confirmar.
export async function submitRSVP(slug, codigo, respuestas, acompanantes) {
  const res = await fetch(`${base(slug)}/rsvp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ codigo, respuestas, ...(acompanantes ? { acompanantes } : {}) }),
  });
  if (!res.ok) {
    // El servidor explica el motivo (por ejemplo, que el plazo ya venció);
    // se conserva para poder mostrárselo al invitado tal cual.
    const cuerpo = await res.json().catch(() => ({}));
    throw new Error(cuerpo.error || "No se pudo enviar la confirmación");
  }
  return res.json();
}
