// Datos comerciales de la landing de Convite. Cambiar aquí y redesplegar el sitio.
// VITE_WHATSAPP (variable del servicio en Railway) manda; si no está, se usa este número.
export const WHATSAPP = import.meta.env.VITE_WHATSAPP || "573236019372";
export const PRECIOS = { general: "150.000", personalizada: "200.000", gestion: "250.000" };

export function waLink(texto) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
}

// La landing se muestra en la raíz del dominio cuando la URL no trae nada de
// una invitación: cualquier tramo de ruta (el slug del evento) o cualquier
// ?i=, ?editor=, ?anuncio=, ?servidores= o ?portada= va a la invitación.
// (La raíz con ?i=CODIGO sigue abriendo la boda de Maite y Ricardo por los
// enlaces ya repartidos: ver DEFAULT_SLUG en App.jsx.)
export function mostrarLanding() {
  const { pathname, search } = window.location;
  if (pathname.split("/").filter(Boolean).length > 0) return false;
  const q = new URLSearchParams(search);
  return !["i", "editor", "anuncio", "servidores", "portada"].some((k) => q.has(k));
}
