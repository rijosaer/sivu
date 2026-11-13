// Los últimos eventos abiertos, para saltar a ellos desde el menú sin pasar
// por la lista. Se guardan en este navegador: es un atajo, no un dato.
const CLAVE = "sivu-eventos-recientes";
const MAX = 4;

export function leerRecientes() {
  try {
    const x = JSON.parse(localStorage.getItem(CLAVE) || "[]");
    return Array.isArray(x) ? x : [];
  } catch {
    return [];
  }
}

// `evento` trae al menos id y nombre; `colores` son los de su invitación
// ({ fondo, acento, texto }) para pintar el círculo del menú colapsado.
export function recordarEvento(evento, extra = {}) {
  if (!evento?.id) return;
  const actual = leerRecientes().filter((e) => String(e.id) !== String(evento.id));
  const nuevo = {
    id: String(evento.id),
    nombre: evento.nombre,
    fecha: extra.fecha ?? evento.fecha_evento ?? null,
    etapa: extra.etapa ?? null,
    colores: extra.colores ?? leerRecientes().find((e) => String(e.id) === String(evento.id))?.colores ?? null,
  };
  try {
    localStorage.setItem(CLAVE, JSON.stringify([nuevo, ...actual].slice(0, MAX)));
    window.dispatchEvent(new Event("sivu-recientes"));
  } catch {
    /* sin almacenamiento: el menú simplemente no muestra recientes */
  }
}

export function olvidarEvento(id) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(leerRecientes().filter((e) => String(e.id) !== String(id))));
    window.dispatchEvent(new Event("sivu-recientes"));
  } catch {
    /* nada */
  }
}

// Iniciales para el círculo del menú colapsado: «Boda Maite & Ricardo» → «MR».
export function iniciales(nombre = "") {
  const limpio = nombre.replace(/^(boda|xv|quince|bautizo|cumpleaños|grado|baby shower|primera comunión|confirmación)\s+(de\s+)?/i, "");
  const palabras = limpio.split(/[\s&y]+/i).filter((p) => p.length > 1 && /^[A-ZÁÉÍÓÚÑ]/i.test(p));
  return (palabras.slice(0, 2).map((p) => p[0]).join("") || nombre.slice(0, 2)).toUpperCase();
}
