// Motores intercambiables. Todos cumplen la misma interfaz:
//   enviar(gen)    → objeto que se guarda en generaciones.motor_estado
//   consultar(gen) → { estado: "pendiente", progreso? }
//                  | { estado: "listo", video: { rel } | { buffer, ext } | { url, headers?, ext } }
//                  | { estado: "error", error }
// MOTOR elige con cuál se envían los trabajos nuevos; los que ya estaban en
// curso se siguen consultando con el motor que los recibió.
import { mock } from "./mock.js";
import { comfyui } from "./comfyui.js";
import { runpod } from "./runpod.js";
import { fal } from "./fal.js";

const MOTORES = { mock, comfyui, runpod, fal };

export const motorActual = () => {
  const nombre = process.env.MOTOR || "mock";
  if (!MOTORES[nombre]) throw new Error(`MOTOR desconocido: "${nombre}" (usa ${Object.keys(MOTORES).join(", ")})`);
  return MOTORES[nombre];
};

export const motorPorNombre = (nombre) => MOTORES[nombre];
