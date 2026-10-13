import { useEffect, useState } from "react";
import { api, setInvitacionActual, sitioUrlInvitacion } from "../api";
import { useToast } from "../ui/Toast";
import { NOMBRE_TIPO_EVENTO } from "../tiposEvento";
import { ETAPAS, CAMPOS_DATOS, peso, fechaCorta, diasHasta, haceCuanto, waUrl, hoyIso, nombreMetodo } from "./comun";

// Producción: todos los eventos contratados, en qué etapa va cada uno, cuánto
// se ha cobrado y qué datos mandó el cliente. Lo atrasado se ve en rojo.

function Pagos({ ev, metodos, onCambio }) {
  const toast = useToast();
  const [pagos, setPagos] = useState(null);
  const [valor, setValor] = useState("");
  const [nota, setNota] = useState("");
  const [fecha, setFecha] = useState(hoyIso());
  const [metodo, setMetodo] = useState("");

  const cargar = () => api.crm.pagos(ev.id).then(setPagos);
  useEffect(() => {
    cargar();
  }, [ev.id]);

  async function agregar(e) {
    e.preventDefault();
    try {
      await api.crm.agregarPago(ev.id, { valor: valor.replace(/\D/g, ""), nota, fecha, metodo });
      setValor("");
      setNota("");
      toast("Pago registrado");
      cargar();
      onCambio();
    } catch (err) {
      toast(err.message, "error");
    }
  }

  async function borrar(id) {
    if (!window.confirm("¿Borrar este pago?")) return;
    await api.crm.borrarPago(id);
    cargar();
    onCambio();
  }

  return (
    <div className="flex flex-col gap-2">
      {pagos?.length ? (
        <ul className="flex flex-col gap-1">
          {pagos.map((p) => (
            <li key={p.id} className="text-[12px] text-ink-suave flex items-center gap-2">
              <span className="tabular-nums text-ink font-medium">{peso(p.valor)}</span>
              <span>{fechaCorta(p.fecha)}</span>
              {p.metodo && <span>· {p.metodo}</span>}
              {p.nota && <span>· {p.nota}</span>}
              <button onClick={() => borrar(p.id)} className="boton-texto !text-[11px] ml-auto">
                quitar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-ink-tenue">Sin pagos registrados.</p>
      )}
      <form onSubmit={agregar} className="flex flex-wrap gap-2">
        <input
          className="campo-sm !w-28"
          inputMode="numeric"
          placeholder="$ valor"
          value={valor ? Number(valor.replace(/\D/g, "")).toLocaleString("es-CO") : ""}
          onChange={(e) => setValor(e.target.value.replace(/\D/g, ""))}
          required
        />
        <input type="date" className="campo-sm !w-auto" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <select className="campo-sm !w-auto" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
          <option value="">¿Por dónde llegó?</option>
          {(metodos || []).map((m) => (
            <option key={m.id}>{nombreMetodo(m)}</option>
          ))}
          <option>Efectivo</option>
          <option>Otro</option>
        </select>
        <input className="campo-sm !w-32 flex-1" placeholder="Nota (anticipo, saldo...)" value={nota} onChange={(e) => setNota(e.target.value)} />
        <button className="boton-secundario !py-1 !text-xs">Registrar</button>
      </form>
    </div>
  );
}

function DatosCliente({ ev, onCambio }) {
  const toast = useToast();
  const [d, setD] = useState(null);

  const cargar = () => api.crm.datosEvento(ev.id).then(setD).catch((e) => toast(e.message, "error"));
  useEffect(() => {
    cargar();
  }, [ev.id]);

  async function enlace() {
    const r = await api.crm.enlaceDatos(ev.id);
    await cargar();
    onCambio();
    return r.url;
  }

  async function usar(a) {
    try {
      await api.crm.usarArchivo(a.id);
      toast(a.tipo === "audio" ? "Música puesta en la invitación" : "Foto agregada a la galería de la invitación");
      cargar();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  if (!d) return <p className="text-[12px] text-ink-tenue">Cargando...</p>;
  const datos = d.datos_cliente || {};
  const llenos = CAMPOS_DATOS.filter(([k]) => datos[k]);
  const textoWa = (url) =>
    `¡Hola${ev.cliente_nombre ? ` ${ev.cliente_nombre.split(/\s+/)[0]}` : ""}! 💌 Para arrancar con tu invitación, llena aquí los datos de tu evento (puedes subir fotos, música y tu lista de invitados): ${url}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          className="boton-secundario !text-xs"
          onClick={async () => {
            const url = d.url || (await enlace());
            await navigator.clipboard.writeText(url);
            toast("Enlace copiado");
          }}
        >
          {d.url ? "Copiar enlace del formulario" : "Crear enlace del formulario"}
        </button>
        {ev.cliente_telefono && (
          <button
            className="boton-verde !text-xs"
            onClick={async () => {
              const url = d.url || (await enlace());
              window.open(waUrl(ev.cliente_telefono, textoWa(url)), "_blank");
            }}
          >
            Mandárselo por WhatsApp
          </button>
        )}
        {d.url && (
          <a className="boton-texto !text-xs" href={d.url} target="_blank" rel="noreferrer">
            Ver formulario
          </a>
        )}
      </div>
      {d.datos_recibidos_en ? (
        <p className="text-[12px] text-emerald-700">✓ Lo envió {haceCuanto(d.datos_recibidos_en)}</p>
      ) : llenos.length ? (
        <p className="text-[12px] text-amber-700">Lo está llenando (aún no le da «Enviar»).</p>
      ) : null}
      {llenos.length > 0 && (
        <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 bg-lienzo rounded-xl p-3">
          {llenos.map(([k, label]) => (
            <div key={k} className="min-w-0">
              <dt className="text-[10px] uppercase tracking-wide text-ink-tenue">{label}</dt>
              <dd className="text-[13px] text-ink whitespace-pre-wrap break-words">{datos[k]}</dd>
            </div>
          ))}
        </dl>
      )}
      {d.archivos.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {d.archivos.map((a) => (
            <li key={a.id} className="text-[12px] flex flex-wrap items-center gap-2">
              <span>{{ foto: "🖼", audio: "🎵", lista: "📋", otro: "📎" }[a.tipo]}</span>
              <span className="text-ink truncate max-w-[14rem]">{a.nombre}</span>
              <span className="text-ink-tenue">{Math.round(a.bytes / 1024)} KB</span>
              <button className="boton-texto !text-[11px]" onClick={() => api.crm.descargarArchivo(a.id, a.nombre)}>
                descargar
              </button>
              {["foto", "audio"].includes(a.tipo) &&
                (a.usado ? (
                  <span className="text-emerald-700">✓ en la invitación</span>
                ) : (
                  <button className="boton-texto !text-[11px]" onClick={() => usar(a)}>
                    usar en la invitación
                  </button>
                ))}
            </li>
          ))}
        </ul>
      )}
      {d.archivos.some((a) => a.tipo === "lista") && (
        <p className="ayuda">La lista de invitados: descárgala y súbela en el evento → Invitaciones → «Importar desde Excel».</p>
      )}
    </div>
  );
}

function TarjetaProduccion({ ev, metodos, onCambio, onEntrar }) {
  const toast = useToast();
  const [abierto, setAbierto] = useState(null); // "pagos" | "datos" | "notas"
  const dias = diasHasta(ev.fecha_evento);
  const saldo = ev.valor_total ? ev.valor_total - ev.pagado : null;
  const atrasado = dias !== null && dias <= 10 && ["datos", "diseno", "revision"].includes(ev.etapa);

  async function guardar(cambios, aviso) {
    try {
      await api.crm.actualizarProduccion(ev.id, cambios);
      if (aviso) toast(aviso);
      onCambio();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  return (
    <div className={`tarjeta-lista p-4 flex flex-col gap-3 ${atrasado ? "!border-red-300" : ""}`}>
      <div className="flex items-start gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink truncate">{ev.nombre}</p>
          <p className="text-[11px] text-ink-tenue">
            {NOMBRE_TIPO_EVENTO[ev.tipo_evento] || ev.tipo_evento}
            {ev.fecha_evento && ` · ${fechaCorta(ev.fecha_evento)}`}
            {dias !== null && dias >= 0 && ` · ${dias === 0 ? "¡es hoy!" : `faltan ${dias} días`}`}
            {ev.cliente_nombre && ` · ${ev.cliente_nombre}`}
          </p>
        </div>
        <select
          className={`campo-sm !w-auto ${atrasado ? "!border-red-300 !text-red-700" : ""}`}
          value={ev.etapa}
          onChange={(e) => guardar({ etapa: e.target.value }, `Etapa: ${ETAPAS[e.target.value]}`)}
        >
          {Object.entries(ETAPAS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-suave">
        <span>
          Valor:{" "}
          <input
            className="campo-sm !w-28 !inline-block"
            inputMode="numeric"
            key={`v${ev.valor_total}`}
            defaultValue={ev.valor_total ? Number(ev.valor_total).toLocaleString("es-CO") : ""}
            placeholder="$"
            onBlur={(e) => {
              const v = e.target.value.replace(/\D/g, "");
              if (String(v || "") !== String(ev.valor_total || "")) guardar({ valor_total: v || null });
            }}
          />
        </span>
        <span>Pagado: {peso(ev.pagado)}</span>
        {saldo !== null && <span className={saldo > 0 ? "text-amber-700 font-medium" : "text-emerald-700"}>{saldo > 0 ? `Falta ${peso(saldo)}` : "Pagado ✓"}</span>}
        <span>
          Invitaciones: {ev.enviados}/{ev.invitados} enviadas
        </span>
        {ev.tiene_datos && <span className="text-emerald-700">{ev.datos_recibidos_en ? "✓ datos recibidos" : "datos en proceso"}</span>}
        {ev.archivos > 0 && <span>{ev.archivos} archivos</span>}
        {ev.mensajes_sin_leer > 0 && <span className="text-emerald-700">💬 {ev.mensajes_sin_leer} mensajes de invitados</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ["datos", "Datos del cliente"],
          ["pagos", "Pagos"],
          ["cliente", "Cliente y notas"],
        ].map(([k, t]) => (
          <button key={k} onClick={() => setAbierto(abierto === k ? null : k)} className={`chip-filtro ${abierto === k ? "chip-filtro-activo" : ""}`}>
            {t}
          </button>
        ))}
        <span className="flex-1" />
        <a className="boton-texto !text-xs" href={sitioUrlInvitacion(ev.slug)} target="_blank" rel="noreferrer">
          Ver ↗
        </a>
        <button onClick={() => onEntrar(ev)} className="boton-secundario !py-1 !text-xs">
          Entrar a editar
        </button>
      </div>

      {abierto === "pagos" && <Pagos ev={ev} metodos={metodos} onCambio={onCambio} />}
      {abierto === "datos" && <DatosCliente ev={ev} onCambio={onCambio} />}
      {abierto === "cliente" && (
        <div className="grid sm:grid-cols-2 gap-2">
          <input
            className="campo-sm"
            placeholder="Nombre del cliente"
            defaultValue={ev.cliente_nombre}
            onBlur={(e) => e.target.value !== ev.cliente_nombre && guardar({ cliente_nombre: e.target.value })}
          />
          <input
            className="campo-sm"
            placeholder="WhatsApp del cliente"
            inputMode="tel"
            defaultValue={ev.cliente_telefono}
            onBlur={(e) => e.target.value.replace(/\D/g, "") !== ev.cliente_telefono && guardar({ cliente_telefono: e.target.value })}
          />
          <textarea
            className="campo-sm sm:col-span-2 min-h-[80px]"
            placeholder="Notas de producción: cambios pedidos, pendientes..."
            defaultValue={ev.notas_produccion}
            onBlur={(e) => e.target.value !== ev.notas_produccion && guardar({ notas_produccion: e.target.value }, "Notas guardadas")}
          />
        </div>
      )}
    </div>
  );
}

export default function Produccion({ onElegirEvento }) {
  const toast = useToast();
  const [eventos, setEventos] = useState(null);
  const [filtro, setFiltro] = useState("activos");
  const [metodos, setMetodos] = useState([]);

  const cargar = () => api.crm.produccion().then(setEventos).catch((e) => toast(e.message, "error"));
  useEffect(() => {
    cargar();
    api.crm.ajustes().then((r) => setMetodos((r.ajustes.pagos?.metodos || []).filter((m) => m.tipo !== "efectivo"))).catch(() => {});
  }, []);

  function entrar(ev) {
    const inv = { id: ev.id, slug: ev.slug, nombre: ev.nombre, tipo_evento: ev.tipo_evento };
    setInvitacionActual(inv);
    onElegirEvento(inv);
  }

  const visibles = (eventos || []).filter((e) =>
    filtro === "activos" ? e.etapa !== "realizado" : filtro === "realizados" ? e.etapa === "realizado" : e.etapa === filtro
  );
  const conteo = (k) => (eventos || []).filter((e) => e.etapa === k).length;
  const porCobrar = (eventos || [])
    .filter((e) => e.etapa !== "realizado" && e.valor_total)
    .reduce((s, e) => s + Math.max(0, e.valor_total - e.pagado), 0);

  return (
    <div>
      <h2 className="panel-titulo">Producción</h2>
      <p className="panel-subtitulo mb-4">
        En qué va cada evento contratado, qué datos mandó el cliente y cuánto falta por cobrar
        {porCobrar > 0 && <b className="text-ink"> · por cobrar: {peso(porCobrar)}</b>}.
      </p>
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4">
        <button onClick={() => setFiltro("activos")} className={`chip-filtro shrink-0 ${filtro === "activos" ? "chip-filtro-activo" : ""}`}>
          En curso
        </button>
        {Object.entries(ETAPAS)
          .filter(([k]) => k !== "realizado")
          .map(([k, v]) => (
            <button key={k} onClick={() => setFiltro(k)} className={`chip-filtro shrink-0 ${filtro === k ? "chip-filtro-activo" : ""}`}>
              {v} <span className="chip-cuenta">{conteo(k)}</span>
            </button>
          ))}
        <button onClick={() => setFiltro("realizados")} className={`chip-filtro shrink-0 ${filtro === "realizados" ? "chip-filtro-activo" : ""}`}>
          Realizados <span className="chip-cuenta">{conteo("realizado")}</span>
        </button>
      </div>
      {!eventos ? (
        <p className="text-sm text-ink-tenue">Cargando...</p>
      ) : !visibles.length ? (
        <div className="vacio">
          <p className="text-sm text-ink-suave">No hay eventos aquí.</p>
          <p className="ayuda mt-1">Cuando un cliente firme, conviértelo en evento desde su ficha y aparece en esta lista.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibles.map((ev) => (
            <TarjetaProduccion key={ev.id} ev={ev} metodos={metodos} onCambio={cargar} onEntrar={entrar} />
          ))}
        </div>
      )}
    </div>
  );
}
