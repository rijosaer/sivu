import { test } from "node:test";
import assert from "node:assert/strict";
import { construirFlujo, cuadros, encontrarVideo } from "../motores/flujosComfy.js";
import { hostPrivado, prepararGeneracion } from "../presets.js";

// Cada referencia [id, salida] de un workflow debe apuntar a un nodo que existe.
function referenciasValidas(w) {
  for (const [id, nodo] of Object.entries(w)) {
    for (const v of Object.values(nodo.inputs)) {
      if (Array.isArray(v)) assert.ok(w[v[0]], `el nodo ${id} (${nodo.class_type}) apunta a ${v[0]}, que no existe`);
    }
  }
}
const tipos = (w) => Object.values(w).map((n) => n.class_type);
const base = {
  promptFinal: "a cat",
  negativo: "blurry",
  parametros: { aspecto: "16:9", resolucion: "480p", duracion: 5, semilla: 7 },
};

test("Wan trabaja con 4n+1 cuadros", () => {
  assert.equal(cuadros(5, 16), 81);
  assert.equal(cuadros(5, 24), 121);
  assert.equal(cuadros(2, 16), 33);
});

test("A14B imagen a video: dos expertos, LoRAs en cada uno", () => {
  process.env.COMFYUI_FAMILIA = "a14b";
  const w = construirFlujo({ ...base, imagen: "x.png", loras: [{ alto: "h.safetensors", bajo: "l.safetensors", escala: 0.8 }] });
  referenciasValidas(w);
  const t = tipos(w);
  assert.equal(t.filter((c) => c === "UNETLoader").length, 2);
  assert.equal(t.filter((c) => c === "KSamplerAdvanced").length, 2);
  assert.equal(t.filter((c) => c === "LoraLoaderModelOnly").length, 2);
  assert.ok(t.includes("WanImageToVideo") && t.includes("SaveVideo"));
  const i2v = Object.values(w).find((n) => n.class_type === "WanImageToVideo");
  assert.equal(i2v.inputs.length, 81);
  assert.equal(i2v.inputs.width, 832);
});

test("A14B texto a video usa latente vacío y modelos t2v", () => {
  process.env.COMFYUI_FAMILIA = "a14b";
  const w = construirFlujo({ ...base, imagen: null });
  referenciasValidas(w);
  assert.ok(tipos(w).includes("EmptyHunyuanLatentVideo"));
  assert.ok(Object.values(w).some((n) => n.inputs.unet_name?.includes("t2v_high_noise")));
});

test("5B para la RTX 4050: un modelo, LoRA rápida baja pasos y cfg", () => {
  process.env.COMFYUI_FAMILIA = "5b";
  process.env.COMFYUI_LORA_RAPIDA = "rapida.safetensors";
  const w = construirFlujo({ ...base, parametros: { ...base.parametros, resolucion: "720p" }, imagen: "x.png" });
  delete process.env.COMFYUI_LORA_RAPIDA;
  referenciasValidas(w);
  const k = Object.values(w).find((n) => n.class_type === "KSampler");
  assert.equal(k.inputs.steps, 6);
  assert.equal(k.inputs.cfg, 1);
  const lat = Object.values(w).find((n) => n.class_type === "Wan22ImageToVideoLatent");
  assert.deepEqual([lat.inputs.width, lat.inputs.height, lat.inputs.length], [1280, 704, 121]);
});

test("encuentra el video en las salidas de ComfyUI", () => {
  const salidas = { 9: { images: [{ filename: "video_0001.mp4", subfolder: "wanstudio", type: "output" }], animated: [true] } };
  assert.equal(encontrarVideo(salidas).filename, "video_0001.mp4");
  assert.equal(encontrarVideo({ 1: { images: [{ filename: "a.png" }] } }), null);
});

test("validación de generaciones", () => {
  assert.throws(() => prepararGeneracion({ preset: "cine" }, { hayImagen: false }), /prompt/);
  assert.throws(() => prepararGeneracion({ preset: "cine", prompt: "x" }, { hayImagen: true }), /no acepta imagen/);
  assert.throws(() => prepararGeneracion({ prompt: "x", duracion: 11 }, { hayImagen: false }), /duracion/);
  const g = prepararGeneracion({ preset: "crash-zoom", prompt: "a dog", resolucion: "720p", duracion: 4 }, { hayImagen: true });
  assert.equal(g.modo, "i2v");
  assert.equal(g.costo, 8);
  assert.match(g.promptFinal, /Crash zoom.*a dog$/);
});

test("webhooks a la red interna se rechazan", () => {
  for (const h of ["localhost", "127.0.0.1", "10.1.2.3", "192.168.0.5", "172.20.0.1", "169.254.169.254", "[::1]", "db.railway.internal"]) {
    assert.ok(hostPrivado(h), h);
  }
  for (const h of ["example.com", "8.8.8.8", "172.32.0.1", "fcbank.com"]) assert.ok(!hostPrivado(h), h);
});
