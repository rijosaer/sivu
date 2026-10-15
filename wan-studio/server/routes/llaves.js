// Llaves de la API. Solo se administran con sesión de la web: una llave no
// puede crear ni revocar otras.
import { Router } from "express";
import { pool } from "../db.js";
import { nuevaLlave, requiereUsuario } from "../auth.js";
import { capturar, ErrorApi } from "../errores.js";

export const llavesRouter = Router();
llavesRouter.use(requiereUsuario({ soloSesion: true }));

llavesRouter.get(
  "/",
  capturar(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT id, nombre, prefijo, creada_en, ultimo_uso FROM api_llaves
        WHERE usuario_id = $1 AND revocada_en IS NULL ORDER BY creada_en DESC`,
      [req.usuario.id]
    );
    res.json({ llaves: rows });
  })
);

llavesRouter.post(
  "/",
  capturar(async (req, res) => {
    const nombre = String(req.body.nombre || "").trim().slice(0, 60) || "Sin nombre";
    const { rows: activas } = await pool.query(
      "SELECT count(*)::int AS n FROM api_llaves WHERE usuario_id = $1 AND revocada_en IS NULL",
      [req.usuario.id]
    );
    if (activas[0].n >= 10) throw new ErrorApi(400, "Máximo 10 llaves activas; revoca alguna primero");
    const { llave, prefijo, hash } = nuevaLlave();
    const { rows } = await pool.query(
      `INSERT INTO api_llaves (usuario_id, nombre, prefijo, hash) VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, prefijo, creada_en, ultimo_uso`,
      [req.usuario.id, nombre, prefijo, hash]
    );
    // La única vez que la llave completa sale del servidor.
    res.status(201).json({ ...rows[0], llave });
  })
);

llavesRouter.delete(
  "/:id",
  capturar(async (req, res) => {
    const { rowCount } = await pool.query(
      `UPDATE api_llaves SET revocada_en = now()
        WHERE id = $1 AND usuario_id = $2 AND revocada_en IS NULL`,
      [Number(req.params.id) || 0, req.usuario.id]
    );
    if (!rowCount) throw new ErrorApi(404, "Llave no encontrada");
    res.status(204).end();
  })
);
