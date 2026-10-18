import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { firmarToken, requiereAdmin } from "../auth.js";
import { capturar } from "../errores.js";
import { clienteIp, limitador, texto } from "../seguridad.js";

export const authRouter = Router();

// Hash de relleno: si el usuario no existe se compara igual contra algo, para
// que la respuesta tarde lo mismo y no delate qué usuarios existen.
const HASH_FALSO = bcrypt.hashSync("sivu-usuario-inexistente", 10);

// Freno a la fuerza bruta: por IP (en index.js) y, además, por usuario, para
// que repartir los intentos entre muchas IPs (credential stuffing) tampoco
// sirva. Solo cuentan los intentos fallidos.
const limitePorUsuario = limitador({
  ventanaMs: 15 * 60 * 1000,
  maximo: 5,
  soloFallos: true,
  clave: (req) => (typeof req.body?.usuario === "string" ? `u:${req.body.usuario.toLowerCase().slice(0, 60)}` : null),
  mensaje: "Demasiados intentos con este usuario. Espera 15 minutos e inténtalo de nuevo.",
});

authRouter.post(
  "/login",
  limitePorUsuario,
  capturar(async (req, res) => {
    const usuario = texto(req.body?.usuario, 60);
    const password = texto(req.body?.password, 200);
    if (!usuario || !password) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }
    const { rows } = await pool.query(
      `SELECT u.usuario, u.password_hash, u.sesion_version,
              i.id, i.slug, i.nombre, i.tipo_evento
       FROM admin_usuarios u LEFT JOIN invitaciones i ON i.id = u.invitacion_id
       WHERE u.usuario = $1`,
      [usuario]
    );
    // Misma respuesta y mismo tiempo exista o no el usuario.
    const ok = await bcrypt.compare(password, rows[0]?.password_hash || HASH_FALSO);
    if (!rows.length || !ok) {
      console.warn(`Login fallido para "${usuario.slice(0, 60)}" desde ${clienteIp(req)}`);
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    // Un cliente entra directo a su evento: el panel se salta "Tus eventos".
    const r = rows[0];
    const invitacion = r.id
      ? { id: r.id, slug: r.slug, nombre: r.nombre, tipo_evento: r.tipo_evento }
      : null;
    res.json({ token: firmarToken(r.usuario, r.sesion_version), invitacion });
  })
);

// Cerrar sesión de verdad: sube la versión de sesión del usuario y con eso
// todos sus tokens (en este y en cualquier otro dispositivo) dejan de valer.
authRouter.post(
  "/logout",
  requiereAdmin,
  capturar(async (req, res) => {
    await pool.query("UPDATE admin_usuarios SET sesion_version = sesion_version + 1 WHERE usuario = $1", [
      req.admin.usuario,
    ]);
    res.json({ ok: true });
  })
);

// Quién soy: permite al panel comprobar la sesión sin pedir datos de más.
authRouter.get("/yo", requiereAdmin, (req, res) => {
  res.json({ usuario: req.admin.usuario, invitacionId: req.admin.invitacionId });
});
