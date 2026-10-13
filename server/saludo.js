import { pool } from "./db.js";
import { enviarTexto, whatsappConectado } from "./whatsappWeb.js";
import { ahoraEnBogota } from "./hora.js";
import {
  leerAjuste, rellenar, describirHorario, dentroDeHorario, proximaAtencion, EVENTO_EN_FRASE,
} from "./ajustes.js";
import { anotar } from "./prospectos.js";

// Mensaje automático al cliente potencial: «recibimos tu solicitud, una
// persona te escribirá». Nadie está pendiente del WhatsApp las 24 horas, así
// que no arma nada ni promete tiempos: solo confirma, dice el horario (si
// está definido) y pide adelantar los datos. Todo se edita en el panel
// (Clientes potenciales → Configuración) y arranca apagado.

export async function textoSaludo(prospecto, ahora = new Date()) {
  const [saludo, horario] = await Promise.all([leerAjuste("saludo"), leerAjuste("horario")]);
  const dentro = dentroDeHorario(horario, ahora);
  return rellenar(dentro ? saludo.texto : saludo.textoFueraHorario, {
    nombre: (prospecto.nombre || "").split(/\s+/)[0] || "",
    evento: EVENTO_EN_FRASE[prospecto.evento] || "tu evento",
    horario: describirHorario(horario),
    proxima_atencion: proximaAtencion(horario, ahora),
  }).replace(/^¡Hola !/, "¡Hola!");
}

// Le escribe si el saludo está prendido, si es hora de escribir y si nadie
// lo ha atendido todavía. Devuelve true si salió.
export async function saludarSiToca(prospectoId) {
  const saludo = await leerAjuste("saludo");
  if (!saludo.activo || !whatsappConectado()) return false;
  const { hora } = ahoraEnBogota();
  if (hora < saludo.enviarDesde || hora >= saludo.enviarHasta) return false;
  const { rows: [p] } = await pool.query("SELECT * FROM prospectos WHERE id = $1", [prospectoId]);
  if (!p || p.saludado_en || p.estado !== "nuevo" || String(p.telefono).length < 11) return false;
  // Se marca antes de enviar: si algo falla a mitad, no se le escribe dos veces.
  const { rowCount } = await pool.query(
    "UPDATE prospectos SET saludado_en = now() WHERE id = $1 AND saludado_en IS NULL",
    [p.id]
  );
  if (!rowCount) return false;
  const r = await enviarTexto(p.telefono, await textoSaludo(p), { automatico: true });
  if (r.estado === "enviado") {
    await anotar(p.id, "saludo", "Se le envió el mensaje automático de bienvenida");
    return true;
  }
  await anotar(p.id, "saludo", `No salió el mensaje automático: ${r.detalle}`);
  return false;
}

// Los que quedaron esperando (llegaron de noche o con el WhatsApp
// desvinculado): se saludan en cuanto se pueda, si no pasó más de un día.
export async function saludarPendientes() {
  const saludo = await leerAjuste("saludo");
  if (!saludo.activo) return;
  const origenes = saludo.responderWhatsappDirecto ? ["anuncio", "whatsapp"] : ["anuncio"];
  const { rows } = await pool.query(
    `SELECT id FROM prospectos
     WHERE saludado_en IS NULL AND estado = 'nuevo' AND origen = ANY($1)
       AND creado_en > now() - interval '24 hours'
     ORDER BY creado_en`,
    [origenes]
  );
  for (const { id } of rows) await saludarSiToca(id);
}
