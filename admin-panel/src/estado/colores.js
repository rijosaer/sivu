// Colores de cada evento para el panel: la cabecera del evento y su círculo en
// el menú se pintan con los colores de SU invitación, así se sabe en qué
// evento se está sin leer el nombre.

function aRgb(hex) {
  const h = String(hex || "").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

function aHex(rgb) {
  return "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");
}

export function mezclar(a, b, t) {
  const x = aRgb(a);
  const y = aRgb(b);
  if (!x || !y) return a || b;
  return aHex(x.map((v, i) => v + (y[i] - v) * t));
}

// Luminancia relativa (WCAG), de 0 (negro) a 1 (blanco).
export function luminancia(hex) {
  const rgb = aRgb(hex);
  if (!rgb) return 0.5;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Colores por defecto (los de Sivú) si el tema no carga.
const RESPALDO = { "color-gold-dark": "#5C0F27", "color-gold": "#9B1F3E", "color-paper": "#FBF3E4", "color-seal": "#E3A63E" };

// Del tema de la invitación ({clave: valor}) a lo que usa el panel.
export function coloresDelEvento(tema = {}) {
  const c = (k) => (aRgb(tema[k]) ? tema[k] : RESPALDO[k]);
  const oscuro = c("color-gold-dark");
  const medio = mezclar(oscuro, c("color-gold"), 0.55);
  // El texto va claro u oscuro según qué tan clara quede la franja.
  const clara = luminancia(mezclar(oscuro, medio, 0.5)) > 0.42;
  return {
    fondo: oscuro,
    acento: medio,
    papel: c("color-paper"),
    sello: c("color-seal"),
    texto: clara ? "#1C1712" : "#FFFFFF",
    clara,
    franja: `linear-gradient(110deg, ${oscuro} 0%, ${mezclar(oscuro, medio, 0.6)} 55%, ${medio} 100%)`,
  };
}

// Tema como arreglo [{clave, valor}] (lo que devuelve la API) → objeto.
export function temaComoObjeto(tema) {
  if (!Array.isArray(tema)) return tema || {};
  return Object.fromEntries(tema.map((x) => [x.clave, x.valor]));
}
