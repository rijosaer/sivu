export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// El servidor devuelve rutas relativas ("/api/public/medio/3") para que no
// dependan del dominio; aquí se completan con la URL del backend.
function absoluta(ruta) {
  return ruta ? `${API_URL}${ruta}` : ruta;
}

export async function getSite() {
  const res = await fetch(`${API_URL}/api/public/site`);
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

export async function getInvitado(codigo) {
  const res = await fetch(`${API_URL}/api/public/invitado/${encodeURIComponent(codigo)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("No se pudo cargar la invitación");
  return res.json();
}

// Avisa al servidor que se abrió esta invitación. Silencioso: si falla, no
// pasa nada (es solo para las estadísticas del panel).
export async function registrarApertura(codigo) {
  try {
    await fetch(`${API_URL}/api/public/visto`, {
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
export async function submitRSVP(codigo, respuestas, acompanantes) {
  const res = await fetch(`${API_URL}/api/public/rsvp`, {
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
