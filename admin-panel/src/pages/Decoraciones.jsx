import { useCallback, useEffect, useRef, useState } from "react";
import { api, urlMedia, SITIO_BASE, ORIGEN_SITIO, mensajeDelSitio } from "../api";
import { comprimirDecoracion } from "../archivos";
import GestorFondo from "./GestorFondo";

const FUENTE = "invitacion-editor";

// La música no se puede decorar: es solo un botón flotante. La portada sí,
// pero va aparte porque la vista previa tiene que cambiar de pantalla.
// "welcome" tiene su propia entrada (la portada) y "musica" es un botón
// flotante. "servidores" es la tarjeta de su enlace aparte: no se dibuja
// dentro de la invitación, así que una decoración puesta ahí no se vería
// nunca.
const NO_COLOCABLES = ["welcome", "musica", "servidores"];

// Debe coincidir con el tipo de sección de la portada en la base.
const PORTADA = "welcome";

// Ámbito libre: la decoración se coloca sobre toda la invitación en vez de
// dentro de una sección, para las que deben quedar entre dos zonas.
// Debe coincidir con ZONA_LIBRE del sitio.
const ZONA_LIBRE = "__global__";

function Deslizador({ etiqueta, valor, min, max, paso, sufijo, onChange }) {
  return (
    <label className="block">
      <span className="flex justify-between text-[11px] uppercase tracking-[.08em] text-ink-tenue">
        {etiqueta}
        <span className="font-mono text-ink-suave">
          {Math.round(valor * 100) / 100}
          {sufijo}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={paso}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-marca"
      />
    </label>
  );
}

export default function Decoraciones() {
  const [decoraciones, setDecoraciones] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [secciones, setSecciones] = useState([]);
  const [seccionActiva, setSeccionActiva] = useState("");
  const [seleccionadaId, setSeleccionadaId] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState("");
  const [error, setError] = useState("");
  const [nombreNueva, setNombreNueva] = useState("");

  const iframeRef = useRef(null);
  const guardadoPendiente = useRef({});

  const avisarAlSitio = useCallback((mensaje) => {
    iframeRef.current?.contentWindow?.postMessage({ fuente: FUENTE, ...mensaje }, ORIGEN_SITIO);
  }, []);

  const cargar = useCallback(async () => {
    const [decos, ubis, secs] = await Promise.all([
      api.decoraciones(),
      api.ubicaciones(),
      api.secciones(),
    ]);
    setDecoraciones(decos);
    setUbicaciones(ubis);
    const portada = secs.find((s) => s.tipo === PORTADA);
    const colocables = [
      { tipo: PORTADA, titulo_panel: `Portada — ${portada?.titulo_panel || "lo primero que se ve"}` },
      { tipo: ZONA_LIBRE, titulo_panel: "Toda la invitación (entre secciones)" },
      ...secs.filter((s) => !NO_COLOCABLES.includes(s.tipo)),
    ];
    setSecciones(colocables);
    setSeccionActiva((prev) => prev || colocables[0].tipo);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Mensajes que llegan del sitio incrustado.
  useEffect(() => {
    function alRecibir(e) {
      if (!mensajeDelSitio(e, iframeRef.current)) return;
      const d = e.data;
      if (!d || d.fuente !== FUENTE) return;
      if (d.tipo === "seleccionar") setSeleccionadaId(d.id ?? null);
      else if (d.tipo === "mover") {
        setUbicaciones((prev) =>
          prev.map((u) => (u.id === d.id ? { ...u, x: d.x, y: d.y } : u))
        );
        api.actualizarUbicacion(d.id, { x: d.x, y: d.y }).catch((err) => setError(err.message));
      }
    }
    window.addEventListener("message", alRecibir);
    return () => window.removeEventListener("message", alRecibir);
  }, []);

  const seleccionada = ubicaciones.find((u) => u.id === seleccionadaId) || null;
  const deSeccion = ubicaciones.filter((u) => u.seccion_tipo === seccionActiva);

  // La portada y el cuerpo son dos pantallas distintas del sitio, así que la
  // previa tiene que recargarse al pasar de una a otra. Como el src solo
  // cambia al cruzar esa frontera, moverse entre secciones del cuerpo no
  // recarga nada.
  const srcPrevia = `${SITIO_BASE}?editor=1${seccionActiva === PORTADA ? "&portada=1" : ""}`;

  // Los deslizadores se mueven muy seguido: se refleja al instante en la
  // previa y se guarda una sola vez cuando el usuario se detiene.
  function ajustar(id, cambios) {
    setUbicaciones((prev) => prev.map((u) => (u.id === id ? { ...u, ...cambios } : u)));
    avisarAlSitio({ tipo: "aplicar", id, cambios });
    clearTimeout(guardadoPendiente.current[id]);
    guardadoPendiente.current[id] = setTimeout(() => {
      api.actualizarUbicacion(id, cambios).catch((e) => setError(e.message));
    }, 400);
  }

  async function colocar(clave) {
    setError("");
    try {
      // Escalonar la posición: si todas nacieran en el mismo punto, la nueva
      // taparía a la anterior y ya no se podría agarrar la de abajo.
      const cuantas = ubicaciones.filter((u) => u.seccion_tipo === seccionActiva).length;
      const nueva = await api.crearUbicacion({
        clave,
        seccion_tipo: seccionActiva,
        x: 15 + ((cuantas * 13) % 55),
        y: 12 + ((cuantas * 9) % 45),
        ancho: 30,
      });
      setUbicaciones((prev) => [...prev, nueva]);
      setSeleccionadaId(nueva.id);
      avisarAlSitio({ tipo: "recargar" });
    } catch (e) {
      setError(e.message);
    }
  }

  async function quitarUbicacion(id) {
    await api.borrarUbicacion(id);
    setUbicaciones((prev) => prev.filter((u) => u.id !== id));
    if (seleccionadaId === id) setSeleccionadaId(null);
    avisarAlSitio({ tipo: "recargar" });
  }

  async function subirImagen(clave, archivo) {
    if (!archivo) return;
    setOcupado(clave);
    setError("");
    try {
      await api.actualizarDecoracion(clave, await comprimirDecoracion(archivo));
      await cargar();
      avisarAlSitio({ tipo: "recargar" });
    } catch (e) {
      setError(e.message);
    }
    setOcupado("");
  }

  async function crearNueva(archivo) {
    if (!archivo) return;
    if (!nombreNueva.trim()) return setError("Ponle un nombre a la decoración antes de subirla.");
    setOcupado("nueva");
    setError("");
    try {
      await api.crearDecoracion(nombreNueva.trim(), await comprimirDecoracion(archivo));
      setNombreNueva("");
      await cargar();
    } catch (e) {
      setError(e.message);
    }
    setOcupado("");
  }

  async function restaurar(clave) {
    setOcupado(clave);
    await api.actualizarDecoracion(clave, null);
    await cargar();
    avisarAlSitio({ tipo: "recargar" });
    setOcupado("");
  }

  async function eliminarDecoracion(clave) {
    if (!confirm("¿Eliminar esta decoración? También se quitará de donde esté colocada.")) return;
    await api.borrarDecoracion(clave);
    await cargar();
    avisarAlSitio({ tipo: "recargar" });
  }

  if (cargando) return <p className="text-sm text-ink/50">Cargando...</p>;

  return (
    <div>
      <h2 className="panel-titulo">Diseño</h2>
      <p className="panel-subtitulo mb-4">
        Elige una sección, agrégale decoraciones y <strong className="text-ink">arrástralas</strong>{" "}
        sobre la vista previa. Se guardan solas.
      </p>

      {/* Los detalles finos van plegados: son cuatro reglas que solo hacen
          falta la primera vez, y como párrafo suelto tapaban los controles. */}
      <details className="tarjeta p-4 mb-6">
        <summary className="text-sm font-medium text-ink cursor-pointer">
          Cómo funciona esta pantalla
        </summary>
        <ul className="ayuda mt-3 space-y-1.5 list-disc pl-4">
          <li>
            <strong className="text-ink-suave">Portada</strong> es la primera pantalla, la que ve el
            invitado antes de abrir la invitación.
          </li>
          <li>
            <strong className="text-ink-suave">Toda la invitación</strong> es para las decoraciones
            que deben quedar entre dos secciones.
          </li>
          <li>
            Si una queda tapada por otra, haz clic en ella en «Colocadas aquí»: se pone al frente y
            ya puedes arrastrarla.
          </li>
          <li>La previa tiene ancho de celular porque así la verán casi todos tus invitados.</li>
        </ul>
      </details>

      {error && <p className="text-xs text-red-700 mb-3">{error}</p>}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ---------- Columna de controles ---------- */}
        <div className="lg:w-[22rem] shrink-0 space-y-6">
          <div>
            <span className="etiqueta">Sección</span>
            <select
              value={seccionActiva}
              onChange={(e) => {
                setSeccionActiva(e.target.value);
                setSeleccionadaId(null);
              }}
              className="campo"
            >
              {secciones.map((s) => (
                <option key={s.tipo} value={s.tipo}>
                  {s.titulo_panel}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="etiqueta">Agregar a esta sección</span>
            <div className="grid grid-cols-4 gap-2">
              {decoraciones.map((d) => (
                <button
                  key={d.clave}
                  onClick={() => colocar(d.clave)}
                  title={`Colocar ${d.etiqueta}`}
                  className="border border-borde rounded-lg h-16 flex items-center justify-center hover:border-marca hover:bg-marca-suave transition-colors p-1"
                >
                  {d.url ? (
                    <img src={urlMedia(d.url)} alt={d.etiqueta} className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-[9px] text-ink-tenue text-center leading-tight">
                      {d.etiqueta}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="etiqueta">Colocadas aquí ({deSeccion.length})</span>
            {deSeccion.length === 0 && (
              <p className="ayuda">Ninguna todavía. Toca una de arriba para colocarla.</p>
            )}
            <div className="space-y-1">
              {deSeccion.map((u) => {
                const deco = decoraciones.find((d) => d.clave === u.clave);
                return (
                  <div
                    key={u.id}
                    className={`flex items-center gap-2 border rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${
                      seleccionadaId === u.id
                        ? "border-marca bg-marca-suave"
                        : "border-borde hover:border-borde-fuerte"
                    }`}
                    onClick={() => {
                      setSeleccionadaId(u.id);
                      avisarAlSitio({ tipo: "seleccionar", id: u.id });
                    }}
                  >
                    {deco?.url && (
                      <img src={urlMedia(deco.url)} alt="" className="w-6 h-6 object-contain" />
                    )}
                    <span className="text-xs flex-1">{deco?.etiqueta || u.clave}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        quitarUbicacion(u.id);
                      }}
                      className="text-[11px] text-ink-tenue hover:text-red-600 transition-colors px-1"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {seleccionada && (
            <div className="tarjeta p-3 space-y-3">
              <span className="etiqueta">Ajustes de la seleccionada</span>
              <Deslizador
                etiqueta="Tamaño"
                valor={seleccionada.ancho}
                min={3}
                max={120}
                paso={1}
                sufijo="%"
                onChange={(v) => ajustar(seleccionada.id, { ancho: v })}
              />
              <Deslizador
                etiqueta="Rotación"
                valor={seleccionada.rotacion}
                min={-180}
                max={180}
                paso={1}
                sufijo="°"
                onChange={(v) => ajustar(seleccionada.id, { rotacion: v })}
              />
              <Deslizador
                etiqueta="Transparencia"
                valor={seleccionada.opacidad}
                min={0.05}
                max={1}
                paso={0.05}
                sufijo=""
                onChange={(v) => ajustar(seleccionada.id, { opacidad: v })}
              />
              <div>
                <span className="etiqueta">Capa</span>
                <div className="flex gap-2 mt-1">
                  {[
                    { k: "detras", l: "Detrás del texto" },
                    { k: "delante", l: "Delante" },
                  ].map((c) => (
                    <button
                      key={c.k}
                      onClick={() => ajustar(seleccionada.id, { capa: c.k })}
                      className={`flex-1 text-[11px] py-1.5 rounded-md border transition-colors ${
                        seleccionada.capa === c.k
                          ? "bg-ink text-white border-ink"
                          : "border-borde-fuerte text-ink-suave hover:text-ink"
                      }`}
                    >
                      {c.l}
                    </button>
                  ))}
                </div>
                <p className="ayuda mt-1.5">
                  "Delante" tapa el texto de la invitación. Úsalo solo en zonas
                  vacías o con la transparencia bien baja.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ---------- Vista previa ---------- */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="etiqueta mb-0">Vista previa — arrastra las decoraciones</span>
            <button onClick={() => avisarAlSitio({ tipo: "recargar" })} className="boton-secundario">
              Refrescar
            </button>
          </div>
          <div className="border border-borde rounded-xl bg-lienzo p-3 flex justify-center">
            <iframe
              ref={iframeRef}
              title="Vista previa de la invitación"
              src={srcPrevia}
              className="w-[390px] h-[720px] bg-white border border-borde rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* ---------- Fondo ---------- */}
      <h3 className="bloque-titulo mt-10 mb-3">Fondo de la invitación</h3>
      <div className="max-w-md">
        <GestorFondo onCambio={() => avisarAlSitio({ tipo: "recargar" })} />
      </div>

      {/* ---------- Biblioteca de decoraciones ---------- */}
      <h3 className="bloque-titulo mt-10 mb-3">Tus decoraciones</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {decoraciones.map((d) => (
          <div key={d.clave} className="tarjeta p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="text-sm font-medium">{d.etiqueta}</p>
              {d.personalizada && (
                <span className="insignia insignia-neutra">propia</span>
              )}
            </div>
            <div className="h-28 border border-dashed border-borde-fuerte rounded-lg flex items-center justify-center mb-3 bg-lienzo">
              {d.url ? (
                <img src={urlMedia(d.url)} alt={d.etiqueta} className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="ayuda">Usando la imagen de fábrica</span>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              <label className="boton-primario cursor-pointer">
                {ocupado === d.clave ? "Subiendo..." : "Cambiar imagen"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    subirImagen(d.clave, e.target.files[0]);
                    e.target.value = "";
                  }}
                />
              </label>
              {d.url && !d.personalizada && (
                <button onClick={() => restaurar(d.clave)} className="boton-texto">
                  Volver a la de fábrica
                </button>
              )}
              {d.personalizada && (
                <button
                  onClick={() => eliminarDecoracion(d.clave)}
                  className="boton-texto hover:text-red-600"
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Crear una decoración nueva */}
        <div className="border border-dashed border-borde-fuerte rounded-xl p-4">
          <p className="text-sm font-medium mb-2">Agregar decoración nueva</p>
          <p className="ayuda mb-3">PNG con fondo transparente funciona mejor.</p>
          <input
            value={nombreNueva}
            onChange={(e) => setNombreNueva(e.target.value)}
            placeholder="Nombre, ej. Ramo de rosas"
            className="campo mb-3"
          />
          <label className="boton-primario cursor-pointer">
            {ocupado === "nueva" ? "Subiendo..." : "Elegir imagen y crear"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                crearNueva(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
