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

function Ajustes({ inicial, onGuardado }) {
  const toast = useToast();
  const [c, setC] = useState(inicial);
  const [ocupado, setOcupado] = useState(false);
  const campo = (clave) => ({
    value: c[clave] || "",
    onChange: (e) => setC({ ...c, [clave]: e.target.value }),
  });

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
          <textarea className="campo" rows={2} placeholder="Mensaje para estos invitados (opcional)" {...campo("textoEnlace")} />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-1">Quienes reciben la lista de opciones</p>
        <textarea className="campo" rows={2} placeholder="Mensaje para estos invitados (opcional)" {...campo("textoLista")} />
      </div>
      <div>
        <p className="text-sm font-medium mb-1">Quienes reciben la lluvia de sobres</p>
        <div className="space-y-2">
          <textarea className="campo" rows={2} placeholder="Ej. Tu presencia es nuestro regalo; si quieres, puedes darnos tu sobre." {...campo("textoSobres")} />
          <input className="campo" placeholder="Datos para aportar, ej. Nequi 300 123 4567 · María Pérez" {...campo("datosSobres")} />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-1">Quienes reciben un regalo específico</p>
        <textarea className="campo" rows={2} placeholder="Ej. Pensamos en algo especial para ti (cada uno ve el suyo)" {...campo("textoEspecifico")} />
      </div>
      <button className="boton-primario" disabled={ocupado}>Guardar</button>
    </form>
  );
}

function Opciones({ opciones, onCambio }) {
  const toast = useToast();
  const [nombre, setNombre] = useState("");
  const [detalle, setDetalle] = useState("");

  async function hacer(accion) {
    try {
      await accion();
      await onCambio();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  async function agregar(e) {
    e.preventDefault();
    await hacer(async () => {
      await api.crearOpcionRegalo({ nombre, detalle });
      setNombre("");
      setDetalle("");
    });
  }

  return (
    <div className="tarjeta p-4">
      <p className="text-sm font-medium mb-3">Opciones de la lista</p>
      <ul className="divide-y divide-borde mb-3">
        {opciones.map((o) => (
          <li key={o.id} className="py-2.5 flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[180px]">
              <p className="text-sm">{o.nombre}</p>
              {o.detalle && <p className="ayuda">{o.detalle}</p>}
              <p className="ayuda">{o.reservado_por ? `Apartado por ${o.invitado}` : "Libre"}</p>
            </div>
            {o.reservado_por && (
              <button type="button" className="boton-secundario" onClick={() => hacer(() => api.liberarOpcionRegalo(o.id))}>
                Liberar
              </button>
            )}
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
        ))}
        {!opciones.length && <li className="ayuda py-2">Todavía no hay opciones.</li>}
      </ul>
      <form onSubmit={agregar} className="flex flex-wrap gap-2">
        <input className="campo flex-1 min-w-[180px]" required placeholder="Opción, por ejemplo: Juego de sábanas" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <input className="campo flex-1 min-w-[180px]" placeholder="Detalle (opcional)" value={detalle} onChange={(e) => setDetalle(e.target.value)} />
        <button className="boton-secundario">Agregar</button>
      </form>
    </div>
  );
}

// Regalo específico de un invitado: qué regalo y dónde comprarlo.
function DetalleEspecifico({ invitado, onCambio }) {
  const toast = useToast();
  const [detalle, setDetalle] = useState(invitado.regalo_detalle || "");
  const [url, setUrl] = useState(invitado.regalo_url || "");

  async function guardar() {
    if (detalle.trim() === (invitado.regalo_detalle || "") && url.trim() === (invitado.regalo_url || "")) return;
    try {
      onCambio(await api.actualizarInvitado(invitado.id, { regalo_detalle: detalle.trim(), regalo_url: url.trim() }));
    } catch (err) {
      toast(err.message, "error");
    }
  }

  return (
    <div className="w-full grid sm:grid-cols-2 gap-2">
      <input
        className={`campo-sm ${detalle.trim() ? "" : "border-amber-300"}`}
        placeholder="Qué regalo, ej. Juego de copas"
        value={detalle}
        onChange={(e) => setDetalle(e.target.value)}
        onBlur={guardar}
        aria-label={`Regalo específico de ${invitado.nombre}`}
      />
      <input
        className="campo-sm"
        type="url"
        placeholder="Dónde comprarlo (opcional): https://..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={guardar}
        aria-label={`Enlace del regalo de ${invitado.nombre}`}
      />
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

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h2 className="panel-titulo">Regalos</h2>
        <p className="panel-subtitulo">Elige qué ve cada invitado en su enlace personal.</p>
      </div>
      <Ajustes inicial={datos.config} onGuardado={cargar} />
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
  );
}
