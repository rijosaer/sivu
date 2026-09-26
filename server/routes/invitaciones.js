import { Router } from "express";
import { pool } from "../db.js";
import { capturar } from "../errores.js";
import { resolverInvitacionAdmin } from "../middlewareInvitacion.js";
import { TIPOS_EVENTO, temaBase, decoracionesBase, plantillaSecciones } from "../plantillas.js";

// CRUD de invitaciones (los "eventos" del sistema). Es lo que le permite al
// dueño operar muchos clientes desde un solo panel: cada fila de aquí es una
// invitación independiente, con su propio tema, secciones, decoraciones e
// invitados, todos colgando de su invitacion_id.
export const invitacionesRouter = Router();

function slugificar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos ya separados por NFD
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function slugUnico(base) {
  const raiz = base || "invitacion";
  let slug = raiz;
  for (let i = 2; i < 200; i++) {
    const { rowCount } = await pool.query("SELECT 1 FROM invitaciones WHERE slug = $1", [slug]);
    if (!rowCount) return slug;
    slug = `${raiz}-${i}`;
  }
  throw new Error("No se pudo generar un slug único");
}

async function conStats(rows) {
  if (!rows.length) return rows;
  const ids = rows.map((r) => r.id);
  const { rows: stats } = await pool.query(
    `SELECT invitacion_id,
            count(*)::int AS invitados,
            count(*) FILTER (WHERE NOT EXISTS (
              SELECT 1 FROM invitado_miembros m
              WHERE m.invitado_id = invitados.id AND m.estado <> 'pendiente'
            ))::int AS sin_responder
     FROM invitados WHERE invitacion_id = ANY($1) GROUP BY invitacion_id`,
    [ids]
  );
  const porId = Object.fromEntries(stats.map((s) => [s.invitacion_id, s]));
  return rows.map((r) => ({
    ...r,
    invitados: porId[r.id]?.invitados || 0,
    sin_responder: porId[r.id]?.sin_responder || 0,
  }));
}

invitacionesRouter.get(
  "/",
  capturar(async (_req, res) => {
    const { rows } = await pool.query(
      `SELECT id, slug, nombre, tipo_evento, fecha_evento, activo, es_plantilla, creado_en
       FROM invitaciones ORDER BY creado_en DESC`
    );
    res.json(await conStats(rows));
  })
);

invitacionesRouter.post(
  "/",
  capturar(async (req, res) => {
    const { nombre, tipo_evento = "boda", fecha_evento = null, slug: slugPedido } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: "Ponle un nombre a la invitación" });
    if (!TIPOS_EVENTO.includes(tipo_evento)) {
      return res.status(400).json({ error: "Tipo de evento no válido" });
    }
    const base = slugificar(slugPedido || nombre) || "invitacion";
    const slug = await slugUnico(base);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `INSERT INTO invitaciones (slug, nombre, tipo_evento, fecha_evento)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [slug, nombre.trim(), tipo_evento, fecha_evento || null]
      );
      const invitacion = rows[0];

      for (const [clave, valor] of temaBase()) {
        await client.query(
          "INSERT INTO tema (invitacion_id, clave, valor) VALUES ($1, $2, $3)",
          [invitacion.id, clave, valor]
        );
      }
      for (const d of decoracionesBase()) {
        await client.query(
          "INSERT INTO decoraciones (invitacion_id, clave, etiqueta, datos) VALUES ($1, $2, $3, NULL)",
          [invitacion.id, d.clave, d.etiqueta]
        );
      }
      for (const sec of plantillaSecciones(tipo_evento, nombre.trim())) {
        await client.query(
          `INSERT INTO secciones (invitacion_id, tipo, titulo_panel, orden, activo, contenido)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [invitacion.id, sec.tipo, sec.titulo_panel, sec.orden, sec.activo, JSON.stringify(sec.contenido)]
        );
      }

      await client.query("COMMIT");
      res.status(201).json(invitacion);
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  })
);

invitacionesRouter.get(
  "/:invitacionId",
  resolverInvitacionAdmin,
  capturar(async (req, res) => {
    const rows = await conStats([req.invitacion]);
    res.json(rows[0]);
  })
);

invitacionesRouter.put(
  "/:invitacionId",
  resolverInvitacionAdmin,
  capturar(async (req, res) => {
    const { nombre, slug: slugPedido, tipo_evento, fecha_evento, activo, es_plantilla } = req.body;
    if (tipo_evento && !TIPOS_EVENTO.includes(tipo_evento)) {
      return res.status(400).json({ error: "Tipo de evento no válido" });
    }
    let slug = null;
    if (slugPedido && slugPedido !== req.invitacion.slug) {
      const candidato = slugificar(slugPedido);
      if (!candidato) return res.status(400).json({ error: "El enlace no puede quedar vacío" });
      const { rowCount } = await pool.query(
        "SELECT 1 FROM invitaciones WHERE slug = $1 AND id <> $2",
        [candidato, req.invitacionId]
      );
      if (rowCount) return res.status(400).json({ error: "Ese enlace ya lo usa otra invitación" });
      slug = candidato;
    }
    const { rows } = await pool.query(
      `UPDATE invitaciones SET
         nombre = COALESCE($2, nombre),
         slug = COALESCE($3, slug),
         tipo_evento = COALESCE($4, tipo_evento),
         fecha_evento = CASE WHEN $5::boolean THEN $6::date ELSE fecha_evento END,
         activo = COALESCE($7, activo),
         es_plantilla = COALESCE($8, es_plantilla),
         actualizado_en = now()
       WHERE id = $1 RETURNING *`,
      [
        req.invitacionId,
        nombre?.trim() || null,
        slug,
        tipo_evento || null,
        fecha_evento !== undefined,
        fecha_evento || null,
        activo,
        es_plantilla,
      ]
    );
    res.json(rows[0]);
  })
);

invitacionesRouter.delete(
  "/:invitacionId",
  resolverInvitacionAdmin,
  capturar(async (req, res) => {
    // Una invitación marcada como plantilla (empezando por la boda real de
    // Maite y Ricardo) no se borra sin querer: hay que quitarle esa marca
    // desde "editar" antes de poder eliminarla.
    if (req.invitacion.es_plantilla) {
      return res.status(400).json({
        error: "Esta invitación es una plantilla protegida. Quítale esa marca antes de borrarla.",
      });
    }
    await pool.query("DELETE FROM invitaciones WHERE id = $1", [req.invitacionId]);
    res.json({ ok: true });
  })
);
