// Express 4 no captura los rechazos de promesa de un handler async: si una
// consulta falla, el error queda como "unhandled rejection" y Node termina el
// proceso entero. Estas piezas evitan eso y dejan todas las respuestas de
// error iguales: JSON corto, sin trazas, rutas internas ni versiones.

// Envuelve un handler async y le pasa cualquier error a manejadorDeErrores.
export const capturar = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

// Ruta que no existe.
export function noEncontrado(_req, res) {
  res.status(404).json({ error: "No encontrado" });
}

// Último middleware de la app: registra el error completo (solo en el
// servidor) y responde con JSON genérico.
// Los 4 parámetros son obligatorios — así es como Express reconoce que este
// middleware maneja errores.
export function manejadorDeErrores(err, req, res, next) {
  // Si ya se empezó a enviar la respuesta, solo Express puede cerrarla bien.
  if (res.headersSent) return next(err);
  // Un cuerpo JSON mal formado es culpa de quien llama, no del servidor: 400,
  // no 500. Sin esto, mandar basura devolvía un "error interno" engañoso.
  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ error: "El cuerpo de la petición no es válido" });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "La petición es demasiado grande" });
  }
  if (err.type === "encoding.unsupported" || err.type === "charset.unsupported") {
    return res.status(415).json({ error: "Formato de petición no admitido" });
  }
  // Valores que Postgres rechaza por forma (texto donde va un número, fecha
  // imposible, demasiado largo): es un dato malo del cliente, no una caída.
  if (["22P02", "22007", "22008", "22001", "22003"].includes(err.code)) {
    return res.status(400).json({ error: "Algún dato no tiene el formato correcto" });
  }
  console.error(`Error en ${req.method} ${req.path}:`, err);
  res.status(500).json({ error: "Error interno del servidor" });
}
