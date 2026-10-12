import { pool } from "./db.js";
import { enviarMensaje, telefonosDe } from "./avisosWhatsapp.js";
import { ZONA_BOGOTA, ahoraEnBogota } from "./hora.js";

// Resumen diario del avance de confirmaciones: a la hora que eligió el dueño
// (hora de Colombia) le llega al cliente cómo va su evento, por los mismos
// números y el mismo canal de los avisos de cada respuesta.
//
// Solo sale si hubo respuestas nuevas desde el último resumen: un mensaje
// diario que siempre dice lo mismo cansa al cliente y, por el número
// vinculado, aumenta el riesgo de bloqueo. «Enviar resumen ahora» en el panel
// lo manda siempre, haya o no novedades.
//
// Por la API oficial va en la plantilla WHATSAPP_PLANTILLA_RESUMEN
// (sivu_resumen_diario) con 5 variables: evento, respondieron hoy, asisten,
// no asisten y sin responder.

const PLANTILLA = () => process.env.WHATSAPP_PLANTILLA_RESUMEN || "sivu_resumen_diario";

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

export async function armarResumen(invitacionId) {
  const { rows: [ev] } = await pool.query(
    `SELECT nombre, fecha_evento, avisos_resumen_ultimo,
            (fecha_evento - (now() AT TIME ZONE $2)::date) AS dias
     FROM invitaciones WHERE id = $1`,
    [invitacionId, ZONA_BOGOTA]
  );
  // «Nuevas» = desde el último resumen; el primero mira las últimas 24 horas.
  const desde = ev.avisos_resumen_ultimo || new Date(Date.now() - 24 * 3600 * 1000);
  const { rows: [c] } = await pool.query(
    `WITH por_invitado AS (
       SELECT i.id,
              bool_or(m.estado = 'confirmado') AS asiste,
              bool_and(m.estado = 'pendiente') AS pendiente,
              bool_or(m.estado <> 'pendiente' AND m.respondido_en > $2) AS nueva
       FROM invitados i JOIN invitado_miembros m ON m.invitado_id = i.id
       WHERE i.invitacion_id = $1 GROUP BY i.id
     )
     SELECT
       (SELECT count(*) FROM invitado_miembros m JOIN invitados i ON i.id = m.invitado_id
         WHERE i.invitacion_id = $1 AND m.estado = 'confirmado')::int AS personas_si,
       (SELECT count(*) FROM invitado_miembros m JOIN invitados i ON i.id = m.invitado_id
         WHERE i.invitacion_id = $1 AND m.estado = 'no_asistira')::int AS personas_no,
       count(*) FILTER (WHERE pendiente)::int AS sin_responder,
       count(*) FILTER (WHERE nueva)::int AS nuevas,
       count(*) FILTER (WHERE nueva AND asiste)::int AS nuevas_si
     FROM por_invitado`,
    [invitacionId, desde]
  );
  const nuevasNo = c.nuevas - c.nuevas_si;
  const hoy = c.nuevas
    ? `${plural(c.nuevas, "invitación", "invitaciones")} (${c.nuevas_si} sí, ${nuevasNo} no)`
    : "ninguna invitación nueva";
  const dias = ev.dias;
  const faltan = dias > 1 ? `Faltan ${dias} días.` : dias === 1 ? "¡Es mañana!" : dias === 0 ? "¡Es hoy!" : "";

  const textoChat = [
    `📊 *Avance de confirmaciones*`,
    `_${ev.nombre}_`,
    "",
    c.nuevas ? `Hoy respondieron ${hoy}.` : "Hoy no hubo respuestas nuevas.",
    "",
    `✅ Asisten: *${plural(c.personas_si, "persona", "personas")}*`,
    `❌ No asisten: ${plural(c.personas_no, "persona", "personas")}`,
    `⏳ Sin responder: ${plural(c.sin_responder, "invitación", "invitaciones")}`,
    faltan && "",
    faltan,
  ].filter((l) => l !== false && l !== undefined).join("\n").trim();

  return {
    hubo: c.nuevas > 0,
    textoChat,
    texto: `📊 Avance · ${ev.nombre}: hoy ${hoy}; asisten ${c.personas_si}, no ${c.personas_no}, sin responder ${c.sin_responder}`,
    variables: [ev.nombre, hoy, String(c.personas_si), String(c.personas_no), String(c.sin_responder)],
  };
}

// Manda el resumen de un evento y deja anotado cuándo, para no repetirlo.
export async function enviarResumen(invitacionId, { siempre = false } = {}) {
  const { rows: [ev] } = await pool.query("SELECT avisos_telefonos FROM invitaciones WHERE id = $1", [invitacionId]);
  const telefonos = telefonosDe(ev?.avisos_telefonos);
  if (!telefonos.length) return { omitido: "No hay números para avisar" };
  const r = await armarResumen(invitacionId);
  // El envío a mano (prueba) no cuenta como el resumen del día.
  if (!siempre) await pool.query("UPDATE invitaciones SET avisos_resumen_ultimo = now() WHERE id = $1", [invitacionId]);
  if (!r.hubo && !siempre) return { omitido: "Sin respuestas nuevas" };
  return enviarMensaje({
    invitacionId,
    telefonos,
    texto: r.texto,
    textoChat: r.textoChat,
    plantilla: PLANTILLA(),
    variables: r.variables,
  });
}

// Cada minuto revisa qué eventos tienen su resumen a esta hora y no lo han
// recibido hoy. Hasta el día del evento: después ya no tiene sentido.
async function revisar() {
  const { hora, fecha } = ahoraEnBogota();
  const { rows } = await pool.query(
    `SELECT id FROM invitaciones
     WHERE activo AND avisos_whatsapp AND avisos_resumen AND avisos_resumen_hora = $1
       AND (avisos_resumen_ultimo IS NULL OR (avisos_resumen_ultimo AT TIME ZONE $3)::date < $2::date)
       AND (fecha_evento IS NULL OR fecha_evento >= $2::date)`,
    [hora, fecha, ZONA_BOGOTA]
  );
  for (const { id } of rows) {
    try {
      const r = await enviarResumen(id);
      if (r.omitido) console.log(`Resumen diario del evento ${id}: ${r.omitido}`);
    } catch (e) {
      console.error(`No se pudo enviar el resumen diario del evento ${id}:`, e);
    }
  }
}

export function iniciarResumenes() {
  setInterval(() => revisar().catch((e) => console.error("Resumen diario:", e)), 60 * 1000);
}
