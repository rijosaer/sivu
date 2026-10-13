import { pool } from "./db.js";
import { normalizarTelefono } from "./avisosWhatsapp.js";

// Clientes potenciales («prospectos»): la lógica que comparten el formulario
// de los anuncios, el WhatsApp, el panel y el reporte de la mañana.

export const ESTADOS = ["nuevo", "contactado", "cotizado", "ganado", "perdido", "frio"];
export const ORIGENES = ["anuncio", "whatsapp", "instagram", "referido", "otro"];
export const EVENTOS = ["boda", "xv", "bautizo", "baby", "cumple", "grado", "empresa", "otro"];

// Qué tan urgente es atender a alguien: un evento cercano y grande va primero.
// Devuelve «alta» 🔥, «media» 🌤 o «baja» ❄ (solo para los que siguen abiertos).
export function prioridad(p) {
  if (!["nuevo", "contactado", "cotizado"].includes(p.estado)) return null;
  let puntos = { mes: 3, "1a3": 2, "3a6": 1, mas6: 0 }[p.cuando] ?? 1;
  puntos += { mas200: 2, "100a200": 2, "50a100": 1, menos50: 0 }[p.invitados] ?? 0;
  if (p.fecha_evento) {
    const dias = (new Date(`${String(p.fecha_evento).slice(0, 10)}T12:00:00-05:00`) - Date.now()) / 86400000;
    if (dias <= 30) puntos += 3;
    else if (dias <= 90) puntos += 1;
  }
  if (p.sin_leer > 0) puntos += 1;
  if (p.cotizacion_vista) puntos += 1;
  return puntos >= 4 ? "alta" : puntos >= 2 ? "media" : "baja";
}

export const EMOJI_PRIORIDAD = { alta: "🔥", media: "🌤", baja: "❄" };

export async function anotar(prospectoId, tipo, detalle = "", db = pool) {
  await db.query("INSERT INTO prospecto_historial (prospecto_id, tipo, detalle) VALUES ($1, $2, $3)", [
    prospectoId,
    tipo,
    detalle,
  ]);
}

const limpio = (v, max = 200) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

// Crea el prospecto o, si ese teléfono ya existe, lo completa (sin pisar lo
// que el dueño ya escribió) y lo reabre si estaba perdido o frío.
// Devuelve { prospecto, nuevo }.
export async function crearOUnir(datos) {
  const telefono = normalizarTelefono(datos.telefono);
  const campos = {
    origen: ORIGENES.includes(datos.origen) ? datos.origen : "otro",
    nombre: limpio(datos.nombre, 120),
    evento: EVENTOS.includes(datos.evento) ? datos.evento : "",
    cuando: limpio(datos.cuando, 10),
    invitados: limpio(datos.invitados, 10),
    ciudad: limpio(datos.ciudad, 80),
    notas: String(datos.notas || "").slice(0, 4000),
  };

  if (telefono) {
    const { rows: [previo] } = await pool.query("SELECT * FROM prospectos WHERE telefono = $1", [telefono]);
    if (previo) {
      const reabrir = ["perdido", "frio"].includes(previo.estado);
      const { rows: [p] } = await pool.query(
        `UPDATE prospectos SET
           nombre = CASE WHEN nombre = '' THEN $2 ELSE nombre END,
           evento = CASE WHEN $3 <> '' THEN $3 ELSE evento END,
           cuando = CASE WHEN $4 <> '' THEN $4 ELSE cuando END,
           invitados = CASE WHEN $5 <> '' THEN $5 ELSE invitados END,
           ciudad = CASE WHEN ciudad = '' THEN $6 ELSE ciudad END,
           estado = CASE WHEN $7 THEN 'nuevo' ELSE estado END,
           actualizado_en = now()
         WHERE id = $1 RETURNING *`,
        [previo.id, campos.nombre, campos.evento, campos.cuando, campos.invitados, campos.ciudad, reabrir]
      );
      await anotar(
        p.id,
        "repetido",
        `Volvió a llegar por ${campos.origen === "anuncio" ? "el formulario del anuncio" : campos.origen}${reabrir ? " (se reabrió)" : ""}`
      );
      return { prospecto: p, nuevo: false };
    }
  }

  const { rows: [p] } = await pool.query(
    `INSERT INTO prospectos (origen, nombre, telefono, evento, cuando, invitados, ciudad, notas)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [campos.origen, campos.nombre, telefono, campos.evento, campos.cuando, campos.invitados, campos.ciudad, campos.notas]
  );
  await anotar(p.id, "creado", {
    anuncio: "Llegó por el formulario del anuncio",
    whatsapp: "Escribió directo por WhatsApp",
    instagram: "Llegó por Instagram",
    referido: "Llegó referido",
    otro: "Agregado a mano",
  }[campos.origen]);
  return { prospecto: p, nuevo: true };
}

// Los que llevan días cotizados o contactados sin ningún movimiento pasan a
// «frío»: así la lista activa no se llena de conversaciones muertas.
export async function enfriar(dias) {
  const { rows } = await pool.query(
    `UPDATE prospectos SET estado = 'frio', actualizado_en = now()
     WHERE estado IN ('contactado', 'cotizado')
       AND GREATEST(actualizado_en, COALESCE(ultimo_entrante, actualizado_en), COALESCE(ultimo_saliente, actualizado_en))
           < now() - make_interval(days => $1)
       AND (proximo_seguimiento IS NULL OR proximo_seguimiento < CURRENT_DATE)
     RETURNING id`,
    [dias]
  );
  for (const { id } of rows) await anotar(id, "estado", `Pasó a frío: ${dias} días sin movimiento`);
  return rows.length;
}
