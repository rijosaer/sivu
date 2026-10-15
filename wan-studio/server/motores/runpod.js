// Motor RunPod Serverless: corre el mismo workflow de ComfyUI en un worker que
// solo se enciende (y cobra) mientras genera. Pensado para el endpoint basado en
// runpod-workers/worker-comfyui con los modelos de Wan 2.2 dentro de la imagen
// o en un network volume.
//   RUNPOD_API_KEY, RUNPOD_ENDPOINT_ID
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buscarPreset } from "../presets.js";
import { rutaAbsoluta } from "../almacen.js";
import { construirFlujo } from "./flujosComfy.js";

const base = () => {
  const id = process.env.RUNPOD_ENDPOINT_ID;
  if (!id || !process.env.RUNPOD_API_KEY) throw new Error("Faltan RUNPOD_API_KEY y RUNPOD_ENDPOINT_ID");
  return `https://api.runpod.ai/v2/${id}`;
};
const cabeceras = () => ({
  Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
  "Content-Type": "application/json",
});

const ES_VIDEO = /\.(mp4|webm|mov|mkv)$/i;

// worker-comfyui devuelve los archivos como [{ filename, type, data }], donde
// type es "base64" o "s3_url". Según la versión vienen en output.images,
// output.videos u output.files: se revisan todas.
function archivoDeVideo(output) {
  const candidatos = ["videos", "files", "images"].flatMap((k) => (Array.isArray(output?.[k]) ? output[k] : []));
  return candidatos.find((a) => ES_VIDEO.test(a?.filename || "")) || null;
}

export const runpod = {
  nombre: "runpod",

  async enviar(gen) {
    const images = [];
    let imagen = null;
    if (gen.imagen) {
      imagen = path.basename(gen.imagen);
      const datos = await readFile(rutaAbsoluta(gen.imagen));
      images.push({ name: imagen, image: datos.toString("base64") });
    }
    const workflow = construirFlujo({
      promptFinal: gen.prompt_final,
      negativo: gen.negativo,
      parametros: gen.parametros,
      imagen,
      loras: buscarPreset(gen.preset)?.loras,
    });
    const r = await fetch(`${base()}/run`, {
      method: "POST",
      headers: cabeceras(),
      body: JSON.stringify({ input: { workflow, images } }),
    });
    const cuerpo = await r.json().catch(() => ({}));
    if (!r.ok || !cuerpo.id) throw new Error(`RunPod respondió ${r.status}: ${JSON.stringify(cuerpo).slice(0, 500)}`);
    return { job_id: cuerpo.id };
  },

  async consultar(gen) {
    const r = await fetch(`${base()}/status/${gen.motor_estado.job_id}`, { headers: cabeceras() });
    const s = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`RunPod respondió ${r.status} al consultar`);

    switch (s.status) {
      case "IN_QUEUE":
      case "IN_PROGRESS":
        return { estado: "pendiente" };
      case "COMPLETED": {
        const a = archivoDeVideo(s.output);
        if (!a) return { estado: "error", error: "RunPod terminó sin devolver un video. ¿Tu worker-comfyui devuelve archivos de video?" };
        const ext = path.extname(a.filename).slice(1);
        return a.type === "s3_url"
          ? { estado: "listo", video: { url: a.data, ext } }
          : { estado: "listo", video: { buffer: Buffer.from(a.data, "base64"), ext } };
      }
      default:
        return { estado: "error", error: `RunPod: ${s.status} ${s.error || s.output?.error || ""}`.trim() };
    }
  },
};
