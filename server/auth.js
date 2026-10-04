import jwt from "jsonwebtoken";
import "dotenv/config";
import { pool } from "./db.js";

const SECRET = process.env.JWT_SECRET || "cambia-este-secreto-en-produccion";

export function firmarToken(usuario) {
  return jwt.sign({ usuario }, SECRET, { expiresIn: "30d" });
}

// El token solo dice quién es; a qué evento tiene acceso se lee de la base en
// cada petición. Así, quitarle el acceso a un cliente (o borrar su usuario)
// surte efecto de inmediato, sin esperar a que venza un token de 30 días.
export async function requiereAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No autenticado" });
  let datos;
  try {
    datos = jwt.verify(token, SECRET);
  } catch {
    return res.status(401).json({ error: "Sesión inválida o expirada" });
  }
  try {
    const { rows } = await pool.query(
      "SELECT usuario, invitacion_id FROM admin_usuarios WHERE usuario = $1",
      [datos.usuario]
    );
    if (!rows.length) return res.status(401).json({ error: "Sesión inválida o expirada" });
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
