// Aplica el tema devuelto por el panel de administración como variables
// CSS en el documento. Como tailwind.config.js define los colores del
// sitio en función de estas variables, todo (bg-gold, text-gold-dark,
// etc.) cambia de color al vuelo, sin recompilar nada.

// El panel guarda los colores en hex, pero las variables tienen que llevar
// los canales sueltos ("184 146 74"): así Tailwind puede componer
// "rgb(var(--color-gold) / 0.4)" y funcionan los modificadores de opacidad.
function aCanales(valor) {
  const v = String(valor).trim();

  // Ya viene en canales ("184 146 74" o "184, 146, 74").
  if (/^\d{1,3}[\s,]+\d{1,3}[\s,]+\d{1,3}$/.test(v)) return v.replace(/,/g, " ").replace(/\s+/g, " ");

  const hex = v.replace(/^#/, "");
  const completo =
    hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex.length === 6 ? hex : null;
  if (!completo || !/^[0-9a-f]{6}$/i.test(completo)) return null;

  const n = parseInt(completo, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function applyTema(tema = {}) {
  Object.entries(tema).forEach(([clave, valor]) => {
    if (!clave.startsWith("color-") || !valor) return;
    const canales = aCanales(valor);
    // Un color que no se entiende se ignora: mejor dejar el de por defecto
    // que escribir basura en la variable y romper toda la paleta.
    if (canales) document.documentElement.style.setProperty(`--${clave}`, canales);
  });
}
