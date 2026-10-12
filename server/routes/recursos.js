import { Router } from "express";
import { pool } from "../db.js";
import { capturar } from "../errores.js";
import { temaDeDiseno } from "../plantillas.js";

// Todo lo de aquí cuelga de una invitación concreta: se monta en admin.js
// bajo /invitaciones/:invitacionId, con resolverInvitacionAdmin puesto antes
// para que req.invitacionId ya venga validado. mergeParams:true es lo que
// deja leer :invitacionId aunque este router se monte "adentro" de otro.
export const recursosRouter = Router({ mergeParams: true });

const MAX_BYTES = 12 * 1024 * 1024; // tope por archivo, ya decodificado

// Acepta "data:image/png;base64,AAA..." y devuelve mime + bytes.
function leerDataUrl(dataUrl) {
  const m = /^data:([^;,]+);base64,(.*)$/s.exec(dataUrl || "");
  if (!m) return null;
  const buffer = Buffer.from(m[2], "base64");
  if (!buffer.length || buffer.length > MAX_BYTES) return null;
  return { mime: m[1], buffer };
}

// ---------- Secciones (contenido, orden, activo/inactivo) ----------

recursosRouter.get(
  "/secciones",
  capturar(async (req, res) => {
    const { rows } = await pool.query(
      "SELECT id, tipo, titulo_panel, orden, activo, contenido FROM secciones WHERE invitacion_id = $1 ORDER BY orden ASC",
      [req.invitacionId]
    );
    res.json(rows);
  })
);

recursosRouter.put(
  "/secciones/:id",
  capturar(async (req, res) => {
    const { contenido, activo, orden } = req.body;
    const { rows } = await pool.query(
      `UPDATE secciones SET
         contenido = COALESCE($3, contenido),
         activo = COALESCE($4, activo),
         orden = COALESCE($5, orden)
       WHERE id = $1 AND invitacion_id = $2 RETURNING *`,
      [req.params.id, req.invitacionId, contenido ? JSON.stringify(contenido) : null, activo, orden]
    );
    if (!rows.length) return res.status(404).json({ error: "Sección no encontrada" });
    res.json(rows[0]);
  })
);

// Reordenar varias secciones de una sola vez: [{id, orden}, ...]
recursosRouter.post(
  "/secciones/reordenar",
  capturar(async (req, res) => {
    const { orden } = req.body; // [{id, orden}]
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const item of orden) {
        await client.query(
          "UPDATE secciones SET orden = $2 WHERE id = $1 AND invitacion_id = $3",
          [item.id, item.orden, req.invitacionId]
        );
      }
      await client.query("COMMIT");
      res.json({ ok: true });
    } catch (e) {
      console.error("Error al reordenar secciones:", e);
      // Si el ROLLBACK también falla, la conexión ya no sirve: se descarta.
      await client.query("ROLLBACK").catch(() => {});
      res.status(500).json({ error: "No se pudo reordenar" });
    } finally {
      client.release();
    }
  })
);

// ---------- Tema (colores y tipografías) ----------

recursosRouter.get(
  "/tema",
  capturar(async (req, res) => {
    const { rows } = await pool.query(
      "SELECT clave, valor FROM tema WHERE invitacion_id = $1 ORDER BY clave",
      [req.invitacionId]
    );
    res.json(rows);
  })
);

// Vuelve a los colores y letras del diseño actual del evento (los demás
// ajustes del tema, como los mensajes de WhatsApp, no se tocan).
recursosRouter.post(
  "/tema/restaurar",
  capturar(async (req, res) => {
    const { rows } = await pool.query("SELECT diseno FROM invitaciones WHERE id = $1", [req.invitacionId]);
    for (const [clave, valor] of temaDeDiseno(rows[0]?.diseno)) {
      await pool.query(
        `INSERT INTO tema (invitacion_id, clave, valor) VALUES ($1, $2, $3)
         ON CONFLICT (invitacion_id, clave) DO UPDATE SET valor = EXCLUDED.valor`,
        [req.invitacionId, clave, valor]
      );
    }
    res.json({ ok: true });
  })
);

recursosRouter.put(
  "/tema/:clave",
  capturar(async (req, res) => {
    const { valor } = req.body;
    await pool.query(
      `INSERT INTO tema (invitacion_id, clave, valor) VALUES ($1, $2, $3)
       ON CONFLICT (invitacion_id, clave) DO UPDATE SET valor = EXCLUDED.valor`,
      [req.invitacionId, req.params.clave, valor]
    );
    res.json({ ok: true });
  })
);

// ---------- Medios: fotos de la galería y audio de fondo ----------
// Nunca se devuelven los bytes en estas rutas, solo la URL pública: el panel
// muestra las imágenes con <img src> igual que lo hace el sitio.

recursosRouter.get(
  "/medios",
  capturar(async (req, res) => {
    const { tipo } = req.query;
    const { rows } = await pool.query(
      `SELECT id, tipo, mime, nombre, orden, octet_length(datos) AS bytes, creado_en
       FROM medios WHERE invitacion_id = $1 ${tipo ? "AND tipo = $2" : ""} ORDER BY orden, id`,
      tipo ? [req.invitacionId, tipo] : [req.invitacionId]
    );
    res.json(rows.map((r) => ({ ...r, url: `/api/public/medio/${r.id}` })));
  })
);

recursosRouter.post(
  "/medios",
  capturar(async (req, res) => {
    const { tipo, nombre, datos } = req.body;
    if (!["foto", "audio", "fondo"].includes(tipo)) {
      return res.status(400).json({ error: "Tipo de archivo no válido" });
    }
    const archivo = leerDataUrl(datos);
    if (!archivo) {
      return res.status(400).json({ error: "Archivo vacío, dañado o mayor a 12 MB" });
    }

    // Del audio y del fondo solo puede haber uno: el nuevo reemplaza al anterior.
    if (tipo === "audio" || tipo === "fondo") {
      await pool.query("DELETE FROM medios WHERE tipo = $1 AND invitacion_id = $2", [
        tipo,
        req.invitacionId,
      ]);
    }

    const siguiente = await pool.query(
      "SELECT COALESCE(max(orden), 0) + 1 AS orden FROM medios WHERE tipo = $1 AND invitacion_id = $2",
      [tipo, req.invitacionId]
    );
    const { rows } = await pool.query(
      `INSERT INTO medios (invitacion_id, tipo, mime, nombre, datos, orden) VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, tipo, mime, nombre, orden`,
      [req.invitacionId, tipo, archivo.mime, nombre || "", archivo.buffer, siguiente.rows[0].orden]
    );
    res.status(201).json({ ...rows[0], url: `/api/public/medio/${rows[0].id}` });
  })
);

recursosRouter.post(
  "/medios/reordenar",
  capturar(async (req, res) => {
    const { orden } = req.body; // [{id, orden}]
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const item of orden) {
        await client.query(
          "UPDATE medios SET orden = $2 WHERE id = $1 AND invitacion_id = $3",
          [item.id, item.orden, req.invitacionId]
        );
      }
      await client.query("COMMIT");
      res.json({ ok: true });
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  })
);

recursosRouter.delete(
  "/medios/:id",
  capturar(async (req, res) => {
    await pool.query("DELETE FROM medios WHERE id = $1 AND invitacion_id = $2", [
      req.params.id,
      req.invitacionId,
    ]);
    res.json({ ok: true });
  })
);

// ---------- Decoraciones ----------

recursosRouter.get(
  "/decoraciones",
  capturar(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT clave, etiqueta, personalizada, (datos IS NOT NULL) AS tiene_imagen,
              extract(epoch FROM actualizado_en)::bigint AS v
       FROM decoraciones WHERE invitacion_id = $1 ORDER BY personalizada, clave`,
      [req.invitacionId]
    );
    res.json(
      rows.map((r) => ({
        clave: r.clave,
        etiqueta: r.etiqueta,
        personalizada: r.personalizada,
        url: r.tiene_imagen
          ? `/api/public/invitaciones/${req.invitacion.slug}/decoracion/${r.clave}?v=${r.v}`
          : null,
      }))
    );
  })
);

// Crear una decoración nueva (además de las cinco de fábrica).
recursosRouter.post(
  "/decoraciones",
  capturar(async (req, res) => {
    const { etiqueta, datos } = req.body;
    if (!etiqueta?.trim()) return res.status(400).json({ error: "Ponle un nombre a la decoración" });
    if (!leerDataUrl(datos)) {
      return res.status(400).json({ error: "Imagen vacía, dañada o mayor a 12 MB" });
    }

    // Clave legible derivada del nombre, con sufijo si ya existe EN ESTA
    // invitación (otra invitación puede tener perfectamente la misma clave).
    const base =
      etiqueta
        .toLowerCase()
        .normalize("NFD")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 30) || "decoracion";
    let clave = base;
    for (let i = 2; i < 100; i++) {
      const existe = await pool.query(
        "SELECT 1 FROM decoraciones WHERE clave = $1 AND invitacion_id = $2",
        [clave, req.invitacionId]
      );
      if (!existe.rowCount) break;
      clave = `${base}-${i}`;
    }

    const { rows } = await pool.query(
      `INSERT INTO decoraciones (invitacion_id, clave, etiqueta, datos, personalizada, actualizado_en)
       VALUES ($1, $2, $3, $4, true, now()) RETURNING clave, etiqueta, personalizada`,
      [req.invitacionId, clave, etiqueta.trim(), datos]
    );
    res.status(201).json(rows[0]);
  })
);

recursosRouter.put(
  "/decoraciones/:clave",
  capturar(async (req, res) => {
    const { datos } = req.body; // data URL, o null para volver a la de fábrica
    if (datos !== null && !leerDataUrl(datos)) {
      return res.status(400).json({ error: "Imagen vacía, dañada o mayor a 12 MB" });
    }
    const { rowCount } = await pool.query(
      "UPDATE decoraciones SET datos = $3, actualizado_en = now() WHERE clave = $1 AND invitacion_id = $2",
      [req.params.clave, req.invitacionId, datos]
    );
    if (!rowCount) return res.status(404).json({ error: "Decoración no encontrada" });
    res.json({ ok: true });
  })
);

// Solo se borran las personalizadas: las de fábrica se restauran poniendo datos = null.
recursosRouter.delete(
  "/decoraciones/:clave",
  capturar(async (req, res) => {
    const { rowCount } = await pool.query(
      "DELETE FROM decoraciones WHERE clave = $1 AND invitacion_id = $2 AND personalizada = true",
      [req.params.clave, req.invitacionId]
    );
    if (!rowCount) {
      return res.status(400).json({ error: "Las decoraciones de fábrica no se pueden eliminar" });
    }
    res.json({ ok: true });
  })
);

// ---------- Dónde va cada decoración ----------

recursosRouter.get(
  "/ubicaciones",
  capturar(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT id, clave, seccion_tipo, x::float, y::float, ancho::float,
              rotacion::float, opacidad::float, capa
       FROM decoracion_ubicaciones WHERE invitacion_id = $1 ORDER BY id`,
      [req.invitacionId]
    );
    res.json(rows);
  })
);

recursosRouter.post(
  "/ubicaciones",
  capturar(async (req, res) => {
    const { clave, seccion_tipo, x, y, ancho, rotacion, opacidad, capa } = req.body;
    if (!clave || !seccion_tipo) {
      return res.status(400).json({ error: "Falta la decoración o la sección" });
    }
    const existe = await pool.query(
      "SELECT 1 FROM decoraciones WHERE clave = $1 AND invitacion_id = $2",
      [clave, req.invitacionId]
    );
    if (!existe.rowCount) return res.status(400).json({ error: "Esa decoración no existe" });
    const { rows } = await pool.query(
      // Los ::numeric son obligatorios: sin ellos Postgres deduce el tipo del
      // parámetro por el literal del COALESCE (un entero) y rechaza cualquier
      // decimal, como una opacidad de 0.2.
      `INSERT INTO decoracion_ubicaciones (invitacion_id, clave, seccion_tipo, x, y, ancho, rotacion, opacidad, capa)
       VALUES ($1, $2, $3, COALESCE($4::numeric, 10), COALESCE($5::numeric, 10),
               COALESCE($6::numeric, 30), COALESCE($7::numeric, 0),
               COALESCE($8::numeric, 1), COALESCE($9, 'detras'))
       RETURNING id, clave, seccion_tipo, x::float, y::float, ancho::float,
                 rotacion::float, opacidad::float, capa`,
      [req.invitacionId, clave, seccion_tipo, x, y, ancho, rotacion, opacidad, capa]
    );
    res.status(201).json(rows[0]);
  })
);

recursosRouter.put(
  "/ubicaciones/:id",
  capturar(async (req, res) => {
    const { x, y, ancho, rotacion, opacidad, capa, seccion_tipo } = req.body;
    const { rows } = await pool.query(
      `UPDATE decoracion_ubicaciones SET
         x = COALESCE($3, x), y = COALESCE($4, y), ancho = COALESCE($5, ancho),
         rotacion = COALESCE($6, rotacion), opacidad = COALESCE($7, opacidad),
         capa = COALESCE($8, capa), seccion_tipo = COALESCE($9, seccion_tipo)
       WHERE id = $1 AND invitacion_id = $2
       RETURNING id, clave, seccion_tipo, x::float, y::float, ancho::float,
                 rotacion::float, opacidad::float, capa`,
      [req.params.id, req.invitacionId, x, y, ancho, rotacion, opacidad, capa, seccion_tipo]
    );
    if (!rows.length) return res.status(404).json({ error: "Ubicación no encontrada" });
    res.json(rows[0]);
  })
);

recursosRouter.delete(
  "/ubicaciones/:id",
  capturar(async (req, res) => {
    await pool.query("DELETE FROM decoracion_ubicaciones WHERE id = $1 AND invitacion_id = $2", [
      req.params.id,
      req.invitacionId,
    ]);
    res.json({ ok: true });
  })
);

// ---------- Invitados (individual, pareja, familia, cupos) ----------

const TIPOS = ["individual", "pareja", "familia", "cupos"];

// Cuántos cupos pide una invitación de tipo "cupos". Son adicionales al
// titular: 3 cupos = el titular + hasta 3 acompañantes.
function cuposValidos(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n >= 1 && n <= 50 ? n : null;
}

async function invitadoConMiembros(invitacionId, id) {
  const { rows } = await pool.query(
    `SELECT id, codigo, tipo, nombre, familia, mensaje, telefono, telefono_aux, cupos, enviado_en, creado_en
     FROM invitados WHERE id = $1 AND invitacion_id = $2`,
    [id, invitacionId]
  );
  if (!rows.length) return null;
  const miembros = await pool.query(
    `SELECT id, nombre, orden, estado, restriccion, comentario, respondido_en, es_acompanante
     FROM invitado_miembros WHERE invitado_id = $1 ORDER BY orden, id`,
    [id]
  );
  return { ...rows[0], miembros: miembros.rows };
}

recursosRouter.get(
  "/invitados",
  capturar(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT i.id, i.codigo, i.tipo, i.nombre, i.familia, i.mensaje,
              i.telefono, i.telefono_aux, i.cupos, i.enviado_en, i.abierto_en, i.ultima_apertura, i.aperturas, i.creado_en,
              COALESCE(json_agg(
                json_build_object('id', m.id, 'nombre', m.nombre, 'orden', m.orden,
                                  'estado', m.estado, 'restriccion', m.restriccion,
                                  'comentario', m.comentario, 'respondido_en', m.respondido_en,
                                  'es_acompanante', m.es_acompanante)
                ORDER BY m.orden, m.id
              ) FILTER (WHERE m.id IS NOT NULL), '[]') AS miembros
       FROM invitados i
       LEFT JOIN invitado_miembros m ON m.invitado_id = i.id
       WHERE i.invitacion_id = $1
       GROUP BY i.id
       ORDER BY i.creado_en DESC`,
      [req.invitacionId]
    );
    res.json(rows);
  })
);

function generarCodigo() {
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin caracteres ambiguos
  let codigo = "";
  for (let i = 0; i < 6; i++) codigo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  return codigo;
}

recursosRouter.post(
  "/invitados",
  capturar(async (req, res) => {
    const { nombre, familia, mensaje, telefono, telefono_aux, tipo = "individual", miembros = [], cupos } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: "El nombre es obligatorio" });
    if (!TIPOS.includes(tipo)) return res.status(400).json({ error: "Tipo de invitación no válido" });

    // Si no mandan personas, la invitación cubre a quien le da nombre.
    const personas = (miembros.length ? miembros : [{ nombre }])
      .map((m) => (typeof m === "string" ? m : m.nombre))
      .map((n) => String(n || "").trim())
      .filter(Boolean);
    if (!personas.length) return res.status(400).json({ error: "Agrega al menos una persona" });
    if (tipo === "pareja" && personas.length !== 2) {
      return res.status(400).json({ error: "Una invitación de pareja debe tener dos personas" });
    }

    // En "cupos" solo se crea el titular: los acompañantes los escribe el
    // invitado al confirmar (o el panel, si avisa por WhatsApp).
    let numeroCupos = 0;
    if (tipo === "cupos") {
      numeroCupos = cuposValidos(cupos);
      if (numeroCupos === null) {
        return res.status(400).json({ error: "Los cupos deben ser un número de 1 a 50" });
      }
      if (personas.length !== 1) {
        return res.status(400).json({ error: "Una invitación por cupos tiene un solo titular" });
      }
    }

    let codigo;
    for (let i = 0; i < 20; i++) {
      codigo = generarCodigo();
      const existe = await pool.query(
        "SELECT 1 FROM invitados WHERE codigo = $1 AND invitacion_id = $2",
        [codigo, req.invitacionId]
      );
      if (!existe.rowCount) break;
      codigo = null;
    }
    if (!codigo) return res.status(500).json({ error: "No se pudo generar un código único" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `INSERT INTO invitados (invitacion_id, codigo, nombre, familia, mensaje, tipo, telefono, telefono_aux, cupos)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          req.invitacionId, codigo, nombre.trim(), familia || "", mensaje || "", tipo,
          (telefono || "").trim(), (telefono_aux || "").trim(), numeroCupos,
        ]
      );
      const id = rows[0].id;
      for (const [i, persona] of personas.entries()) {
        await client.query(
          "INSERT INTO invitado_miembros (invitado_id, nombre, orden) VALUES ($1, $2, $3)",
          [id, persona, i + 1]
        );
      }
      await client.query("COMMIT");
      res.status(201).json(await invitadoConMiembros(req.invitacionId, id));
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  })
);

recursosRouter.put(
  "/invitados/:id",
  capturar(async (req, res) => {
    const { nombre, familia, mensaje, tipo, telefono, telefono_aux, enviado, cupos } = req.body;
    if (tipo && !TIPOS.includes(tipo)) {
      return res.status(400).json({ error: "Tipo de invitación no válido" });
    }

    // Bajar los cupos no puede dejar fuera a gente que ya confirmó: primero
    // hay que quitar a esos acompañantes desde «Ver personas».
    let numeroCupos = null;
    if (cupos !== undefined && cupos !== null) {
      numeroCupos = cuposValidos(cupos);
      if (numeroCupos === null) {
        return res.status(400).json({ error: "Los cupos deben ser un número de 1 a 50" });
      }
      const { rows: ocupados } = await pool.query(
        `SELECT count(*)::int AS n FROM invitado_miembros m
         JOIN invitados i ON i.id = m.invitado_id
         WHERE m.invitado_id = $1 AND i.invitacion_id = $2 AND m.es_acompanante = true`,
        [req.params.id, req.invitacionId]
      );
      if (numeroCupos < ocupados[0].n) {
        return res.status(400).json({
          error: `Ya hay ${ocupados[0].n} acompañante(s) registrados: no puedes dejar menos cupos que eso`,
        });
      }
    }
    // "enviado" es un sí/no desde el panel; en la base se guarda la fecha, y
    // marcar de nuevo una ya enviada no le cambia la fecha original.
    const marcaEnvio =
      enviado === true ? "COALESCE(enviado_en, now())" : enviado === false ? "NULL" : "enviado_en";
    const { rows } = await pool.query(
      `UPDATE invitados SET
         nombre = COALESCE($3, nombre),
         familia = COALESCE($4, familia),
         mensaje = COALESCE($5, mensaje),
         tipo = COALESCE($6, tipo),
         telefono = COALESCE($7, telefono),
         cupos = COALESCE($8, cupos),
         telefono_aux = COALESCE($9, telefono_aux),
         enviado_en = ${marcaEnvio}
       WHERE id = $1 AND invitacion_id = $2 RETURNING id`,
      [
        req.params.id, req.invitacionId, nombre, familia, mensaje, tipo, telefono, numeroCupos,
        typeof telefono_aux === "string" ? telefono_aux.trim() : null,
      ]
    );
    if (!rows.length) return res.status(404).json({ error: "Invitación no encontrada" });
    res.json(await invitadoConMiembros(req.invitacionId, rows[0].id));
  })
);

recursosRouter.delete(
  "/invitados/:id",
  capturar(async (req, res) => {
    // Los miembros se van solos: la llave foránea es ON DELETE CASCADE.
    await pool.query("DELETE FROM invitados WHERE id = $1 AND invitacion_id = $2", [
      req.params.id,
      req.invitacionId,
    ]);
    res.json({ ok: true });
  })
);

// ---------- Personas dentro de una invitación ----------

recursosRouter.post(
  "/invitados/:id/miembros",
  capturar(async (req, res) => {
    const { nombre, acompanante = false } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: "El nombre es obligatorio" });
    const existe = await pool.query(
      "SELECT tipo, cupos FROM invitados WHERE id = $1 AND invitacion_id = $2",
      [req.params.id, req.invitacionId]
    );
    if (!existe.rowCount) return res.status(404).json({ error: "Invitación no encontrada" });

    // En una invitación por cupos todo lo que se agregue ocupa un cupo: el
    // titular ya existe desde que se creó.
    const invitacion = existe.rows[0];
    const ocupaCupo = acompanante || invitacion.tipo === "cupos";
    if (ocupaCupo) {
      if (invitacion.tipo !== "cupos") {
        return res.status(400).json({ error: "Esta invitación no maneja cupos" });
      }
      const { rows } = await pool.query(
        `SELECT count(*)::int AS n FROM invitado_miembros
         WHERE invitado_id = $1 AND es_acompanante = true`,
        [req.params.id]
      );
      if (rows[0].n >= invitacion.cupos) {
        return res.status(400).json({
          error: `Esta invitación solo tiene ${invitacion.cupos} cupo(s) y ya están ocupados`,
        });
      }
    }

    const siguiente = await pool.query(
      "SELECT COALESCE(max(orden), 0) + 1 AS orden FROM invitado_miembros WHERE invitado_id = $1",
      [req.params.id]
    );
    // Un acompañante agregado a mano viene de un «sí» que nos dieron por otro
    // lado (WhatsApp, en persona), así que entra como confirmado. Se marca
    // 'panel' para no avisarnos a nosotros mismos en /novedades.
    await pool.query(
      `INSERT INTO invitado_miembros
         (invitado_id, nombre, orden, es_acompanante, estado, respondido_en, respondido_via)
       VALUES ($1, $2, $3, $4::boolean,
               CASE WHEN $4::boolean THEN 'confirmado' ELSE 'pendiente' END,
               CASE WHEN $4::boolean THEN now() ELSE NULL END,
               CASE WHEN $4::boolean THEN 'panel' ELSE 'invitado' END)`,
      [req.params.id, nombre.trim(), siguiente.rows[0].orden, ocupaCupo]
    );
    res.status(201).json(await invitadoConMiembros(req.invitacionId, req.params.id));
  })
);

recursosRouter.put(
  "/miembros/:id",
  capturar(async (req, res) => {
    const { nombre, estado, restriccion, comentario } = req.body;
    // Marcar a mano cuenta como respuesta: se sella respondido_en para que la
    // persona suba al principio de la lista igual que quien responde desde su
    // invitación. Se marca respondido_via='panel' para no avisarnos a nosotros
    // mismos (ver /novedades). Volver a "pendiente" borra la marca.
    // El CASE solo actúa si venía un estado nuevo y distinto: renombrar a
    // alguien (que manda solo `nombre`) no debe tocar su fecha de respuesta.
    // El JOIN con invitados es lo que impide que un panel abierto sobre una
    // invitación toque a una persona de otra.
    const { rows } = await pool.query(
      `UPDATE invitado_miembros m SET
         nombre = COALESCE($3, m.nombre),
         estado = COALESCE($4, m.estado),
         restriccion = COALESCE($5, m.restriccion),
         comentario = COALESCE($6, m.comentario),
         respondido_en = CASE
           WHEN $4::text IS NULL THEN m.respondido_en
           WHEN $4::text = 'pendiente' THEN NULL
           WHEN m.estado IS DISTINCT FROM $4::text THEN now()
           ELSE m.respondido_en END,
         respondido_via = CASE
           WHEN $4::text IS NULL OR $4::text = 'pendiente' THEN m.respondido_via
           WHEN m.estado IS DISTINCT FROM $4::text THEN 'panel'
           ELSE m.respondido_via END
       FROM invitados i
       WHERE m.id = $1 AND i.id = m.invitado_id AND i.invitacion_id = $2
       RETURNING m.invitado_id`,
      [req.params.id, req.invitacionId, nombre, estado, restriccion, comentario]
    );
    if (!rows.length) return res.status(404).json({ error: "Persona no encontrada" });
    res.json(await invitadoConMiembros(req.invitacionId, rows[0].invitado_id));
  })
);

recursosRouter.delete(
  "/miembros/:id",
  capturar(async (req, res) => {
    // El titular de una invitación por cupos no se puede quitar: es quien le
    // da nombre y a quien se le mandó el enlace. Se elimina la invitación
    // entera, o se le cambia el nombre.
    const { rows } = await pool.query(
      `DELETE FROM invitado_miembros m
       USING invitados i
       WHERE m.id = $1 AND i.id = m.invitado_id AND i.invitacion_id = $2
         AND NOT (i.tipo = 'cupos' AND m.es_acompanante = false)
       RETURNING m.invitado_id`,
      [req.params.id, req.invitacionId]
    );
    if (!rows.length) {
      const existe = await pool.query(
        `SELECT 1 FROM invitado_miembros m JOIN invitados i ON i.id = m.invitado_id
         WHERE m.id = $1 AND i.invitacion_id = $2`,
        [req.params.id, req.invitacionId]
      );
      if (existe.rowCount) {
        return res.status(400).json({ error: "No se puede quitar al titular de la invitación" });
      }
      return res.status(404).json({ error: "Persona no encontrada" });
    }
    res.json(await invitadoConMiembros(req.invitacionId, rows[0].invitado_id));
  })
);

// ---------- Novedades: respuestas y aperturas recientes ----------
// El panel sondea esto para avisar (con sonido) cuando alguien responde o abre
// su invitación. "desde" es la última novedad ya vista; se devuelven las más
// nuevas que esa, de la más reciente a la más antigua.
recursosRouter.get(
  "/novedades",
  capturar(async (req, res) => {
    const desde = req.query.desde || null;
    const { rows } = await pool.query(
      `SELECT * FROM (
         SELECT 'respuesta' AS tipo, m.nombre, m.estado,
                i.nombre AS invitacion, i.familia, i.codigo,
                m.respondido_en AS cuando
         FROM invitado_miembros m
         JOIN invitados i ON i.id = m.invitado_id
         WHERE i.invitacion_id = $2
           AND m.respondido_en IS NOT NULL
           AND m.respondido_via = 'invitado'
           AND ($1::timestamptz IS NULL OR m.respondido_en > $1::timestamptz)
         UNION ALL
         SELECT 'apertura' AS tipo, NULL AS nombre, NULL AS estado,
                i.nombre AS invitacion, i.familia, i.codigo,
                i.ultima_apertura AS cuando
         FROM invitados i
         WHERE i.invitacion_id = $2
           AND i.ultima_apertura IS NOT NULL
           AND ($1::timestamptz IS NULL OR i.ultima_apertura > $1::timestamptz)
       ) e
       ORDER BY cuando DESC
       LIMIT 100`,
      [desde, req.invitacionId]
    );
    res.json(rows);
  })
);

// ---------- Resumen para el dashboard ----------

recursosRouter.get(
  "/resumen",
  capturar(async (req, res) => {
    const personas = await pool.query(
      `SELECT
         count(*)::int AS total,
         count(*) FILTER (WHERE m.estado = 'confirmado')::int AS confirmados,
         count(*) FILTER (WHERE m.estado = 'no_asistira')::int AS no_asisten,
         count(*) FILTER (WHERE m.estado = 'pendiente')::int AS pendientes
       FROM invitado_miembros m
       JOIN invitados i ON i.id = m.invitado_id
       WHERE i.invitacion_id = $1`,
      [req.invitacionId]
    );
    const invitaciones = await pool.query(
      `SELECT
         count(*)::int AS total,
         count(*) FILTER (WHERE tipo = 'individual')::int AS individuales,
         count(*) FILTER (WHERE tipo = 'pareja')::int AS parejas,
         count(*) FILTER (WHERE tipo = 'familia')::int AS familias,
         count(*) FILTER (WHERE tipo = 'cupos')::int AS con_cupos,
         -- Cupos que siguen sin nombre: es el margen de gente que todavía
         -- podría llegar, y el catering necesita saberlo.
         COALESCE(sum(cupos) FILTER (WHERE tipo = 'cupos'), 0)::int AS cupos_totales,
         COALESCE(sum(cupos) FILTER (WHERE tipo = 'cupos'), 0)::int - (
           SELECT count(*)::int FROM invitado_miembros m
           JOIN invitados i2 ON i2.id = m.invitado_id
           WHERE i2.invitacion_id = $1 AND m.es_acompanante = true
         ) AS cupos_libres,
         count(*) FILTER (WHERE NOT EXISTS (
           SELECT 1 FROM invitado_miembros m
           WHERE m.invitado_id = invitados.id AND m.estado <> 'pendiente'
         ))::int AS sin_responder
       FROM invitados WHERE invitacion_id = $1`,
      [req.invitacionId]
    );
    res.json({ ...personas.rows[0], invitaciones: invitaciones.rows[0] });
  })
);
