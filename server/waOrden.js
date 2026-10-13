import { pool } from "./db.js";
import {
  alRecibirMensajes, descargarMedia, enviarTexto, esAutomatico, etiquetasConocidas, numeroVinculado, socketActual, whatsappConectado,
} from "./whatsappWeb.js";
import { normalizarTelefono } from "./avisosWhatsapp.js";
import { leerAjuste, telefonosAviso } from "./ajustes.js";
import { anotar, crearOUnir } from "./prospectos.js";
import { saludarSiToca } from "./saludo.js";

// Orden del WhatsApp de Sivú. Por el mismo número pasan clientes potenciales,
// clientes con contrato y cientos de invitaciones; para que no sea un
// reguero:
//  - Cada mensaje que entra o sale se guarda y se amarra a quien corresponde:
//    al cliente potencial, o al invitado y su evento. Así el panel muestra la
//    conversación de cada cliente y las respuestas de los invitados de cada
//    evento aunque el chat esté archivado.
//  - Quien escribe por primera vez y no es invitado, cliente ni del equipo se
//    vuelve cliente potencial (origen «WhatsApp»).
//  - Si el dueño le escribe desde el celular a un cliente nuevo, la ficha
//    pasa sola a «Contactado».
//  - Etiquetas de WhatsApp Business: 🎯 Cliente potencial, 💼 Cliente y una
//    por evento para los invitados; y los chats de invitados se archivan
//    después de enviarles su invitación.
// Todo lo de etiquetas y archivo es «mejor esfuerzo»: si WhatsApp lo rechaza,
// se anota en el registro y el envío sigue normal.

// ---------- Utilidades ----------

const digitos = (jid) => String(jid || "").split("@")[0].split(":")[0];

// El número detrás de un chat. Con las cuentas nuevas WhatsApp identifica a
// algunos contactos con un «LID» en vez del número; se traduce.
async function telefonoDelChat(key) {
  const jid = key?.remoteJid || "";
  if (jid.endsWith("@s.whatsapp.net")) return digitos(jid);
  if (key?.remoteJidAlt?.endsWith?.("@s.whatsapp.net")) return digitos(key.remoteJidAlt);
  if (jid.endsWith("@lid")) {
    try {
      const pn = await socketActual()?.signalRepository?.lidMapping?.getPNForLID(jid);
      if (pn) return digitos(pn);
    } catch {
      /* sin traducción: se omite */
    }
  }
  return "";
}

function desenvolver(m) {
  let msg = m || {};
  for (let i = 0; i < 4; i++) {
    const dentro =
      msg.ephemeralMessage?.message ||
      msg.viewOnceMessage?.message ||
      msg.viewOnceMessageV2?.message ||
      msg.documentWithCaptionMessage?.message ||
      msg.editedMessage?.message;
    if (!dentro) break;
    msg = dentro;
  }
  return msg;
}

export function contenido(message) {
  const m = desenvolver(message);
  if (m.conversation) return { tipo: "texto", texto: m.conversation };
  if (m.extendedTextMessage) return { tipo: "texto", texto: m.extendedTextMessage.text || "" };
  if (m.imageMessage) return { tipo: "imagen", texto: m.imageMessage.caption || "" };
  if (m.videoMessage) return { tipo: "video", texto: m.videoMessage.caption || "" };
  if (m.audioMessage) return { tipo: "audio", texto: "" };
  if (m.documentMessage) return { tipo: "documento", texto: m.documentMessage.fileName || m.documentMessage.caption || "" };
  if (m.stickerMessage) return { tipo: "sticker", texto: "" };
  if (m.contactMessage) return { tipo: "otro", texto: `Contacto: ${m.contactMessage.displayName || ""}` };
  if (m.locationMessage) return { tipo: "otro", texto: "Ubicación" };
  // Reacciones, recibos, cambios de protocolo...: no son conversación.
  return null;
}

// Datos del archivo de un mensaje (foto, audio...), si trae uno.
function archivoDe(message) {
  const m = desenvolver(message);
  const a = m.imageMessage || m.videoMessage || m.audioMessage || m.documentMessage || m.stickerMessage;
  if (!a) return null;
  return {
    mime: a.mimetype || "",
    nombre: m.documentMessage?.fileName || "",
    segundos: a.seconds || null,
    bytes: Number(a.fileLength || 0),
  };
}

// Hasta este tamaño se guarda el archivo en la base; lo más pesado (videos
// largos) queda anotado y se ve en el celular.
const MAX_MEDIA = 16 * 1024 * 1024;

export async function guardarMedia(mensajeId, m, buffer = null) {
  const a = archivoDe(m.message);
  if (!a) return;
  let datos = buffer;
  let error = "";
  if (!datos) {
    if (a.bytes > MAX_MEDIA) error = "Archivo muy pesado: ábrelo en el celular";
    else {
      try {
        datos = await descargarMedia(m);
      } catch (e) {
        error = `No se pudo descargar: ${e.message}`.slice(0, 300);
      }
    }
  }
  await pool.query(
    `INSERT INTO mensajes_media (mensaje_id, mime, nombre, segundos, bytes, datos, error)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (mensaje_id) DO UPDATE SET datos = COALESCE(mensajes_media.datos, EXCLUDED.datos),
       error = CASE WHEN mensajes_media.datos IS NULL THEN EXCLUDED.error ELSE '' END,
       bytes = GREATEST(mensajes_media.bytes, EXCLUDED.bytes)`,
    [mensajeId, a.mime.split(";")[0], a.nombre.slice(0, 200), a.segundos, datos ? datos.length : a.bytes, datos, error]
  );
}

const ultimos10 = (t) => String(t).slice(-10);

// ¿Quién es este número para Sivú?
export async function quienEs(telefono) {
  const t10 = ultimos10(telefono);
  const [pros, inv, cliente, ignorado] = await Promise.all([
    pool.query("SELECT * FROM prospectos WHERE telefono = $1", [telefono]),
    // El invitado más reciente con ese número (principal o auxiliar), de un
    // evento que no sea plantilla.
    pool.query(
      `SELECT v.id, v.nombre, v.invitacion_id, i.nombre AS evento
       FROM invitados v JOIN invitaciones i ON i.id = v.invitacion_id
       WHERE NOT i.es_plantilla
         AND (right(regexp_replace(v.telefono, '\\D', '', 'g'), 10) = $1
              OR right(regexp_replace(v.telefono_aux, '\\D', '', 'g'), 10) = $1)
       ORDER BY i.fecha_evento DESC NULLS LAST, v.id DESC LIMIT 1`,
      [t10]
    ),
    // Clientes con contrato: el teléfono del cliente en producción o los
    // números de avisos del evento.
    pool.query(
      `SELECT id, nombre FROM invitaciones
       WHERE right(regexp_replace(cliente_telefono, '\\D', '', 'g'), 10) = $1
          OR avisos_telefonos LIKE '%' || $1 || '%'
       ORDER BY creado_en DESC LIMIT 1`,
      [t10]
    ),
    pool.query("SELECT 1 FROM wa_ignorados WHERE telefono = $1", [telefono]),
  ]);
  return {
    prospecto: pros.rows[0] || null,
    invitado: inv.rows[0] || null,
    cliente: cliente.rows[0] || null,
    ignorado: ignorado.rowCount > 0,
  };
}

// ---------- Etiquetas de WhatsApp Business ----------

const COLORES = { "🎯 Cliente potencial": 3, "💼 Cliente": 5, "💌 Invitados": 9 };
let avisadoEtiquetas = false;

async function idEtiqueta(nombre) {
  const { rows } = await pool.query("SELECT label_id FROM wa_etiquetas WHERE nombre = $1", [nombre]);
  if (rows.length) return rows[0].label_id;
  const sock = socketActual();
  if (!sock) return null;
  // Un id libre: por encima de las etiquetas que ya tiene la cuenta.
  const { rows: propias } = await pool.query("SELECT label_id FROM wa_etiquetas");
  const usados = [...etiquetasConocidas().keys(), ...propias.map((r) => r.label_id)].map(Number).filter(Number.isFinite);
  const id = String(Math.max(30, ...usados) + 1);
  await sock.addLabel("", { id, name: nombre, color: COLORES[nombre] ?? (Number(id) % 20), deleted: false });
  await pool.query("INSERT INTO wa_etiquetas (nombre, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [nombre, id]);
  return id;
}

// Una etiqueta por evento para sus invitados («💌 Tres Vidas»). WhatsApp
// Business permite pocas etiquetas, así que pasadas 15 propias se usa la
// general «💌 Invitados».
async function nombreEtiquetaEvento(invitacionId) {
  const { rows: [inv] } = await pool.query("SELECT nombre FROM invitaciones WHERE id = $1", [invitacionId]);
  const nombre = `💌 ${String(inv?.nombre || "Invitados").replace(/\s+/g, " ").trim().slice(0, 22)}`;
  const { rows } = await pool.query("SELECT 1 FROM wa_etiquetas WHERE nombre = $1", [nombre]);
  if (rows.length) return nombre;
  const { rows: [{ n }] } = await pool.query("SELECT count(*)::int AS n FROM wa_etiquetas");
  return n >= 15 ? "💌 Invitados" : nombre;
}

export async function etiquetar(jid, nombre) {
  try {
    const { etiquetar: activo } = await leerAjuste("whatsapp");
    const sock = socketActual();
    if (!activo || !sock || !jid) return false;
    const id = await idEtiqueta(nombre);
    if (!id) return false;
    await sock.addChatLabel(jid, id);
    return true;
  } catch (e) {
    if (!avisadoEtiquetas) console.error("WhatsApp (etiquetas):", e.message);
    avisadoEtiquetas = true;
    return false;
  }
}

export const jidDe = (telefono) => `${normalizarTelefono(telefono)}@s.whatsapp.net`;

// Después de mandarle la invitación a un invitado: etiqueta del evento y al
// archivo, para que la bandeja principal quede para los clientes.
export async function ordenarChatInvitado(resultado, invitacionId) {
  if (!resultado?.jid) return;
  try {
    await etiquetar(resultado.jid, await nombreEtiquetaEvento(invitacionId));
    const { archivarInvitados } = await leerAjuste("whatsapp");
    const sock = socketActual();
    if (archivarInvitados && sock && resultado.key && resultado.timestamp) {
      await sock.chatModify(
        { archive: true, lastMessages: [{ key: resultado.key, messageTimestamp: resultado.timestamp }] },
        resultado.jid
      );
    }
  } catch (e) {
    if (!avisadoEtiquetas) console.error("WhatsApp (archivar):", e.message);
    avisadoEtiquetas = true;
  }
}

// ---------- Mensajes ----------

async function avisarEquipo(texto) {
  if (!whatsappConectado()) return;
  for (const tel of await telefonosAviso()) {
    const r = await enviarTexto(tel, texto);
    if (r.estado !== "enviado") console.error(`Aviso a +${tel}:`, r.detalle);
  }
}

export function textoAvisoWhatsapp(p, primerMensaje) {
  return [
    "🎯 *Nuevo cliente potencial · por WhatsApp*",
    "",
    `👤 ${p.nombre || "Sin nombre"}`,
    `📱 +${p.telefono} · wa.me/${p.telefono}`,
    "",
    primerMensaje ? `💬 «${primerMensaje.slice(0, 300)}»` : "💬 (mandó un archivo)",
    ...(process.env.PANEL_URL ? ["", `_Ficha en el panel: ${process.env.PANEL_URL}_`] : []),
  ].join("\n");
}

export async function registrar(m, tipoUpsert) {
  const key = m.key || {};
  const jid = key.remoteJid || "";
  if (!jid || jid === "status@broadcast" || jid.endsWith("@g.us") || jid.endsWith("@newsletter") || jid.endsWith("@broadcast")) return;
  const c = contenido(m.message);
  if (!c) return;
  const telefono = await telefonoDelChat(key);
  if (!telefono || telefono === numeroVinculado()) return;

  // Mensajes con el equipo (avisos, reportes): no son conversación de clientes.
  const equipo = await telefonosAviso();
  if (equipo.includes(telefono)) return;

  const saliente = Boolean(key.fromMe);
  const quien = await quienEs(telefono);
  let prospecto = quien.prospecto;

  // Alguien nuevo escribe: se vuelve cliente potencial si no es invitado,
  // cliente ni un número marcado como «no es cliente».
  let esNuevo = false;
  if (!saliente && !prospecto && !quien.invitado && !quien.cliente && !quien.ignorado && tipoUpsert === "notify") {
    const { whatsappDirecto } = await leerAjuste("captura");
    if (whatsappDirecto) {
      const r = await crearOUnir({ origen: "whatsapp", nombre: m.pushName || "", telefono });
      prospecto = r.prospecto;
      esNuevo = r.nuevo;
    }
  }

  // Solo se guarda lo de clientes potenciales e invitados: las demás
  // conversaciones del número (amigos, proveedores) no son asunto del panel.
  if (!prospecto && !quien.invitado) return;

  // La hora real del mensaje (los que llegan al reconectar traen la suya).
  const ts = Number(m.messageTimestamp?.low ?? m.messageTimestamp) || 0;
  const { rows: [nuevo] } = await pool.query(
    `INSERT INTO mensajes_whatsapp
       (wa_id, telefono, direccion, texto, tipo, nombre_contacto, prospecto_id, invitacion_id, invitado_id, leido, creado_en)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE(to_timestamp(NULLIF($11, 0)), now()))
     ON CONFLICT (wa_id) WHERE wa_id IS NOT NULL DO NOTHING
     RETURNING id`,
    [
      key.id || null,
      telefono,
      saliente ? "saliente" : "entrante",
      c.texto.slice(0, 4000),
      c.tipo,
      saliente ? "" : String(m.pushName || "").slice(0, 80),
      prospecto?.id || null,
      prospecto ? null : quien.invitado?.invitacion_id || null,
      prospecto ? null : quien.invitado?.id || null,
      saliente,
      ts,
    ]
  );
  if (!nuevo) return null; // ya estaba guardado

  // Fotos, audios y documentos: se bajan aparte para no frenar lo demás.
  if (archivoDe(m.message)) {
    guardarMedia(nuevo.id, m).catch((e) => console.error("WhatsApp (guardar archivo):", e.message));
  }

  if (prospecto) {
    if (saliente && esAutomatico(telefono)) {
      // El saludo automático no cuenta como que alguien ya lo atendió.
      await pool.query("UPDATE prospectos SET ultimo_saliente = now() WHERE id = $1", [prospecto.id]);
    } else if (saliente) {
      // El dueño le escribió (desde el celular o el panel): ya está contactado.
      const { rows: [p] } = await pool.query(
        `UPDATE prospectos SET ultimo_saliente = now(),
           estado = CASE WHEN estado = 'nuevo' THEN 'contactado' ELSE estado END,
           contactado_en = COALESCE(contactado_en, CASE WHEN estado = 'nuevo' THEN now() END),
           actualizado_en = now()
         WHERE id = $1 RETURNING estado, contactado_en`,
        [prospecto.id]
      );
      if (prospecto.estado === "nuevo" && p?.estado === "contactado") {
        await anotar(prospecto.id, "estado", "Pasó a contactado: le escribiste por WhatsApp");
      }
    } else {
      await pool.query(
        `UPDATE prospectos SET ultimo_entrante = now(), sin_leer = sin_leer + 1,
           nombre = CASE WHEN nombre = '' THEN $2 ELSE nombre END
         WHERE id = $1`,
        [prospecto.id, String(m.pushName || "").slice(0, 120)]
      );
    }
  }

  if (esNuevo && prospecto) {
    await etiquetar(jid, "🎯 Cliente potencial");
    const { whatsappDirecto } = await leerAjuste("avisos");
    if (whatsappDirecto) await avisarEquipo(textoAvisoWhatsapp(prospecto, c.texto));
    const { responderWhatsappDirecto } = await leerAjuste("saludo");
    if (responderWhatsappDirecto) await saludarSiToca(prospecto.id);
  }
  return nuevo.id;
}

export function iniciarOrdenWhatsapp() {
  alRecibirMensajes(async (u) => {
    for (const m of u.messages || []) {
      try {
        await registrar(m, u.type);
      } catch (e) {
        console.error("WhatsApp (registrar mensaje):", e.message);
      }
    }
  });
}

// Marca como cliente (💼) el chat de un prospecto ganado.
export async function etiquetarCliente(telefono) {
  if (telefono) await etiquetar(jidDe(telefono), "💼 Cliente");
}

// Mandar un mensaje desde el panel. Queda guardado al volver por
// messages.upsert; aquí solo se anota en la ficha.
export async function enviarDesdePanel(prospecto, texto) {
  const r = await enviarTexto(prospecto.telefono, texto);
  if (r.estado === "enviado") await anotar(prospecto.id, "mensaje", "Mensaje enviado desde el panel");
  return r;
}
