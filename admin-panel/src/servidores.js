// El trozo de URL de cada servidor sale de su nombre: "Omar Adrián Luján" da
// "omar-adrian-lujan". Tiene que dar exactamente lo mismo que "comoEnlace" en
// src/components/Servidores.jsx del sitio — son dos aplicaciones distintas y no
// comparten código, así que si una cambia hay que cambiar la otra: el panel
// repartiría enlaces que no abren la tarjeta de nadie.
export function comoEnlace(nombre) {
  return String(nombre || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // sin tildes: la URL queda limpia
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Lo que el sitio entiende como "la primera de la lista". Sirve para la vista
// previa del panel: si apuntara al enlace de alguien concreto, cambiarle el
// nombre mientras se escribe rompería la coincidencia y la previa saltaría a
// la tarjeta común a media palabra. El asterisco no puede chocar con ningún
// nombre porque los enlaces solo llevan letras, números y guiones.
export const PRIMERA = "*";
