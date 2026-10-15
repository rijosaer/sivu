// Limitador de peticiones en memoria por clave (IP o usuario). Suficiente para
// una sola instancia; se reinicia al redesplegar.
export function clienteIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return String(xff).split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || "desconocida";
}

export function limitador({ ventanaMs, maximo, mensaje, clave = clienteIp }) {
  const golpes = new Map();
  setInterval(() => {
    const corte = Date.now() - ventanaMs;
    for (const [k, tiempos] of golpes) {
      const vivos = tiempos.filter((t) => t > corte);
      if (vivos.length) golpes.set(k, vivos);
      else golpes.delete(k);
    }
  }, ventanaMs).unref();

  return function (req, res, next) {
    const ahora = Date.now();
    const k = clave(req);
    const previos = (golpes.get(k) || []).filter((t) => t > ahora - ventanaMs);
    if (previos.length >= maximo) {
      res.setHeader("Retry-After", String(Math.ceil((previos[0] + ventanaMs - ahora) / 1000)));
      return res.status(429).json({ error: mensaje || "Demasiadas solicitudes. Espera un momento." });
    }
    previos.push(ahora);
    golpes.set(k, previos);
    next();
  };
}

export function cabecerasSeguras(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
}
