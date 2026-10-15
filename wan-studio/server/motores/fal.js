// Motor fal.ai: Wan 2.2 A14B ya hospedado, se paga por video. Sirve para
// lanzar sin infraestructura propia o como respaldo de tu GPU.
//   FAL_KEY
//   FAL_ENDPOINT_I2V / FAL_ENDPOINT_T2V  para cambiar de modelo sin tocar código
// Si el preset trae LoRAs con "url", se usa la variante "/lora" del endpoint.
import { readFile } from "node:fs/promises";
import { buscarPreset } from "../presets.js";
import { rutaAbsoluta } from "../almacen.js";
import { cuadros } from "./flujosComfy.js";

const FPS = 16;
const MIME = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };

const cabeceras = () => {
  if (!process.env.FAL_KEY) throw new Error("Falta FAL_KEY");
  return { Authorization: `Key ${process.env.FAL_KEY}`, "Content-Type": "application/json" };
};

async function leerJson(r, accion) {
  const texto = await r.text();
  if (!r.ok) throw new Error(`fal.ai respondió ${r.status} al ${accion}: ${texto.slice(0, 500)}`);
  return JSON.parse(texto);
}

export const fal = {
  nombre: "fal",

  async enviar(gen) {
    const p = gen.parametros;
    const loras = (buscarPreset(gen.preset)?.loras || [])
      .filter((l) => l.url)
      .map((l) => ({ path: l.url, scale: l.escala ?? 1 }));

    let endpoint = gen.imagen
      ? process.env.FAL_ENDPOINT_I2V || "fal-ai/wan/v2.2-a14b/image-to-video"
      : process.env.FAL_ENDPOINT_T2V || "fal-ai/wan/v2.2-a14b/text-to-video";
    if (loras.length) endpoint += "/lora";

    const entrada = {
      prompt: gen.prompt_final,
      negative_prompt: gen.negativo,
      seed: p.semilla,
      resolution: p.resolucion,
      aspect_ratio: p.aspecto,
      num_frames: cuadros(p.duracion, FPS),
      frames_per_second: FPS,
    };
    if (p.pasos) entrada.num_inference_steps = p.pasos;
    if (p.guia) entrada.guidance_scale = p.guia;
    if (loras.length) entrada.loras = loras;
    if (gen.imagen) {
      const ext = gen.imagen.split(".").pop();
      const datos = await readFile(rutaAbsoluta(gen.imagen));
      entrada.image_url = `data:${MIME[ext]};base64,${datos.toString("base64")}`;
    }

    const r = await fetch(`https://queue.fal.run/${endpoint}`, {
      method: "POST",
      headers: cabeceras(),
      body: JSON.stringify(entrada),
    });
    const { request_id, status_url, response_url } = await leerJson(r, "encolar");
    return { request_id, status_url, response_url };
  },

  async consultar(gen) {
    const { status_url, response_url } = gen.motor_estado;
    const s = await leerJson(await fetch(status_url, { headers: cabeceras() }), "consultar");
    if (s.status === "IN_QUEUE" || s.status === "IN_PROGRESS") return { estado: "pendiente" };
    if (s.status !== "COMPLETED") return { estado: "error", error: `fal.ai: estado ${s.status}` };

    const r = await fetch(response_url, { headers: cabeceras() });
    const texto = await r.text();
    if (!r.ok) return { estado: "error", error: `fal.ai: ${texto.slice(0, 500)}` };
    const url = JSON.parse(texto).video?.url;
    if (!url) return { estado: "error", error: "fal.ai no devolvió un video" };
    return { estado: "listo", video: { url, ext: "mp4" } };
  },
};
