import jwt from "jsonwebtoken";
import { createHmac } from "node:crypto";
import "dotenv/config";
import { pool } from "./db.js";

const enProduccion = process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT);
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

// Secretos derivados para otros usos (firmar URLs de archivos, etc.): así un
// valor filtrado de un uso no sirve para falsificar el otro.
export function secretoFirma(uso) {
  return createHmac("sha256", SECRET).update(`sivu:${uso}`).digest();
}

const ALGORITMO = "HS256";
const DURACION = "12h";
const EMISOR = "api.heysivu.com";

// "v" es la versión de sesión del usuario: subirla en la base (al cerrar
// sesión o cambiar la contraseña) invalida en el acto todos sus tokens.
export function firmarToken(usuario, version = 0) {
  return jwt.sign({ usuario, v: version }, SECRET, {
    algorithm: ALGORITMO,
    expiresIn: DURACION,
    issuer: EMISOR,
  });
}

// El token solo dice quién es; a qué evento tiene acceso se lee de la base en
// cada petición. Así, quitarle el acceso a un cliente (o borrar su usuario)
// surte efecto de inmediato, sin esperar a que venza el token.
export async function requiereAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const m = /^Bearer ([A-Za-z0-9._-]{20,2048})$/.exec(header);
  if (!m) return res.status(401).json({ error: "No autenticado" });
  let datos;
  try {
    // Algoritmo fijado: no se acepta "none" ni ningún otro que diga el token.
    datos = jwt.verify(m[1], SECRET, { algorithms: [ALGORITMO], issuer: EMISOR });
  } catch {
    return res.status(401).json({ error: "Sesión inválida o expirada" });
  }
  if (typeof datos?.usuario !== "string") return res.status(401).json({ error: "Sesión inválida o expirada" });
  try {
    const { rows } = await pool.query(
      "SELECT usuario, invitacion_id, sesion_version FROM admin_usuarios WHERE usuario = $1",
      [datos.usuario]
    );
    if (!rows.length || rows[0].sesion_version !== (datos.v ?? -1)) {
      return res.status(401).json({ error: "Sesión inválida o expirada" });
    }
    // invitacionId null = dueño del sistema; un número = cliente de ese evento.
    req.admin = { usuario: rows[0].usuario, invitacionId: rows[0].invitacion_id };
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
