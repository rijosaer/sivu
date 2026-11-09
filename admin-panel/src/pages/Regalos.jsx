import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useToast } from "../ui/Toast";
import { paraBuscar } from "./Invitados";

const MODOS = [
  ["", "Sin regalo"],
  ["enlace", "Enlace de compra"],
  ["lista", "Lista de opciones"],
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

function Asignar({ invitados, onCambio }) {
  const toast = useToast();
  const [buscar, setBuscar] = useState("");
  const cuenta = useMemo(() => ({
    enlace: invitados.filter((i) => i.regalo_modo === "enlace").length,
    lista: invitados.filter((i) => i.regalo_modo === "lista").length,
  }), [invitados]);
  const q = paraBuscar(buscar);
  const visibles = invitados.filter((i) => paraBuscar(i.nombre).includes(q));

  async function cambiar(i, regalo_modo) {
    try {
      onCambio(await api.actualizarInvitado(i.id, { regalo_modo }));
    } catch (err) {
      toast(err.message, "error");
    }
  }

  return (
    <div className="tarjeta p-4">
      <p className="text-sm font-medium mb-1">Qué recibe cada invitado</p>
      <p className="ayuda mb-3">
        {cuenta.enlace} con enlace · {cuenta.lista} con lista · {invitados.length - cuenta.enlace - cuenta.lista} sin regalo.
        Quien abra el enlace general no ve esta sección.
      </p>
      <input className="campo mb-2" placeholder="Buscar invitado" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
      <ul className="divide-y divide-borde">
        {visibles.map((i) => (
          <li key={i.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm">{i.nombre}</span>
            <select className="campo-sm w-auto" value={i.regalo_modo || ""} onChange={(e) => cambiar(i, e.target.value)}>
              {MODOS.map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
            </select>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Enlace de compra para unos invitados, lista para apartar para otros.
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
          // Cambiar el modo puede soltar una opción apartada.
          cargar();
        }}
      />
    </div>
  );
}
