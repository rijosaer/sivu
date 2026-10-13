import { useEffect, useRef, useState } from "react";
import { api, sitioUrlInvitacion } from "../api";
import { useToast } from "../ui/Toast";
import { DISENOS, NOMBRE_TIPO_EVENTO, TIPOS_EVENTO } from "../tiposEvento";
import Cotizador from "./Cotizador";
import {
  EVENTOS, CUANDO, INVITADOS, ORIGENES, ESTADOS, PRIORIDAD, MOTIVOS_PERDIDA, EVENTO_A_TIPO,
  peso, soloFecha, fechaCorta, haceCuanto, waUrl, rellenar, valoresDe, hoyIso,
} from "./comun";

// Ficha de un cliente potencial: todo lo que hace falta para atenderlo sin
// salir de aquí — su conversación, respuestas listas, estado, seguimiento,
// cotizaciones y, cuando firma, convertirlo en evento.

const sumarDias = (n) => {
  const d = new Date(`${hoyIso()}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

function Campo({ label, children }) {
  return (
    <label className="block">
      <span className="etiqueta">{label}</span>
      {children}
    </label>
  );
}

// Una respuesta lista, ya rellenada con los datos del cliente, para revisar
// antes de mandarla.
function ComponerMensaje({ inicial, prospecto, conectado, onEnviado, onCerrar }) {
  const toast = useToast();
  const [texto, setTexto] = useState(inicial);
  const [enviando, setEnviando] = useState(false);

  async function enviarAqui() {
    setEnviando(true);
    try {
      await api.crm.enviarMensaje(prospecto.id, texto);
      toast("Mensaje enviado por el WhatsApp de Sivú");
      onEnviado();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="border border-borde rounded-xl p-3 bg-lienzo flex flex-col gap-2">
      <textarea className="campo !text-[13px] min-h-[140px]" value={texto} onChange={(e) => setTexto(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <a
          href={waUrl(prospecto.telefono, texto)}
          target="_blank"
          rel="noreferrer"
          className="boton-verde !text-xs"
          onClick={() => setTimeout(onCerrar, 300)}
        >
          Abrir en WhatsApp
        </a>
        <button onClick={enviarAqui} disabled={enviando || !conectado || !texto.trim()} className="boton-secundario !text-xs">
          {enviando ? "Enviando..." : "Enviar desde aquí"}
        </button>
        <button onClick={onCerrar} className="boton-texto !text-xs">
          Cancelar
        </button>
      </div>
      {!conectado && <p className="text-[11px] text-ink-tenue">«Enviar desde aquí» necesita el WhatsApp de Sivú vinculado.</p>}
    </div>
  );
}

function ConvertirEnEvento({ prospecto, onHecho, onCancelar }) {
  const toast = useToast();
  const [nombre, setNombre] = useState(
    `${(prospecto.nombre || "Cliente").split(/\s+/).slice(0, 2).join(" ")} — ${EVENTOS[prospecto.evento] || "Evento"}`
  );
  const [tipo, setTipo] = useState(EVENTO_A_TIPO[prospecto.evento] || "otro");
  const [fecha, setFecha] = useState(soloFecha(prospecto.fecha_evento));
  const [diseno, setDiseno] = useState("clasico");
  const [guardando, setGuardando] = useState(false);

  async function crear(e) {
    e.preventDefault();
    setGuardando(true);
    try {
      const inv = await api.crearInvitacion({ nombre: nombre.trim(), tipo_evento: tipo, fecha_evento: fecha || null, diseno });
      await api.crm.actualizarProduccion(inv.id, {
        cliente_nombre: prospecto.nombre,
        cliente_telefono: prospecto.telefono,
        valor_total: prospecto.valor_ganado ?? prospecto.valor_cotizado ?? null,
      });
      await api.crm.actualizarProspecto(prospecto.id, { invitacion_id: inv.id, estado: "ganado" });
      toast("Evento creado: ya está en Producción");
      onHecho();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={crear} className="border border-borde rounded-xl p-4 bg-lienzo flex flex-col gap-3">
      <p className="text-sm font-medium text-ink">Convertir en evento</p>
      <Campo label="Nombre del evento">
        <input className="campo" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
      </Campo>
      <div className="grid grid-cols-2 gap-3">
        <Campo label="Tipo">
          <select className="campo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS_EVENTO.map((t) => (
              <option key={t} value={t}>
                {NOMBRE_TIPO_EVENTO[t]}
              </option>
            ))}
          </select>
        </Campo>
        <Campo label="Fecha">
          <input type="date" className="campo" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Campo>
      </div>
      <Campo label="Diseño">
        <select className="campo" value={diseno} onChange={(e) => setDiseno(e.target.value)}>
          {DISENOS.map((d) => (
            <option key={d.key} value={d.key}>
              {d.nombre}
            </option>
          ))}
        </select>
      </Campo>
      <p className="ayuda">Queda marcado como ganado, enlazado a esta ficha y en Producción con su valor.</p>
      <div className="flex gap-2">
        <button disabled={guardando} className="boton-primario">
          {guardando ? "Creando..." : "Crear evento"}
        </button>
        <button type="button" onClick={onCancelar} className="boton-secundario">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function FichaCliente({ id, ajustes, conectado, onCambio, onCerrar, onIrAProduccion }) {
  const toast = useToast();
  const [p, setP] = useState(null);
  const [componiendo, setComponiendo] = useState(null); // texto inicial
  const [cotizando, setCotizando] = useState(null); // null | "nueva" | cotización
  const [convirtiendo, setConvirtiendo] = useState(false);
  const [notas, setNotas] = useState("");
  const [enlaceDatos, setEnlaceDatos] = useState("");
  const finChat = useRef(null);

  async function cargar() {
    try {
      const d = await api.crm.prospecto(id);
      setP(d);
      setNotas(d.notas || "");
      if (d.sin_leer > 0) {
        await api.crm.marcarLeido(id);
        onCambio();
      }
    } catch (e) {
      toast(e.message, "error");
    }
  }

  useEffect(() => {
    setP(null);
    setComponiendo(null);
    setCotizando(null);
    setConvirtiendo(false);
    setEnlaceDatos("");
    cargar();
    // La conversación se refresca sola mientras la ficha está abierta.
    const t = setInterval(() => api.crm.prospecto(id).then(setP).catch(() => {}), 20000);
    return () => clearInterval(t);
  }, [id]);

  useEffect(() => {
    finChat.current?.scrollIntoView({ block: "nearest" });
  }, [p?.mensajes?.length]);

  async function guardar(cambios, aviso) {
    try {
      const d = await api.crm.actualizarProspecto(id, cambios);
      setP((prev) => ({ ...prev, ...d }));
      if (aviso) toast(aviso);
      onCambio();
      if ("estado" in cambios || "proximo_seguimiento" in cambios) cargar();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  async function borrar(ignorar) {
    const msg = ignorar
      ? "¿Quitar a esta persona? No es cliente: su número no volverá a entrar solo como cliente potencial."
      : "¿Borrar este cliente potencial y todo su historial?";
    if (!window.confirm(msg)) return;
    await api.crm.borrarProspecto(id, ignorar);
    toast(ignorar ? "Listo: no volverá a aparecer" : "Borrado");
    onCambio();
    onCerrar();
  }

  async function obtenerEnlaceDatos() {
    if (!p.invitacion_id) return "";
    if (enlaceDatos) return enlaceDatos;
    const r = await api.crm.enlaceDatos(p.invitacion_id);
    setEnlaceDatos(r.url);
    return r.url;
  }

  async function usarRespuesta(r) {
    const ultima = p.cotizaciones?.[0];
    const datos = r.texto.includes("{datos}") ? await obtenerEnlaceDatos() : "";
    setComponiendo(rellenar(r.texto, valoresDe(p, { cotizacion: ultima?.url ? ultima.url : "", datos, pagos: ajustes?.pagos })));
  }

  if (!p) return <div className="tarjeta p-6 text-sm text-ink-tenue">Cargando...</div>;

  const prio = PRIORIDAD[p.prioridad];
  const seguimientoVencido = p.proximo_seguimiento && soloFecha(p.proximo_seguimiento) <= hoyIso();

  return (
    <div className="tarjeta p-0 overflow-hidden">
      {/* Encabezado */}
      <div className="p-5 border-b border-borde flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <button onClick={onCerrar} className="boton-texto !p-1 lg:hidden" aria-label="Volver a la lista">
            ←
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {prio && <span title={prio.nombre}>{prio.emoji}</span>}
              <input
                className="text-lg font-semibold text-ink bg-transparent border-0 p-0 focus:ring-0 min-w-0 flex-1"
                defaultValue={p.nombre}
                placeholder="Sin nombre"
                onBlur={(e) => e.target.value !== p.nombre && guardar({ nombre: e.target.value })}
              />
              <span className={`insignia ${ESTADOS[p.estado].clase}`}>{ESTADOS[p.estado].nombre}</span>
            </div>
            <p className="text-[12px] text-ink-suave mt-1">
              {p.telefono ? `+${p.telefono}` : "Sin teléfono"} · {ORIGENES[p.origen]} · llegó {haceCuanto(p.creado_en)}
              {p.saludado_en && " · se le envió el mensaje automático"}
            </p>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap gap-2">
          {p.telefono && (
            <a href={waUrl(p.telefono)} target="_blank" rel="noreferrer" className="boton-verde !text-xs">
              Abrir chat
            </a>
          )}
          {p.telefono && (
            <details className="relative">
              <summary className="boton-secundario !text-xs list-none cursor-pointer">Respuestas listas ▾</summary>
              <div className="absolute z-20 mt-1 left-0 w-64 bg-white border border-borde rounded-xl shadow-flotante p-1">
                {(ajustes?.respuestas || []).map((r) => (
                  <button
                    key={r.id}
                    onClick={(e) => {
                      e.currentTarget.closest("details").open = false;
                      usarRespuesta(r);
                    }}
                    className="block w-full text-left text-[13px] px-3 py-2 rounded-lg hover:bg-lienzo"
                  >
                    {r.titulo}
                  </button>
                ))}
              </div>
            </details>
          )}
          {p.telefono && (
            <a href={`tel:+${p.telefono}`} className="boton-secundario !text-xs">
              Llamar
            </a>
          )}
          <button onClick={() => setCotizando("nueva")} className="boton-secundario !text-xs">
            Nueva cotización
          </button>
        </div>
        {componiendo !== null && (
          <ComponerMensaje
            inicial={componiendo}
            prospecto={p}
            conectado={conectado}
            onEnviado={() => {
              setComponiendo(null);
              setTimeout(cargar, 1500);
            }}
            onCerrar={() => setComponiendo(null)}
          />
        )}
      </div>

      {cotizando && (
        <div className="p-5 border-b border-borde">
          <Cotizador
            prospecto={p}
            cotizacion={cotizando === "nueva" ? null : cotizando}
            ajustes={ajustes}
            onGuardada={(c) => {
              setCotizando(null);
              cargar();
              onCambio();
              const r = (ajustes?.respuestas || []).find((x) => x.id === "cotizacion");
              if (r && p.telefono) setComponiendo(rellenar(r.texto, valoresDe(p, { cotizacion: c.url, pagos: ajustes?.pagos })));
            }}
            onCancelar={() => setCotizando(null)}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Columna izquierda: estado, datos, notas */}
        <div className="p-5 flex flex-col gap-5 border-b lg:border-b-0 lg:border-r border-borde">
          <div>
            <span className="etiqueta">Estado</span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(ESTADOS).map(([k, e]) => (
                <button
                  key={k}
                  onClick={() => k !== p.estado && guardar({ estado: k }, `Pasó a ${e.nombre.toLowerCase()}`)}
                  className={`chip-filtro ${p.estado === k ? "chip-filtro-activo" : ""}`}
                >
                  {e.nombre}
                </button>
              ))}
            </div>
            {p.estado === "perdido" && (
              <select
                className="campo !text-xs mt-2"
                value={p.motivo_perdida || ""}
                onChange={(e) => guardar({ motivo_perdida: e.target.value })}
              >
                <option value="">¿Por qué se perdió?</option>
                {MOTIVOS_PERDIDA.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <span className="etiqueta">Próximo seguimiento</span>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                className={`campo !w-auto !py-1.5 !text-xs ${seguimientoVencido ? "!border-amber-400" : ""}`}
                value={soloFecha(p.proximo_seguimiento)}
                onChange={(e) => guardar({ proximo_seguimiento: e.target.value || null })}
              />
              {[
                ["Mañana", 1],
                ["+2 días", 2],
                ["+1 semana", 7],
              ].map(([t, n]) => (
                <button key={t} onClick={() => guardar({ proximo_seguimiento: sumarDias(n) }, `Seguimiento: ${fechaCorta(sumarDias(n))}`)} className="boton-texto !text-[11px]">
                  {t}
                </button>
              ))}
              {p.proximo_seguimiento && (
                <button onClick={() => guardar({ proximo_seguimiento: null })} className="boton-texto !text-[11px]">
                  Quitar
                </button>
              )}
            </div>
            {seguimientoVencido && <p className="text-[11px] text-amber-700 mt-1">Toca escribirle hoy.</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Campo label="Evento">
              <select className="campo !text-xs" value={p.evento} onChange={(e) => guardar({ evento: e.target.value })}>
                <option value="">—</option>
                {Object.entries(EVENTOS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Fecha del evento">
              <input
                type="date"
                className="campo !text-xs"
                value={soloFecha(p.fecha_evento)}
                onChange={(e) => guardar({ fecha_evento: e.target.value || null })}
              />
            </Campo>
            <Campo label="¿Para cuándo?">
              <select className="campo !text-xs" value={p.cuando} onChange={(e) => guardar({ cuando: e.target.value })}>
                <option value="">—</option>
                {Object.entries(CUANDO).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Invitados">
              <select className="campo !text-xs" value={p.invitados} onChange={(e) => guardar({ invitados: e.target.value })}>
                <option value="">—</option>
                {Object.entries(INVITADOS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Ciudad">
              <input className="campo !text-xs" defaultValue={p.ciudad} onBlur={(e) => e.target.value !== p.ciudad && guardar({ ciudad: e.target.value })} />
            </Campo>
            <Campo label="Teléfono">
              <input
                className="campo !text-xs"
                defaultValue={p.telefono}
                inputMode="tel"
                onBlur={(e) => e.target.value.replace(/\D/g, "") !== p.telefono && guardar({ telefono: e.target.value })}
              />
            </Campo>
            <Campo label="Valor cotizado">
              <input
                className="campo !text-xs"
                inputMode="numeric"
                defaultValue={p.valor_cotizado ?? ""}
                key={`vc${p.valor_cotizado}`}
                placeholder="$"
                onBlur={(e) => guardar({ valor_cotizado: e.target.value.replace(/\D/g, "") || null })}
              />
            </Campo>
            <Campo label="Valor ganado">
              <input
                className="campo !text-xs"
                inputMode="numeric"
                defaultValue={p.valor_ganado ?? ""}
                key={`vg${p.valor_ganado}`}
                placeholder="$"
                onBlur={(e) => guardar({ valor_ganado: e.target.value.replace(/\D/g, "") || null })}
              />
            </Campo>
            <Campo label="Origen">
              <select className="campo !text-xs" value={p.origen} onChange={(e) => guardar({ origen: e.target.value })}>
                {Object.entries(ORIGENES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <Campo label="Notas">
            <textarea
              className="campo !text-[13px] min-h-[110px]"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              onBlur={() => notas !== (p.notas || "") && guardar({ notas }, "Notas guardadas")}
              placeholder="Lo que pidió, gustos, presupuesto, quién decide..."
            />
          </Campo>

          {/* Evento */}
          <div>
            <span className="etiqueta">Evento en el panel</span>
            {p.invitacion_id ? (
              <div className="flex flex-col gap-2 text-[13px]">
                <p className="text-ink">
                  {p.invitacion_nombre} ·{" "}
                  <a className="underline" href={sitioUrlInvitacion(p.invitacion_slug)} target="_blank" rel="noreferrer">
                    ver invitación
                  </a>
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="boton-secundario !text-xs"
                    onClick={async () => {
                      const url = await obtenerEnlaceDatos();
                      await navigator.clipboard.writeText(url);
                      toast("Enlace del formulario de datos copiado");
                    }}
                  >
                    Copiar formulario de datos
                  </button>
                  <button className="boton-texto !text-xs" onClick={onIrAProduccion}>
                    Ver en Producción →
                  </button>
                </div>
              </div>
            ) : convirtiendo ? (
              <ConvertirEnEvento
                prospecto={p}
                onHecho={() => {
                  setConvirtiendo(false);
                  cargar();
                  onCambio();
                }}
                onCancelar={() => setConvirtiendo(false)}
              />
            ) : (
              <button onClick={() => setConvirtiendo(true)} className="boton-secundario !text-xs">
                Firmó: convertir en evento
              </button>
            )}
          </div>
        </div>

        {/* Columna derecha: conversación, cotizaciones, historial */}
        <div className="p-5 flex flex-col gap-5 min-w-0">
          <div>
            <span className="etiqueta">Conversación por WhatsApp</span>
            {p.mensajes?.length ? (
              <div className="max-h-[340px] overflow-y-auto flex flex-col gap-1.5 bg-lienzo rounded-xl p-3">
                {p.mensajes.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] whitespace-pre-wrap break-words ${
                      m.direccion === "saliente" ? "self-end bg-[#e2f0dc]" : "self-start bg-white border border-borde"
                    }`}
                  >
                    {m.texto || <i className="text-ink-tenue">({m.tipo})</i>}
                    <span className="block text-[10px] text-ink-tenue mt-0.5 text-right">{haceCuanto(m.creado_en)}</span>
                  </div>
                ))}
                <div ref={finChat} />
              </div>
            ) : (
              <p className="text-[12px] text-ink-tenue">
                Aún no hay mensajes guardados. Lo que se hable por el WhatsApp de Sivú aparece aquí solo.
              </p>
            )}
          </div>

          <div>
            <span className="etiqueta">Cotizaciones</span>
            {p.cotizaciones?.length ? (
              <ul className="flex flex-col gap-2">
                {p.cotizaciones.map((c) => (
                  <li key={c.id} className="border border-borde rounded-lg px-3 py-2 text-[13px] flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink">{peso(c.total)}</span>
                    <span className={`insignia ${c.estado === "aceptada" ? "insignia-ok" : c.vistas ? "insignia-info" : "insignia-neutra"}`}>
                      {c.estado === "aceptada" ? "aceptada" : c.vistas ? `vista ${c.vistas}×` : "sin abrir"}
                    </span>
                    <span className="text-[11px] text-ink-tenue">{haceCuanto(c.creado_en)}</span>
                    <span className="flex-1" />
                    <button
                      className="boton-texto !text-[11px]"
                      onClick={async () => {
                        await navigator.clipboard.writeText(`${c.url || ""}`);
                        toast("Enlace copiado");
                      }}
                    >
                      Copiar enlace
                    </button>
                    <a className="boton-texto !text-[11px]" href={`${c.url}?vista=panel`} target="_blank" rel="noreferrer">
                      Ver
                    </a>
                    <button className="boton-texto !text-[11px]" onClick={() => setCotizando(c)}>
                      Editar
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-ink-tenue">Sin cotizaciones todavía.</p>
            )}
          </div>

          <div>
            <span className="etiqueta">Historial</span>
            <ul className="flex flex-col gap-1">
              {(p.historial || []).map((h, i) => (
                <li key={i} className="text-[12px] text-ink-suave">
                  <span className="text-ink-tenue">{haceCuanto(h.creado_en)} · </span>
                  {h.detalle}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-3 pt-2 border-t border-borde">
            <button onClick={() => borrar(true)} className="boton-texto !text-[11px]">
              No es cliente (no volver a capturarlo)
            </button>
            <button onClick={() => borrar(false)} className="boton-texto !text-[11px] !text-red-600">
              Borrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

