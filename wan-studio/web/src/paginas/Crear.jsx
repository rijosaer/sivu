import { useMemo, useRef, useState } from "react";
import { api } from "../api.js";
import Escena from "../componentes/Escena.jsx";
import EditorEscenas from "../componentes/EditorEscenas.jsx";
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
  const [forma, setForma] = useState("clip"); // "clip" | "escenas"
  const opcEscenas = opciones?.escenas ?? { max: 3, max_ilimitado: null, duracion: { min: 2, max: 10, defecto: 8 } };
  const [escenas, setEscenas] = useState(() => [
    { id: crypto.randomUUID(), prompt: "", duracion: opcEscenas.duracion.defecto, preset: null },
  ]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [arrastrando, setArrastrando] = useState(false);
  const entrada = useRef(null);

  const { lista, recargar, quitar } = useGeneraciones({ limite: 12, alTerminar: alCambiarCreditos });

  const preset = presets.find((p) => p.id === presetId) || presets[0];
  const modo = imagen ? "i2v" : "t2v";
  const compatible = preset.modos.includes(modo);
  const minDuracion = opciones?.duracion.min ?? 2;
  const recomendado = opciones?.duracion.recomendado ?? 60;
  const maxBarra = usuario.ilimitado ? recomendado : (opciones?.duracion.max ?? 5);
  const tramos = Math.max(1, Math.ceil(duracion / (opciones?.duracion.tramo || 5)));
  const factor = resolucion === "720p" ? 2 : 1;
  const maxEscenas = usuario.ilimitado ? (opcEscenas.max_ilimitado ?? Infinity) : opcEscenas.max;
  const presetDe = (e) => presets.find((p) => p.id === (e.preset ?? preset.id)) || preset;
  const costo =
    forma === "escenas"
      ? escenas.reduce((s, e) => s + Math.ceil(e.duracion * factor * (presetDe(e).multiplicador || 1)), 0)
      : Math.ceil(duracion * factor * (preset.multiplicador || 1));
  const nombres = useMemo(() => Object.fromEntries(presets.map((p) => [p.id, p.nombre])), [presets]);

  const primera = presetDe(escenas[0]);
  const vacia = escenas.findIndex((e) => !e.prompt.trim());
  let bloqueo = "";
  if (forma === "escenas") {
    if (vacia >= 0) bloqueo = `Escribe qué pasa en la escena ${vacia + 1}.`;
    else if (!primera.modos.includes(modo)) {
      bloqueo = `El preset de la escena 1 ${modo === "i2v" ? "es solo de texto: quita la imagen" : "necesita una imagen"}.`;
    }
  } else if (!(duracion >= minDuracion)) bloqueo = `La duración mínima es ${minDuracion} s.`;
  else if (!compatible) bloqueo = modo === "i2v" ? "Este preset es solo de texto: quita la imagen." : "Este preset necesita una imagen.";
  else if (modo === "t2v" && !prompt.trim()) bloqueo = "Sin imagen, describe la escena en el prompt.";
  if (!bloqueo && !usuario.ilimitado && usuario.creditos < costo) bloqueo = `Te faltan créditos: cuesta ${costo} y tienes ${usuario.creditos}.`;

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
        cuerpo: {
          preset: preset.id,
          aspecto,
          resolucion,
          ...(forma === "escenas"
            ? { escenas: escenas.map((e) => ({ prompt: e.prompt, duracion: e.duracion, preset: e.preset ?? preset.id })) }
            : { prompt, duracion }),
          ...(imagen ? { imagen } : {}),
        },
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
        {catalogo.motor === "mock" && (
          <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-200">
            <strong>Modo demostración:</strong> los videos todavía no usan IA. Solo se mueve la cámara sobre tu imagen
            (o un fondo animado si no hay imagen), así que el texto no se dibuja. Para generar con Wan, configura un motor
            real (fal, RunPod o tu GPU).
          </div>
        )}
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

        <div className="grid grid-cols-2 gap-1 rounded-xl border border-borde bg-panel p-1 text-sm">
          {[
            ["clip", "Un clip"],
            ["escenas", "Escenas (guion)"],
          ].map(([v, t]) => (
            <button
              type="button"
              key={v}
              onClick={() => setForma(v)}
              className={`rounded-lg py-1.5 font-medium transition ${forma === v ? "bg-acento text-black" : "text-tenue hover:text-white"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {forma === "escenas" ? (
          <EditorEscenas
            escenas={escenas}
            setEscenas={setEscenas}
            presets={presets}
            presetBase={preset.id}
            maxEscenas={maxEscenas}
            duracion={opcEscenas.duracion}
          />
        ) : (
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

        )}

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

        {forma === "clip" && (
        <div>
          <label htmlFor="duracion" className="mb-2 flex justify-between text-sm font-semibold text-tenue">
            <span>Duración</span>
            {usuario.ilimitado ? (
              // Sin tope: la barra llega a lo recomendado y el número acepta más.
              <span className="flex items-center gap-1 text-white">
                <input
                  type="number"
                  min={minDuracion}
                  value={duracion || ""}
                  onChange={(e) => setDuracion(Math.floor(Number(e.target.value)) || 0)}
                  className="w-20 rounded-lg border border-borde bg-fondo px-2 py-0.5 text-right text-white focus:border-acento focus:outline-none"
                  aria-label="Duración en segundos"
                />
                s
              </span>
            ) : (
              <span className="text-white">{duracion} s</span>
            )}
          </label>
          <input
            id="duracion"
            type="range"
            min={minDuracion}
            max={maxBarra}
            value={Math.min(duracion, maxBarra)}
            onChange={(e) => setDuracion(Number(e.target.value))}
            className="w-full accent-acento"
          />
          {usuario.ilimitado && (
            <p className="mt-1 text-xs text-tenue">
              Sin tope. Recomendado hasta {recomendado} s: más largo funciona, pero tarda más y la escena se va
              alejando de la imagen original.
            </p>
          )}
          {tramos > 1 && (
            <p className={`mt-1 text-xs ${duracion > recomendado ? "text-amber-300" : "text-tenue"}`}>
              Se genera en {tramos} tramos encadenados de ~{Math.round(duracion / tramos)} s: cada uno sigue desde el
              último cuadro del anterior.
            </p>
          )}
        </div>
        )}

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
