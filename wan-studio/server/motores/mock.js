// Motor de prueba: no usa IA. Con ffmpeg hace un "Ken Burns" de la imagen (o
// un degradado animado si no hay imagen) imitando el movimiento del preset.
// Sirve para desarrollar la web y la API sin GPU y sin gastar.
import { spawn } from "node:child_process";
import { buscarPreset } from "../presets.js";
import { rutaAbsoluta } from "../almacen.js";
import { cuadros, dimensiones } from "./flujosComfy.js";

const FPS = 16;
const DEMORA_MS = Number(process.env.MOCK_DEMORA_MS ?? 4000);
const trabajos = new Map(); // id -> { inicio, terminado, error }

const MOVIMIENTOS = {
  "zoom-in": { z: "1+0.3*on/N", x: "iw/2-(iw/zoom/2)", y: "ih/2-(ih/zoom/2)" },
  "zoom-out": { z: "1.3-0.3*on/N", x: "iw/2-(iw/zoom/2)", y: "ih/2-(ih/zoom/2)" },
  paneo: { z: "1.2", x: "(iw-iw/zoom)*on/N", y: "ih/2-(ih/zoom/2)" },
  temblor: { z: "1.08", x: "iw/2-(iw/zoom/2)+8*sin(on*0.9)", y: "ih/2-(ih/zoom/2)+6*cos(on*1.3)" },
};

function argumentosFfmpeg(gen, salida) {
  const [ancho, alto] = dimensiones(gen.parametros, "a14b");
  const n = cuadros(gen.parametros.duracion, FPS);
  const codificar = ["-frames:v", String(n), "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-movflags", "+faststart", salida];

  if (!gen.imagen) {
    return ["-y", "-f", "lavfi", "-i", `gradients=s=${ancho}x${alto}:speed=0.03:r=${FPS}`, ...codificar];
  }
  const mov = MOVIMIENTOS[buscarPreset(gen.preset)?.mock] || MOVIMIENTOS["zoom-in"];
  const sub = (expr) => expr.replaceAll("N", String(n));
  const filtro =
    `scale=${ancho * 2}:${alto * 2}:force_original_aspect_ratio=increase,crop=${ancho * 2}:${alto * 2},` +
    `zoompan=z='${sub(mov.z)}':x='${sub(mov.x)}':y='${sub(mov.y)}':d=${n}:s=${ancho}x${alto}:fps=${FPS}`;
  return ["-y", "-i", rutaAbsoluta(gen.imagen), "-vf", filtro, ...codificar];
}

export const mock = {
  nombre: "mock",

  async enviar(gen) {
    const rel = `videos/${gen.id}.mp4`;
    const trabajo = { inicio: Date.now(), terminado: false, error: null };
    trabajos.set(gen.id, trabajo);
    const ff = spawn("ffmpeg", argumentosFfmpeg(gen, rutaAbsoluta(rel)), { stdio: ["ignore", "ignore", "pipe"] });
    let log = "";
    ff.stderr.on("data", (d) => (log = (log + d).slice(-2000)));
    ff.on("error", (e) => {
      trabajo.error = `No se pudo ejecutar ffmpeg (${e.code}). El motor mock lo necesita instalado.`;
    });
    ff.on("close", (codigo) => {
      if (codigo === 0) trabajo.terminado = true;
      else trabajo.error ||= `ffmpeg terminó con código ${codigo}: ${log.split("\n").slice(-3).join(" ")}`;
    });
    return { rel };
  },

  async consultar(gen) {
    const t = trabajos.get(gen.id);
    if (!t) return { estado: "error", error: "El servidor se reinició durante la generación" };
    if (t.error) {
      trabajos.delete(gen.id);
      return { estado: "error", error: t.error };
    }
    const progreso = Math.min(0.99, (Date.now() - t.inicio) / Math.max(DEMORA_MS, 1));
    if (!t.terminado || Date.now() - t.inicio < DEMORA_MS) return { estado: "pendiente", progreso };
    trabajos.delete(gen.id);
    return { estado: "listo", video: { rel: gen.motor_estado.rel } };
  },
};
