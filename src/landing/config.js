// Datos comerciales de la landing de Convite. Cambiar aquí y redesplegar el sitio.
// VITE_WHATSAPP (variable del servicio en Railway) manda; si no está, se usa este número.
export const WHATSAPP = import.meta.env.VITE_WHATSAPP || "573236019372";
export const PRECIOS = { general: "150.000", personalizada: "200.000", gestion: "250.000" };

export function waLink(texto) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
}

// La landing se muestra en la raíz de un dominio de Convite cuando la URL no trae nada de una
// invitación. El dominio de la boda de Maite y Ricardo sigue abriendo la boda en la raíz
// (los enlaces ya repartidos no cambian), y cualquier ?i=, ?editor=, ?anuncio=, ?servidores=
// o ?portada= siempre va a la invitación.
export function mostrarLanding() {
  const { hostname, pathname, search } = window.location;
  if (hostname.startsWith("maiteyricardo")) return false;
  if (pathname.split("/").filter(Boolean).length > 0) return false;
  const q = new URLSearchParams(search);
  return !["i", "editor", "anuncio", "servidores", "portada"].some((k) => q.has(k));
}
