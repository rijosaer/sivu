// Motor ComfyUI: tu propia GPU (la RTX 4050 con COMFYUI_FAMILIA=5b) o un pod
// rentado (RunPod, Vast.ai) con COMFYUI_FAMILIA=a14b.
//   COMFYUI_URL    p. ej. http://127.0.0.1:8188
//   COMFYUI_TOKEN  opcional, si el pod está detrás de un proxy con token
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buscarPreset } from "../presets.js";
import { rutaAbsoluta } from "../almacen.js";
import { construirFlujo, encontrarVideo } from "./flujosComfy.js";

const base = () => {
  const url = process.env.COMFYUI_URL;
  if (!url) throw new Error("Falta COMFYUI_URL");
  return url.replace(/\/$/, "");
};
const cabeceras = () => (process.env.COMFYUI_TOKEN ? { Authorization: `Bearer ${process.env.COMFYUI_TOKEN}` } : {});

// Veces seguidas que un trabajo no apareció ni en la cola ni en el historial.
const ausencias = new Map();

async function json(r, accion) {
  const texto = await r.text();
  if (!r.ok) throw new Error(`ComfyUI respondió ${r.status} al ${accion}: ${texto.slice(0, 500)}`);
  return texto ? JSON.parse(texto) : {};
}

async function subirImagen(gen) {
  const buffer = await readFile(rutaAbsoluta(gen.imagen));
  const form = new FormData();
  form.append("image", new Blob([buffer]), path.basename(gen.imagen));
  form.append("overwrite", "true");
  const r = await fetch(`${base()}/upload/image`, { method: "POST", body: form, headers: cabeceras() });
  const { name, subfolder } = await json(r, "subir la imagen");
  return subfolder ? `${subfolder}/${name}` : name;
}

export const comfyui = {
  nombre: "comfyui",

  async enviar(gen) {
    const imagen = gen.imagen ? await subirImagen(gen) : null;
    const prompt = construirFlujo({
      promptFinal: gen.prompt_final,
      negativo: gen.negativo,
      parametros: gen.parametros,
      imagen,
      loras: buscarPreset(gen.preset)?.loras,
    });
    const r = await fetch(`${base()}/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...cabeceras() },
      body: JSON.stringify({ prompt, client_id: "wan-studio" }),
    });
    const { prompt_id } = await json(r, "encolar el workflow");
    return { prompt_id };
  },

  async consultar(gen) {
    const id = gen.motor_estado.prompt_id;
    const historial = await json(await fetch(`${base()}/history/${id}`, { headers: cabeceras() }), "consultar");
    const h = historial[id];

    if (h) {
      ausencias.delete(id);
      if (h.status?.status_str === "error") {
        const fallo = h.status.messages?.find(([tipo]) => tipo === "execution_error")?.[1];
        return { estado: "error", error: fallo ? `${fallo.node_type}: ${fallo.exception_message}` : "ComfyUI falló" };
      }
      if (!h.status?.completed) return { estado: "pendiente" };
      const archivo = encontrarVideo(h.outputs);
      if (!archivo) return { estado: "error", error: "El workflow terminó sin producir un video" };
      const q = new URLSearchParams({ filename: archivo.filename, subfolder: archivo.subfolder || "", type: archivo.type || "output" });
      return {
        estado: "listo",
        video: { url: `${base()}/view?${q}`, headers: cabeceras(), ext: path.extname(archivo.filename).slice(1) },
      };
    }

    const cola = await json(await fetch(`${base()}/queue`, { headers: cabeceras() }), "consultar la cola");
    const enCola = [...(cola.queue_running || []), ...(cola.queue_pending || [])].some((t) => t[1] === id);
    if (enCola) {
      ausencias.delete(id);
      return { estado: "pendiente" };
    }
    // Entre salir de la cola y entrar al historial hay un instante: se espera
    // a no verlo varias veces seguidas antes de darlo por perdido.
    const veces = (ausencias.get(id) || 0) + 1;
    ausencias.set(id, veces);
    if (veces < 5) return { estado: "pendiente" };
    ausencias.delete(id);
    return { estado: "error", error: "ComfyUI ya no tiene este trabajo (¿se reinició?)" };
  },
};
