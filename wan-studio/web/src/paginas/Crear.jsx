import { useMemo, useRef, useState } from "react";
import { api } from "../api.js";
import Escena from "../componentes/Escena.jsx";
import TarjetaGeneracion from "../componentes/TarjetaGeneracion.jsx";
import { useGeneraciones } from "../componentes/useGeneraciones.js";

const MAX_IMAGEN = 10 * 1024 * 1024;
const TIPOS = ["image/png", "image/jpeg", "image/webp"];

const leerArchivo = (archivo) =>
  new Promise((ok, mal) => {
    const lector = new FileReader();
    lector.onload = () => ok(lector.result);
    lector.onerror = () => mal(new Error("No se pudo leer la imagen"));
    lector.readAsDataURL(archivo);
  });

function Fichas({ valores, valor, alElegir }) {
  return (
    <div className="flex flex-wrap gap-2">
      {valores.map((v) => (
        <button
          type="button"
          key={v}
          onClick={() => alElegir(v)}
          className={`ficha ${valor === v ? "ficha-activa" : "ficha-inactiva"}`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

export default function Crear({ catalogo, usuario, presetInicial, alCambiarCreditos }) {
  const { presets, opciones } = catalogo;
  const [imagen, setImagen] = useState(null); // data URI
  const [presetId, setPresetId] = useState(presets.some((p) => p.id === presetInicial) ? presetInicial : "animar");
  const [prompt, setPrompt] = useState("");
  const [aspecto, setAspecto] = useState("16:9");
  const [resolucion, setResolucion] = useState("480p");
  const [duracion, setDuracion] = useState(opciones?.duracion.defecto ?? 5);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [arrastrando, setArrastrando] = useState(false);
  const entrada = useRef(null);

  const { lista, recargar, quitar } = useGeneraciones({ limite: 12, alTerminar: alCambiarCreditos });

  const preset = presets.find((p) => p.id === presetId) || presets[0];
  const modo = imagen ? "i2v" : "t2v";
  const compatible = preset.modos.includes(modo);
  const costo = Math.ceil(duracion * (resolucion === "720p" ? 2 : 1) * (preset.multiplicador || 1));
  const nombres = useMemo(() => Object.fromEntries(presets.map((p) => [p.id, p.nombre])), [presets]);

  let bloqueo = "";
  if (!compatible) bloqueo = modo === "i2v" ? "Este preset es solo de texto: quita la imagen." : "Este preset necesita una imagen.";
  else if (modo === "t2v" && !prompt.trim()) bloqueo = "Sin imagen, describe la escena en el prompt.";
  else if (!usuario.ilimitado && usuario.creditos < costo) bloqueo = `Te faltan créditos: cuesta ${costo} y tienes ${usuario.creditos}.`;

  const elegirArchivo = async (archivo) => {
    setError("");
    if (!archivo) return;
    if (!TIPOS.includes(archivo.type)) return setError("Usa una imagen PNG, JPEG o WebP.");
    if (archivo.size > MAX_IMAGEN) return setError("La imagen pasa de 10 MB.");
    try {
      setImagen(await leerArchivo(archivo));
    } catch (e) {
      setError(e.message);
    }
  };

  const generar = async (e) => {
    e.preventDefault();
    if (bloqueo) return;
    setEnviando(true);
    setError("");
    try {
      await api("/v1/generaciones", {
        metodo: "POST",
        cuerpo: { preset: preset.id, prompt, aspecto, resolucion, duracion, ...(imagen ? { imagen } : {}) },
      });
      await Promise.all([recargar(), alCambiarCreditos()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="grid gap-8 py-8 lg:grid-cols-[400px_1fr]">
      <form onSubmit={generar} className="space-y-6 lg:sticky lg:top-20 lg:self-start">
        <div>
          <h2 className="mb-2 text-sm font-semibold text-tenue">Imagen de inicio (opcional)</h2>
          <div
            onClick={() => entrada.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastrando(false);
              elegirArchivo(e.dataTransfer.files[0]);
            }}
            className={`relative grid min-h-40 cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed transition ${
              arrastrando ? "border-acento bg-acento/5" : "border-borde hover:border-tenue"
            }`}
          >
            {imagen ? (
              <>
                <img src={imagen} alt="Imagen de inicio" className="max-h-64 w-full object-contain" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImagen(null);
                  }}
                  className="absolute right-2 top-2 rounded-lg bg-black/70 px-2 py-1 text-xs hover:bg-black"
                >
                  Quitar
                </button>
              </>
            ) : (
              <p className="p-6 text-center text-sm text-tenue">
                Arrastra una imagen o haz clic
                <br />
                <span className="text-xs">Sin imagen, se genera desde el texto</span>
              </p>
            )}
            <input
              ref={entrada}
              type="file"
              accept={TIPOS.join(",")}
              className="hidden"
              onChange={(e) => {
                elegirArchivo(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-tenue">Preset</h2>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((p) => {
              const ok = p.modos.includes(modo);
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setPresetId(p.id)}
                  title={ok ? p.descripcion : modo === "i2v" ? "Solo texto a video" : "Necesita imagen"}
                  className={`overflow-hidden rounded-xl border text-left text-xs transition ${
                    p.id === preset.id ? "border-acento" : "border-borde hover:border-tenue"
                  } ${ok ? "" : "opacity-40"}`}
                >
                  <Escena animacion={p.animacion} />
                  <span className="block truncate px-2 py-1.5">{p.nombre}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-tenue">{preset.descripcion}</p>
        </div>

        <div>
          <label htmlFor="prompt" className="mb-2 block text-sm font-semibold text-tenue">
            Prompt {modo === "i2v" && <span className="font-normal">(opcional)</span>}
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder={modo === "i2v" ? "Qué pasa en la escena… (en inglés suele funcionar mejor)" : "Describe la escena completa…"}
            className="campo resize-y"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h2 className="mb-2 text-sm font-semibold text-tenue">Formato</h2>
            <Fichas valores={opciones?.aspectos || ["16:9"]} valor={aspecto} alElegir={setAspecto} />
          </div>
          <div>
            <h2 className="mb-2 text-sm font-semibold text-tenue">Calidad</h2>
            <Fichas valores={opciones?.resoluciones || ["480p"]} valor={resolucion} alElegir={setResolucion} />
          </div>
        </div>

        <div>
          <label htmlFor="duracion" className="mb-2 flex justify-between text-sm font-semibold text-tenue">
            <span>Duración</span>
            <span className="text-white">{duracion} s</span>
          </label>
          <input
            id="duracion"
            type="range"
            min={opciones?.duracion.min ?? 2}
            max={opciones?.duracion.max ?? 5}
            value={duracion}
            onChange={(e) => setDuracion(Number(e.target.value))}
            className="w-full accent-acento"
          />
        </div>

        {(error || bloqueo) && <p className={`text-sm ${error ? "text-red-300" : "text-tenue"}`}>{error || bloqueo}</p>}

        <button type="submit" disabled={!!bloqueo || enviando} className="boton-acento w-full py-3 text-base">
          {enviando ? "Enviando…" : usuario.ilimitado ? "Generar" : `Generar · ${costo} créditos`}
        </button>
      </form>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Tus últimas generaciones</h2>
        {lista.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {lista.map((g) => (
              <TarjetaGeneracion key={g.id} g={g} nombrePreset={nombres[g.preset]} alCambiar={recargar} alBorrar={quitar} />
            ))}
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-borde text-center text-tenue">
            <p>
              Aquí aparecerán tus videos.
              <br />
              Elige un preset y presiona Generar.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
