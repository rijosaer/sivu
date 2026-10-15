// Archivos en disco: imágenes de entrada y videos generados.
// En Railway, DATOS_DIR debe apuntar a un volumen montado; si no, los videos
// se pierden en cada despliegue.
import { mkdirSync, createWriteStream } from "node:fs";
import { rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { ErrorApi } from "./errores.js";

export const DATOS_DIR = path.resolve(
  process.env.DATOS_DIR || new URL("./datos", import.meta.url).pathname
);
for (const sub of ["entradas", "videos"]) mkdirSync(path.join(DATOS_DIR, sub), { recursive: true });

export const MAX_IMAGEN = 10 * 1024 * 1024;
const MAX_VIDEO = 500 * 1024 * 1024;

// Se revisan los primeros bytes además del tipo declarado: el data URI lo
// escribe quien llama y podría mentir.
const FIRMAS = {
  "image/png": { ext: "png", ok: (b) => b.subarray(0, 4).toString("hex") === "89504e47" },
  "image/jpeg": { ext: "jpg", ok: (b) => b.subarray(0, 3).toString("hex") === "ffd8ff" },
  "image/webp": {
    ext: "webp",
    ok: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP",
  },
};

export const rutaAbsoluta = (rel) => {
  const abs = path.resolve(DATOS_DIR, rel);
  if (!abs.startsWith(DATOS_DIR + path.sep)) throw new Error(`Ruta fuera de DATOS_DIR: ${rel}`);
  return abs;
};

// Decodifica "data:image/png;base64,..." sin escribir nada todavía.
export function leerImagen(dataUri) {
  const m = /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(String(dataUri));
  if (!m) throw new ErrorApi(400, `"imagen" debe ser un data URI en base64 (data:image/png;base64,...)`);
  const tipo = FIRMAS[m[1]];
  if (!tipo) throw new ErrorApi(400, "La imagen debe ser PNG, JPEG o WebP");
  const buffer = Buffer.from(m[2], "base64");
  if (buffer.length > MAX_IMAGEN) throw new ErrorApi(413, "La imagen pasa de 10 MB");
  if (!tipo.ok(buffer)) throw new ErrorApi(400, "El contenido de la imagen no coincide con su tipo");
  return { buffer, ext: tipo.ext, mime: m[1] };
}

export async function guardarImagen(id, { buffer, ext }) {
  const rel = `entradas/${id}.${ext}`;
  await writeFile(rutaAbsoluta(rel), buffer);
  return rel;
}

export async function guardarVideo(id, buffer, ext = "mp4") {
  const rel = `videos/${id}.${ext}`;
  await writeFile(rutaAbsoluta(rel), buffer);
  return rel;
}

// Descarga un video remoto (fal.ai, RunPod con S3, ComfyUI) directo a disco.
export async function descargarVideo(id, url, { headers, ext = "mp4" } = {}) {
  const r = await fetch(url, { headers });
  if (!r.ok || !r.body) throw new Error(`No se pudo descargar el video (${r.status})`);
  const rel = `videos/${id}.${ext}`;
  let total = 0;
  const limite = new Transform({
    transform(chunk, _enc, cb) {
      total += chunk.length;
      cb(total > MAX_VIDEO ? new Error("El video pasa del tamaño máximo") : null, chunk);
    },
  });
  await pipeline(Readable.fromWeb(r.body), limite, createWriteStream(rutaAbsoluta(rel)));
  return rel;
}

export async function borrar(rel) {
  if (rel) await rm(rutaAbsoluta(rel), { force: true });
}

// URL pública de un archivo. PUBLIC_URL fija el dominio (detrás de proxies);
// si no está, se arma con el host de la petición.
export function urlPublica(rel, req) {
  if (!rel) return null;
  const base = process.env.PUBLIC_URL?.replace(/\/$/, "") || (req ? `${req.protocol}://${req.get("host")}` : "");
  return `${base}/archivos/${rel}`;
}
