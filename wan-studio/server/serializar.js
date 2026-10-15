import { urlPublica } from "./almacen.js";

// Forma pública de una generación (API, web y webhooks). No expone el prompt
// final ni el estado interno del motor.
export const generacionPublica = (g, req) => ({
  id: g.id,
  estado: g.estado,
  preset: g.preset,
  modo: g.modo,
  prompt: g.prompt,
  parametros: g.parametros,
  progreso: g.estado === "completada" ? 1 : g.progreso,
  video_url: urlPublica(g.video, req),
  imagen_url: urlPublica(g.imagen, req),
  error: g.error,
  costo: g.costo,
  creado_en: g.creado_en,
  terminado_en: g.terminado_en,
});
