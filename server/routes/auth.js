import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { firmarToken } from "../auth.js";
import { capturar } from "../errores.js";

export const authRouter = Router();

authRouter.post(
  "/login",
  capturar(async (req, res) => {
    const { usuario, password } = req.body;
    const { rows } = await pool.query(
      `SELECT u.usuario, u.password_hash,
              i.id, i.slug, i.nombre, i.tipo_evento
       FROM admin_usuarios u LEFT JOIN invitaciones i ON i.id = u.invitacion_id
       WHERE u.usuario = $1`,
      [usuario]
    );
    if (!rows.length) return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

    const ok = bcrypt.compareSync(password || "", rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

    // Un cliente entra directo a su evento: el panel se salta "Tus eventos".
    const r = rows[0];
    const invitacion = r.id
      ? { id: r.id, slug: r.slug, nombre: r.nombre, tipo_evento: r.tipo_evento }
      : null;
    res.json({ token: firmarToken(usuario), invitacion });
  })
);
