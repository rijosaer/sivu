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
      "SELECT usuario, password_hash FROM admin_usuarios WHERE usuario = $1",
      [usuario]
    );
    if (!rows.length) return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

    const ok = bcrypt.compareSync(password || "", rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: "Usuario o contraseña incorrectos" });

    res.json({ token: firmarToken(usuario) });
  })
);
