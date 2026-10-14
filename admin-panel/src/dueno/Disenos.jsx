import { useEffect, useMemo, useRef, useState } from "react";
import { api, SITIO_URL } from "../api";
import { useToast } from "../ui/Toast";
import Icono from "../ui/Icono";
import { olvidarCatalogo } from "../catalogoDisenos";

// Catálogo de diseños de invitación: los programados (Valle, Jardín…) y sus
// variantes (el mismo dibujo con otra paleta y otras letras). Desde aquí se
// renombran, se decide cuáles salen en la landing y se crean variantes.

const sitio = (ruta) => `${SITIO_URL.replace(/\/+$/, "")}${ruta}`;

const COLORES = [
  ["color-paper", "Fondo"],
  ["color-ink", "Texto"],
  ["color-gold", "Color principal"],
  ["color-gold-light", "Principal claro"],
  ["color-gold-dark", "Principal oscuro"],
  ["color-marble", "Superficies"],
  ["color-seal", "Detalles"],
];

const LETRAS = {
  "fuente-guion": ["Letra manuscrita", ["Pinyon Script", "Great Vibes", "Parisienne", "Dancing Script", "Ballet", "Alex Brush", "Allura", "Tangerine"]],
  "fuente-titulos": ["Letra de títulos", ["Playfair Display", "Cormorant Garamond", "Bodoni Moda", "Fraunces", "Marcellus", "Libre Baskerville", "Lora", "Cinzel", "Unbounded", "Pinyon Script"]],
  "fuente-cuerpo": ["Letra de textos", ["Cormorant Garamond", "Jost", "Josefin Sans", "Nunito Sans", "Quicksand", "Manrope", "Libre Baskerville", "Lora", "Montserrat", "Work Sans"]],
};

const FILTROS = [
  ["todos", "Todos"],
  ["landing", "En la landing"],
  ["sin", "Sin publicar"],
  ["variantes", "Variantes"],
];

// La invitación de ejemplo, dentro de un celular. El iframe se dibuja a
// 390 px de ancho (como un teléfono) y se escala para caber en la tarjeta.
function Celular({ src, escala = 0.62, alto = 640 }) {
  return (
    <div className="mx-auto rounded-[2rem] border-[6px] border-[#2a1a1f] bg-[#2a1a1f] overflow-hidden shadow-flotante" style={{ width: 390 * escala + 12, height: alto * escala + 12 }}>
      {src ? (
        <iframe
          title="Vista de ejemplo"
          src={src}
          loading="lazy"
          className="bg-white origin-top-left !rounded-none"
          style={{ width: 390, height: alto, transform: `scale(${escala})`, border: 0 }}
        />
      ) : (
        <div className="w-full h-full grid place-items-center bg-lienzo text-center px-6">
          <p className="text-[12px] text-ink-tenue">Este diseño aún no tiene vista de ejemplo.</p>
        </div>
      )}
    </div>
  );
}

function Nombre({ d, onGuardar }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(d.nombre);
  useEffect(() => setValor(d.nombre), [d.nombre]);

  if (!editando) {
    return (
      <button onClick={() => setEditando(true)} className="group text-left !rounded-none" title="Cambiar el nombre">
        <span className="font-display text-[19px] leading-tight text-ink">{d.nombre}</span>
        <span className="ml-1.5 text-[11px] text-marca opacity-0 group-hover:opacity-100 transition-opacity">renombrar</span>
      </button>
    );
  }
  async function guardar(e) {
    e.preventDefault();
    if (valor.trim() && valor.trim() !== d.nombre) await onGuardar({ nombre: valor.trim() });
    setEditando(false);
  }
  return (
    <form onSubmit={guardar} className="flex gap-1.5">
      <input id={`nombre-${d.id}`} autoFocus className="campo-sm !text-sm" value={valor} onChange={(e) => setValor(e.target.value)} onBlur={guardar} maxLength={60} />
    </form>
  );
}

function Tarjeta({ d, nombreBase, onCambio, onEditar, onVariante }) {
  const toast = useToast();
  const [borrar, setBorrar] = useState(false);

  async function guardar(cambios, aviso) {
    try {
      onCambio(await api.crm.actualizarDiseno(d.id, cambios));
      if (aviso) toast(aviso);
    } catch (e) {
      toast(e.message, "error");
    }
  }

  async function quitar() {
    try {
      await api.crm.borrarDiseno(d.id);
      onCambio(null, d.id);
      toast("Variante borrada");
    } catch (e) {
      toast(e.message, "error");
    }
  }

  return (
    <article className="tarjeta p-4 flex flex-col gap-3">
      <Celular src={d.vista ? sitio(`${d.vista}?preview=1`) : null} />
      <div className="flex flex-col gap-1">
        <Nombre d={d} onGuardar={(c) => guardar(c, "Nombre actualizado")} />
        <p className="text-[12px] text-ink-tenue">
          {d.variante ? `Variante de ${nombreBase}` : d.descripcion}
          {d.eventos > 0 && ` · usado en ${d.eventos} evento${d.eventos === 1 ? "" : "s"}`}
        </p>
        <div className="flex flex-wrap gap-1.5 mt-1">
          <span className={`insignia ${d.en_landing ? "insignia-ok" : "insignia-neutra"}`}>{d.en_landing ? "En la landing" : "Sin publicar"}</span>
          {d.variante && <span className="insignia insignia-oro">variante</span>}
          <span className="flex gap-0.5 items-center ml-auto" title="Paleta">
            {COLORES.slice(0, 5).map(([k]) => (
              <span key={k} className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ background: d.tema_efectivo[k] }} />
            ))}
          </span>
        </div>
      </div>

      <label className={`flex items-center gap-2 text-[13px] ${d.vista ? "cursor-pointer text-ink" : "text-ink-tenue"}`}>
        <input
          type="checkbox"
          checked={d.en_landing}
          disabled={!d.vista}
          onChange={(e) => guardar({ en_landing: e.target.checked }, e.target.checked ? "Publicado en la landing" : "Quitado de la landing")}
        />
        Mostrar en la landing
      </label>

      <div className="flex flex-wrap gap-2 mt-auto">
        <button className="boton-secundario" onClick={() => onVariante(d)}>
          <Icono nombre="copiar" className="w-3.5 h-3.5" />
          Crear variante
        </button>
        {d.variante && (
          <button className="boton-primario" onClick={() => onEditar(d)}>
            <Icono nombre="paleta" className="w-3.5 h-3.5" />
            Colores y letras
          </button>
        )}
        {d.vista && (
          <a className="boton-texto self-center" href={sitio(d.vista)} target="_blank" rel="noreferrer">
            Ver ↗
          </a>
        )}
        {d.variante && d.eventos === 0 && (
          borrar ? (
            <span className="flex items-center gap-2 text-[12px] w-full">
              ¿Borrar esta variante?
              <button className="boton-peligro !py-1" onClick={quitar}>Sí, borrar</button>
              <button className="boton-texto" onClick={() => setBorrar(false)}>no</button>
            </span>
          ) : (
            <button className="boton-texto self-center text-ink-tenue" onClick={() => setBorrar(true)}>borrar</button>
          )
        )}
      </div>
    </article>
  );
}

function NuevaVariante({ origen, onCreada, onCancelar }) {
  const toast = useToast();
  const [nombre, setNombre] = useState(`${origen.nombre} · `);
  const [creando, setCreando] = useState(false);

  async function crear(e) {
    e.preventDefault();
    setCreando(true);
    try {
      onCreada(await api.crm.crearVariante(origen.id, nombre.trim()));
      toast("Variante creada: ahora ajusta sus colores y letras");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setCreando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={onCancelar}>
      <form onSubmit={crear} onClick={(e) => e.stopPropagation()} className="tarjeta p-6 w-full max-w-md flex flex-col gap-4">
        <div>
          <h3 className="font-display text-2xl text-ink">Nueva variante</h3>
          <p className="ayuda mt-1">
            Parte de «{origen.nombre}»: mismo dibujo y estructura. Después le cambias colores y letras. El original queda intacto.
          </p>
        </div>
        <label className="block">
          <span className="etiqueta">Nombre de la variante</span>
          <input id="nombre-variante" autoFocus className="campo" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Valle rosa atardecer" maxLength={60} />
        </label>
        <div className="flex gap-2">
          <button className="boton-primario" disabled={creando || !nombre.trim()}>{creando ? "Creando..." : "Crear variante"}</button>
          <button type="button" className="boton-secundario" onClick={onCancelar}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}

// Editor de colores y letras de una variante, con la invitación de ejemplo
// actualizándose al lado (?t= en la demo del sitio, sin guardar nada).
function EditorVariante({ d, base, onGuardada, onCerrar }) {
  const toast = useToast();
  const [tema, setTema] = useState(d.tema_efectivo);
  const [nombre, setNombre] = useState(d.nombre);
  const [guardando, setGuardando] = useState(false);
  const [vista, setVista] = useState(null);
  const temporizador = useRef(null);
  const claves = Object.keys(LETRAS).filter((k) => k in d.tema_efectivo);

  useEffect(() => {
    if (!d.vista) return;
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      setVista(sitio(`${d.vista}?preview=1&t=${encodeURIComponent(JSON.stringify(tema))}`));
    }, 450);
    return () => clearTimeout(temporizador.current);
  }, [tema, d.vista]);

  // Solo se guarda lo que difiere del diseño base.
  function diferencias() {
    return Object.fromEntries(Object.entries(tema).filter(([k, v]) => base?.tema_efectivo[k] !== v));
  }

  async function guardar() {
    setGuardando(true);
    try {
      onGuardada(await api.crm.actualizarDiseno(d.id, { nombre: nombre.trim(), tema: diferencias() }));
      toast("Variante guardada");
      onCerrar();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 overflow-y-auto p-3 sm:p-6">
      <div className="tarjeta max-w-5xl mx-auto p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="etiqueta !mb-1">Variante de {base?.nombre}</p>
            <input id="editor-nombre" className="campo !text-lg font-display max-w-sm" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} />
          </div>
          <button onClick={onCerrar} className="boton-texto" aria-label="Cerrar">cerrar ✕</button>
        </div>

        <div className="grid md:grid-cols-[minmax(0,1fr)_auto] gap-8 items-start">
          <div className="flex flex-col gap-6">
            <section>
              <h3 className="bloque-titulo mb-3">Colores</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {COLORES.map(([k, t]) => (
                  <label key={k} className="flex items-center gap-2.5 rounded-xl border border-borde px-3 py-2 bg-paper cursor-pointer">
                    <input id={`color-${k}`} type="color" value={tema[k] || "#000000"} onChange={(e) => setTema((x) => ({ ...x, [k]: e.target.value.toUpperCase() }))} className="w-9 h-9 border-0 bg-transparent" />
                    <span className="min-w-0">
                      <span className="block text-[12.5px] text-ink">{t}</span>
                      <span className="block text-[11px] text-ink-tenue tabular-nums">{tema[k]}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="ayuda mt-2">Cada diseño usa sus colores a su manera: mira el cambio en el celular de la derecha.</p>
            </section>

            <section>
              <h3 className="bloque-titulo mb-3">Letras</h3>
              <div className="grid sm:grid-cols-3 gap-3">
                {claves.map((k) => {
                  const [t, opciones] = LETRAS[k];
                  const lista = opciones.includes(tema[k]) ? opciones : [tema[k], ...opciones];
                  return (
                    <label key={k} className="block">
                      <span className="etiqueta">{t}</span>
                      <select id={`letra-${k}`} className="campo" value={tema[k]} onChange={(e) => setTema((x) => ({ ...x, [k]: e.target.value }))}>
                        {lista.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </label>
                  );
                })}
              </div>
            </section>

            <div className="flex flex-wrap gap-2">
              <button className="boton-primario" disabled={guardando || !nombre.trim()} onClick={guardar}>
                {guardando ? "Guardando..." : "Guardar variante"}
              </button>
              <button className="boton-secundario" onClick={() => setTema(base?.tema_efectivo || d.tema_efectivo)}>
                Volver a los colores de {base?.nombre}
              </button>
              <button className="boton-texto" onClick={onCerrar}>Cancelar</button>
            </div>
          </div>

          <div className="md:sticky md:top-4">
            <Celular src={vista} escala={0.8} alto={700} />
            <p className="ayuda text-center mt-2">Vista previa en vivo · no se guarda hasta que le des Guardar</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Disenos() {
  const toast = useToast();
  const [lista, setLista] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [editando, setEditando] = useState(null);
  const [variandoDe, setVariandoDe] = useState(null);

  useEffect(() => {
    api.crm.disenos().then(setLista).catch((e) => toast(e.message, "error"));
  }, []);

  const porId = useMemo(() => Object.fromEntries((lista || []).map((d) => [d.id, d])), [lista]);
  const cuenta = {
    todos: lista?.length || 0,
    landing: (lista || []).filter((d) => d.en_landing).length,
    sin: (lista || []).filter((d) => !d.en_landing).length,
    variantes: (lista || []).filter((d) => d.variante).length,
  };
  const visibles = (lista || []).filter((d) =>
    filtro === "landing" ? d.en_landing : filtro === "sin" ? !d.en_landing : filtro === "variantes" ? d.variante : true
  );

  function actualizar(d, borradoId) {
    olvidarCatalogo();
    setLista((prev) => {
      if (borradoId) return prev.filter((x) => x.id !== borradoId);
      const existe = prev.some((x) => x.id === d.id);
      const nueva = existe ? prev.map((x) => (x.id === d.id ? d : x)) : [...prev, d];
      return nueva.sort((a, b) => a.orden - b.orden || String(a.creado_en).localeCompare(String(b.creado_en)));
    });
  }

  return (
    <div>
      <h2 className="panel-titulo">Diseños</h2>
      <p className="panel-subtitulo mb-5">
        Todos los diseños de invitación. Renómbralos, decide cuáles salen en la landing y crea variantes con otra paleta y otras letras, sin programar.
      </p>

      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5">
        {FILTROS.map(([k, t]) => (
          <button key={k} onClick={() => setFiltro(k)} className={`chip-filtro shrink-0 ${filtro === k ? "chip-filtro-activo" : ""}`}>
            {t} <span className="chip-cuenta">{cuenta[k]}</span>
          </button>
        ))}
      </div>

      {!lista ? (
        <p className="text-sm text-ink-tenue">Cargando...</p>
      ) : !visibles.length ? (
        <div className="vacio">
          <p className="text-sm text-ink-suave">Nada con ese filtro.</p>
          {filtro === "variantes" && <p className="ayuda mt-1">Toca «Crear variante» en cualquier diseño para hacer la primera.</p>}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {visibles.map((d) => (
            <Tarjeta
              key={d.id}
              d={d}
              nombreBase={porId[d.base]?.nombre || d.base}
              onCambio={actualizar}
              onEditar={setEditando}
              onVariante={setVariandoDe}
            />
          ))}
        </div>
      )}

      {variandoDe && (
        <NuevaVariante
          origen={variandoDe}
          onCancelar={() => setVariandoDe(null)}
          onCreada={(d) => {
            actualizar(d);
            setVariandoDe(null);
            setEditando(d);
          }}
        />
      )}
      {editando && (
        <EditorVariante d={editando} base={porId[editando.base]} onGuardada={actualizar} onCerrar={() => setEditando(null)} />
      )}
    </div>
  );
}
