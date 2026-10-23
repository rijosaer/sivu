// Endurecimiento de la API: cabeceras, CORS con lista blanca, IP real del
// cliente, limitador de intentos y validaciones comunes. Sin dependencias
// nuevas a propósito: menos superficie de ataque y nada que instalar en el
// despliegue.

export const enProduccion =
  process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT);

// Cabeceras que convienen a una API que solo devuelve JSON e imágenes. Nada
// de lo que responde la API se tiene que ejecutar ni mostrar como página, así
// que la política es la más cerrada posible: ningún recurso, ningún iframe,
// y sandbox (sin scripts, sin formularios, origen opaco) por si un navegador
// llegara a abrir una respuesta como documento.
export function cabecerasSeguras(_req, res, next) {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; sandbox"
  );
  // No adivinar el tipo de contenido: evita que un archivo subido se
  // interprete como HTML/JS y se ejecute.
  res.setHeader("X-Content-Type-Options", "nosniff");
  // La API nunca debe mostrarse dentro de un iframe (respaldo de
  // frame-ancestors para navegadores viejos).
  res.setHeader("X-Frame-Options", "DENY");
  // No filtrar la URL completa (que puede llevar el código del invitado).
  res.setHeader("Referrer-Policy", "no-referrer");
  // Forzar HTTPS durante dos años, también en los subdominios.
  res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  // Las imágenes (fondo, decoraciones) se cargan desde el sitio, que está en
  // otro dominio: hay que permitir el uso entre orígenes explícitamente.
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
  // Por defecto nada se guarda en cachés intermedias (respuestas del panel con
  // datos de invitados). Los archivos públicos lo sobrescriben a propósito.
  res.setHeader("Cache-Control", "no-store");
  next();
}

// Orígenes permitidos para CORS: los dominios de Sivú, los que se agreguen
// por variable de entorno (CORS_ORIGINS, separados por coma) y localhost solo
// en desarrollo. Ya no se acepta cualquier *.up.railway.app: ese comodín
// dejaba entrar a cualquier proyecto de Railway de cualquier persona.
const ORIGENES_BASE = ["https://heysivu.com", "https://www.heysivu.com", "https://panel.heysivu.com"];

const listaEnv = (nombre) =>
  (process.env[nombre] || "")
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean);

function esLocalhost(origin) {
  if (enProduccion) return false;
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function origenPermitido(origin) {
  if (!origin) return true; // curl, monitores, peticiones del propio servidor
  return ORIGENES_BASE.includes(origin) || listaEnv("CORS_ORIGINS").includes(origin) || esLocalhost(origin);
}

// Orígenes del PANEL: los únicos a los que el navegador les manda la cookie de
// sesión con permiso para leer la respuesta (CORS con credenciales). El sitio
// público (heysivu.com) muestra contenido que escriben clientes e invitados,
// así que, aunque esté en el mismo dominio, no cuenta como panel.
// PANEL_ORIGINS suma otros (separados por coma); deben estar bajo heysivu.com,
// porque la cookie es SameSite=Strict y no viaja a otros sitios.
export function origenPanel(origin) {
  if (!origin) return false;
  return origin === "https://panel.heysivu.com" || listaEnv("PANEL_ORIGINS").includes(origin) || esLocalhost(origin);
}

const corsBase = {
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "X-CSRF-Token"],
  maxAge: 600,
};

// Delegado de cors(): credenciales solo para el panel.
export function corsOpciones(req, callback) {
  const origin = req.headers.origin;
  callback(null, { ...corsBase, origin: origenPermitido(origin), credentials: origenPanel(origin) });
}

// Rangos publicados por Cloudflare (https://www.cloudflare.com/ips/). Solo
// cuando la conexión llega desde uno de ellos se le cree la cabecera
// CF-Connecting-IP; si no, cualquiera podría inventársela.
const RANGOS_CLOUDFLARE = [
  "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22",
  "141.101.64.0/18", "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20",
  "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13",
  "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
  "2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32",
  "2405:8100::/32", "2a06:98c0::/29", "2c0f:f248::/32",
];

function ipABigInt(ip) {
  if (ip.includes(":")) {
    let [cabeza, cola = ""] = ip.split("::");
    const a = cabeza ? cabeza.split(":") : [];
    const b = cola ? cola.split(":") : [];
    if (!ip.includes("::") && a.length !== 8) return null;
    const relleno = Array(8 - a.length - b.length).fill("0");
    const grupos = ip.includes("::") ? [...a, ...relleno, ...b] : a;
    if (grupos.length !== 8 || grupos.some((g) => !/^[0-9a-f]{1,4}$/i.test(g))) return null;
    return { v: grupos.reduce((acc, g) => (acc << 16n) + BigInt(parseInt(g, 16)), 0n), bits: 128 };
  }
  const p = ip.split(".");
  if (p.length !== 4 || p.some((x) => !/^\d{1,3}$/.test(x) || Number(x) > 255)) return null;
  return { v: p.reduce((acc, x) => (acc << 8n) + BigInt(Number(x)), 0n), bits: 32 };
}

export function ipEnRango(ip, cidr) {
  const [red, largo] = cidr.split("/");
  const a = ipABigInt(String(ip || "").replace(/^::ffff:/, ""));
  const b = ipABigInt(red);
  if (!a || !b || a.bits !== b.bits) return false;
  const corrimiento = BigInt(b.bits - Number(largo));
  return a.v >> corrimiento === b.v >> corrimiento;
}

export const esIpCloudflare = (ip) => RANGOS_CLOUDFLARE.some((r) => ipEnRango(ip, r));

// IP real del cliente. El borde de Railway pone en X-Real-IP la IP que le
// abrió la conexión (eso no lo controla el cliente). Si esa IP es de
// Cloudflare, el cliente real viene en CF-Connecting-IP. Antes se usaba la
// primera entrada de X-Forwarded-For, que la escribe el propio cliente: bastaba
// con mandar una distinta en cada petición para saltarse todos los límites.
export function clienteIp(req) {
  const borde = String(req.headers["x-real-ip"] || req.socket?.remoteAddress || "").trim();
  const cf = String(req.headers["cf-connecting-ip"] || "").trim();
  if (cf && esIpCloudflare(borde)) return cf;
  return borde || "desconocida";
}

// Opcional (SOLO_CLOUDFLARE=1): rechaza lo que no pase por Cloudflare. Así
// nadie se salta el WAF y las reglas de borde llamando a Railway directo.
export function soloDesdeCloudflare(req, res, next) {
  if (process.env.SOLO_CLOUDFLARE !== "1") return next();
  const borde = String(req.headers["x-real-ip"] || req.socket?.remoteAddress || "");
  if (esIpCloudflare(borde)) return next();
  return res.status(403).json({ error: "Acceso no permitido" });
}

// Limitador de intentos en memoria: una ventana deslizante por clave (IP por
// defecto). Suficiente para un sitio de una sola instancia; se reinicia al
// redesplegar, lo cual no es problema para frenar fuerza bruta.
// - clave(req): de qué se cuentan los golpes (IP, usuario, IP+slug...).
// - soloFallos: cuenta solo las respuestas >= 400 (p. ej. códigos que no
//   existen), para no castigar a quien usa el sitio normalmente.
export function limitador({ ventanaMs, maximo, mensaje, clave = clienteIp, soloFallos = false }) {
  const golpes = new Map(); // clave -> [tiempos]
  const TOPE_CLAVES = 50_000; // que un barrido de IPs no llene la memoria

  const limpiador = setInterval(() => {
    const corte = Date.now() - ventanaMs;
    for (const [k, tiempos] of golpes) {
      const vivos = tiempos.filter((t) => t > corte);
      if (vivos.length) golpes.set(k, vivos);
      else golpes.delete(k);
    }
  }, Math.min(ventanaMs, 60_000));
  limpiador.unref?.();

  const anotar = (k, ahora) => {
    if (!golpes.has(k) && golpes.size >= TOPE_CLAVES) golpes.delete(golpes.keys().next().value);
    const lista = golpes.get(k) || [];
    lista.push(ahora);
    golpes.set(k, lista);
  };

  return function (req, res, next) {
    const ahora = Date.now();
    const corte = ahora - ventanaMs;
    const k = clave(req);
    if (k == null) return next();
    const previos = (golpes.get(k) || []).filter((t) => t > corte);
    golpes.set(k, previos);

    if (previos.length >= maximo) {
      const esperaS = Math.max(1, Math.ceil((previos[0] + ventanaMs - ahora) / 1000));
      res.setHeader("Retry-After", String(esperaS));
      return res.status(429).json({ error: mensaje || "Demasiados intentos. Espera un momento." });
    }

    if (soloFallos) {
      res.on("finish", () => {
        if (res.statusCode >= 400) anotar(k, Date.now());
      });
    } else {
      anotar(k, ahora);
    }
    next();
  };
}

// Solo deja pasar los métodos indicados (el resto responde 405).
export function soloMetodos(...metodos) {
  const permitidos = new Set([...metodos, "OPTIONS"]);
  return (req, res, next) => {
    if (permitidos.has(req.method)) return next();
    res.setHeader("Allow", [...permitidos].join(", "));
    return res.status(405).json({ error: "Método no permitido" });
  };
}

// Claves que permiten contaminar prototipos al mezclar objetos. Un cuerpo
// JSON que las traiga, a cualquier profundidad, se rechaza entero.
const CLAVES_PELIGROSAS = new Set(["__proto__", "constructor", "prototype"]);
function tieneClavePeligrosa(valor, profundidad = 0) {
  if (profundidad > 40) return true; // anidamiento absurdo: también se rechaza
  if (!valor || typeof valor !== "object") return false;
  for (const k of Object.keys(valor)) {
    if (CLAVES_PELIGROSAS.has(k)) return true;
    if (tieneClavePeligrosa(valor[k], profundidad + 1)) return true;
  }
  return false;
}

export function cuerpoSeguro(req, res, next) {
  if (req.body !== undefined && tieneClavePeligrosa(req.body)) {
    return res.status(400).json({ error: "El cuerpo de la petición no es válido" });
  }
  next();
}

// ---------- Validadores de parámetros ----------

// Holgado a propósito: tiene que aceptar todo slug que ya exista (el corte a
// 60 caracteres puede dejarlo terminado en guion, y los repetidos llevan
// "-2", "-3"...). Solo descarta lo que nunca podría ser un slug.
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,99}$/;
export const CODIGO_RE = /^[A-Za-z0-9_-]{3,40}$/;
export const CLAVE_RE = /^[a-z0-9_][a-z0-9_-]{0,59}$/;

export const esIdValido = (v) => /^\d{1,10}$/.test(String(v)) && Number(v) > 0 && Number(v) <= 2_147_483_647;

// router.param: valida un parámetro de ruta antes de tocar la base. Un valor
// malformado responde 404 (igual que uno inexistente): no hay nada que ganar
// distinguiendo "mal escrito" de "no existe".
export function validarParam(prueba, mensaje = "No encontrado") {
  return (req, res, next, valor) => {
    if (prueba(valor)) return next();
    return res.status(404).json({ error: mensaje });
  };
}

// Texto opcional con tope de longitud. Devuelve undefined si no vino, null si
// vino algo que no es texto o es demasiado largo (el llamador responde 400).
export function texto(valor, max) {
  if (valor === undefined || valor === null) return undefined;
  if (typeof valor !== "string" && typeof valor !== "number") return null;
  const s = String(valor);
  return s.length > max ? null : s;
}
