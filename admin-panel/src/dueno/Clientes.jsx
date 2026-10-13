import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useToast } from "../ui/Toast";
import Icono from "../ui/Icono";
import FichaCliente from "./FichaCliente";
import {
  EVENTOS, CUANDO, INVITADOS, ORIGENES, ESTADOS, PRIORIDAD, peso, soloFecha, fechaCorta, haceCuanto, hoyIso, descargarCsv,
} from "./comun";

// Clientes potenciales: la bandeja de ventas. Arriba los filtros por estado;
// la lista se ordena por prioridad (lo urgente primero) y al tocar a alguien
// se abre su ficha al lado (o encima, en el celular).

const FILTROS = [
  ["abiertos", "Por atender"],
  ["nuevo", "Nuevos"],
  ["contactado", "Contactados"],
  ["cotizado", "Cotizados"],
  ["ganado", "Ganados"],
  ["perdido", "Perdidos"],
  ["frio", "Fríos"],
  ["todos", "Todos"],
];
const ORDEN_PRIO = { alta: 0, media: 1, baja: 2 };

function Agregar({ onCreado, onCancelar }) {
  const toast = useToast();
  const [d, setD] = useState({ nombre: "", telefono: "", origen: "instagram", evento: "", ciudad: "", notas: "" });
  const [guardando, setGuardando] = useState(false);
  const set = (k) => (e) => setD((prev) => ({ ...prev, [k]: e.target.value }));

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const p = await api.crm.crearProspecto(d);
      toast(p.unido ? "Ese número ya existía: se unió a su ficha" : "Cliente potencial agregado");
      onCreado(p);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="tarjeta p-4 mb-4 grid sm:grid-cols-3 gap-3">
      <input className="campo" placeholder="Nombre" value={d.nombre} onChange={set("nombre")} autoFocus />
      <input className="campo" placeholder="WhatsApp" inputMode="tel" value={d.telefono} onChange={set("telefono")} />
      <select className="campo" value={d.origen} onChange={set("origen")}>
        {Object.entries(ORIGENES).map(([k, v]) => (
          <option key={k} value={k}>
            Llegó por: {v}
          </option>
        ))}
      </select>
      <select className="campo" value={d.evento} onChange={set("evento")}>
        <option value="">Evento…</option>
        {Object.entries(EVENTOS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <input className="campo" placeholder="Ciudad" value={d.ciudad} onChange={set("ciudad")} />
      <input className="campo" placeholder="Nota rápida" value={d.notas} onChange={set("notas")} />
      <div className="sm:col-span-3 flex gap-2">
        <button disabled={guardando} className="boton-primario">
          {guardando ? "Guardando..." : "Agregar"}
        </button>
        <button type="button" onClick={onCancelar} className="boton-secundario">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function Fila({ p, activo, onAbrir }) {
  const prio = PRIORIDAD[p.prioridad];
  const seg = p.proximo_seguimiento && soloFecha(p.proximo_seguimiento);
  const vencido = seg && seg <= hoyIso();
  const detalle = [EVENTOS[p.evento], CUANDO[p.cuando], p.invitados && `${INVITADOS[p.invitados]} inv.`, p.ciudad]
    .filter(Boolean)
    .join(" · ");
  return (
    <button
      onClick={onAbrir}
      className={`w-full text-left px-4 py-3 border-t border-borde first:border-t-0 transition-colors ${
        activo ? "bg-marca-suave" : "hover:bg-lienzo"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="w-5 shrink-0 text-center" title={prio?.nombre}>
          {prio?.emoji || ""}
        </span>
        <span className="text-sm font-medium text-ink truncate flex-1">{p.nombre || `+${p.telefono}`}</span>
        {p.sin_leer > 0 && (
          <span className="text-[10px] font-semibold bg-emerald-600 text-white rounded-full px-1.5 py-0.5">{p.sin_leer}</span>
        )}
        <span className={`insignia ${ESTADOS[p.estado].clase}`}>{ESTADOS[p.estado].nombre}</span>
      </div>
      <div className="pl-7 mt-0.5 text-[12px] text-ink-suave truncate">{detalle || "Sin datos del evento"}</div>
      <div className="pl-7 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-tenue">
        <span>{ORIGENES[p.origen]}</span>
        <span>{haceCuanto(p.creado_en)}</span>
        {seg && <span className={vencido ? "text-amber-700 font-medium" : ""}>📅 {vencido ? "toca hoy" : fechaCorta(seg)}</span>}
        {p.valor_cotizado && <span>{peso(p.valor_cotizado)}</span>}
        {p.cotizacion_vista && p.estado === "cotizado" && <span>👀 vio la cotización</span>}
      </div>
      {p.ultimo_mensaje && (
        <div className="pl-7 mt-1 text-[12px] text-ink-tenue truncate">
          {p.ultimo_direccion === "saliente" ? "Tú: " : "💬 "}
          {p.ultimo_mensaje}
        </div>
      )}
    </button>
  );
}

export default function Clientes({ conteos, onCambio, abierto = null, onAbrir, onIrAProduccion }) {
  const toast = useToast();
  const [filtro, setFiltro] = useState("abiertos");
  const [q, setQ] = useState("");
  const [origen, setOrigen] = useState("");
  const [evento, setEvento] = useState("");
  const [orden, setOrden] = useState("prioridad");
  const [lista, setLista] = useState(null);
  // El cliente abierto vive en la dirección (/clientes/25).
  const setAbierto = (id) => onAbrir?.(id);
  const [agregando, setAgregando] = useState(false);
  const [ajustes, setAjustes] = useState(null);
  const [conectado, setConectado] = useState(false);

  async function cargar() {
    try {
      setLista(await api.crm.prospectos({ estado: filtro === "todos" ? "" : filtro, q, origen, evento }));
    } catch (e) {
      toast(e.message, "error");
    }
  }

  useEffect(() => {
    api.crm.ajustes().then((r) => setAjustes(r.ajustes)).catch(() => {});
    api.estadoWhatsapp().then((w) => setConectado(w.estado === "conectado")).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(cargar, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [filtro, q, origen, evento]);

  // Lo nuevo entra solo: se refresca cada 30 s.
  useEffect(() => {
    const t = setInterval(cargar, 30000);
    return () => clearInterval(t);
  }, [filtro, q, origen, evento]);

  const ordenada = useMemo(() => {
    if (!lista) return [];
    const l = [...lista];
    if (orden === "prioridad") {
      l.sort(
        (a, b) =>
          (ORDEN_PRIO[a.prioridad] ?? 3) - (ORDEN_PRIO[b.prioridad] ?? 3) ||
          (b.sin_leer > 0) - (a.sin_leer > 0) ||
          new Date(b.creado_en) - new Date(a.creado_en)
      );
    }
    return l;
  }, [lista, orden]);

  function cambio() {
    cargar();
    onCambio?.();
  }

  async function exportar() {
    const todos = await api.crm.exportar();
    descargarCsv(`clientes-potenciales-${hoyIso()}.csv`, [
      ["Nombre", "Teléfono", "Origen", "Estado", "Prioridad", "Evento", "Cuándo", "Invitados", "Ciudad", "Fecha evento", "Valor cotizado", "Valor ganado", "Próximo seguimiento", "Llegó", "Notas"],
      ...todos.map((p) => [
        p.nombre, p.telefono ? `+${p.telefono}` : "", ORIGENES[p.origen], ESTADOS[p.estado].nombre, PRIORIDAD[p.prioridad]?.nombre || "",
        EVENTOS[p.evento] || "", CUANDO[p.cuando] || "", INVITADOS[p.invitados] || "", p.ciudad, soloFecha(p.fecha_evento),
        p.valor_cotizado ?? "", p.valor_ganado ?? "", soloFecha(p.proximo_seguimiento),
        new Date(p.creado_en).toLocaleString("es-CO", { timeZone: "America/Bogota" }), p.notas,
      ]),
    ]);
  }

  const cuenta = (k) => {
    if (!conteos) return null;
    if (k === "abiertos") return conteos.nuevo + conteos.contactado + conteos.cotizado;
    if (k === "todos") return Object.values(conteos).reduce((s, n) => s + n, 0);
    return conteos[k];
  };

  // En el celular, con una ficha abierta, solo se ve la ficha.
  const soloEscritorio = abierto ? "hidden lg:block" : "";

  return (
    <div>
      <div className={`${soloEscritorio} lg:flex flex-wrap items-center justify-between gap-3 mb-4 ${abierto ? "" : "flex"}`}>
        <div>
          <h2 className="panel-titulo">Clientes potenciales</h2>
          <p className="panel-subtitulo">Lo urgente primero. Llegan solos del anuncio y del WhatsApp; los demás los agregas aquí.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setAgregando(true)} className="boton-primario">
            <Icono nombre="mas" className="w-3.5 h-3.5" /> Agregar
          </button>
          <button onClick={exportar} className="boton-secundario" title="Descargar en Excel (CSV)">
            <Icono nombre="descargar" className="w-3.5 h-3.5" /> Excel
          </button>
        </div>
      </div>

      {agregando && (
        <Agregar
          onCreado={(p) => {
            setAgregando(false);
            cambio();
            setAbierto(p.id);
          }}
          onCancelar={() => setAgregando(false)}
        />
      )}

      <div className={`${soloEscritorio} ${abierto ? "" : "flex"} lg:flex gap-1.5 overflow-x-auto pb-2 mb-3 -mx-1 px-1`}>
        {FILTROS.map(([k, t]) => (
          <button key={k} onClick={() => setFiltro(k)} className={`chip-filtro shrink-0 ${filtro === k ? "chip-filtro-activo" : ""}`}>
            {t} {cuenta(k) !== null && <span className="chip-cuenta">{cuenta(k)}</span>}
          </button>
        ))}
      </div>

      <div className={`${soloEscritorio} ${abierto ? "" : "flex"} lg:flex flex-wrap gap-2 mb-4`}>
        <div className="relative flex-1 min-w-[180px]">
          <Icono nombre="buscar" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-tenue" />
          <input className="campo !pl-8" placeholder="Buscar por nombre, teléfono, ciudad o nota" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="campo !w-auto" value={origen} onChange={(e) => setOrigen(e.target.value)}>
          <option value="">Todo origen</option>
          {Object.entries(ORIGENES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select className="campo !w-auto" value={evento} onChange={(e) => setEvento(e.target.value)}>
          <option value="">Todo evento</option>
          {Object.entries(EVENTOS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select className="campo !w-auto" value={orden} onChange={(e) => setOrden(e.target.value)}>
          <option value="prioridad">Orden: prioridad</option>
          <option value="recientes">Orden: más recientes</option>
        </select>
      </div>

      <div className={`grid gap-4 ${abierto ? "lg:grid-cols-[22rem_minmax(0,1fr)]" : ""}`}>
        <div className={`tarjeta p-0 overflow-hidden self-start ${abierto ? "hidden lg:block" : ""}`}>
          {!lista ? (
            <p className="p-5 text-sm text-ink-tenue">Cargando...</p>
          ) : !ordenada.length ? (
            <div className="vacio m-4">
              <p className="text-sm text-ink-suave">No hay clientes en esta lista.</p>
              <p className="ayuda mt-1">Cuando alguien llene el formulario del anuncio o le escriba al WhatsApp de Sivú, aparece aquí.</p>
            </div>
          ) : (
            <div className="max-h-[75vh] overflow-y-auto">
              {ordenada.map((p) => (
                <Fila
                  key={p.id}
                  p={p}
                  activo={abierto === p.id}
                  onAbrir={() => {
                    setAbierto(p.id);
                    if (window.innerWidth < 1024) window.scrollTo({ top: 0 });
                  }}
                />
              ))}
            </div>
          )}
        </div>
        {abierto && (
          <FichaCliente
            id={abierto}
            ajustes={ajustes}
            conectado={conectado}
            onCambio={cambio}
            onCerrar={() => setAbierto(null)}
            onIrAProduccion={onIrAProduccion}
          />
        )}
      </div>
    </div>
  );
}
