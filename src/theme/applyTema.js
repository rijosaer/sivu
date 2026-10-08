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

// Letras del tema (fuente-guion, fuente-titulos, fuente-cuerpo): se publican
// como --fuente-* para los diseños que las leen (Moños y perlas, Coquette),
// que traen su propia letra como respaldo. Si el cliente elige otra familia,
// se carga de Google Fonts; si la familia no tiene esos pesos, se pide solo
// la regular.
function cargarFuente(familia) {
  const id = `fuente-${familia.replace(/\W+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) return;
  const nombre = encodeURIComponent(familia).replace(/%20/g, "+");
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${nombre}:wght@400;500;600;700&display=swap`;
  link.onerror = () => { link.onerror = null; link.href = `https://fonts.googleapis.com/css2?family=${nombre}&display=swap`; };
  document.head.appendChild(link);
}

export function applyTema(tema = {}) {
  Object.entries(tema).forEach(([clave, valor]) => {
    if (clave.startsWith("fuente-") && typeof valor === "string" && /^[\w -]+$/.test(valor.trim())) {
      document.documentElement.style.setProperty(`--${clave}`, `"${valor.trim()}"`);
      cargarFuente(valor.trim());
      return;
    }
    if (!clave.startsWith("color-") || !valor) return;
    const canales = aCanales(valor);
    // Un color que no se entiende se ignora: mejor dejar el de por defecto
    // que escribir basura en la variable y romper toda la paleta.
    if (canales) document.documentElement.style.setProperty(`--${clave}`, canales);
  });
}
