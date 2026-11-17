import { pool } from "./db.js";
import { enviarTexto, whatsappConectado } from "./whatsappWeb.js";
import { ahoraEnBogota } from "./hora.js";
import { ordenarChatInvitado } from "./waOrden.js";

// Envío automático de invitaciones por el número de Sivú vinculado.
//
// Ritmo «moderado» (lo eligió el dueño, sabiendo el riesgo): entre un mensaje
// y otro pasa un tiempo al azar de 20 a 45 segundos, y cada 20 mensajes hay un
// descanso de 5 a 10 minutos. Solo se envía dentro de la franja del envío
// (por defecto 8 a. m. a 8 p. m., hora de Colombia; el dueño la puede cambiar);
// fuera de ella la cola espera a la próxima apertura. Nunca hay
// dos envíos a la vez, aunque sean de eventos distintos: el número es uno.
//
// Se detiene solo si el WhatsApp se desvincula o si fallan 3 seguidos por
// algo que no sea el número del invitado: insistir con un número que WhatsApp
// está frenando es lo que termina en bloqueo.

export const RITMO = {
  pausaMin: 20_000,
  pausaMax: 45_000,
  tanda: 20,
  descansoMin: 5 * 60_000,
  descansoMax: 10 * 60_000,
  desde: 8,
  hasta: 20,
  fallosParaDetener: 3,
};

const azar = (min, max) => Math.round(min + Math.random() * (max - min));

// Errores que son del número del invitado, no del canal: no cuentan para
// detener la cola.
const ERROR_DEL_NUMERO = /no tiene WhatsApp/i;

// Cada envío tiene su franja (hora_desde / hora_hasta, 24 = medianoche); los
// envíos viejos sin ella usan la de RITMO.
const franja = (envio) => ({
  desde: Number.isInteger(envio?.hora_desde) ? envio.hora_desde : RITMO.desde,
  hasta: Number.isInteger(envio?.hora_hasta) ? envio.hora_hasta : RITMO.hasta,
});

// Próxima apertura de la franja en Colombia (UTC-5 todo el año) como fecha absoluta.
function proximaApertura(envio) {
  const { desde } = franja(envio);
  const { fecha, hora } = ahoraEnBogota();
  const dia = new Date(`${fecha}T${String(desde).padStart(2, "0")}:00:00-05:00`);
  if (hora >= desde) dia.setUTCDate(dia.getUTCDate() + 1);
  return dia;
}

export const enHorario = (envio) => {
  const { desde, hasta } = franja(envio);
  const { hora } = ahoraEnBogota();
  return hora >= desde && hora < hasta;
};

export const horaLegible = (h) =>
  h === 0 || h === 24 ? "12 a. m." : h === 12 ? "12 p. m." : h < 12 ? `${h} a. m.` : `${h - 12} p. m.`;

async function actualizar(id, campos) {
  const claves = Object.keys(campos);
  const sets = claves.map((c, i) => `${c} = $${i + 2}`).join(", ");
  await pool.query(
    `UPDATE envios_masivos SET ${sets}, actualizado_en = now() WHERE id = $1`,
    [id, ...claves.map((c) => campos[c])]
  );
}

let ocupado = false;

async function paso() {
  if (ocupado) return;
  ocupado = true;
  try {
    const { rows: [envio] } = await pool.query(
      `SELECT * FROM envios_masivos WHERE estado = 'en_curso' AND siguiente_en <= now()
       ORDER BY id LIMIT 1`
    );
    if (!envio) return;

    if (!whatsappConectado()) {
      await actualizar(envio.id, {
        estado: "detenido",
        detalle: "El WhatsApp de Sivú se desvinculó. Vuelve a vincularlo y toca «Reanudar».",
      });
      return;
    }
    if (!enHorario(envio)) {
      await actualizar(envio.id, {
        siguiente_en: proximaApertura(envio),
        en_tanda: 0,
        detalle: `Fuera de horario: sigue a las ${horaLegible(franja(envio).desde)}`,
      });
      return;
    }

    const { rows: [item] } = await pool.query(
      `SELECT * FROM envios_masivos_items WHERE envio_id = $1 AND estado = 'pendiente'
       ORDER BY orden LIMIT 1`,
      [envio.id]
    );
    if (!item) {
      await actualizar(envio.id, { estado: "terminado", detalle: "" });
      return;
    }

    // La invitación pudo borrarse mientras la cola esperaba.
    if (!item.invitado_id) {
      await pool.query(
        "UPDATE envios_masivos_items SET estado = 'omitido', detalle = 'La invitación ya no existe' WHERE id = $1",
        [item.id]
      );
      return;
    }

    // «enviando» antes de enviar: si el servidor se cae justo aquí, al volver
    // ese mensaje queda marcado para revisar en vez de mandarse dos veces.
    await pool.query("UPDATE envios_masivos_items SET estado = 'enviando' WHERE id = $1", [item.id]);
    const r = await enviarTexto(item.telefono, item.texto);
    const ok = r.estado === "enviado";
    await pool.query(
      `UPDATE envios_masivos_items SET estado = $2, detalle = $3, enviado_en = CASE WHEN $4 THEN now() END
       WHERE id = $1`,
      [item.id, ok ? "enviado" : "fallido", ok ? "" : r.detalle || "No se pudo enviar", ok]
    );
    // Etiqueta del evento y al archivo: la bandeja principal queda para los
    // clientes (las respuestas de los invitados se ven en el panel).
    if (ok) ordenarChatInvitado(r, envio.invitacion_id);
    if (ok && envio.tipo === "invitacion") {
      await pool.query("UPDATE invitados SET enviado_en = COALESCE(enviado_en, now()) WHERE id = $1", [
        item.invitado_id,
      ]);
    }

    const fallos = ok || ERROR_DEL_NUMERO.test(r.detalle || "") ? 0 : envio.fallos_seguidos + 1;
    if (fallos >= RITMO.fallosParaDetener) {
      await actualizar(envio.id, {
        estado: "detenido",
        fallos_seguidos: fallos,
        detalle: `Se detuvo tras ${fallos} fallos seguidos (último: ${r.detalle}). Revisa el WhatsApp de Sivú antes de reanudar.`,
      });
      return;
    }

    const enTanda = envio.en_tanda + 1;
    const descanso = enTanda >= RITMO.tanda;
    await actualizar(envio.id, {
      en_tanda: descanso ? 0 : enTanda,
      fallos_seguidos: fallos,
      siguiente_en: new Date(
        Date.now() + (descanso ? azar(RITMO.descansoMin, RITMO.descansoMax) : azar(RITMO.pausaMin, RITMO.pausaMax))
      ),
      detalle: descanso ? "Descanso entre tandas" : "",
    });
  } catch (e) {
    console.error("Envío automático:", e);
  } finally {
    ocupado = false;
  }
}

export async function iniciarEnvios() {
  // Un mensaje que quedó a medio enviar en un reinicio no se reintenta: pudo
  // haber llegado, y mandarlo dos veces se ve peor que revisarlo a mano.
  await pool
    .query(
      `UPDATE envios_masivos_items SET estado = 'fallido',
         detalle = 'Se interrumpió por un reinicio del servidor: revisa si le llegó'
       WHERE estado = 'enviando'`
    )
    .catch((e) => console.error("Envío automático:", e.message));
  setInterval(paso, 5000);
}
