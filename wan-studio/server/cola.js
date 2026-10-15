// Cola de generaciones sobre Postgres. Cada pocos segundos:
//  1. consulta al motor por los trabajos en curso y guarda los que terminaron;
//  2. toma trabajos nuevos de la cola hasta llenar TRABAJOS_SIMULTANEOS.
// Pensada para una sola instancia del servidor: con varias, SKIP LOCKED evita
// que dos tomen el mismo trabajo, pero el motor mock guarda estado en memoria.
import { pool } from "./db.js";
import { descargarVideo, guardarVideo } from "./almacen.js";
import { motorActual, motorPorNombre } from "./motores/index.js";
import { generacionPublica } from "./serializar.js";

const SIMULTANEOS = Number(process.env.TRABAJOS_SIMULTANEOS || 1);
const INTERVALO_MS = Number(process.env.COLA_INTERVALO_MS || 2000);
const LIMITE_MIN = Number(process.env.TRABAJO_LIMITE_MIN || 30);
const EXT_VIDEO = /^(mp4|webm|mov|mkv)$/;

let ocupado = false;

export function iniciarCola() {
  console.log(`Cola activa con el motor "${process.env.MOTOR || "mock"}" (${SIMULTANEOS} simultáneo/s)`);
  setInterval(ciclo, INTERVALO_MS);
}

export async function ciclo() {
  if (ocupado) return;
  ocupado = true;
  try {
    await revisarEnCurso();
    await tomarNuevos();
  } catch (e) {
    console.error("Error en la cola:", e);
  } finally {
    ocupado = false;
  }
}

async function revisarEnCurso() {
  const { rows } = await pool.query(
    "SELECT * FROM generaciones WHERE estado = 'procesando' ORDER BY iniciado_en"
  );
  for (const gen of rows) {
    const minutos = (Date.now() - new Date(gen.iniciado_en).getTime()) / 60000;
    if (minutos > LIMITE_MIN) {
      await fallar(gen, `Se superó el tiempo límite de ${LIMITE_MIN} minutos`);
      continue;
    }
    // Tomada pero nunca enviada: el proceso se cayó justo en medio.
    if (!gen.motor_estado) {
      if (minutos > 2) await fallar(gen, "La generación se interrumpió antes de llegar al motor");
      continue;
    }

    let r;
    try {
      r = await motorPorNombre(gen.motor).consultar(gen);
    } catch (e) {
      // Un fallo de red al consultar no condena el trabajo: se reintenta en el
      // siguiente ciclo y, si nunca se recupera, lo corta el tiempo límite.
      console.error(`No se pudo consultar ${gen.id}:`, e.message);
      continue;
    }

    if (r.estado === "pendiente") {
      if (r.progreso != null) {
        await pool.query("UPDATE generaciones SET progreso = $2 WHERE id = $1", [gen.id, r.progreso]);
      }
    } else if (r.estado === "error") {
      await fallar(gen, r.error);
    } else {
      try {
        await completar(gen, await guardar(gen, r.video));
      } catch (e) {
        await fallar(gen, `No se pudo guardar el video: ${e.message}`);
      }
    }
  }
}

async function guardar(gen, video) {
  if (video.rel) return video.rel;
  const ext = EXT_VIDEO.test(video.ext || "") ? video.ext : "mp4";
  if (video.buffer) return guardarVideo(gen.id, video.buffer, ext);
  return descargarVideo(gen.id, video.url, { headers: video.headers, ext });
}

async function tomarNuevos() {
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM generaciones WHERE estado = 'procesando'");
  let libres = SIMULTANEOS - rows[0].n;
  while (libres-- > 0) {
    const motor = motorActual();
    const { rows: tomadas } = await pool.query(
      `UPDATE generaciones SET estado = 'procesando', iniciado_en = now(), motor = $1, progreso = 0
        WHERE id = (
          SELECT id FROM generaciones WHERE estado = 'en_cola'
           ORDER BY creado_en FOR UPDATE SKIP LOCKED LIMIT 1
        )
        RETURNING *`,
      [motor.nombre]
    );
    const gen = tomadas[0];
    if (!gen) return;
    try {
      const estado = await motor.enviar(gen);
      await pool.query("UPDATE generaciones SET motor_estado = $2 WHERE id = $1", [gen.id, estado]);
    } catch (e) {
      console.error(`El motor ${motor.nombre} rechazó ${gen.id}:`, e.message);
      // "fetch failed" no le dice nada a quien espera su video.
      const causa = e.cause?.code ? `no se pudo conectar con el motor "${motor.nombre}" (${e.cause.code})` : e.message;
      await fallar(gen, causa);
    }
  }
}

async function completar(gen, video) {
  const { rows } = await pool.query(
    `UPDATE generaciones
        SET estado = 'completada', video = $2, progreso = 1, terminado_en = now(), motor_estado = NULL
      WHERE id = $1 AND estado = 'procesando'
      RETURNING *`,
    [gen.id, video]
  );
  if (rows[0]) avisar(rows[0]);
}

// Marca la generación como fallida y devuelve los créditos, todo junto.
export async function fallar(gen, error, { estado = "fallida", desde = ["en_cola", "procesando"] } = {}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `UPDATE generaciones
          SET estado = $3, error = $2, terminado_en = now(), motor_estado = NULL
        WHERE id = $1 AND estado = ANY($4)
        RETURNING *`,
      [gen.id, String(error || "Error desconocido").slice(0, 1000), estado, desde]
    );
    if (rows[0]) {
      await client.query("UPDATE usuarios SET creditos = creditos + $2 WHERE id = $1", [rows[0].usuario_id, rows[0].costo]);
    }
    await client.query("COMMIT");
    if (rows[0]) avisar(rows[0]);
    return rows[0] || null;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

// Webhook al terminar: hasta 3 intentos. Sin PUBLIC_URL, las URLs de video del
// aviso salen relativas.
async function avisar(gen) {
  if (!gen.webhook_url) return;
  const cuerpo = JSON.stringify({ evento: `generacion.${gen.estado}`, generacion: generacionPublica(gen) });
  for (const espera of [0, 5000, 30000]) {
    if (espera) await new Promise((r) => setTimeout(r, espera));
    try {
      const r = await fetch(gen.webhook_url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "wan-studio-webhook" },
        body: cuerpo,
        redirect: "manual",
        signal: AbortSignal.timeout(10000),
      });
      if (r.ok) return;
    } catch {
      // se reintenta
    }
  }
  console.error(`El webhook de ${gen.id} no respondió tras 3 intentos`);
}
