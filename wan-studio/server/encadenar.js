// Videos largos por tramos. Wan da su mejor calidad en clips de ~5 s; para
// duraciones mayores se genera un tramo, se toma su último cuadro como imagen
// de inicio del siguiente y al final se unen todos con ffmpeg.
import { spawn } from "node:child_process";
import { writeFile, rm } from "node:fs/promises";
import { DURACION } from "./presets.js";
import { rutaAbsoluta } from "./almacen.js";

// Reparte la duración en tramos parecidos de como mucho DURACION.tramo
// segundos (12 s → [4, 4, 4], no [5, 5, 2]).
export function tramos(segundos, maximo = DURACION.tramo) {
  const n = Math.max(1, Math.ceil(segundos / maximo));
  const base = Math.floor(segundos / n);
  return Array.from({ length: n }, (_, i) => base + (i < segundos % n ? 1 : 0));
}

function ffmpeg(args) {
  return new Promise((ok, mal) => {
    const p = spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { stdio: ["ignore", "ignore", "pipe"] });
    let log = "";
    p.stderr.on("data", (d) => (log = (log + d).slice(-1500)));
    p.on("error", (e) => mal(new Error(`No se pudo ejecutar ffmpeg (${e.code})`)));
    p.on("close", (c) => (c === 0 ? ok() : mal(new Error(`ffmpeg terminó con código ${c}: ${log.trim()}`))));
  });
}

// Último cuadro del video: con -update 1 cada cuadro del último segundo
// sobrescribe la imagen, y queda el final.
export async function ultimoCuadro(video, destino) {
  await ffmpeg(["-sseof", "-1", "-i", rutaAbsoluta(video), "-update", "1", "-q:v", "1", rutaAbsoluta(destino)]);
  return destino;
}

// Une los tramos en un solo MP4. Se recodifica porque cada motor puede
// entregar códecs distintos.
export async function unir(partes, destino) {
  const lista = rutaAbsoluta(`${destino}.txt`);
  await writeFile(lista, partes.map((p) => `file '${rutaAbsoluta(p)}'`).join("\n"));
  try {
    await ffmpeg([
      "-f", "concat", "-safe", "0", "-i", lista,
      "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-an", "-movflags", "+faststart",
      rutaAbsoluta(destino),
    ]);
  } finally {
    await rm(lista, { force: true });
  }
  return destino;
}
