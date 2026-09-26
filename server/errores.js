// Express 4 no captura los rechazos de promesa de un handler async: si una
// consulta falla, el error queda como "unhandled rejection" y Node termina el
// proceso entero. Estas dos piezas evitan eso.

// Envuelve un handler async y le pasa cualquier error a manejadorDeErrores.
export const capturar = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

// Último middleware de la app: registra el error y responde con JSON.
// Los 4 parámetros son obligatorios — así es como Express reconoce que este
// middleware maneja errores.
export function manejadorDeErrores(err, req, res, next) {
  console.error(`Error en ${req.method} ${req.originalUrl}:`, err);
  // Si ya se empezó a enviar la respuesta, solo Express puede cerrarla bien.
  if (res.headersSent) return next(err);
  // Un cuerpo JSON mal formado es culpa de quien llama, no del servidor: 400,
  // no 500. Sin esto, mandar basura devolvía un "error interno" engañoso.
  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ error: "El cuerpo de la petición no es válido" });
  }
  res.status(500).json({ error: "Error interno del servidor" });
}
