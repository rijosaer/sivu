// Las mismas letras de la landing (Fraunces, Work Sans y Alex Brush).
export function cargarFuentes() {
  if (document.getElementById("sv-fuentes")) return;
  const link = document.createElement("link");
  link.id = "sv-fuentes";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Alex+Brush&family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=Work+Sans:wght@400;500;600;700&display=swap";
  document.head.appendChild(link);
}
