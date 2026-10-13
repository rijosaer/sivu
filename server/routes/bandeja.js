import { Router } from "express";
import { pool } from "../db.js";
import { capturar } from "../errores.js";
import { enviarArchivo, enviarTexto, whatsappConectado } from "../whatsappWeb.js";
import { guardarMedia, quienEs, registrar } from "../waOrden.js";
import { anotar } from "../prospectos.js";

// La bandeja de WhatsApp del panel: los chats del número de Sivú con
// clientes potenciales e invitados, como en WhatsApp Web. Se lee de
// mensajes_whatsapp (lo que waOrden guarda al llegar) y se responde por el
// mismo número vinculado. Solo el dueño (va dentro de /api/admin/crm).
export const bandejaRouter = Router();

const tel = (v) => String(v || "").replace(/\D/g, "");

// Lista de chats: el último mensaje de cada número, cuántos sin leer y a quién
// pertenece (cliente potencial o invitado de qué evento).
bandejaRouter.get(
  "/chats",
  capturar(async (_req, res) => {
    const { rows } = await pool.query(
      `WITH ult AS (
         SELECT DISTINCT ON (telefono) telefono, id, texto, tipo, direccion, creado_en
         FROM mensajes_whatsapp ORDER BY telefono, creado_en DESC, id DESC
       ), datos AS (
         SELECT telefono,
                count(*) FILTER (WHERE direccion = 'entrante' AND NOT leido)::int AS sin_leer,
                max(prospecto_id) AS prospecto_id, max(invitado_id) AS invitado_id, max(invitacion_id) AS invitacion_id,
                max(nombre_contacto) FILTER (WHERE nombre_contacto <> '') AS nombre_contacto
         FROM mensajes_whatsapp GROUP BY telefono
       )
       SELECT u.telefono, u.texto, u.tipo, u.direccion, u.creado_en, d.sin_leer, d.nombre_contacto,
              p.id AS prospecto_id, p.nombre AS prospecto, p.estado,
              v.id AS invitado_id, v.nombre AS invitado,
              i.id AS invitacion_id, i.nombre AS evento
       FROM ult u JOIN datos d USING (telefono)
       LEFT JOIN prospectos p ON p.id = d.prospecto_id
       LEFT JOIN invitados v ON v.id = d.invitado_id
       LEFT JOIN invitaciones i ON i.id = d.invitacion_id
       ORDER BY u.creado_en DESC
       LIMIT 500`
    );
    res.json(rows);
  })
);

// Una conversación completa, con lo que se sabe de esa persona.
bandejaRouter.get(
  "/chats/:telefono",
  capturar(async (req, res) => {
    const t = tel(req.params.telefono);
    const { rows: mensajes } = await pool.query(
      `SELECT * FROM (
         SELECT m.id, m.direccion, m.texto, m.tipo, m.creado_en, m.leido, m.nombre_contacto,
                mm.mime, mm.nombre AS archivo, mm.segundos, mm.bytes, mm.error AS error_archivo,
                (mm.datos IS NOT NULL) AS tiene_archivo
         FROM mensajes_whatsapp m LEFT JOIN mensajes_media mm ON mm.mensaje_id = m.id
         WHERE m.telefono = $1
         ORDER BY m.creado_en DESC, m.id DESC
         LIMIT 400
       ) x ORDER BY creado_en, id`,
      [t]
    );
    if (!mensajes.length) return res.status(404).json({ error: "No hay conversación con ese número" });

    const quien = await quienEs(t);
    let invitado = null;
    if (quien.invitado) {
      const { rows: [r] } = await pool.query(
        `SELECT v.id, v.nombre, v.codigo, v.cupos, v.enviado_en, i.id AS invitacion_id, i.nombre AS evento, i.slug,
                count(mb.*) FILTER (WHERE mb.estado = 'confirmado')::int AS confirmados,
                count(mb.*) FILTER (WHERE mb.estado = 'no_asistira')::int AS no_asisten,
                count(mb.*) FILTER (WHERE mb.estado = 'pendiente')::int AS pendientes
         FROM invitados v JOIN invitaciones i ON i.id = v.invitacion_id
         LEFT JOIN invitado_miembros mb ON mb.invitado_id = v.id
         WHERE v.id = $1 GROUP BY v.id, i.id`,
        [quien.invitado.id]
      );
      invitado = r || null;
    }
    res.json({
      telefono: t,
      mensajes,
      prospecto: quien.prospecto,
      invitado,
      cliente: quien.cliente,
      whatsapp: whatsappConectado(),
    });
  })
);

bandejaRouter.post(
  "/chats/:telefono/leido",
  capturar(async (req, res) => {
    const t = tel(req.params.telefono);
    await pool.query("UPDATE mensajes_whatsapp SET leido = true WHERE telefono = $1 AND NOT leido", [t]);
    await pool.query("UPDATE prospectos SET sin_leer = 0 WHERE telefono = $1", [t]);
    res.status(204).end();
  })
);

// El archivo de un mensaje (foto, audio, video, documento).
bandejaRouter.get(
  "/media/:id",
  capturar(async (req, res) => {
    const { rows: [a] } = await pool.query("SELECT mime, nombre, datos FROM mensajes_media WHERE mensaje_id = $1", [
      Number(req.params.id) || 0,
    ]);
    if (!a?.datos) return res.status(404).json({ error: "Ese archivo no está guardado" });
    res.set("Content-Type", a.mime || "application/octet-stream");
    res.set("Cache-Control", "private, max-age=604800");
    if (a.nombre) res.set("Content-Disposition", `inline; filename="${encodeURIComponent(a.nombre)}"`);
    res.send(a.datos);
  })
);

// Guarda lo que se acaba de mandar desde el panel. Normalmente WhatsApp lo
// devuelve solo (y waOrden lo guarda), pero así queda aunque tarde.
async function guardarEnviado(r, buffer) {
  if (!r?.mensaje) return null;
  const msg = { ...r.mensaje, key: { ...r.mensaje.key, fromMe: true } };
  let id = await registrar(msg, "append").catch(() => null);
  if (!id && r.key?.id) {
    const { rows: [m] } = await pool.query("SELECT id FROM mensajes_whatsapp WHERE wa_id = $1", [r.key.id]);
    id = m?.id || null;
  }
  if (id && buffer) await guardarMedia(id, msg, buffer).catch(() => {});
  return id;
}

async function anotarSiEsCliente(telefono, nota) {
  const { rows: [p] } = await pool.query("SELECT id FROM prospectos WHERE telefono = $1", [telefono]);
  if (p) await anotar(p.id, "mensaje", nota);
}

bandejaRouter.post(
  "/chats/:telefono/enviar",
  capturar(async (req, res) => {
    const t = tel(req.params.telefono);
    const texto = String(req.body.texto || "").trim().slice(0, 4000);
    if (!texto) return res.status(400).json({ error: "Escribe el mensaje" });
    if (!whatsappConectado()) return res.status(400).json({ error: "El WhatsApp de Sivú no está vinculado" });
    const r = await enviarTexto(t, texto);
    if (r.estado !== "enviado") return res.status(400).json({ error: r.detalle || "No se pudo enviar" });
    await guardarEnviado(r);
    await anotarSiEsCliente(t, "Mensaje enviado desde la bandeja del panel");
    res.json({ ok: true });
  })
);

// Fotos, documentos y audios desde el panel. Llegan como data URL (hasta
// 12 MB de archivo; el servidor acepta cuerpos de hasta 20 MB).
const TIPO_POR_MIME = (mime) =>
  mime.startsWith("image/") ? "imagen" : mime.startsWith("video/") ? "video" : mime.startsWith("audio/") ? "audio" : "documento";

bandejaRouter.post(
  "/chats/:telefono/archivo",
  capturar(async (req, res) => {
    const t = tel(req.params.telefono);
    const m = /^data:([^;,]+)[^,]*;base64,(.+)$/s.exec(String(req.body.archivo || ""));
    if (!m) return res.status(400).json({ error: "No llegó el archivo" });
    const buffer = Buffer.from(m[2], "base64");
    if (buffer.length > 12 * 1024 * 1024) return res.status(400).json({ error: "El archivo pesa más de 12 MB" });
    if (!whatsappConectado()) return res.status(400).json({ error: "El WhatsApp de Sivú no está vinculado" });
    const mime = m[1];
    const r = await enviarArchivo(t, {
      tipo: TIPO_POR_MIME(mime),
      buffer,
      mime,
      nombre: String(req.body.nombre || "").slice(0, 200),
      texto: String(req.body.texto || "").slice(0, 1000),
    });
    if (r.estado !== "enviado") return res.status(400).json({ error: r.detalle || "No se pudo enviar" });
    await guardarEnviado(r, buffer);
    await anotarSiEsCliente(t, "Archivo enviado desde la bandeja del panel");
    res.json({ ok: true });
  })
);
