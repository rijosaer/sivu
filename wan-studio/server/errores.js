// Express 4 no captura los rechazos de un handler async: sin esto, un error en
// una consulta termina el proceso entero.
export const capturar = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

// Error con código HTTP para responderle a quien llama (400, 402, 404…).
export class ErrorApi extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

export function manejadorDeErrores(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err instanceof ErrorApi) return res.status(err.status).json({ error: err.message });
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "La petición es demasiado grande" });
  }
  if (err.type === "entity.parse.failed" || err instanceof SyntaxError) {
    return res.status(400).json({ error: "El cuerpo de la petición no es JSON válido" });
  }
  console.error(`Error en ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json({ error: "Error interno del servidor" });
}
