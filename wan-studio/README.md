# Wan Studio

Estudio de video con IA estilo Higgsfield sobre **Wan 2.2** (código abierto, Apache 2.0):
eliges un preset (crash zoom, órbita, bullet time…), subes una foto y sale el clip.
Todo lo que hace la web también está disponible como **API con llaves**.

```
wan-studio/
├── web/      → sitio (React + Vite + Tailwind). Puerto 5180 en desarrollo.
├── server/   → API + cola de trabajos (Node + Express + Postgres). Puerto 4100.
│   └── motores/  → dónde se genera el video: mock · comfyui · runpod · fal
└── package.json  → build y start para desplegar en un solo servicio (la API sirve la web)
```

```
[Web]  ──┐
         ├──► API /v1 ──► Postgres (usuarios, llaves, créditos, cola)
[Tu app] ┘                    │
                              ▼  cada 2 s
                         Motor (MOTOR=...)
                ┌─────────┬────────┴────────┬──────────┐
              mock     comfyui          runpod       fal
            (ffmpeg)  (tu GPU o pod)  (serverless)  (por video)
```

## 1. Arrancar en local (sin GPU)

Con el motor `mock` todo funciona sin IA: hace un efecto Ken Burns de la foto con ffmpeg.
Sirve para desarrollar la web y la API sin gastar.

Necesitas Node 20+, Docker y ffmpeg (`winget install ffmpeg` en Windows).

```bash
cd wan-studio
docker compose up -d                 # Postgres en el puerto 5433

cd server
cp .env.example .env                 # cambia JWT_SECRET
npm install
npm run migrar
npm run dev                          # http://localhost:4100

# en otra terminal
cd web
npm install
npm run dev                          # http://localhost:5180
```

Crea una cuenta en la web; la primera queda como administradora y todas reciben
`CREDITOS_INICIALES`. Para sumar créditos:

```bash
npm run creditos tu@correo.com 100
```

Pruebas: `cd server && npm test`.

## 2. Con IA en tu RTX 4050 (6 GB de VRAM, 16 GB de RAM)

Con 16 GB de RAM, el modelo que cabe es **Wan 2.2 TI2V 5B** (texto e imagen a video).
El A14B queda para la nube (ver sección 3).

1. **Instala ComfyUI** (versión portable para Windows con NVIDIA) y actualízalo a la
   última versión: los nodos de Wan 2.2 son nativos.
2. **Instala el paquete ComfyUI-GGUF** desde ComfyUI Manager. El 5B en fp16 pesa ~10 GB;
   la versión GGUF Q4/Q5 pesa ~3–4 GB y cabe mucho mejor en 6 GB.
3. **Descarga los modelos** (HuggingFace: `Comfy-Org/Wan_2.2_ComfyUI_Repackaged`, y una
   versión GGUF del TI2V 5B, p. ej. de QuantStack):

   | Archivo | Carpeta de ComfyUI |
   |---|---|
   | `Wan2.2-TI2V-5B-Q5_K_M.gguf` (o el `.safetensors` fp16) | `models/unet` (gguf) o `models/diffusion_models` |
   | `wan2.2_vae.safetensors` | `models/vae` |
   | `umt5_xxl_fp8_e4m3fn_scaled.safetensors` | `models/text_encoders` |

4. **Prueba primero en ComfyUI** la plantilla "Wan 2.2 5B" (Workflow → Browse Templates).
   Si ahí funciona, aquí también.
5. **Conecta Wan Studio** en `server/.env`:

   ```
   MOTOR=comfyui
   COMFYUI_URL=http://127.0.0.1:8188
   COMFYUI_FAMILIA=5b
   COMFYUI_GGUF=true
   COMFYUI_MODELO_5B=Wan2.2-TI2V-5B-Q5_K_M.gguf
   TRABAJO_LIMITE_MIN=60
   ```

Consejos para 6 GB: genera en 480p y de 2 a 3 s mientras pruebas, cierra el navegador
y los juegos mientras genera, y si existe una LoRA de aceleración para el 5B ponla en
`COMFYUI_LORA_RAPIDA` (baja a ~6 pasos con cfg 1).

**¿Y WanGP?** Úsalo para *explorar*: tiene casi todos los modelos (Wan 2.1/2.2, VACE,
MultiTalk, LoRAs) con perfiles de poca memoria. Cuando encuentres una combinación que
se vea bien, la conviertes en preset aquí. Wan Studio habla con ComfyUI porque tiene
una API HTTP estable; WanGP es una interfaz Gradio pensada para personas.

## 3. En la nube

### Pod por horas (RunPod / Vast.ai): mismo motor `comfyui`

Renta una RTX 4090 (24 GB) o L40S (48 GB) con la plantilla de ComfyUI, descarga los
modelos A14B a un network volume y apunta el servidor al pod:

```
MOTOR=comfyui
COMFYUI_URL=https://<id-del-pod>-8188.proxy.runpod.net
COMFYUI_FAMILIA=a14b
```

Modelos A14B (en `Comfy-Org/Wan_2.2_ComfyUI_Repackaged`):
`wan2.2_i2v_high_noise_14B_fp8_scaled`, `wan2.2_i2v_low_noise_14B_fp8_scaled`
(y los `t2v` equivalentes) en `diffusion_models`, `wan_2.1_vae` en `vae`,
`umt5_xxl_fp8_e4m3fn_scaled` en `text_encoders`. Con las LoRAs lightx2v
(`COMFYUI_LORA_RAPIDA_ALTO` / `_BAJO`) cada clip baja de ~20 a ~6 pasos.

### RunPod Serverless: motor `runpod` (para usuarios reales)

Solo pagas los segundos que la GPU está generando. Crea un endpoint con
`runpod-workers/worker-comfyui` y los modelos A14B (en la imagen de Docker o en un
network volume). Antes de conectarlo, verifica que tu versión del worker devuelva
archivos de video y no solo imágenes.

```
MOTOR=runpod
RUNPOD_API_KEY=...
RUNPOD_ENDPOINT_ID=...
COMFYUI_FAMILIA=a14b
```

### fal.ai: motor `fal` (sin infraestructura)

Pagas por video y no administras nada. Es útil para lanzar rápido o como respaldo.

```
MOTOR=fal
FAL_KEY=...
```

Los endpoints por defecto son `fal-ai/wan/v2.2-a14b/image-to-video` y
`.../text-to-video`; se cambian con `FAL_ENDPOINT_I2V` / `FAL_ENDPOINT_T2V`.

Los trabajos que ya estaban en curso se siguen consultando con el motor que los
recibió, así que puedes cambiar `MOTOR` en caliente.

## 4. Agregar presets y efectos (LoRAs)

Un preset es un objeto en `server/presets.js`; la web y la API lo toman solos.

```js
{
  id: "inflar",
  nombre: "Inflar",
  descripcion: "El sujeto se infla como globo.",
  categoria: "efecto",
  modos: ["i2v"],
  plantilla: "The subject inflates like a balloon and floats up. {prompt}",
  loras: [{
    alto: "inflate_high_noise.safetensors",   // ComfyUI/models/loras (A14B, experto alto)
    bajo: "inflate_low_noise.safetensors",    // ComfyUI/models/loras (A14B, experto bajo)
    ti2v: "inflate_5b.safetensors",           // opcional, para la familia 5b
    url: "https://.../inflate.safetensors",   // la misma LoRA para fal.ai
    escala: 1,
  }],
  multiplicador: 1.5,
  animacion: "respirar",   // vista previa CSS en la web
  mock: "zoom-in",
}
```

Los efectos virales estilo Higgsfield (inflate, squish, explode, etc.) son LoRAs de
la comunidad en HuggingFace y Civitai. Revisa la licencia de cada una antes de cobrar
por usarla.

## 5. Desplegar en Railway

1. Crea un servicio desde este repositorio con **Root Directory = `/wan-studio`**,
   Build Command `npm run build`, Start Command `npm start` y Pre-deploy
   `npm run migrar` (Railway no lee un `railway.json` dentro del Root Directory).
2. Agrega Postgres al proyecto y pasa `DATABASE_URL` al servicio.
3. Agrega un **volumen** montado en `/datos` y define `DATOS_DIR=/datos`. Sin él,
   los videos se pierden en cada despliegue.
4. Variables: `JWT_SECRET`, `PUBLIC_URL` (tu dominio, para los webhooks), `MOTOR`
   y las de ese motor.

En Railway usa `fal` o `runpod`: la imagen no trae ffmpeg, así que `mock` falla, y
Railway no tiene GPU.

## 6. API

La documentación completa, con ejemplos que ya traen tu dominio, está en la web, en la
pestaña **API**. Resumen:

```bash
curl -X POST $URL/v1/generaciones \
  -H "Authorization: Bearer ws_..." -H "Content-Type: application/json" \
  -d '{"preset":"orbita","prompt":"neon city at night","aspecto":"9:16"}'
# → 202 { "id": "...", "estado": "en_cola", ... }

curl $URL/v1/generaciones/<id> -H "Authorization: Bearer ws_..."
# → { "estado": "completada", "video_url": "https://.../archivos/videos/<id>.mp4" }
```

Créditos = segundos × (2 en 720p, 1 en 480p) × multiplicador del preset. Si una
generación falla o se cancela, se devuelven.

## Pendiente antes de abrirlo al público

- **Moderación**: filtro de contenido en prompts e imágenes, y términos de uso
  (deepfakes de personas reales, contenido sexual).
- **Pagos**: comprar créditos (Stripe o Mercado Pago).
- **Almacenamiento**: mover videos a S3/R2 cuando crezca el volumen.
- **Progreso real** desde el websocket de ComfyUI (hoy la barra es indeterminada).
- **Varias instancias**: la cola está pensada para un solo servidor.
