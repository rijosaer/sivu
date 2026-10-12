import { pool } from "./db.js";
import { enviarTexto, whatsappConectado } from "./whatsappWeb.js";

// Avisos por WhatsApp en tiempo real: cuando un invitado responde desde su
// enlace, se le escribe al cliente (los números que el dueño puso en el
// evento) si asiste o no.
//
// Sale por uno de dos caminos, en este orden:
//  1. API oficial de WhatsApp Business (Cloud API de Meta), si están
//     WHATSAPP_TOKEN y WHATSAPP_NUMERO_ID. Como el mensaje lo inicia Sivú,
//     va en una plantilla aprobada con dos variables (docs/avisos-whatsapp.md):
//     {{1}} nombre del evento · {{2}} quién y si asiste.
//     Opcionales: WHATSAPP_PLANTILLA (sivu_respuesta_invitado), WHATSAPP_IDIOMA (es).
//  2. El número de Sivú vinculado como WhatsApp Web desde el panel
//     (whatsappWeb.js). Provisional: no es un canal autorizado por WhatsApp.
// Si no hay ninguno, el aviso se anota como «simulado» y no sale.

const API = "https://graph.facebook.com/v21.0";
const PLANTILLA = () => process.env.WHATSAPP_PLANTILLA || "sivu_respuesta_invitado";
const IDIOMA = () => process.env.WHATSAPP_IDIOMA || "es";
const hayApiOficial = () => Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_NUMERO_ID);

export const avisosListos = () => hayApiOficial() || whatsappConectado();

// Igual que el panel (admin-panel/src/whatsapp.js): un número colombiano de
// 10 dígitos se completa con el 57; si ya trae indicativo se respeta.
export function normalizarTelefono(valor) {
  const digitos = String(valor || "").replace(/\D/g, "");
  if (!digitos) return "";
  if (digitos.length === 10) return "57" + digitos;
  return digitos.replace(/^0+/, "");
}

export function telefonosDe(texto) {
  return [...new Set(String(texto || "").split(/[,;\n]+/).map(normalizarTelefono).filter((t) => t.length >= 11))];
}

// Solo si asiste o no: si alguien de la invitación va, cuenta como que asiste.
export function describirRespuesta(invitado, miembros) {
  // "nombre" es como se le escribió la invitación («Familia Rodríguez»).
  const quien = invitado.nombre || invitado.familia || "Un invitado";
  const asiste = miembros.some((m) => m.estado === "confirmado");
  return { quien, asiste, frase: asiste ? `${quien} confirmó que asiste` : `${quien} no asistirá` };
}

// Las variables de una plantilla no pueden llevar saltos de línea, tabuladores
// ni más de 4 espacios seguidos (Meta las rechaza).
const limpio = (t) => String(t).replace(/[\n\r\t]+/g, " ").replace(/ {2,}/g, " ").trim();

async function enviarPlantilla(telefono, variables, plantilla = PLANTILLA()) {
  try {
    const r = await fetch(`${API}/${process.env.WHATSAPP_NUMERO_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: telefono,
        type: "template",
        template: {
          name: plantilla,
          language: { code: IDIOMA() },
          components: [{ type: "body", parameters: variables.map((v) => ({ type: "text", text: limpio(v) })) }],
        },
      }),
      signal: AbortSignal.timeout(10000),
    });
    const datos = await r.json().catch(() => ({}));
    if (!r.ok) {
      const e = datos.error || {};
      return { estado: "error", detalle: `${e.code || r.status}: ${e.error_data?.details || e.message || "respuesta inesperada de WhatsApp"}` };
    }
    return { estado: "enviado", detalle: datos.messages?.[0]?.id || "" };
  } catch (e) {
    return { estado: "error", detalle: e.name === "TimeoutError" ? "WhatsApp no respondió a tiempo" : e.message };
  }
}

// Manda un mensaje a varios números y deja cada intento anotado. "texto" es
// la versión de una línea que se guarda y se ve en el panel; "textoChat" la
// que sale por el número vinculado; "plantilla" y "variables", lo que sale por
// la API oficial.
export async function enviarMensaje({ invitacionId, invitadoId = null, telefonos, texto, textoChat, plantilla, variables }) {
  const resultados = [];
  for (const telefono of telefonos) {
    let r;
    if (hayApiOficial()) r = await enviarPlantilla(telefono, variables, plantilla);
    else if (whatsappConectado()) r = await enviarTexto(telefono, textoChat);
    else {
      r = { estado: "simulado", detalle: "No hay WhatsApp vinculado ni cuenta oficial" };
      console.log(`[aviso simulado → ${telefono}] ${textoChat}`);
    }
    await pool.query(
      `INSERT INTO avisos_enviados (invitacion_id, invitado_id, telefono, texto, estado, detalle)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [invitacionId, invitadoId, telefono, texto, r.estado, r.detalle]
    );
    resultados.push({ telefono, ...r });
  }
  return { texto, resultados };
}

// Aviso de una respuesta: solo si asiste o no.
export function enviarAviso({ invitacionId, invitadoId = null, telefonos, evento, respuesta }) {
  const icono = respuesta.asiste ? "✅" : "❌";
  return enviarMensaje({
    invitacionId,
    invitadoId,
    telefonos,
    texto: `${icono} ${respuesta.frase} · ${evento}`,
    // Por el número vinculado va como un chat normal: nombre en negrita y el
    // evento en cursiva debajo.
    textoChat: `${icono} *${respuesta.quien}* ${respuesta.asiste ? "confirmó que asiste" : "no asistirá"}\n_${evento}_`,
    plantilla: PLANTILLA(),
    variables: [evento, respuesta.frase],
  });
}

// En qué quedó la invitación: "si" si alguien va, "no" si respondieron que
// no, "pendiente" si aún no responden. Se compara antes y después de guardar.
export async function fotoRespuestas(invitadoId) {
  const { rows } = await pool.query("SELECT estado FROM invitado_miembros WHERE invitado_id = $1", [invitadoId]);
  if (rows.some((m) => m.estado === "confirmado")) return "si";
  if (rows.some((m) => m.estado === "no_asistira")) return "no";
  return "pendiente";
}

// Se llama después de guardar la respuesta de un invitado. No avisa si el
// evento no lo tiene prendido, si el sí o el no siguen igual, o si todo
// quedó pendiente. Nunca lanza: un aviso fallido no debe
// tumbar la confirmación del invitado, que ya quedó guardada.
export async function avisarRespuesta({ invitacionId, invitadoId, antes }) {
  try {
    const ev = await pool.query(
      "SELECT nombre, avisos_whatsapp, avisos_telefonos FROM invitaciones WHERE id = $1",
      [invitacionId]
    );
    const evento = ev.rows[0];
    if (!evento?.avisos_whatsapp) return;
    const telefonos = telefonosDe(evento.avisos_telefonos);
    if (!telefonos.length) return;

    // Solo se avisa si cambió el sí o el no (no por un acompañante más o menos).
    const ahora = await fotoRespuestas(invitadoId);
    if (ahora === antes || ahora === "pendiente") return;
    const inv = await pool.query("SELECT nombre, familia FROM invitados WHERE id = $1", [invitadoId]);
    const miembros = await pool.query("SELECT estado FROM invitado_miembros WHERE invitado_id = $1", [invitadoId]);

    await enviarAviso({
      invitacionId,
      invitadoId,
      telefonos,
      evento: evento.nombre,
      respuesta: describirRespuesta(inv.rows[0] || {}, miembros.rows),
    });
  } catch (e) {
    console.error("No se pudo enviar el aviso por WhatsApp:", e);
  }
}
