import { Router } from "express";
import { pool } from "../db.js";
import { capturar } from "../errores.js";
import { enviarTexto, whatsappConectado } from "../whatsappWeb.js";
import { leerAjuste, telefonosAviso } from "../ajustes.js";
import { anotar } from "../prospectos.js";

// Páginas públicas del negocio (sin sesión, con un enlace imposible de
// adivinar):
//   /cotizacion/<token> → la cotización que se le manda a un cliente.
//   /datos/<token>      → el formulario donde el cliente que ya firmó llena
//                          los datos de su evento y sube fotos, música y lista.
export const publicoNegocioRouter = Router();

const WHATSAPP_SIVU = () => process.env.WHATSAPP_SIVU || "573236019372";

async function avisarEquipo(clave, texto) {
  const avisos = await leerAjuste("avisos");
  if (!avisos[clave] || !whatsappConectado()) return;
  for (const tel of await telefonosAviso()) enviarTexto(tel, texto);
}

// ---------- Cotización ----------

publicoNegocioRouter.get(
  "/cotizacion/:token",
  capturar(async (req, res) => {
    const { rows: [c] } = await pool.query("SELECT * FROM cotizaciones WHERE token = $1", [req.params.token]);
    if (!c) return res.status(404).json({ error: "Esta cotización no existe" });
    // Las vistas del propio panel (?vista=panel) no cuentan.
    if (req.query.vista !== "panel") {
      await pool.query(
        `UPDATE cotizaciones SET vistas = vistas + 1, vista_en = COALESCE(vista_en, now()),
           estado = CASE WHEN estado = 'enviada' THEN 'vista' ELSE estado END
         WHERE id = $1`,
        [c.id]
      );
      if (c.prospecto_id && !c.vistas) await anotar(c.prospecto_id, "cotizacion", "Abrió la cotización");
    }
    const { pago } = await leerAjuste("cotizacion");
    const vencida = c.vigencia && new Date(`${String(c.vigencia.toISOString?.() || c.vigencia).slice(0, 10)}T23:59:59-05:00`) < new Date();
    res.json({
      cliente: c.cliente,
      evento: c.evento,
      items: c.items,
      descuento: Number(c.descuento),
      total: Number(c.total),
      notas: c.notas,
      vigencia: c.vigencia,
      vencida,
      aceptada: c.estado === "aceptada",
      creado_en: c.creado_en,
      pago,
      whatsapp: WHATSAPP_SIVU(),
    });
  })
);

publicoNegocioRouter.post(
  "/cotizacion/:token/aceptar",
  capturar(async (req, res) => {
    const { rows: [previa] } = await pool.query("SELECT estado FROM cotizaciones WHERE token = $1", [req.params.token]);
    if (!previa) return res.status(404).json({ error: "Esta cotización no existe" });
    if (previa.estado === "aceptada") return res.json({ ok: true, whatsapp: WHATSAPP_SIVU() });
    const { rows: [c] } = await pool.query(
      "UPDATE cotizaciones SET estado = 'aceptada', aceptada_en = now() WHERE token = $1 RETURNING *",
      [req.params.token]
    );
    if (c.prospecto_id) {
      await anotar(c.prospecto_id, "cotizacion", "¡Aceptó la cotización desde el enlace!");
      await pool.query(
        "UPDATE prospectos SET proximo_seguimiento = CURRENT_DATE, actualizado_en = now() WHERE id = $1",
        [c.prospecto_id]
      );
    }
    await avisarEquipo(
      "cotizacionAceptada",
      `✅ *${c.cliente || "Un cliente"} aceptó la cotización* de $${Number(c.total).toLocaleString("es-CO")}${c.evento ? ` (${c.evento})` : ""}.\nEscríbele para separar la fecha.`
    );
    res.json({ ok: true, whatsapp: WHATSAPP_SIVU() });
  })
);

// ---------- Formulario de datos del evento ----------

async function eventoPorToken(token) {
  const { rows: [inv] } = await pool.query(
    "SELECT id, nombre, tipo_evento, fecha_evento, datos_cliente, datos_recibidos_en FROM invitaciones WHERE datos_token = $1",
    [token]
  );
  return inv || null;
}

publicoNegocioRouter.get(
  "/datos/:token",
  capturar(async (req, res) => {
    const inv = await eventoPorToken(req.params.token);
    if (!inv) return res.status(404).json({ error: "Este enlace no existe" });
    const { rows: archivos } = await pool.query(
      "SELECT id, tipo, nombre, octet_length(datos) AS bytes FROM datos_archivos WHERE invitacion_id = $1 ORDER BY id",
      [inv.id]
    );
    res.json({
      nombre: inv.nombre,
      tipo_evento: inv.tipo_evento,
      fecha_evento: inv.fecha_evento,
      datos: inv.datos_cliente || {},
      enviado: Boolean(inv.datos_recibidos_en),
      archivos,
      whatsapp: WHATSAPP_SIVU(),
    });
  })
);

// Guarda lo que va llenando (borrador) o lo envía (final: true).
publicoNegocioRouter.post(
  "/datos/:token",
  capturar(async (req, res) => {
    const inv = await eventoPorToken(req.params.token);
    if (!inv) return res.status(404).json({ error: "Este enlace no existe" });
    const datos = req.body?.datos;
    if (!datos || typeof datos !== "object" || Array.isArray(datos)) return res.status(400).json({ error: "Datos no válidos" });
    // Solo texto, con tope por campo y en total.
    const limpio = {};
    for (const [k, v] of Object.entries(datos).slice(0, 60)) {
      if (!/^[a-zA-Z0-9_]{1,40}$/.test(k)) continue;
      limpio[k] = String(v ?? "").slice(0, 4000);
    }
    const final = Boolean(req.body.final);
    await pool.query(
      `UPDATE invitaciones SET datos_cliente = $2,
         datos_recibidos_en = CASE WHEN $3 THEN now() ELSE datos_recibidos_en END,
         etapa = CASE WHEN $3 AND etapa = 'datos' THEN 'diseno' ELSE etapa END
       WHERE id = $1`,
      [inv.id, JSON.stringify(limpio), final]
    );
    if (final) {
      const { rows: [{ n }] } = await pool.query("SELECT count(*)::int AS n FROM datos_archivos WHERE invitacion_id = $1", [inv.id]);
      await avisarEquipo(
        "datosRecibidos",
        `📥 *${inv.nombre}*: el cliente ${inv.datos_recibidos_en ? "actualizó" : "envió"} los datos de su evento${n ? ` (${n} archivo${n === 1 ? "" : "s"})` : ""}.\nRevísalos en el panel → Producción.`
      );
    }
    res.json({ ok: true });
  })
);

const LIMITES = {
  foto: { bytes: 8 * 1024 * 1024, max: 40, mime: /^image\/(jpeg|png|webp|heic|heif)$/ },
  audio: { bytes: 10 * 1024 * 1024, max: 3, mime: /^audio\// },
  lista: {
    bytes: 5 * 1024 * 1024,
    max: 5,
    mime: /^(application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|application\/vnd\.ms-excel|text\/csv|application\/pdf|application\/octet-stream)$/,
  },
  otro: { bytes: 8 * 1024 * 1024, max: 10, mime: /^(image\/|application\/pdf)/ },
};

publicoNegocioRouter.post(
  "/datos/:token/archivos",
  capturar(async (req, res) => {
    const inv = await eventoPorToken(req.params.token);
    if (!inv) return res.status(404).json({ error: "Este enlace no existe" });
    const { tipo, nombre, datos } = req.body || {};
    const lim = LIMITES[tipo];
    if (!lim) return res.status(400).json({ error: "Tipo de archivo no válido" });
    const m = /^data:([^;,]+);base64,(.*)$/s.exec(datos || "");
    if (!m) return res.status(400).json({ error: "Archivo no válido" });
    const mime = m[1].toLowerCase();
    if (!lim.mime.test(mime)) return res.status(400).json({ error: "Ese formato de archivo no se acepta aquí" });
    const buffer = Buffer.from(m[2], "base64");
    if (buffer.length > lim.bytes) {
      return res.status(400).json({ error: `El archivo pesa más de ${Math.round(lim.bytes / 1024 / 1024)} MB` });
    }
    const { rows: [{ n }] } = await pool.query(
      "SELECT count(*)::int AS n FROM datos_archivos WHERE invitacion_id = $1 AND tipo = $2",
      [inv.id, tipo]
    );
    if (n >= lim.max) return res.status(400).json({ error: `Máximo ${lim.max} archivos de este tipo` });
    const { rows: [a] } = await pool.query(
      `INSERT INTO datos_archivos (invitacion_id, tipo, nombre, mime, datos) VALUES ($1, $2, $3, $4, $5)
       RETURNING id, tipo, nombre, octet_length(datos) AS bytes`,
      [inv.id, tipo, String(nombre || "archivo").slice(0, 120), mime, buffer]
    );
    res.status(201).json(a);
  })
);

publicoNegocioRouter.delete(
  "/datos/:token/archivos/:id",
  capturar(async (req, res) => {
    const inv = await eventoPorToken(req.params.token);
    if (!inv) return res.status(404).json({ error: "Este enlace no existe" });
    await pool.query("DELETE FROM datos_archivos WHERE id = $1 AND invitacion_id = $2 AND NOT usado", [req.params.id, inv.id]);
    res.status(204).end();
  })
);
