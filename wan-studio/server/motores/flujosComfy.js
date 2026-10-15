// Workflows de ComfyUI (formato API) para Wan 2.2, armados en código para poder
// insertar las LoRAs de cada preset. Los usan los motores "comfyui" (tu GPU o
// un pod) y "runpod" (serverless), que corren el mismo ComfyUI.
//
// Familias (COMFYUI_FAMILIA):
//   a14b → Wan 2.2 A14B: dos expertos de 14B (ruido alto y bajo). La mejor
//          calidad; pensado para la nube (24 GB+ de VRAM, 64 GB de RAM).
//   5b   → Wan 2.2 TI2V 5B: un solo modelo para texto e imagen. El que cabe en
//          una GPU de 6–8 GB como la RTX 4050.
//
// Los nombres de archivo por defecto son los de los paquetes de Comfy-Org en
// HuggingFace (Comfy-Org/Wan_2.2_ComfyUI_Repackaged). Si tus archivos se llaman
// distinto (p. ej. versiones GGUF), cámbialos con las variables COMFYUI_*.
// Las clases de nodo corresponden a los nodos nativos de Wan en ComfyUI; si al
// encolar ComfyUI responde con un error de validación, compara con la plantilla
// "Wan 2.2" que trae tu versión (Workflow → Browse Templates).

const env = (nombre, defecto) => process.env[nombre] || defecto;

export const FAMILIAS = {
  a14b: {
    fps: 16,
    pasos: 20,
    guia: 3.5,
    shift: 8,
    sampler: "euler",
    tamanos: {
      "480p": { "16:9": [832, 480], "9:16": [480, 832], "1:1": [640, 640] },
      "720p": { "16:9": [1280, 720], "9:16": [720, 1280], "1:1": [960, 960] },
    },
  },
  "5b": {
    fps: 24,
    pasos: 30,
    guia: 5,
    shift: 8,
    sampler: "uni_pc",
    tamanos: {
      "480p": { "16:9": [832, 480], "9:16": [480, 832], "1:1": [640, 640] },
      "720p": { "16:9": [1280, 704], "9:16": [704, 1280], "1:1": [960, 960] },
    },
  },
};

export const familiaActual = () => {
  const f = env("COMFYUI_FAMILIA", "a14b");
  if (!FAMILIAS[f]) throw new Error(`COMFYUI_FAMILIA inválida: "${f}" (usa a14b o 5b)`);
  return f;
};

// Wan trabaja con 4n+1 cuadros (81 = 5 s a 16 fps).
export const cuadros = (segundos, fps) => 4 * Math.round((segundos * fps) / 4) + 1;

export function dimensiones(parametros, familia = familiaActual()) {
  return FAMILIAS[familia].tamanos[parametros.resolucion][parametros.aspecto];
}

// LoRA de aceleración opcional (p. ej. lightx2v): baja de ~20 a 4–8 pasos.
// Con ella la guía (cfg) va en 1.
function loraRapida(familia) {
  if (familia === "5b") {
    const archivo = env("COMFYUI_LORA_RAPIDA");
    return archivo ? { ti2v: archivo } : null;
  }
  const alto = env("COMFYUI_LORA_RAPIDA_ALTO");
  const bajo = env("COMFYUI_LORA_RAPIDA_BAJO");
  return alto && bajo ? { alto, bajo } : null;
}

/**
 * @param {object} o
 * @param {string} o.promptFinal
 * @param {string} o.negativo
 * @param {object} o.parametros   { aspecto, resolucion, duracion, semilla, pasos?, guia? }
 * @param {string|null} o.imagen  nombre del archivo ya subido a ComfyUI (input/)
 * @param {Array}  o.loras        LoRAs del preset
 */
export function construirFlujo({ promptFinal, negativo, parametros, imagen, loras = [] }) {
  const familia = familiaActual();
  const f = FAMILIAS[familia];
  const [ancho, alto] = dimensiones(parametros, familia);
  const rapida = loraRapida(familia);
  const pasos = parametros.pasos ?? (rapida ? 6 : f.pasos);
  const guia = parametros.guia ?? (rapida ? 1 : f.guia);
  const length = cuadros(parametros.duracion, f.fps);
  const todasLoras = rapida ? [rapida, ...loras] : loras;

  const w = {};
  let n = 0;
  const nodo = (class_type, inputs) => {
    const id = String(++n);
    w[id] = { class_type, inputs };
    return id;
  };

  const clip = nodo("CLIPLoader", {
    clip_name: env("COMFYUI_TEXTO", "umt5_xxl_fp8_e4m3fn_scaled.safetensors"),
    type: "wan",
    device: "default",
  });
  const positivo = nodo("CLIPTextEncode", { text: promptFinal, clip: [clip, 0] });
  const negativoId = nodo("CLIPTextEncode", { text: negativo, clip: [clip, 0] });
  const imagenId = imagen ? nodo("LoadImage", { image: imagen }) : null;

  // Carga un modelo, le aplica las LoRAs que correspondan y el shift de Wan.
  // Con COMFYUI_GGUF=true se usan modelos cuantizados .gguf (nodo del paquete
  // ComfyUI-GGUF): pesan menos de la mitad y son los que caben en 6 GB de VRAM.
  const modelo = (archivo, claveLora) => {
    let m =
      env("COMFYUI_GGUF") === "true"
        ? nodo("UnetLoaderGGUF", { unet_name: archivo })
        : nodo("UNETLoader", { unet_name: archivo, weight_dtype: "default" });
    for (const l of todasLoras) {
      if (!l[claveLora]) continue;
      m = nodo("LoraLoaderModelOnly", {
        model: [m, 0],
        lora_name: l[claveLora],
        strength_model: l.escala ?? 1,
      });
    }
    return nodo("ModelSamplingSD3", { model: [m, 0], shift: f.shift });
  };

  let latente;
  if (familia === "5b") {
    const vae = nodo("VAELoader", { vae_name: env("COMFYUI_VAE_5B", "wan2.2_vae.safetensors") });
    const m = modelo(env("COMFYUI_MODELO_5B", "wan2.2_ti2v_5B_fp16.safetensors"), "ti2v");
    const vacio = nodo("Wan22ImageToVideoLatent", {
      vae: [vae, 0],
      width: ancho,
      height: alto,
      length,
      batch_size: 1,
      ...(imagenId ? { start_image: [imagenId, 0] } : {}),
    });
    latente = nodo("KSampler", {
      model: [m, 0],
      seed: parametros.semilla,
      steps: pasos,
      cfg: guia,
      sampler_name: f.sampler,
      scheduler: "simple",
      positive: [positivo, 0],
      negative: [negativoId, 0],
      latent_image: [vacio, 0],
      denoise: 1,
    });
    return terminar(w, nodo, latente, vae, f.fps);
  }

  const vae = nodo("VAELoader", { vae_name: env("COMFYUI_VAE", "wan_2.1_vae.safetensors") });
  const tipo = imagenId ? "i2v" : "t2v";
  const mAlto = modelo(env(`COMFYUI_MODELO_${tipo.toUpperCase()}_ALTO`, `wan2.2_${tipo}_high_noise_14B_fp8_scaled.safetensors`), "alto");
  const mBajo = modelo(env(`COMFYUI_MODELO_${tipo.toUpperCase()}_BAJO`, `wan2.2_${tipo}_low_noise_14B_fp8_scaled.safetensors`), "bajo");

  let pos = [positivo, 0];
  let neg = [negativoId, 0];
  let vacio;
  if (imagenId) {
    const i2v = nodo("WanImageToVideo", {
      positive: pos,
      negative: neg,
      vae: [vae, 0],
      width: ancho,
      height: alto,
      length,
      batch_size: 1,
      start_image: [imagenId, 0],
    });
    pos = [i2v, 0];
    neg = [i2v, 1];
    vacio = [i2v, 2];
  } else {
    vacio = [nodo("EmptyHunyuanLatentVideo", { width: ancho, height: alto, length, batch_size: 1 }), 0];
  }

  // El experto de ruido alto hace la primera mitad de los pasos (composición y
  // movimiento) y el de ruido bajo la segunda (detalle).
  const mitad = Math.max(1, Math.floor(pasos / 2));
  const comun = {
    noise_seed: parametros.semilla,
    steps: pasos,
    cfg: guia,
    sampler_name: f.sampler,
    scheduler: "simple",
    positive: pos,
    negative: neg,
  };
  const primera = nodo("KSamplerAdvanced", {
    ...comun,
    model: [mAlto, 0],
    add_noise: "enable",
    latent_image: vacio,
    start_at_step: 0,
    end_at_step: mitad,
    return_with_leftover_noise: "enable",
  });
  latente = nodo("KSamplerAdvanced", {
    ...comun,
    model: [mBajo, 0],
    add_noise: "disable",
    latent_image: [primera, 0],
    start_at_step: mitad,
    end_at_step: 10000,
    return_with_leftover_noise: "disable",
  });
  return terminar(w, nodo, latente, vae, f.fps);
}

function terminar(w, nodo, latente, vae, fps) {
  const imagenes = nodo("VAEDecode", { samples: [latente, 0], vae: [vae, 0] });
  const video = nodo("CreateVideo", { images: [imagenes, 0], fps });
  nodo("SaveVideo", { video: [video, 0], filename_prefix: "wanstudio/video", format: "auto", codec: "auto" });
  return w;
}

// Busca el archivo de video en las salidas de un prompt de ComfyUI. SaveVideo
// lo reporta bajo "images" (con "animated"), VideoHelperSuite bajo "gifs";
// se revisan todas las listas por si acaso.
export function encontrarVideo(salidas) {
  for (const salida of Object.values(salidas || {})) {
    for (const lista of Object.values(salida)) {
      if (!Array.isArray(lista)) continue;
      for (const item of lista) {
        if (item?.filename && /\.(mp4|webm|mov|mkv)$/i.test(item.filename)) return item;
      }
    }
  }
  return null;
}
