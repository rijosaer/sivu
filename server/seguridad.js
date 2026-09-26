// Endurecimiento de la API: cabeceras, CORS con lista blanca y un limitador
// de intentos sencillo. Sin dependencias nuevas a propósito: menos superficie
// de ataque y nada que instalar en el despliegue.

// Cabeceras que convienen a una API que solo devuelve JSON e imágenes.
export function cabecerasSeguras(_req, res, next) {
  // No adivinar el tipo de contenido: evita que un archivo subido se
  // interprete como HTML/JS y se ejecute.
  res.setHeader("X-Content-Type-Options", "nosniff");
  // La API nunca debe mostrarse dentro de un iframe.
  res.setHeader("X-Frame-Options", "DENY");
  // No filtrar la URL completa (que puede llevar el código del invitado) a
  // terceros al hacer clic en un enlace externo.
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Forzar HTTPS durante un año en el navegador.
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  // Las imágenes (fondo, decoraciones) se cargan desde el sitio, que está en
  // otro dominio: hay que permitir el uso entre orígenes explícitamente.
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}

// Orígenes permitidos para CORS. La autenticación va por token en la cabecera
// (no por cookies), así que CORS no es la barrera principal; aun así se cierra
// a lo conocido. Se aceptan los subdominios de Railway del proyecto para que
// no se rompa si se renombra el dominio, más los que se agreguen por variable
// de entorno (para un dominio propio a futuro), más localhost en desarrollo.
export function origenPermitido(origin) {
  if (!origin) return true; // curl, apps móviles, peticiones del propio servidor
  const extra = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (extra.includes(origin)) return true;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "https:" && protocol !== "http:") return false;
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    if (hostname.endsWith(".up.railway.app")) return true;
  } catch {
    return false;
  }
  return false;
}

export const corsOpciones = {
  origin(origin, callback) {
    callback(null, origenPermitido(origin));
  },
};

// IP real del cliente. Detrás del proxy de Railway, req.ip puede resolver a
// una IP interna que cambia entre peticiones, y entonces el limitador nunca
// acumula. La primera entrada de X-Forwarded-For es el cliente original, que
// sí es estable. Un atacante decidido podría falsificar esa cabecera, pero eso
// solo evade el freno de fuerza bruta, no rompe la contraseña (fuerte) que hay
// detrás; contra scripts ingenuos, que es lo común, funciona.
export function clienteIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return String(xff).split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || "desconocida";
}

// Limitador de intentos en memoria: una ventana deslizante por clave (IP).
// Suficiente para un sitio de una sola instancia; se reinicia al redesplegar,
// lo cual no es problema para frenar fuerza bruta.
export function limitador({ ventanaMs, maximo, mensaje }) {
  const golpes = new Map(); // clave -> [tiempos]

  // Limpieza periódica para que el Map no crezca sin fin.
  const limpiador = setInterval(() => {
    const corte = Date.now() - ventanaMs;
    for (const [clave, tiempos] of golpes) {
      const vivos = tiempos.filter((t) => t > corte);
      if (vivos.length) golpes.set(clave, vivos);
      else golpes.delete(clave);
    }
  }, ventanaMs);
  limpiador.unref?.();

  return function (req, res, next) {
    const ahora = Date.now();
    const corte = ahora - ventanaMs;
    const clave = clienteIp(req);
    const previos = (golpes.get(clave) || []).filter((t) => t > corte);

    if (previos.length >= maximo) {
      const esperaS = Math.ceil((previos[0] + ventanaMs - ahora) / 1000);
      res.setHeader("Retry-After", String(esperaS));
      return res.status(429).json({ error: mensaje || "Demasiados intentos. Espera un momento." });
    }

    previos.push(ahora);
    golpes.set(clave, previos);
    next();
  };
}
