export function archivoADataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Las fotos que salen de un celular pesan varios MB y tienen mucha más
// resolución de la que necesita la invitación. Se reducen aquí, en el
// navegador, antes de subirlas: la base de datos queda liviana y los
// invitados cargan el sitio mucho más rápido con datos móviles.
export function comprimirImagen(file, ladoMaximo = 1600, calidad = 0.82) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const escala = Math.min(1, ladoMaximo / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/webp", calidad));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

// Las decoraciones necesitan conservar la transparencia y suelen ser chicas,
// así que se reducen menos. WebP también guarda transparencia y pesa una
// fracción de lo que pesa el PNG: la misma cenefa son 324 KB en PNG y 57 en
// WebP, y eso lo baja cada invitado que abre la invitación.
export function comprimirDecoracion(file, ladoMaximo = 1000, calidad = 0.88) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const escala = Math.min(1, ladoMaximo / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      // Si el navegador no sabe codificar WebP devuelve un PNG sin avisar, y
      // ahí el resultado no empieza por "data:image/webp".
      const webp = canvas.toDataURL("image/webp", calidad);
      resolve(webp.startsWith("data:image/webp") ? webp : canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

export function pesoLegible(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
