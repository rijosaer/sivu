import jwt from "jsonwebtoken";
import { createHmac, timingSafeEqual } from "node:crypto";
import "dotenv/config";
import { pool } from "./db.js";
import { enProduccion, origenPanel } from "./seguridad.js";

const SECRETO_DEFECTO = "cambia-este-secreto-en-produccion";
const SECRET = process.env.JWT_SECRET || SECRETO_DEFECTO;

// Con el secreto de ejemplo (público en este repositorio) cualquiera podría
// fabricarse un token de dueño. En producción eso no arranca.
if (enProduccion && SECRET === SECRETO_DEFECTO) {
  console.error("JWT_SECRET no está configurado. El servidor no arranca con el secreto de ejemplo.");
  process.exit(1);
}
if (SECRET.length < 32) {
  console.warn("Aviso: JWT_SECRET es corto. Usa al menos 32 caracteres aleatorios (openssl rand -base64 48).");
}

// Secretos derivados para otros usos (firmar URLs de archivos, CSRF...): así
// un valor filtrado de un uso no sirve para falsificar el otro.
export function secretoFirma(uso) {
  return createHmac("sha256", SECRET).update(`sivu:${uso}`).digest();
}

const ALGORITMO = "HS256";
const DURACION_S = 12 * 60 * 60;
const EMISOR = "api.heysivu.com";

// ---------- La sesión vive en una cookie que JavaScript no puede leer ----------
// HttpOnly: ni un XSS en el panel puede llevarse el token. Secure: solo por
// HTTPS. SameSite=Strict: el navegador no la manda en peticiones que nazcan en
// otro sitio (CSRF desde páginas ajenas). El prefijo __Host- obliga a que sea
// del dominio exacto de la API (sin Domain=) y con Path=/, así ningún otro
// subdominio puede pisarla. En desarrollo (http://localhost) no puede llevar
// Secure, así que se usa un nombre sin prefijo.
export const COOKIE_SESION = enProduccion ? "__Host-sivu_sesion" : "sivu_sesion";

function atributosCookie(maxAge) {
  return ["Path=/", "HttpOnly", "SameSite=Strict", `Max-Age=${maxAge}`, ...(enProduccion ? ["Secure"] : [])].join("; ");
}

export function ponerCookieSesion(res, token) {
  res.append("Set-Cookie", `${COOKIE_SESION}=${token}; ${atributosCookie(DURACION_S)}`);
}

export function borrarCookieSesion(res) {
  res.append("Set-Cookie", `${COOKIE_SESION}=; ${atributosCookie(0)}`);
}

function leerCookie(req, nombre) {
  for (const parte of String(req.headers.cookie || "").split(";")) {
    const i = parte.indexOf("=");
    if (i > 0 && parte.slice(0, i).trim() === nombre) return parte.slice(i + 1).trim();
  }
  return "";
}

// "v" es la versión de sesión del usuario: subirla en la base (al cerrar
// sesión o cambiar la contraseña) invalida en el acto todos sus tokens.
export function firmarToken(usuario, version = 0) {
  return jwt.sign({ usuario, v: version }, SECRET, {
    algorithm: ALGORITMO,
    expiresIn: DURACION_S,
    issuer: EMISOR,
  });
}

// Token CSRF: derivado de la sesión concreta (usuario, versión, emisión). El
// panel lo recibe en el cuerpo del login (o de /api/auth/yo) y lo manda en la
// cabecera X-CSRF-Token. Una página ajena no puede leerlo (CORS) ni adivinarlo,
// y cambia con cada inicio de sesión.
export function csrfDe(datos) {
  return createHmac("sha256", secretoFirma("csrf"))
    .update(`${datos.usuario}:${datos.v}:${datos.iat}`)
    .digest("base64url");
}

function iguales(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}

// Lee y valida el token de la cookie. null si no hay o no sirve.
export function leerSesion(req) {
  const token = leerCookie(req, COOKIE_SESION);
  if (!/^[A-Za-z0-9._-]{20,2048}$/.test(token)) return null;
  try {
    // Algoritmo fijado: no se acepta "none" ni ningún otro que diga el token.
    const datos = jwt.verify(token, SECRET, { algorithms: [ALGORITMO], issuer: EMISOR });
    return typeof datos?.usuario === "string" ? datos : null;
  } catch {
    return null;
  }
}

const SEGUROS = new Set(["GET", "HEAD", "OPTIONS"]);

// Defensa CSRF en dos capas, además de SameSite=Strict (que no protege entre
// subdominios del mismo sitio, como heysivu.com → api.heysivu.com):
//  1. Si el navegador dice de dónde viene la petición (Origin), tiene que ser
//     el panel. En lo que cambia datos, Origin es obligatorio.
//  2. Lo que cambia datos lleva además X-CSRF-Token, ligado a esta sesión.
export function verificarOrigen(req, datos) {
  const origin = req.headers.origin;
  if (origin && !origenPanel(origin)) return false;
  if (SEGUROS.has(req.method)) return true;
  if (!origin) return false;
  return Boolean(datos) && iguales(req.headers["x-csrf-token"] || "", csrfDe(datos));
}

// El token solo dice quién es; a qué evento tiene acceso se lee de la base en
// cada petición. Así, quitarle el acceso a un cliente (o borrar su usuario)
// surte efecto de inmediato, sin esperar a que venza el token.
export async function requiereAdmin(req, res, next) {
  const datos = leerSesion(req);
  if (!datos) return res.status(401).json({ error: "No autenticado" });
  if (!verificarOrigen(req, datos)) {
    return res.status(403).json({ error: "Solicitud rechazada. Recarga el panel e inténtalo de nuevo." });
  }
  try {
    const { rows } = await pool.query(
      "SELECT usuario, invitacion_id, sesion_version FROM admin_usuarios WHERE usuario = $1",
      [datos.usuario]
    );
    if (!rows.length || rows[0].sesion_version !== (datos.v ?? -1)) {
      borrarCookieSesion(res);
      return res.status(401).json({ error: "Sesión inválida o expirada" });
    }
    // invitacionId null = dueño del sistema; un número = cliente de ese evento.
    req.admin = { usuario: rows[0].usuario, invitacionId: rows[0].invitacion_id };
    req.sesion = datos;
    next();
  } catch (e) {
    next(e);
  }
}

// Crear, editar o borrar eventos es solo del dueño: un cliente administra
// lo de adentro de su evento (invitados, contenido, colores), no el evento.
export function soloDueno(req, res, next) {
  if (req.admin?.invitacionId) {
    return res.status(403).json({ error: "Tu usuario no puede administrar eventos" });
  }
  next();
}
