// API pública v1. La web usa exactamente estas mismas rutas.
// Autenticación: "Authorization: Bearer ws_..." (llave) o el token de sesión.
import { Router } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "../db.js";
import { requiereUsuario } from "../auth.js";
import { capturar, ErrorApi } from "../errores.js";
import { ASPECTOS, DURACION, PRESETS, RESOLUCIONES, prepararGeneracion, presetPublico } from "../presets.js";
import { borrar, guardarImagen, leerImagen } from "../almacen.js";
import { generacionPublica } from "../serializar.js";
import { fallar } from "../cola.js";
import { limitador } from "../seguridad.js";

export const v1Router = Router();

const MAX_PENDIENTES = Number(process.env.MAX_PENDIENTES_POR_USUARIO || 5);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

v1Router.get("/presets", (_req, res) => {
  res.json({
    presets: PRESETS.map(presetPublico),
    opciones: { aspectos: ASPECTOS, resoluciones: RESOLUCIONES, duracion: DURACION },
    costo: "créditos = segundos × (2 si es 720p, 1 si es 480p) × multiplicador del preset",
  });
});

v1Router.use(requiereUsuario());

v1Router.get("/cuenta", (req, res) => {
  res.json({ email: req.usuario.email, creditos: req.usuario.creditos, ilimitado: req.usuario.ilimitado });
});

const limiteCrear = limitador({
  ventanaMs: 60 * 1000,
  maximo: 20,
  mensaje: "Demasiadas generaciones por minuto. Espera un momento.",
  clave: (req) => `u${req.usuario.id}`,
});
const limiteCrearSalvoIlimitados = (req, res, next) => (req.usuario.ilimitado ? next() : limiteCrear(req, res, next));

v1Router.post(
  "/generaciones",
  limiteCrearSalvoIlimitados,
  capturar(async (req, res) => {
    const imagen = req.body.imagen ? leerImagen(req.body.imagen) : null;
    const g = prepararGeneracion(req.body, { hayImagen: !!imagen, ilimitado: req.usuario.ilimitado });
    // Las cuentas ilimitadas no pagan: costo 0 también hace que no haya nada
    // que devolver si la generación falla.
    if (req.usuario.ilimitado) g.costo = 0;
    const id = randomUUID();
    const rutaImagen = imagen ? await guardarImagen(id, imagen) : null;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // El bloqueo de la fila del usuario serializa sus peticiones: el conteo
      // de pendientes y el cobro no se pueden adelantar uno al otro.
      const { rows: u } = await client.query("SELECT creditos FROM usuarios WHERE id = $1 FOR UPDATE", [req.usuario.id]);
      const { rows: p } = await client.query(
        "SELECT count(*)::int AS n FROM generaciones WHERE usuario_id = $1 AND estado IN ('en_cola', 'procesando')",
        [req.usuario.id]
      );
      if (!req.usuario.ilimitado && p[0].n >= MAX_PENDIENTES) {
        throw new ErrorApi(429, `Ya tienes ${p[0].n} generaciones en curso; espera a que termine alguna`);
      }
      if (u[0].creditos < g.costo) {
        throw new ErrorApi(402, `Créditos insuficientes: cuesta ${g.costo} y tienes ${u[0].creditos}`);
      }
      await client.query("UPDATE usuarios SET creditos = creditos - $2 WHERE id = $1", [req.usuario.id, g.costo]);
      const { rows } = await client.query(
        `INSERT INTO generaciones
           (id, usuario_id, preset, modo, prompt, prompt_final, negativo, parametros, imagen, costo, webhook_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [id, req.usuario.id, g.preset.id, g.modo, g.prompt, g.promptFinal, g.negativo, g.parametros, rutaImagen, g.costo, g.webhookUrl]
      );
      await client.query("COMMIT");
      res.status(202).json(generacionPublica(rows[0], req));
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      await borrar(rutaImagen).catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  })
);

v1Router.get(
  "/generaciones",
  capturar(async (req, res) => {
    const limite = Math.min(Math.max(Number(req.query.limite) || 20, 1), 100);
    const antes = req.query.antes ? new Date(String(req.query.antes)) : null;
    if (antes && Number.isNaN(antes.getTime())) throw new ErrorApi(400, `"antes" debe ser una fecha ISO`);
    const { rows } = await pool.query(
      `SELECT * FROM generaciones
        WHERE usuario_id = $1 AND ($2::timestamptz IS NULL OR creado_en < $2)
        ORDER BY creado_en DESC LIMIT $3`,
      [req.usuario.id, antes, limite]
    );
    res.json({
      generaciones: rows.map((g) => generacionPublica(g, req)),
      siguiente: rows.length === limite ? rows.at(-1).creado_en : null,
    });
  })
);

async function propia(req) {
  if (!UUID.test(req.params.id)) throw new ErrorApi(404, "Generación no encontrada");
  const { rows } = await pool.query("SELECT * FROM generaciones WHERE id = $1 AND usuario_id = $2", [
    req.params.id,
    req.usuario.id,
  ]);
  if (!rows[0]) throw new ErrorApi(404, "Generación no encontrada");
  return rows[0];
}

v1Router.get(
  "/generaciones/:id",
  capturar(async (req, res) => res.json(generacionPublica(await propia(req), req)))
);

v1Router.post(
  "/generaciones/:id/cancelar",
  capturar(async (req, res) => {
    const gen = await propia(req);
    if (gen.estado !== "en_cola") throw new ErrorApi(409, "Solo se puede cancelar una generación que sigue en cola");
    const cancelada = await fallar(gen, "Cancelada por el usuario", { estado: "cancelada", desde: ["en_cola"] });
    if (!cancelada) throw new ErrorApi(409, "La generación ya empezó a procesarse");
    res.json(generacionPublica(cancelada, req));
  })
);

v1Router.delete(
  "/generaciones/:id",
  capturar(async (req, res) => {
    const gen = await propia(req);
    if (gen.estado === "en_cola" || gen.estado === "procesando") {
      throw new ErrorApi(409, "No se puede borrar una generación en curso; cancélala o espera a que termine");
    }
    await pool.query("DELETE FROM generaciones WHERE id = $1", [gen.id]);
    await Promise.all([borrar(gen.video), borrar(gen.imagen)]);
    res.status(204).end();
  })
);
