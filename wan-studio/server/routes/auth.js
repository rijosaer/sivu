import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { firmarToken, requiereUsuario } from "../auth.js";
import { capturar, ErrorApi } from "../errores.js";

export const authRouter = Router();

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const credenciales = (cuerpo) => {
  const email = String(cuerpo.email || "").trim().toLowerCase();
  const password = String(cuerpo.password || "");
  if (!EMAIL.test(email)) throw new ErrorApi(400, "Escribe un correo válido");
  if (password.length < 8) throw new ErrorApi(400, "La contraseña debe tener al menos 8 caracteres");
  return { email, password };
};

const respuesta = (u) => ({
  token: firmarToken(u),
  usuario: { id: u.id, email: u.email, creditos: u.creditos, es_admin: u.es_admin },
});

authRouter.post(
  "/registro",
  capturar(async (req, res) => {
    if (process.env.REGISTRO_ABIERTO === "false") throw new ErrorApi(403, "El registro está cerrado");
    const { email, password } = credenciales(req.body);
    const hash = await bcrypt.hash(password, 10);
    // La primera cuenta del sistema queda como administradora.
    const { rows } = await pool.query(
      `INSERT INTO usuarios (email, hash, creditos, es_admin)
       VALUES ($1, $2, $3, NOT EXISTS (SELECT 1 FROM usuarios))
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, creditos, es_admin`,
      [email, hash, Number(process.env.CREDITOS_INICIALES ?? 20)]
    );
    if (!rows[0]) throw new ErrorApi(409, "Ya existe una cuenta con ese correo");
    res.status(201).json(respuesta(rows[0]));
  })
);

authRouter.post(
  "/login",
  capturar(async (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    const { rows } = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
    const ok = rows[0] && (await bcrypt.compare(String(req.body.password || ""), rows[0].hash));
    if (!ok) throw new ErrorApi(401, "Correo o contraseña incorrectos");
    res.json(respuesta(rows[0]));
  })
);

authRouter.get("/yo", requiereUsuario(), (req, res) => res.json({ usuario: req.usuario }));
