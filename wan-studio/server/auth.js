// Dos formas de identificarse, ambas con "Authorization: Bearer ...":
//  - La web usa un JWT que obtiene al iniciar sesión.
//  - La API pública usa llaves "ws_..." creadas desde la web.
// Las dos terminan en req.usuario = { id, email, creditos, es_admin, ilimitado }.
import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { pool } from "./db.js";

export const PREFIJO_LLAVE = "ws_";

const secreto = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("Falta JWT_SECRET en el entorno");
  return s;
};

export const firmarToken = (usuario) =>
  jwt.sign({ sub: usuario.id }, secreto(), { expiresIn: "30d" });

export const hashLlave = (llave) => createHash("sha256").update(llave).digest("hex");

export function nuevaLlave() {
  const llave = PREFIJO_LLAVE + randomBytes(24).toString("base64url");
  return { llave, prefijo: llave.slice(0, 10), hash: hashLlave(llave) };
}

async function usuarioPorLlave(llave) {
  const { rows } = await pool.query(
    `UPDATE api_llaves SET ultimo_uso = now()
      WHERE hash = $1 AND revocada_en IS NULL
      RETURNING usuario_id`,
    [hashLlave(llave)]
  );
  return rows[0] ? usuarioPorId(rows[0].usuario_id) : null;
}

async function usuarioPorId(id) {
  const { rows } = await pool.query(
    "SELECT id, email, creditos, es_admin FROM usuarios WHERE id = $1",
    [id]
  );
  return rows[0] ? conPermisos(rows[0]) : null;
}

// Administradores: la primera cuenta registrada y los correos de ADMIN_EMAILS
// (separados por comas). No gastan créditos ni tienen límites de uso.
export function conPermisos(u) {
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const es_admin = u.es_admin || admins.includes(u.email);
  return { id: u.id, email: u.email, creditos: u.creditos, es_admin, ilimitado: es_admin };
}

// soloSesion: rutas que una llave de API no debe tocar (p. ej. crear llaves).
export const requiereUsuario = ({ soloSesion = false } = {}) =>
  async function (req, res, next) {
    try {
      const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
      if (!token) return res.status(401).json({ error: "Falta el encabezado Authorization: Bearer" });

      let usuario = null;
      if (token.startsWith(PREFIJO_LLAVE)) {
        if (soloSesion) return res.status(403).json({ error: "Esta ruta requiere iniciar sesión en la web" });
        usuario = await usuarioPorLlave(token);
      } else {
        try {
          const { sub } = jwt.verify(token, secreto());
          usuario = await usuarioPorId(sub);
        } catch {
          usuario = null;
        }
      }
      if (!usuario) return res.status(401).json({ error: "Credenciales inválidas o vencidas" });
      req.usuario = usuario;
      next();
    } catch (e) {
      next(e);
    }
  };
