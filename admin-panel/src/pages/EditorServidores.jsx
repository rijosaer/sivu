import { useRef } from "react";
import { SITIO_URL } from "../api";
import { comoEnlace } from "../servidores";

// El editor propio de la tarjeta de los servidores. Las demás secciones se
// editan con el formulario genérico que arma un campo por clave del JSON, y
// para esta se quedaba corto: el mensaje de cada persona salía en un renglón
// de una sola línea, y no se veía a qué enlace lleva cada nombre.
//
// Todo el texto de la tarjeta se escribe aquí. Lo único que no: la firma
// —los nombres de los novios y la fecha—, que se toma de Bienvenida y de
// Información de la boda para que no haya dos sitios donde cambiarla.

const MARCADORES = [
  { clave: "{nombre}", que: "El nombre de esa persona" },
  { clave: "{funcion}", que: "Su función («que como voz principal...»)" },
];

// Un área de texto con los botones que insertan {nombre} y {funcion} donde
// esté el cursor, no al final: así se colocan en mitad de una frase.
function TextoConMarcadores({ valor, onChange, filas = 3, marcadores = MARCADORES }) {
  const areaRef = useRef(null);

  function insertar(clave) {
    const area = areaRef.current;
    const texto = valor ?? "";
    const inicio = area?.selectionStart ?? texto.length;
    const fin = area?.selectionEnd ?? texto.length;
    onChange(texto.slice(0, inicio) + clave + texto.slice(fin));
    requestAnimationFrame(() => {
      area?.focus();
      area?.setSelectionRange(inicio + clave.length, inicio + clave.length);
    });
  }

  return (
    <div>
      <textarea
        ref={areaRef}
        value={valor ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={filas}
        className="campo leading-relaxed resize-y"
      />
      {marcadores.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <span className="text-[11px] text-ink-tenue mr-1">Insertar:</span>
          {marcadores.map((m) => (
            <button
              key={m.clave}
              type="button"
              onClick={() => insertar(m.clave)}
              title={m.que}
              className="chip-filtro font-mono"
            >
              {m.clave}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Campo({ etiqueta, ayuda, children }) {
  return (
    <div>
      <span className="etiqueta">{etiqueta}</span>
      {children}
      {ayuda && <p className="ayuda mt-1">{ayuda}</p>}
    </div>
  );
}

const btnChico =
  "text-[11px] px-2 py-1 rounded-md border border-borde-fuerte text-ink-suave hover:border-[#aeb5aa] hover:text-ink transition-colors";

function Persona({ persona, indice, total, onCambiar, onMover, onQuitar }) {
  const enlace = persona.nombre ? `${SITIO_URL}/?servidores=${comoEnlace(persona.nombre)}` : "";

  return (
    <div className="border border-borde rounded-lg p-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-3 min-w-0">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] uppercase tracking-wide text-ink/45">Nombre</span>
              <input
                value={persona.nombre ?? ""}
                onChange={(e) => onCambiar({ nombre: e.target.value })}
                placeholder="María José Fragozo"
                className="campo mt-0.5"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-wide text-ink/45">Función</span>
              <input
                value={persona.funcion ?? ""}
                onChange={(e) => onCambiar({ funcion: e.target.value })}
                placeholder="voz principal"
                className="campo mt-0.5"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[10px] uppercase tracking-wide text-ink/45">
              Mensaje solo para esta persona
            </span>
            <textarea
              value={persona.mensaje ?? ""}
              onChange={(e) => onCambiar({ mensaje: e.target.value })}
              rows={2}
              placeholder="Si lo dejas vacío, recibe el mensaje para todos."
              className="campo mt-0.5 leading-relaxed resize-y"
            />
          </label>

          {enlace && (
            <p className="text-[11px] text-ink-tenue break-all">
              Su enlace: <code className="font-mono">{enlace}</code>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          <button
            type="button"
            onClick={() => onMover(-1)}
            disabled={indice === 0}
            className={`${btnChico} disabled:opacity-20`}
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMover(1)}
            disabled={indice === total - 1}
            className={`${btnChico} disabled:opacity-20`}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={onQuitar}
            className={`${btnChico} hover:border-red-700 hover:text-red-700`}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EditorServidores({ contenido, onCambiar }) {
  const personas = Array.isArray(contenido.personas) ? contenido.personas : [];

  const set = (clave, valor) => onCambiar({ ...contenido, [clave]: valor });
  const setPersonas = (lista) => set("personas", lista);

  function cambiarPersona(i, cambios) {
    setPersonas(personas.map((p, j) => (j === i ? { ...p, ...cambios } : p)));
  }
  function moverPersona(i, delta) {
    const destino = i + delta;
    if (destino < 0 || destino >= personas.length) return;
    const copia = [...personas];
    [copia[i], copia[destino]] = [copia[destino], copia[i]];
    setPersonas(copia);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Campo etiqueta="Título de arriba">
          <input
            value={contenido.titulo ?? ""}
            onChange={(e) => set("titulo", e.target.value)}
            placeholder="Gracias por ser parte"
            className="campo"
          />
        </Campo>

        <Campo
          etiqueta="Mensaje para todos"
          ayuda="Lo recibe cada quien con su nombre y su función ya puestos. Quien tenga un mensaje propio, más abajo, recibe ese en lugar de este."
        >
          <TextoConMarcadores
            valor={contenido.texto}
            onChange={(v) => set("texto", v)}
            filas={4}
          />
        </Campo>

        <Campo etiqueta="Versículo o frase" ayuda="Va en cursiva, debajo del mensaje. Déjalo vacío si no lo quieres.">
          <TextoConMarcadores
            valor={contenido.versiculo}
            onChange={(v) => set("versiculo", v)}
            filas={2}
          />
        </Campo>

        <Campo
          etiqueta="Despedida sobre la firma"
          ayuda="La línea que va justo encima de los nombres de los novios."
        >
          <input
            value={contenido.cierre ?? ""}
            onChange={(e) => set("cierre", e.target.value)}
            placeholder="Con todo nuestro cariño,"
            className="campo"
          />
        </Campo>

        <p className="ayuda border-l-2 border-borde-fuerte pl-3">
          La firma —los nombres de los novios y la fecha— no se escribe aquí: sale de Bienvenida y
          de Información de la boda, para no tener que cambiarla en dos sitios.
        </p>
      </div>

      <div className="pt-5 separador">
        <div className="flex items-end justify-between gap-3 flex-wrap mb-3">
          <div>
            <span className="etiqueta mb-0">Personas · {personas.length}</span>
            <p className="ayuda mt-0.5">
              Cada una tiene su tarjeta y su enlace. El enlace sale del nombre: si lo cambias, el
              anterior deja de abrir su tarjeta.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {personas.map((p, i) => (
            <Persona
              key={i}
              persona={p || {}}
              indice={i}
              total={personas.length}
              onCambiar={(cambios) => cambiarPersona(i, cambios)}
              onMover={(d) => moverPersona(i, d)}
              onQuitar={() => setPersonas(personas.filter((_, j) => j !== i))}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setPersonas([...personas, { nombre: "", funcion: "", mensaje: "" }])}
          className="boton-secundario mt-3"
        >
          + Agregar persona
        </button>
      </div>

      <div className="pt-5 separador space-y-4">
        <span className="etiqueta mb-0">Enlace común</span>
        <p className="ayuda -mt-1">
          {`${SITIO_URL}/?servidores=1`} muestra a todos en una sola tarjeta. Es el respaldo de
          cuando alguien copia mal su enlace.
        </p>
        <Campo etiqueta="Título de la tarjeta común">
          <input
            value={contenido.subtitulo ?? ""}
            onChange={(e) => set("subtitulo", e.target.value)}
            placeholder="Quienes nos acompañan"
            className="campo"
          />
        </Campo>
      </div>
    </div>
  );
}
