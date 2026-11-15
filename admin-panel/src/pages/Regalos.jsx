import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useToast } from "../ui/Toast";
import { paraBuscar } from "./Invitados";

const MODOS = [
  ["", "Sin regalo"],
  ["sobres", "Lluvia de sobres"],
  ["especifico", "Regalo específico"],
  ["lista", "Lista de opciones"],
  ["enlace", "Enlace de compra"],
];

function Ajustes({ inicial, porDefecto = {}, onGuardado }) {
  const toast = useToast();
  const [c, setC] = useState(inicial);
  const [ocupado, setOcupado] = useState(false);
  const campo = (clave) => ({
    value: c[clave] || "",
    onChange: (e) => setC({ ...c, [clave]: e.target.value }),
  });
  // Casilla de mensaje: vacía muestra el que saldrá por defecto.
  const mensaje = (clave) => ({ ...campo(clave), rows: 3, placeholder: porDefecto[clave] ? `Si lo dejas vacío sale: «${porDefecto[clave]}»` : "Mensaje para estos invitados" });

  async function guardar(e) {
    e.preventDefault();
    setOcupado(true);
    try {
      await api.guardarRegalosConfig(c);
      toast("Regalos guardados");
      onGuardado();
    } catch (err) {
      toast(err.message, "error");
    }
    setOcupado(false);
  }

  return (
    <form onSubmit={guardar} className="tarjeta p-4 space-y-3">
      <div>
        <label className="text-sm font-medium block mb-1">Título de la sección</label>
        <input className="campo" {...campo("titulo")} />
      </div>
      <div>
        <p className="text-sm font-medium mb-1">Quienes reciben el enlace de compra</p>
        <div className="space-y-2">
          <input className="campo" type="url" placeholder="https://tienda.com/mi-lista" {...campo("enlaceUrl")} />
          <input className="campo" placeholder="Texto del botón, por ejemplo: Ver tienda" {...campo("enlaceEtiqueta")} />
          <textarea className="campo" {...mensaje("textoEnlace")} />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-1">Quienes reciben la lista de opciones</p>
        <textarea className="campo" {...mensaje("textoLista")} />
      </div>
      <div>
        <p className="text-sm font-medium mb-1">Quienes reciben la lluvia de sobres</p>
        <div className="space-y-2">
          <textarea className="campo" {...mensaje("textoSobres")} />
          <input className="campo" placeholder="Datos para aportar, ej. Nequi 300 123 4567 · María Pérez" {...campo("datosSobres")} />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-1">Quienes reciben un regalo específico</p>
        <textarea className="campo" {...mensaje("textoEspecifico")} />
      </div>
      <button className="boton-primario" disabled={ocupado}>Guardar</button>
    </form>
  );
}

// Varias cosas dentro de un mismo regalo, cada una con cantidad y enlace:
// «6 · Toallas de cuerpo · https://...», «6 · Toallas de cara · https://...».
const ARTICULO_VACIO = { cantidad: 1, nombre: "", url: "" };
function EditorArticulos({ valor, onChange, onListo }) {
  const filas = valor.length ? valor : [ARTICULO_VACIO];
  const cambiar = (i, clave, v) => onChange(filas.map((a, j) => (j === i ? { ...a, [clave]: v } : a)));
  return (
    <div className="space-y-1.5">
      <p className="ayuda">Cosas del regalo (cantidad, qué es y dónde comprarlo):</p>
      {filas.map((a, i) => (
        <div key={i} className="flex flex-wrap gap-1.5 items-center">
          <input
            className="campo-sm w-16"
            type="number"
            min={1}
            max={999}
            aria-label="Cantidad"
            value={a.cantidad}
            onChange={(e) => cambiar(i, "cantidad", e.target.value)}
            onBlur={onListo}
          />
          <input
            className="campo-sm flex-1 min-w-[120px]"
            placeholder="Qué es, ej. Toallas de cuerpo"
            aria-label="Qué es"
            value={a.nombre}
            onChange={(e) => cambiar(i, "nombre", e.target.value)}
            onBlur={onListo}
          />
          <input
            className="campo-sm flex-1 min-w-[160px]"
            type="url"
            placeholder="Enlace (opcional): https://..."
            aria-label="Enlace"
            value={a.url}
            onChange={(e) => cambiar(i, "url", e.target.value)}
            onBlur={onListo}
          />
          <button
            type="button"
            className="w-7 h-7 shrink-0 rounded-full text-ink-tenue hover:bg-lienzo hover:text-ink"
            aria-label="Quitar esta cosa"
            title="Quitar esta cosa"
            onClick={() => {
              const resto = filas.filter((_, j) => j !== i);
              onChange(resto);
              onListo?.(resto);
            }}
          >
            ✕
          </button>
        </div>
      ))}
      {filas.length < 10 && (
        <button type="button" className="text-xs underline" onClick={() => onChange([...filas, ARTICULO_VACIO])}>
          + Agregar otra cosa
        </button>
      )}
    </div>
  );
}

const articulosLimpios = (lista) =>
  (lista || [])
    .filter((a) => String(a.nombre || "").trim() || String(a.url || "").trim())
    .map((a) => ({ cantidad: Number(a.cantidad) || 1, nombre: String(a.nombre || "").trim(), url: String(a.url || "").trim() }));

// Texto corto para el listado: «6 Toallas de cuerpo, 6 Toallas de cara».
const resumenArticulos = (lista) => (lista || []).map((a) => `${a.cantidad} ${a.nombre}`).join(", ");

function Opciones({ opciones, onCambio }) {
  const toast = useToast();
  const [editando, setEditando] = useState(null);
  const [formNuevo, setFormNuevo] = useState(0); // cambia para vaciar el formulario

  async function hacer(accion) {
    try {
      await accion();
      await onCambio();
      return true;
    } catch (err) {
      toast(err.message, "error");
      return false;
    }
  }

  return (
    <div className="tarjeta p-4">
      <p className="text-sm font-medium mb-3">Opciones de la lista</p>
      <ul className="divide-y divide-borde mb-3">
        {opciones.map((o) =>
          editando === o.id ? (
            <li key={o.id} className="py-2.5">
              <FormOpcion
                inicial={o}
                boton="Guardar"
                onCancelar={() => setEditando(null)}
                onGuardar={async (datos) => {
                  if (await hacer(() => api.editarOpcionRegalo(o.id, datos))) setEditando(null);
                }}
              />
            </li>
          ) : (
            <li key={o.id} className="py-2.5 flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[180px]">
                <p className="text-sm">
                  {o.nombre}
                  {o.personas > 1 && <span className="ayuda"> · para {o.personas} personas</span>}
                </p>
                {o.detalle && <p className="ayuda">{o.detalle}</p>}
                {(o.articulos || []).length > 0 && <p className="ayuda">Incluye: {resumenArticulos(o.articulos)}</p>}
                {o.url && (
                  <a href={o.url} target="_blank" rel="noopener noreferrer" className="ayuda underline break-all">
                    {o.url}
                  </a>
                )}
                <p className="ayuda">
                  {!(o.apartados || []).length
                    ? "Libre"
                    : o.personas > 1
                      ? `${o.apartados.length} de ${o.personas} apartados:`
                      : "Apartado por:"}
                </p>
                {(o.apartados || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {o.apartados.map((a) => (
                      <span key={a.id} className="inline-flex items-center gap-1.5 rounded-full bg-lienzo px-2.5 py-1 text-xs">
                        {a.nombre}
                        <button
                          type="button"
                          className="underline text-ink-tenue hover:text-ink"
                          title={`Liberar lo que apartó ${a.nombre}`}
                          onClick={() => {
                            if (confirm(`¿Liberar lo que apartó ${a.nombre}? Esa persona podrá elegir otra vez.`)) {
                              hacer(() => api.liberarOpcionRegalo(o.id, a.id));
                            }
                          }}
                        >
                          liberar
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" className="boton-secundario" onClick={() => setEditando(o.id)}>
                Editar
              </button>
              <button
                type="button"
                className="boton-peligro"
                onClick={() => {
                  if (confirm(`¿Quitar «${o.nombre}» de la lista?`)) hacer(() => api.borrarOpcionRegalo(o.id));
                }}
              >
                Quitar
              </button>
            </li>
          )
        )}
        {!opciones.length && <li className="ayuda py-2">Todavía no hay opciones.</li>}
      </ul>
      <p className="text-sm font-medium mb-2">Agregar una opción</p>
      <FormOpcion
        key={formNuevo}
        boton="Agregar"
        onGuardar={async (datos) => {
          if (await hacer(() => api.crearOpcionRegalo(datos))) setFormNuevo((n) => n + 1);
        }}
      />
    </div>
  );
}

// Agregar o editar una opción. Puede ser una sola cosa (nombre + enlace) o un
// paquete de varias cosas con cantidad y enlace cada una; quien la aparta se
// lleva todo el paquete.
function FormOpcion({ inicial = {}, boton, onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState(inicial.nombre || "");
  const [detalle, setDetalle] = useState(inicial.detalle || "");
  const [url, setUrl] = useState(inicial.url || "");
  const [articulos, setArticulos] = useState(inicial.articulos || []);
  const [conVarias, setConVarias] = useState((inicial.articulos || []).length > 0);
  const [personas, setPersonas] = useState(inicial.personas || 1);
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        onGuardar({
          nombre,
          detalle,
          url: conVarias ? "" : url,
          articulos: conVarias ? articulosLimpios(articulos) : [],
          personas: Number(personas) || 1,
        });
      }}
    >
      <div className="flex flex-wrap gap-2">
        <input className="campo flex-1 min-w-[180px]" required aria-label="Opción" placeholder="Opción, ej. Juego de toallas" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <input className="campo flex-1 min-w-[180px]" aria-label="Detalle" placeholder="Detalle (opcional)" value={detalle} onChange={(e) => setDetalle(e.target.value)} />
        {!conVarias && (
          <input className="campo flex-1 min-w-[220px]" type="url" aria-label="Enlace" placeholder="Dónde comprarlo (opcional): https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
        )}
      </div>
      <label className="flex flex-wrap items-center gap-2 text-sm">
        ¿Cuántas personas pueden apartarla?
        <input
          className="campo-sm w-20"
          type="number"
          min={1}
          max={99}
          required
          aria-label="Personas que pueden apartarla"
          value={personas}
          onChange={(e) => setPersonas(e.target.value)}
        />
        <span className="ayuda">Ej. 2 si quieren dos escritorios.</span>
      </label>
      {conVarias ? (
        <EditorArticulos valor={articulos} onChange={setArticulos} />
      ) : (
        <button type="button" className="text-xs underline" onClick={() => setConVarias(true)}>
          + Son varias cosas, con cantidad y enlace cada una
        </button>
      )}
      <div className="flex gap-2">
        <button className={onCancelar ? "boton-primario" : "boton-secundario"}>{boton}</button>
        {onCancelar && (
          <button type="button" className="boton-secundario" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

// Regalo específico de un invitado: qué regalo y dónde comprarlo, o varias
// cosas con su cantidad y su enlace cada una.
function DetalleEspecifico({ invitado, onCambio }) {
  const toast = useToast();
  const [detalle, setDetalle] = useState(invitado.regalo_detalle || "");
  const [url, setUrl] = useState(invitado.regalo_url || "");
  const [articulos, setArticulos] = useState(invitado.regalo_articulos || []);
  const [conVarias, setConVarias] = useState((invitado.regalo_articulos || []).length > 0);

  async function guardar(lista = articulos) {
    const limpios = articulosLimpios(lista);
    const igual =
      detalle.trim() === (invitado.regalo_detalle || "") &&
      (conVarias ? "" : url.trim()) === (invitado.regalo_url || "") &&
      JSON.stringify(limpios) === JSON.stringify(invitado.regalo_articulos || []);
    if (igual) return;
    try {
      onCambio(
        await api.actualizarInvitado(invitado.id, {
          regalo_detalle: detalle.trim(),
          regalo_url: conVarias ? "" : url.trim(),
          regalo_articulos: limpios,
        })
      );
    } catch (err) {
      toast(err.message, "error");
    }
  }

  const vacio = !detalle.trim() && !articulosLimpios(articulos).length;
  return (
    <div className="w-full space-y-2">
      <div className="grid sm:grid-cols-2 gap-2">
        <input
          className={`campo-sm ${vacio ? "border-amber-300" : ""}`}
          placeholder={conVarias ? "Nombre del regalo (opcional), ej. Juego de toallas" : "Qué regalo, ej. Juego de copas"}
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          onBlur={() => guardar()}
          aria-label={`Regalo específico de ${invitado.nombre}`}
        />
        {!conVarias && (
          <input
            className="campo-sm"
            type="url"
            placeholder="Dónde comprarlo (opcional): https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => guardar()}
            aria-label={`Enlace del regalo de ${invitado.nombre}`}
          />
        )}
      </div>
      {conVarias ? (
        <EditorArticulos valor={articulos} onChange={setArticulos} onListo={(lista) => guardar(Array.isArray(lista) ? lista : undefined)} />
      ) : (
        <button type="button" className="text-xs underline" onClick={() => setConVarias(true)}>
          + Son varias cosas, con cantidad y enlace cada una
        </button>
      )}
    </div>
  );
}

function Asignar({ invitados, onCambio }) {
  const toast = useToast();
  const [buscar, setBuscar] = useState("");
  const [grupo, setGrupo] = useState("");
  const [enMasa, setEnMasa] = useState("");
  const [aplicando, setAplicando] = useState(false);
  const cuenta = useMemo(() => {
    const c = {};
    for (const [valor] of MODOS) c[valor] = invitados.filter((i) => (i.regalo_modo || "") === valor).length;
    return c;
  }, [invitados]);
  const grupos = useMemo(
    () => [...new Set(invitados.map((i) => (i.grupo || "").trim()).filter(Boolean))].sort(),
    [invitados]
  );
  const q = paraBuscar(buscar);
  const visibles = invitados.filter(
    (i) => paraBuscar(i.nombre).includes(q) && (!grupo || paraBuscar(i.grupo || "") === paraBuscar(grupo))
  );

  async function cambiar(i, regalo_modo) {
    try {
      onCambio(await api.actualizarInvitado(i.id, { regalo_modo }));
    } catch (err) {
      toast(err.message, "error");
    }
  }

  // Asigna el mismo modo a todos los que se están viendo (un grupo, una búsqueda).
  async function aplicarATodos() {
    const cambiar_ = visibles.filter((i) => (i.regalo_modo || "") !== enMasa);
    if (!cambiar_.length) return;
    const etiqueta = MODOS.find(([v]) => v === enMasa)?.[1];
    if (!confirm(`¿Poner «${etiqueta}» a ${cambiar_.length} invitaciones?`)) return;
    setAplicando(true);
    let ultima = null;
    for (const i of cambiar_) {
      try {
        ultima = await api.actualizarInvitado(i.id, { regalo_modo: enMasa });
      } catch (err) {
        toast(`${i.nombre}: ${err.message}`, "error");
      }
    }
    setAplicando(false);
    if (ultima) onCambio(ultima, { recargar: true });
    toast("Regalos asignados");
  }

  return (
    <div className="tarjeta p-4">
      <p className="text-sm font-medium mb-1">Qué recibe cada invitado</p>
      <p className="ayuda mb-3">
        {MODOS.filter(([v]) => v && cuenta[v])
          .map(([v, etiqueta]) => `${cuenta[v]} ${etiqueta.toLowerCase()}`)
          .join(" · ") || "Nadie tiene regalo asignado todavía"}
        {" · "}
        {cuenta[""]} sin regalo. Quien abra el enlace general no ve esta sección.
      </p>
      <div className="flex flex-wrap gap-2 mb-2">
        <input className="campo flex-1 min-w-[180px]" placeholder="Buscar invitado" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
        {grupos.length > 0 && (
          <select className="campo w-auto" value={grupo} onChange={(e) => setGrupo(e.target.value)} aria-label="Grupo">
            <option value="">Todos los grupos</option>
            {grupos.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="ayuda">A los {visibles.length} que estás viendo:</span>
        <select className="campo-sm w-auto" value={enMasa} onChange={(e) => setEnMasa(e.target.value)} aria-label="Regalo para todos">
          {MODOS.map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
        </select>
        <button type="button" className="boton-secundario" disabled={aplicando || !visibles.length} onClick={aplicarATodos}>
          {aplicando ? "Asignando..." : "Asignar a todos"}
        </button>
      </div>
      <ul className="divide-y divide-borde">
        {visibles.map((i) => (
          <li key={i.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm">
              {i.nombre}
              {i.grupo && <span className="insignia insignia-info ml-2">{i.grupo}</span>}
            </span>
            <select className="campo-sm w-auto" value={i.regalo_modo || ""} onChange={(e) => cambiar(i, e.target.value)}>
              {MODOS.map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
            </select>
            {i.regalo_modo === "especifico" && <DetalleEspecifico invitado={i} onCambio={onCambio} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Qué regalo ve cada invitado: lluvia de sobres, un regalo específico, una
// lista para apartar (lo que aparta uno ya no lo puede tomar otro) o un enlace.
export default function Regalos() {
  const [datos, setDatos] = useState(null);
  const [invitados, setInvitados] = useState([]);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      const [regalos, lista] = await Promise.all([api.regalos(), api.invitados()]);
      setDatos(regalos);
      setInvitados(lista);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!datos) return null;

  const cuenta = (modo) => invitados.filter((i) => (i.regalo_modo || "") === modo).length;
  const apartadas = (datos.opciones || []).reduce((n, o) => n + (o.apartados || []).length, 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="panel-titulo">Regalos</h2>
        <p className="panel-subtitulo">
          Qué regalo ve cada invitado en su enlace personal. Lo que alguien aparta de la lista ya no lo puede tomar otro.
        </p>
      </div>
      {/* Cuántas invitaciones tienen cada tipo de regalo, de un vistazo. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {MODOS.map(([valor, etiqueta]) => (
          <div key={valor} className="tarjeta px-4 py-3">
            <p className="text-[13px] text-ink-suave">{etiqueta}</p>
            <p className="flex items-baseline gap-1.5">
              <span className={`font-display text-[1.7rem] leading-tight tabular-nums ${cuenta(valor) ? "text-ink" : "text-ink-tenue"}`}>{cuenta(valor)}</span>
              <span className="text-[12.5px] text-ink-tenue">{cuenta(valor) === 1 ? "invitación" : "invitaciones"}</span>
            </p>
          </div>
        ))}
      </div>
      <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <Opciones opciones={datos.opciones} onCambio={cargar} />
          <Asignar
            invitados={invitados}
            onCambio={(act) => {
              setInvitados((l) => l.map((i) => (i.id === act.id ? { ...i, ...act } : i)));
              // Cambiar el modo puede soltar una opción apartada (y asignar a
              // varios de una vez cambia más de una fila).
              cargar();
            }}
          />
        </div>
        <div className="min-w-0">
          <Ajustes inicial={datos.config} porDefecto={datos.porDefecto} onGuardado={cargar} />
          {apartadas > 0 && <p className="ayuda mt-2">{apartadas} {apartadas === 1 ? "invitado ya apartó" : "invitados ya apartaron"} algo de la lista.</p>}
        </div>
      </div>
    </div>
  );
}
