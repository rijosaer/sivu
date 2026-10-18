import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, SITIO_BASE, esEventoFijo, ORIGEN_SITIO } from "../api";
import CampoValor, { etiquetaDe } from "./EditorCampos";
import { vocabulario, etiquetaCampo, campoVisible } from "../vocabulario";
import GestorFotos from "./GestorFotos";
import EditorServidores from "./EditorServidores";
import { PRIMERA } from "../servidores";
import GestorAudio from "./GestorAudio";
import { usePendientes } from "../estado/Pendientes";
import { useToast } from "../ui/Toast";
import Icono from "../ui/Icono";

const FUENTE = "invitacion-editor";

// Campos que ya tienen su propio gestor arriba del editor y que, por eso, no
// deben repetirse como campo suelto del JSON.
const CAMPOS_SECUNDARIOS = { fotos: ["urls"] };

// Antes esta pantalla eran doce tarjetas abiertas, una debajo de otra: para
// llegar a «Menú» había que pasar por todo lo demás y no se sabía cuántas
// secciones había. Ahora es una lista a la izquierda y el editor de la que
// elijas a la derecha.
//
// Lo que se escribe vive en "borradores", en esta pantalla y no dentro de cada
// tarjeta: así se puede saltar de una sección a otra sin perder lo escrito, y
// el aviso de «sin publicar» cuenta todas, no solo la que estás viendo.

function ListaSecciones({ secciones, seleccionada, onSeleccionar, esPendiente, arrastrar, soloTextos }) {
  return (
    <ul className="tarjeta divide-y divide-borde overflow-hidden">
      {secciones.map((s) => {
        const activa = s.id === seleccionada;
        return (
          <li
            key={s.id}
            onDragOver={(e) => {
              if (arrastrar.activo()) e.preventDefault();
            }}
            onDrop={() => arrastrar.soltar(s)}
          >
            <div
              className={`flex items-center gap-2 pr-2 transition-colors ${
                activa ? "bg-[#F3E9DA]" : "hover:bg-lienzo"
              }`}
            >
              {!soloTextos && <span
                draggable
                onDragStart={() => arrastrar.tomar(s)}
                onDragEnd={() => arrastrar.fin()}
                title="Arrastra para reordenar"
                className="cursor-grab active:cursor-grabbing text-ink-tenue hover:text-ink select-none pl-2.5 py-2.5"
              >
                ⋮⋮
              </span>}
              <button
                onClick={() => onSeleccionar(s.id)}
                aria-current={activa ? "true" : undefined}
                className={`flex-1 min-w-0 text-left py-2.5 ${soloTextos ? "pl-4" : ""}`}
              >
                <span
                  className={`block text-sm truncate ${
                    activa ? "font-medium text-ink" : "text-ink-suave"
                  }`}
                >
                  {s.titulo_panel}
                </span>
                <span className="flex items-center gap-1.5 mt-0.5">
                  {esPendiente(s) && <span className="insignia insignia-aviso">sin publicar</span>}
                  {!s.activo && <span className="insignia insignia-neutra">oculta</span>}
                </span>
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Editor({
  seccion,
  borrador,
  sinPublicar,
  onCambiar,
  onPublicar,
  onDescartar,
  onMover,
  esPrimera,
  esUltima,
  soloTextos,
}) {
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [verSecundarios, setVerSecundarios] = useState(false);

  const secundarios = CAMPOS_SECUNDARIOS[seccion.tipo] || [];
  const voc = vocabulario();
  const visibles = Object.entries(borrador.contenido).filter(([c, v]) => campoVisible(c, v, voc));
  const campos = visibles.filter(([c]) => !secundarios.includes(c));
  const camposSecundarios = visibles.filter(([c]) => secundarios.includes(c));
  const etiqueta = (clave) => etiquetaCampo(clave, voc) || etiquetaDe(clave);

  function setCampo(clave, valor) {
    onCambiar({ ...borrador, contenido: { ...borrador.contenido, [clave]: valor } });
  }

  async function publicar() {
    setGuardando(true);
    setError("");
    try {
      await onPublicar();
    } catch (e) {
      setError(e.message || "No se pudo publicar");
    }
    setGuardando(false);
  }

  return (
    <div className="tarjeta p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div className="min-w-0">
          <h3 className="text-lg font-medium tracking-[-.02em] text-ink truncate">
            {seccion.titulo_panel}
          </h3>
          <p className="ayuda mt-0.5">
            {sinPublicar
              ? "Tus invitados todavía ven la versión anterior."
              : "Al día con lo que ven los invitados."}
          </p>
        </div>

        {/* El cliente solo corrige textos: el orden y qué secciones se ven
            los define Sivú, igual que el diseño. */}
        {!soloTextos && <div className="flex items-center gap-2 shrink-0">
          <button
            disabled={esPrimera}
            onClick={() => onMover(-1)}
            title="Subir esta sección"
            className="boton-secundario w-8 px-0"
          >
            ↑
          </button>
          <button
            disabled={esUltima}
            onClick={() => onMover(1)}
            title="Bajar esta sección"
            className="boton-secundario w-8 px-0"
          >
            ↓
          </button>
          <label
            className={`inline-flex items-center gap-2 text-xs px-3 py-2 rounded-md border cursor-pointer transition-colors ${
              borrador.activo
                ? "border-borde-fuerte text-ink-suave hover:text-ink"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            <input
              type="checkbox"
              checked={borrador.activo}
              onChange={(e) => onCambiar({ ...borrador, activo: e.target.checked })}
            />
            {borrador.activo ? "Visible" : "Oculta"}
          </label>
        </div>}
      </div>

      {/* Estas dos secciones traen además su gestor de archivos. */}
      {seccion.tipo === "fotos" && <GestorFotos />}
      {seccion.tipo === "musica" && <GestorAudio />}

      {/* La tarjeta de los servidores tiene su propio editor: el formulario
          genérico daba un renglón de una línea para el mensaje de cada
          persona y no enseñaba a qué enlace lleva cada nombre. */}
      {seccion.tipo === "servidores" ? (
        <EditorServidores
          contenido={borrador.contenido}
          onCambiar={(contenido) => onCambiar({ ...borrador, contenido })}
        />
      ) : (
        <div className="space-y-4">
          {campos.map(([clave, valor]) => (
            <div key={clave}>
              <span className="etiqueta">{etiqueta(clave)}</span>
              <CampoValor clave={clave} valor={valor} onChange={(v) => setCampo(clave, v)} />
            </div>
          ))}
        </div>
      )}

      {/* Los enlaces externos quedan plegados: es la vía secundaria y ocupaba
          tanto espacio que tapaba el botón de subir fotos. */}
      {camposSecundarios.length > 0 && (
        <div className="mt-4 pt-3 separador">
          <button onClick={() => setVerSecundarios((v) => !v)} className="boton-texto">
            {verSecundarios ? "▾" : "▸"} Opciones avanzadas
          </button>
          {verSecundarios && (
            <div className="space-y-4 mt-3">
              {camposSecundarios.map(([clave, valor]) => (
                <div key={clave}>
                  <span className="etiqueta">{etiqueta(clave)}</span>
                  <CampoValor clave={clave} valor={valor} onChange={(v) => setCampo(clave, v)} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-5 pt-4 separador flex items-center gap-3 flex-wrap">
        <button onClick={publicar} disabled={guardando || !sinPublicar} className="boton-primario">
          {guardando ? "Publicando..." : sinPublicar ? "Publicar cambios" : "Publicado"}
        </button>
        {sinPublicar && (
          <button onClick={onDescartar} className="boton-peligro">
            Descartar
          </button>
        )}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}

export default function Contenido() {
  const toast = useToast();
  const { marcar } = usePendientes();
  const soloTextos = esEventoFijo();
  const [secciones, setSecciones] = useState([]);
  const [borradores, setBorradores] = useState({});
  const [seleccionada, setSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [verVista, setVerVista] = useState(false);

  const iframeRef = useRef(null);
  const arrastrado = useRef(null);

  const avisarVista = useCallback((mensaje) => {
    iframeRef.current?.contentWindow?.postMessage({ fuente: FUENTE, ...mensaje }, ORIGEN_SITIO);
  }, []);

  async function cargar() {
    setCargando(true);
    const data = await api.secciones();
    // Servidores salió del menú (se hizo para una sola boda); su sección
    // sigue en la base por si un cliente la vuelve a pedir.
    const ordenadas = data.filter((s) => s.tipo !== "servidores" && (!esEventoFijo() || s.activo)).sort((a, b) => a.orden - b.orden);
    setSecciones(ordenadas);
    setSeleccionada((prev) => prev ?? ordenadas[0]?.id ?? null);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  // Lo que se está editando de una sección: su borrador si existe, y si no, lo
  // publicado tal cual.
  const borradorDe = useCallback(
    (s) => borradores[s.id] || { contenido: s.contenido, activo: s.activo },
    [borradores]
  );

  const sinPublicar = useCallback(
    (s) => {
      const b = borradores[s.id];
      if (!b) return false;
      return JSON.stringify(b.contenido) !== JSON.stringify(s.contenido) || b.activo !== s.activo;
    },
    [borradores]
  );

  const pendientes = useMemo(
    () => secciones.filter(sinPublicar).map((s) => s.titulo_panel),
    [secciones, sinPublicar]
  );

  // El aviso de la cabecera cuenta todas las secciones con cambios, se esté
  // viendo la que se esté viendo.
  const nombresRef = useRef([]);
  useEffect(() => {
    nombresRef.current = secciones.map((s) => s.titulo_panel);
    for (const n of nombresRef.current) marcar(n, pendientes.includes(n));
  }, [marcar, pendientes, secciones]);

  // La limpieza va aparte y solo al salir de la pantalla: si se hiciera en el
  // mismo efecto, cada tecla apagaría y volvería a encender el aviso.
  useEffect(
    () => () => {
      for (const n of nombresRef.current) marcar(n, false);
    },
    [marcar]
  );

  const actual = secciones.find((s) => s.id === seleccionada);

  // La tarjeta de los servidores no se dibuja dentro de la invitación: vive en
  // su propio enlace. Para verla mientras se edita, la previa tiene que pedir
  // esa página en vez de la invitación.
  const previaSrc =
    actual?.tipo === "servidores"
      ? `${SITIO_BASE}?editor=1&servidores=${PRIMERA}`
      : `${SITIO_BASE}?editor=1`;

  // Vista previa en vivo: se manda el contenido de la sección abierta al sitio
  // incrustado mientras se escribe (con un pequeño retardo para no saturar).
  useEffect(() => {
    if (!actual || !verVista) return;
    const b = borradorDe(actual);
    const t = setTimeout(
      () => avisarVista({ tipo: "previsualizar", seccionTipo: actual.tipo, ...b }),
      250
    );
    return () => clearTimeout(t);
  }, [actual, borradorDe, avisarVista, verVista]);

  function cambiar(seccion, borrador) {
    setBorradores((prev) => ({ ...prev, [seccion.id]: borrador }));
  }

  function descartar(seccion) {
    setBorradores((prev) => {
      const copia = { ...prev };
      delete copia[seccion.id];
      return copia;
    });
    toast("Cambios descartados", "info");
  }

  async function publicar(seccion) {
    const b = borradorDe(seccion);
    await api.actualizarSeccion(seccion.id, b);
    setSecciones((prev) =>
      prev.map((s) => (s.id === seccion.id ? { ...s, contenido: b.contenido, activo: b.activo } : s))
    );
    setBorradores((prev) => {
      const copia = { ...prev };
      delete copia[seccion.id];
      return copia;
    });
    // Tras publicar, la previa recarga para reflejar el estado real.
    avisarVista({ tipo: "recargar" });
    toast("Sección publicada");
  }

  async function persistirOrden(orden) {
    await api.reordenarSecciones(orden.map((s, i) => ({ id: s.id, orden: i + 1 })));
    setSecciones(orden.map((s, i) => ({ ...s, orden: i + 1 })));
    avisarVista({ tipo: "recargar" });
  }

  async function mover(seccion, direccion) {
    const idx = secciones.findIndex((s) => s.id === seccion.id);
    const destino = idx + direccion;
    if (destino < 0 || destino >= secciones.length) return;
    const copia = [...secciones];
    [copia[idx], copia[destino]] = [copia[destino], copia[idx]];
    await persistirOrden(copia);
  }

  // Reordenar arrastrando: al soltar sobre otra sección, la arrastrada se
  // inserta en esa posición. Las flechas siguen ahí para móvil/accesibilidad.
  const arrastrar = {
    activo: () => Boolean(arrastrado.current),
    tomar: (s) => {
      arrastrado.current = s;
    },
    fin: () => {
      arrastrado.current = null;
    },
    soltar: async (destino) => {
      const origen = arrastrado.current;
      arrastrado.current = null;
      if (!origen || origen.id === destino.id) return;
      const copia = secciones.filter((s) => s.id !== origen.id);
      const at = copia.findIndex((s) => s.id === destino.id);
      copia.splice(at, 0, origen);
      await persistirOrden(copia);
      toast("Orden actualizado");
    },
  };

  if (cargando) return <p className="text-sm text-ink-tenue">Cargando...</p>;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h2 className="panel-titulo">Contenido</h2>
          <p className="panel-subtitulo">
            Elige una sección, edítala y publícala. Nada llega a la invitación hasta que le des
            <strong className="text-ink"> Publicar cambios</strong>.
          </p>
        </div>
        <button onClick={() => setVerVista((v) => !v)} className="boton-secundario">
          <Icono nombre="ojo" className="w-3.5 h-3.5" />
          {verVista ? "Ocultar vista previa" : "Ver vista previa"}
        </button>
      </div>

      <div className="grid lg:grid-cols-[17rem_minmax(0,1fr)] gap-5 items-start">
        <div className="lg:sticky lg:top-24">
          <span className="etiqueta">
            Secciones de la invitación · {secciones.length}
            {pendientes.length > 0 && ` · ${pendientes.length} sin publicar`}
          </span>
          <ListaSecciones
            secciones={secciones}
            seleccionada={seleccionada}
            onSeleccionar={setSeleccionada}
            esPendiente={sinPublicar}
            arrastrar={arrastrar}
            soloTextos={soloTextos}
          />
          {!soloTextos && (
            <p className="ayuda mt-2">
              Arrastra ⋮⋮ para cambiar el orden en que aparecen en la invitación.
            </p>
          )}
        </div>

        <div className="space-y-5">
          {/* Vista previa en vivo del sitio: se actualiza mientras escribes. */}
          {verVista && (
            <div className="tarjeta p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="etiqueta mb-0">Vista previa — se actualiza al escribir</span>
                <button
                  onClick={() => avisarVista({ tipo: "recargar" })}
                  className="boton-texto"
                >
                  Refrescar
                </button>
              </div>
              <div className="bg-lienzo border border-borde rounded-lg flex justify-center overflow-hidden">
                <iframe
                  ref={iframeRef}
                  title="Vista previa de la invitación"
                  src={previaSrc}
                  className="w-[390px] h-[560px] bg-white"
                />
              </div>
            </div>
          )}

          {actual && (
            <Editor
              key={actual.id}
              seccion={actual}
              borrador={borradorDe(actual)}
              sinPublicar={sinPublicar(actual)}
              onCambiar={(b) => cambiar(actual, b)}
              onPublicar={() => publicar(actual)}
              onDescartar={() => descartar(actual)}
              onMover={(d) => mover(actual, d)}
              esPrimera={secciones[0]?.id === actual.id}
              esUltima={secciones[secciones.length - 1]?.id === actual.id}
              soloTextos={soloTextos}
            />
          )}
        </div>
      </div>
    </div>
  );
}
