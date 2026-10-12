import { useId } from "react";

// Nombres legibles para las claves que vienen del JSON de cada sección.
const ETIQUETAS = {
  hora: "Hora",
  titulo: "Título",
  nombre: "Nombre",
  color: "Color",
  tipo: "Tipo",
  items: "Elementos",
  detalle: "Detalle",
  distancia: "Distancia",
  nota: "Nota",
  mapsUrl: "Enlace de Google Maps (botón «Cómo llegar»)",
  mapaEmbed: "Mapa incrustado (pega el «Insertar un mapa» de Google)",
  p: "Pregunta",
  r: "Respuesta",
  texto: "Texto",
  subtitulo: "Subtítulo",
  lugar: "Lugar",
  direccion: "Dirección",
  fecha: "Fecha y hora",
  urls: "Fotos por enlace externo",
  permitidos: "Colores permitidos",
  evitar: "Colores a evitar",
  cronograma: "Itinerario detallado",
  cronogramaModo: "Cómo se muestra el itinerario",
  cronogramaMensaje: "Mensaje del itinerario",
  opciones: "Opciones",
  hoteles: "Hoteles",
  fechaLimiteConfirmacion: "Fecha límite para confirmar",
  mostrarRestriccion: "Preguntar restricción alimentaria al confirmar",
  mostrarObservaciones: "Mostrar campo de observaciones al confirmar",
  bienvenidaTexto: "Texto de bienvenida",
  anuncioTitulo: "Participación (no invitados) — título de arriba",
  anuncioTexto: "Participación (no invitados) — mensaje bajo la fecha",
  fraseIntro: "Frase de entrada",
  padresTexto: "Texto sobre los padres",
  versiculo: "Versículo o frase final (opcional)",
  versiculoCita: "Cita del versículo (ej. Eclesiastés 4:9)",
  festejados: "Festejados (nombre y edad que cumplen)",
  edad: "Edad",
  telefonoConfirmar: "Teléfono para confirmar (si abren sin enlace personal)",
  novioEl: "Nombre 1",
  novioElla: "Nombre 2",
  padreElPadre: "Padre de 1",
  padreElMadre: "Madre de 1",
  padreEllaPadre: "Padre de 2",
  padreEllaMadre: "Madre de 2",
  src: "Enlace de audio externo",
  overline: "Texto pequeño de arriba (ej. «Ceremonia civil», «Baby shower»)",
  tituloSeccion: "Título de la sección",
  tituloItinerario: "Título del itinerario/agenda",
  grupos: "Grupos (padres, padrinos...)",
  etiqueta: "Etiqueta del grupo",
  personas: "Personas",
  enlaces: "Enlaces a tiendas",
  tienda: "Tienda",
  url: "Enlace",
  datosTransferencia: "Datos para transferencia (opcional)",
};

export function etiquetaDe(clave) {
  return ETIQUETAS[clave] || clave.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

const btnChico =
  "text-[11px] px-2 py-1 rounded-md border border-borde-fuerte text-ink-suave hover:border-[#aeb5aa] hover:text-ink transition-colors";

function Fila({ children, onSubir, onBajar, onQuitar, esPrimera, esUltima }) {
  return (
    <div className="flex gap-2 items-start border border-borde rounded-lg p-2">
      <div className="flex-1 space-y-2">{children}</div>
      <div className="flex flex-col gap-1 shrink-0">
        <button type="button" onClick={onSubir} disabled={esPrimera} className={`${btnChico} disabled:opacity-20`}>
          ↑
        </button>
        <button type="button" onClick={onBajar} disabled={esUltima} className={`${btnChico} disabled:opacity-20`}>
          ↓
        </button>
        <button type="button" onClick={onQuitar} className={`${btnChico} hover:border-red-700 hover:text-red-700`}>
          ✕
        </button>
      </div>
    </div>
  );
}

// Punto de partida al convertir una entrada en gama: los pasteles clásicos,
// repartidos por todo el círculo cromático.
const GAMA_PASTEL = [
  "#F6D8DE",
  "#F8DFC8",
  "#FAF0C8",
  "#DDEBD0",
  "#C8E6E4",
  "#CFE1F2",
  "#DCD4EC",
  "#EED7E9",
];

// Lista de colores con su nombre — usada por el código de vestimenta.
// Cada entrada es o un color suelto ({nombre, color}) o una gama entera
// ({nombre, colores: [...]}), que en la invitación se dibuja como una franja
// degradada con un solo nombre debajo.
function ListaColores({ valor, onChange }) {
  const lista = Array.isArray(valor) ? valor : [];

  function actualizar(i, cambios) {
    onChange(lista.map((c, j) => (j === i ? { ...c, ...cambios } : c)));
  }
  // Al cambiar de modo se reemplaza la entrada entera: si quedara "color" y
  // "colores" a la vez, la invitación no sabría cuál mandar.
  function reemplazar(i, entrada) {
    onChange(lista.map((c, j) => (j === i ? entrada : c)));
  }
  function mover(i, delta) {
    const copia = [...lista];
    const [x] = copia.splice(i, 1);
    copia.splice(i + delta, 0, x);
    onChange(copia);
  }
  function cambiarDeGama(i, k, color) {
    const c = lista[i];
    reemplazar(i, { ...c, colores: c.colores.map((x, j) => (j === k ? color : x)) });
  }

  return (
    <div className="space-y-2">
      {lista.map((c, i) => {
        const esGama = Array.isArray(c.colores);
        return (
          <Fila
            key={i}
            esPrimera={i === 0}
            esUltima={i === lista.length - 1}
            onSubir={() => mover(i, -1)}
            onBajar={() => mover(i, 1)}
            onQuitar={() => onChange(lista.filter((_, j) => j !== i))}
          >
            {esGama ? (
              <>
                <div className="flex gap-2 items-center">
                  <input
                    value={c.nombre || ""}
                    onChange={(e) => actualizar(i, { nombre: e.target.value })}
                    placeholder="Nombre de la gama (ej. Toda la gama pastel)"
                    className="campo flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => reemplazar(i, { nombre: c.nombre, color: c.colores[0] || "#cccccc" })}
                    className={btnChico}
                  >
                    Usar un solo color
                  </button>
                </div>

                <div className="flex gap-2 flex-wrap items-start">
                  {c.colores.map((col, k) => (
                    <div key={k} className="flex flex-col items-center">
                      <input
                        type="color"
                        value={col}
                        onChange={(e) => cambiarDeGama(i, k, e.target.value)}
                        className="w-11 h-8 border border-borde bg-transparent cursor-pointer"
                        aria-label={`Color ${k + 1} de la gama`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          reemplazar(i, { ...c, colores: c.colores.filter((_, j) => j !== k) })
                        }
                        className="text-[11px] text-ink-tenue hover:text-red-600 leading-none mt-1 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      reemplazar(i, { ...c, colores: [...c.colores, c.colores.at(-1) || "#eeddee"] })
                    }
                    className={`${btnChico} h-8`}
                  >
                    + color
                  </button>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wide text-ink/40">
                    Así se verá
                  </span>
                  <div
                    className="h-7 rounded-full border border-borde mt-1"
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${c.colores.join(", ")})`,
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={c.color || "#cccccc"}
                    onChange={(e) => actualizar(i, { color: e.target.value })}
                    className="w-12 h-9 border border-borde bg-transparent cursor-pointer shrink-0"
                    aria-label="Elegir color"
                  />
                  <input
                    value={c.nombre || ""}
                    onChange={(e) => actualizar(i, { nombre: e.target.value })}
                    placeholder="Nombre del color (ej. Camel)"
                    className="campo flex-1"
                  />
                  <input
                    value={c.color || ""}
                    onChange={(e) => actualizar(i, { color: e.target.value })}
                    placeholder="#RRGGBB"
                    className="w-28 border border-borde px-2 py-2 text-xs font-mono shrink-0"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    reemplazar(i, {
                      nombre: c.nombre || "Toda la gama pastel",
                      colores: GAMA_PASTEL,
                    })
                  }
                  className={btnChico}
                >
                  Convertir en gama de colores
                </button>
              </>
            )}
          </Fila>
        );
      })}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange([...lista, { nombre: "", color: "#c9932f" }])}
          className={btnChico}
        >
          + Agregar color
        </button>
        <button
          type="button"
          onClick={() => onChange([...lista, { nombre: "Toda la gama pastel", colores: GAMA_PASTEL }])}
          className={btnChico}
        >
          + Agregar gama
        </button>
      </div>
    </div>
  );
}

// Lista de textos sueltos (ej. "Información importante", los items de un menú).
function ListaTextos({ valor, onChange, etiqueta = "elemento" }) {
  const lista = Array.isArray(valor) ? valor : [];
  function mover(i, delta) {
    const copia = [...lista];
    const [x] = copia.splice(i, 1);
    copia.splice(i + delta, 0, x);
    onChange(copia);
  }
  return (
    <div className="space-y-2">
      {lista.map((t, i) => (
        <Fila
          key={i}
          esPrimera={i === 0}
          esUltima={i === lista.length - 1}
          onSubir={() => mover(i, -1)}
          onBajar={() => mover(i, 1)}
          onQuitar={() => onChange(lista.filter((_, j) => j !== i))}
        >
          <textarea
            value={t}
            rows={String(t).length > 80 ? 3 : 1}
            onChange={(e) => onChange(lista.map((v, j) => (j === i ? e.target.value : v)))}
            className="campo resize-y"
          />
        </Fila>
      ))}
      <button type="button" onClick={() => onChange([...lista, ""])} className={btnChico}>
        + Agregar {etiqueta}
      </button>
    </div>
  );
}

// Lista de fichas con varios campos: itinerario, hoteles, preguntas frecuentes,
// opciones del menú... Los campos salen de las claves que ya tiene cada ficha.
function ListaFichas({ valor, onChange }) {
  const lista = Array.isArray(valor) ? valor : [];
  const claves = [...new Set(lista.flatMap((o) => Object.keys(o || {})))];

  function actualizar(i, clave, v) {
    onChange(lista.map((o, j) => (j === i ? { ...o, [clave]: v } : o)));
  }
  function mover(i, delta) {
    const copia = [...lista];
    const [x] = copia.splice(i, 1);
    copia.splice(i + delta, 0, x);
    onChange(copia);
  }

  return (
    <div className="space-y-2">
      {lista.map((ficha, i) => (
        <Fila
          key={i}
          esPrimera={i === 0}
          esUltima={i === lista.length - 1}
          onSubir={() => mover(i, -1)}
          onBajar={() => mover(i, 1)}
          onQuitar={() => onChange(lista.filter((_, j) => j !== i))}
        >
          {claves.map((clave) => {
            const v = ficha?.[clave];
            // Una ficha puede tener a su vez una lista dentro (ej. los platos
            // de cada tanda del menú).
            if (Array.isArray(v)) {
              return (
                <div key={clave}>
                  <span className="text-[10px] uppercase tracking-wide text-ink/45">
                    {etiquetaDe(clave)}
                  </span>
                  <ListaTextos valor={v} onChange={(nv) => actualizar(i, clave, nv)} />
                </div>
              );
            }
            return (
              <label key={clave} className="block">
                <span className="text-[10px] uppercase tracking-wide text-ink/45">
                  {etiquetaDe(clave)}
                </span>
                <input
                  value={v ?? ""}
                  onChange={(e) => actualizar(i, clave, e.target.value)}
                  className="campo mt-0.5"
                />
              </label>
            );
          })}
        </Fila>
      ))}
      <button
        type="button"
        onClick={() => onChange([...lista, Object.fromEntries(claves.map((c) => [c, ""]))])}
        className={btnChico}
        disabled={!claves.length}
      >
        + Agregar
      </button>
    </div>
  );
}

// La boda es en Colombia, que no tiene horario de verano: el desfase es
// siempre -05:00. Se guarda con esa marca para que el sitio muestre la misma
// hora sin importar dónde esté el invitado.
const DESFASE_BOGOTA = "-05:00";

function isoAEntradaLocal(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "";
  // "sv-SE" da directamente el formato "2026-11-14 17:00".
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(" ", "T");
}

function CampoFechaHora({ valor, onChange }) {
  return (
    <div>
      <input
        type="datetime-local"
        value={isoAEntradaLocal(valor)}
        onChange={(e) => onChange(e.target.value ? `${e.target.value}:00${DESFASE_BOGOTA}` : "")}
        className="campo"
      />
      <p className="ayuda mt-1">Hora de Colombia (Bogotá, UTC−5).</p>
    </div>
  );
}

const MODOS_CRONOGRAMA = [
  { k: "detallado", l: "Detallado", d: "La lista de horas con cada momento del evento." },
  { k: "mensaje", l: "Solo un mensaje", d: "Un texto suelto, para cuando el orden aún no está cerrado." },
  { k: "oculto", l: "No mostrarlo", d: "El itinerario no aparece en la invitación." },
];

function CampoModoCronograma({ valor, onChange }) {
  const actual = valor || "detallado";
  return (
    <div>
      <div className="flex gap-2 flex-wrap">
        {MODOS_CRONOGRAMA.map((m) => (
          <button
            key={m.k}
            type="button"
            onClick={() => onChange(m.k)}
            className={`text-xs px-3 py-2 border transition-colors ${
              actual === m.k
                ? "bg-ink text-white border-ink"
                : "border-borde-fuerte text-ink-suave hover:text-ink"
            }`}
          >
            {m.l}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-ink/40 mt-1.5">
        {MODOS_CRONOGRAMA.find((m) => m.k === actual)?.d}
      </p>
    </div>
  );
}

// Decide qué editor mostrar según lo que haya guardado en ese campo.
export default function CampoValor({ clave, valor, onChange }) {
  const id = useId();

  if (clave === "fecha") return <CampoFechaHora valor={valor} onChange={onChange} />;

  if (clave === "cronogramaModo") return <CampoModoCronograma valor={valor} onChange={onChange} />;

  // Textos largos que casi siempre se escriben en varios renglones: se les da
  // un área de texto aunque estén vacíos, que es cuando más falta hace.
  if (
    clave === "cronogramaMensaje" ||
    clave === "nota" ||
    clave === "mapaEmbed" ||
    clave === "anuncioTexto"
  ) {
    return (
      <textarea
        id={id}
        className="campo"
        rows={3}
        value={valor ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (clave === "fechaLimiteConfirmacion") {
    return (
      <input
        type="date"
        value={valor || ""}
        onChange={(e) => onChange(e.target.value)}
        className="campo"
      />
    );
  }

  if (Array.isArray(valor)) {
    const primero = valor[0];
    const esColor =
      primero && typeof primero === "object" && ("color" in primero || "colores" in primero);
    if (esColor || clave === "permitidos" || clave === "evitar") {
      return <ListaColores valor={valor} onChange={onChange} />;
    }
    if (primero && typeof primero === "object") return <ListaFichas valor={valor} onChange={onChange} />;
    return <ListaTextos valor={valor} onChange={onChange} />;
  }

  if (typeof valor === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={valor} onChange={(e) => onChange(e.target.checked)} />
        {valor ? "Sí" : "No"}
      </label>
    );
  }

  if (typeof valor === "string" && valor.length > 70) {
    return (
      <textarea
        id={id}
        className="campo"
        rows={3}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  return (
    <input
      id={id}
      className="campo"
      value={valor ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
