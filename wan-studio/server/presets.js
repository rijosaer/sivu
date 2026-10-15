// Catálogo de presets: cada uno es una receta (plantilla de prompt + LoRAs +
// ajustes) encima del mismo modelo Wan. Agregar un efecto nuevo es agregar un
// objeto aquí; el resto de la app (web, API, motores) lo toma solo.
//
// Campos:
//   id, nombre, descripcion, categoria ("camara" | "efecto" | "libre")
//   modos:      qué acepta: "i2v" (imagen a video) y/o "t2v" (texto a video)
//   plantilla:  prompt que recibe el modelo; {prompt} es el texto del usuario
//   negativo:   se suma al negativo general
//   loras:      opcional, [{ alto, bajo, url, escala }]
//               alto/bajo = archivos en ComfyUI/models/loras para los dos
//               expertos de Wan 2.2 A14B; url = la misma LoRA para fal.ai
//   multiplicador: opcional, encarece el preset (p. ej. si usa LoRAs pesadas)
//   animacion:  nombre de la animación CSS de la tarjeta en la web
//   mock:       movimiento que imita el motor de prueba (zoom-in, zoom-out,
//               paneo, temblor)
import { ErrorApi } from "./errores.js";

export const NEGATIVO_BASE =
  "blurry, low quality, worst quality, distorted, deformed, bad anatomy, extra limbs, " +
  "static frame, watermark, text, subtitles, jpeg artifacts, flickering";

export const PRESETS = [
  {
    id: "animar",
    nombre: "Animar",
    descripcion: "Da vida a tu imagen o escena con tus propias palabras.",
    categoria: "libre",
    modos: ["i2v", "t2v"],
    plantilla: "{prompt}",
    animacion: "respirar",
    mock: "zoom-in",
  },
  {
    id: "crash-zoom",
    nombre: "Crash Zoom",
    descripcion: "Acercamiento brusco y dramático hacia el sujeto.",
    categoria: "camara",
    modos: ["i2v", "t2v"],
    plantilla:
      "Crash zoom: the camera rapidly zooms in toward the main subject, sudden dramatic push-in " +
      "with motion blur, energetic. {prompt}",
    animacion: "crash-zoom",
    mock: "zoom-in",
  },
  {
    id: "dolly-atras",
    nombre: "Dolly hacia atrás",
    descripcion: "La cámara se aleja despacio y revela la escena completa.",
    categoria: "camara",
    modos: ["i2v", "t2v"],
    plantilla:
      "Slow dolly out: the camera smoothly pulls back to reveal the wider scene around the subject, " +
      "cinematic. {prompt}",
    animacion: "dolly-atras",
    mock: "zoom-out",
  },
  {
    id: "orbita",
    nombre: "Órbita 180°",
    descripcion: "La cámara rodea al sujeto manteniéndolo al centro.",
    categoria: "camara",
    modos: ["i2v", "t2v"],
    plantilla:
      "The camera orbits 180 degrees around the main subject in a smooth arc, keeping the subject " +
      "centered, strong parallax in the background. {prompt}",
    animacion: "orbita",
    mock: "paneo",
  },
  {
    id: "dron-fpv",
    nombre: "Dron FPV",
    descripcion: "Vuelo rápido hacia adelante con giros de dron de carreras.",
    categoria: "camara",
    modos: ["i2v", "t2v"],
    plantilla:
      "FPV drone shot: the camera flies fast forward and swoops through the scene with dynamic " +
      "banking motion. {prompt}",
    animacion: "dron",
    mock: "zoom-in",
  },
  {
    id: "bullet-time",
    nombre: "Bullet Time",
    descripcion: "El tiempo se congela y la cámara gira alrededor.",
    categoria: "efecto",
    modos: ["i2v", "t2v"],
    plantilla:
      "Bullet time effect: time is frozen, the subject is suspended mid-motion while the camera " +
      "circles around them, particles and droplets hang in the air. {prompt}",
    animacion: "orbita",
    mock: "paneo",
  },
  {
    id: "camara-mano",
    nombre: "Cámara en mano",
    descripcion: "Movimiento natural de documental, con un temblor sutil.",
    categoria: "camara",
    modos: ["i2v", "t2v"],
    plantilla:
      "Handheld documentary camera with subtle natural shake, the subject moves naturally. {prompt}",
    animacion: "temblor",
    mock: "temblor",
  },
  {
    id: "timelapse",
    nombre: "Timelapse",
    descripcion: "Nubes, luz y sombras corren mientras la escena se queda quieta.",
    categoria: "efecto",
    modos: ["i2v", "t2v"],
    plantilla:
      "Timelapse: clouds and light move quickly across the scene, shadows sweep over the ground, " +
      "the camera stays locked off. {prompt}",
    negativo: "camera movement",
    animacion: "luz",
    mock: "paneo",
  },
  {
    id: "cine",
    nombre: "Toma de cine",
    descripcion: "Escena desde cero con look cinematográfico.",
    categoria: "libre",
    modos: ["t2v"],
    plantilla:
      "Cinematic shot, anamorphic lens, film grain, shallow depth of field, dramatic lighting. {prompt}",
    animacion: "luz",
    mock: "zoom-in",
  },
];

export const ASPECTOS = ["16:9", "9:16", "1:1"];
export const RESOLUCIONES = ["480p", "720p"];
// Wan da su mejor calidad en clips de ~5 s: los videos más largos se generan
// en tramos encadenados de como mucho "tramo" segundos (ver encadenar.js).
//   max              tope para cuentas normales (DURACION_MAX)
//   max_ilimitado    tope para cuentas ilimitadas: sin tope salvo que se fije
//                    DURACION_MAX_ILIMITADO (null = sin tope)
//   recomendado      lo que se sugiere en la web a las cuentas ilimitadas: más
//                    allá funciona igual, pero cada 5 s es otro tramo de GPU y
//                    la escena se va alejando de la imagen original
export const DURACION = {
  min: 2,
  max: Number(process.env.DURACION_MAX) || 10,
  max_ilimitado: Number(process.env.DURACION_MAX_ILIMITADO) || null,
  recomendado: 60,
  tramo: Number(process.env.TRAMO_SEG) || 5,
  defecto: 5,
};

export const buscarPreset = (id) => PRESETS.find((p) => p.id === id);

// Lo que se publica en GET /v1/presets: sin detalles internos de los motores.
export const presetPublico = (p) => ({
  id: p.id,
  nombre: p.nombre,
  descripcion: p.descripcion,
  categoria: p.categoria,
  modos: p.modos,
  animacion: p.animacion,
  multiplicador: p.multiplicador || 1,
});

export const calcularCosto = ({ duracion, resolucion }, preset) =>
  Math.ceil(duracion * (resolucion === "720p" ? 2 : 1) * (preset.multiplicador || 1));

const entero = (v, min, max, nombre) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new ErrorApi(400, `"${nombre}" debe ser un entero entre ${min} y ${max}`);
  }
  return n;
};

// Freno básico para que un webhook no sirva para pegarle a la red interna del
// servidor. No cubre un dominio público que resuelva a una IP privada.
export function hostPrivado(host) {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal") || h.endsWith(".local")) return true;
  if (h === "::1" || h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) return h.includes(":");
  const m = /^(\d+)\.(\d+)\.\d+\.\d+$/.exec(h);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

// Valida el cuerpo de POST /v1/generaciones y arma todo lo que se guarda.
// La imagen se valida aparte (almacen.js) porque implica escribir un archivo.
export function prepararGeneracion(cuerpo, { hayImagen, ilimitado = false }) {
  const preset = buscarPreset(cuerpo.preset || "animar");
  if (!preset) throw new ErrorApi(400, `Preset desconocido: "${cuerpo.preset}"`);

  const modo = hayImagen ? "i2v" : "t2v";
  if (!preset.modos.includes(modo)) {
    throw new ErrorApi(
      400,
      modo === "i2v"
        ? `El preset "${preset.id}" no acepta imagen; es solo texto a video`
        : `El preset "${preset.id}" necesita una imagen de entrada`
    );
  }

  const prompt = String(cuerpo.prompt ?? "").trim();
  if (prompt.length > 2000) throw new ErrorApi(400, "El prompt no puede pasar de 2000 caracteres");
  if (modo === "t2v" && !prompt) throw new ErrorApi(400, "Sin imagen hace falta un prompt que describa la escena");

  const aspecto = cuerpo.aspecto || "16:9";
  if (!ASPECTOS.includes(aspecto)) throw new ErrorApi(400, `"aspecto" debe ser uno de: ${ASPECTOS.join(", ")}`);
  const resolucion = cuerpo.resolucion || "480p";
  if (!RESOLUCIONES.includes(resolucion)) {
    throw new ErrorApi(400, `"resolucion" debe ser una de: ${RESOLUCIONES.join(", ")}`);
  }

  const parametros = {
    aspecto,
    resolucion,
    duracion:
      // Sin tope, solo el límite técnico de un día para no aceptar números absurdos.
      entero(cuerpo.duracion, DURACION.min, ilimitado ? (DURACION.max_ilimitado ?? 86400) : DURACION.max, "duracion") ??
      DURACION.defecto,
    semilla: entero(cuerpo.semilla, 0, 2 ** 31 - 1, "semilla") ?? Math.floor(Math.random() * 2 ** 31),
  };
  // Ajustes avanzados opcionales: si no vienen, cada motor usa los suyos.
  const pasos = entero(cuerpo.pasos, 1, 60, "pasos");
  if (pasos !== undefined) parametros.pasos = pasos;
  if (cuerpo.guia !== undefined) {
    const guia = Number(cuerpo.guia);
    if (!(guia >= 1 && guia <= 15)) throw new ErrorApi(400, `"guia" debe estar entre 1 y 15`);
    parametros.guia = guia;
  }

  const promptFinal = preset.plantilla.replace("{prompt}", prompt).trim();
  const negativo = [NEGATIVO_BASE, preset.negativo, String(cuerpo.negativo ?? "").trim()]
    .filter(Boolean)
    .join(", ")
    .slice(0, 2000);

  let webhookUrl = null;
  if (cuerpo.webhook_url) {
    let u;
    try {
      u = new URL(cuerpo.webhook_url);
    } catch {
      u = null;
    }
    if (!u || (u.protocol !== "https:" && u.protocol !== "http:")) {
      throw new ErrorApi(400, `"webhook_url" debe ser una URL http(s) válida`);
    }
    if (hostPrivado(u.hostname) && process.env.WEBHOOKS_PRIVADOS !== "true") {
      throw new ErrorApi(400, `"webhook_url" no puede apuntar a una dirección local o privada`);
    }
    webhookUrl = u.toString();
  }

  return {
    preset,
    modo,
    prompt,
    promptFinal,
    negativo,
    parametros,
    costo: calcularCosto(parametros, preset),
    webhookUrl,
  };
}
