import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import { ir } from "../ruta";
import { useToast } from "../ui/Toast";
import Icono from "../ui/Icono";
import { CUANDO, ESTADOS, EVENTOS, peso, rellenar, valoresDe } from "./comun";

// La bandeja del WhatsApp de Sivú dentro del panel, como WhatsApp Web: a la
// izquierda los chats de clientes potenciales e invitados, en el centro la
// conversación (con fotos, audios, videos y documentos) y a la derecha lo que
// se sabe de esa persona. Se responde por el mismo número vinculado.
// Dirección: /mensajes y /mensajes/573001234567.

const hora = (iso) => new Date(iso).toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit" });

function cuandoCorto(iso) {
  const d = new Date(iso);
  const hoy = new Date();
  const ayer = new Date(Date.now() - 864e5);
  if (d.toDateString() === hoy.toDateString()) return hora(iso);
  if (d.toDateString() === ayer.toDateString()) return "ayer";
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

function diaLargo(iso) {
  const d = new Date(iso);
  const hoy = new Date();
  if (d.toDateString() === hoy.toDateString()) return "Hoy";
  if (d.toDateString() === new Date(Date.now() - 864e5).toDateString()) return "Ayer";
  return d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
}

const ICONO_TIPO = { imagen: "📷 Foto", video: "🎥 Video", audio: "🎤 Audio", documento: "📄 Documento", sticker: "Sticker" };
const vistaPrevia = (c) => (c.tipo !== "texto" && !c.texto ? ICONO_TIPO[c.tipo] || "Mensaje" : `${c.tipo !== "texto" ? `${ICONO_TIPO[c.tipo]?.split(" ")[0] || ""} ` : ""}${c.texto}`);

const nombreChat = (c) => c.prospecto || c.invitado || c.nombre_contacto || `+${c.telefono}`;

function Avatar({ nombre, tipo }) {
  const letra = (nombre || "?").replace(/^\+/, "").trim().charAt(0).toUpperCase();
  return (
    <span
      className={`w-10 h-10 shrink-0 rounded-full grid place-items-center text-sm font-semibold ${
        tipo === "invitado" ? "bg-oro-suave text-oro-oscuro" : "bg-marca-suave text-marca-dark"
      }`}
    >
      {letra}
    </span>
  );
}

// ---------- Archivos ----------

const blobs = new Map(); // id → url, para no bajar dos veces lo mismo

function useArchivo(id, activo) {
  const [url, setUrl] = useState(blobs.get(id) || null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!activo || url) return;
    let vivo = true;
    api
      .crm.chatMedia(id)
      .then((u) => {
        blobs.set(id, u);
        if (vivo) setUrl(u);
      })
      .catch((e) => vivo && setError(e.message));
    return () => {
      vivo = false;
    };
  }, [id, activo]);
  return { url, error };
}

function Archivo({ m, onVer }) {
  const { url, error } = useArchivo(m.id, m.tiene_archivo);
  if (!m.tiene_archivo) {
    return (
      <p className="text-[12px] text-ink-tenue italic">
        {ICONO_TIPO[m.tipo] || "Archivo"} · {m.error_archivo || "guardándose…"}
      </p>
    );
  }
  if (error) return <p className="text-[12px] text-red-600">{error}</p>;
  if (!url) return <div className="w-56 h-32 rounded-lg bg-lienzo animate-pulse" />;
  if (m.tipo === "imagen" || m.tipo === "sticker") {
    return (
      <button onClick={() => onVer(url)} className="block !rounded-lg overflow-hidden">
        <img src={url} alt="Foto" className={`${m.tipo === "sticker" ? "w-28" : "max-w-[16rem] max-h-80"} object-cover rounded-lg`} />
      </button>
    );
  }
  if (m.tipo === "audio") return <audio controls src={url} className="w-64 max-w-full h-10" />;
  if (m.tipo === "video") return <video controls src={url} className="max-w-[16rem] max-h-80 rounded-lg" />;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg bg-black/[.04] px-3 py-2 text-[13px] text-ink hover:bg-black/[.07]">
      <span className="text-lg">📄</span>
      <span className="truncate max-w-[12rem]">{m.archivo || m.texto || "Documento"}</span>
      <span className="text-[11px] text-ink-tenue shrink-0">{m.bytes ? `${Math.max(1, Math.round(m.bytes / 1024))} KB` : ""}</span>
    </a>
  );
}

// ---------- Lista de chats ----------

const FILTROS = [
  ["todos", "Todos"],
  ["clientes", "Clientes"],
  ["invitados", "Invitados"],
  ["sinleer", "Sin leer"],
];

function ListaChats({ chats, abierto, onAbrir }) {
  const [filtro, setFiltro] = useState("todos");
  const [evento, setEvento] = useState("");
  const [q, setQ] = useState("");

  const eventos = useMemo(
    () => [...new Map((chats || []).filter((c) => c.invitacion_id).map((c) => [String(c.invitacion_id), c.evento])).entries()],
    [chats]
  );
  const visibles = (chats || []).filter((c) => {
    if (filtro === "clientes" && !c.prospecto_id) return false;
    if (filtro === "invitados" && !c.invitado_id) return false;
    if (filtro === "invitados" && evento && String(c.invitacion_id) !== evento) return false;
    if (filtro === "sinleer" && !c.sin_leer) return false;
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      if (!`${nombreChat(c)} ${c.telefono} ${c.evento || ""}`.toLowerCase().includes(t)) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col min-h-0 h-full border-r border-borde bg-paper">
      <div className="p-3 border-b border-borde flex flex-col gap-2">
        <label className="relative block">
          <Icono nombre="buscar" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-tenue" />
          <input id="bandeja-buscar" className="campo !pl-9 !py-2 !rounded-full" placeholder="Buscar chat" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTROS.map(([k, t]) => (
            <button key={k} onClick={() => setFiltro(k)} className={`chip-filtro shrink-0 !py-1 ${filtro === k ? "chip-filtro-activo" : ""}`}>
              {t}
            </button>
          ))}
        </div>
        {filtro === "invitados" && eventos.length > 1 && (
          <select className="campo-sm" value={evento} onChange={(e) => setEvento(e.target.value)}>
            <option value="">Todos los eventos</option>
            {eventos.map(([id, n]) => (
              <option key={id} value={id}>
                {n}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {!chats ? (
          <p className="p-4 text-sm text-ink-tenue">Cargando chats…</p>
        ) : !visibles.length ? (
          <p className="p-6 text-sm text-ink-tenue text-center">{chats.length ? "Nada con ese filtro." : "Todavía no hay conversaciones guardadas."}</p>
        ) : (
          visibles.map((c) => (
            <button
              key={c.telefono}
              onClick={() => onAbrir(c.telefono)}
              className={`w-full text-left flex gap-3 px-3 py-3 !rounded-none border-b border-borde/70 transition-colors ${
                abierto === c.telefono ? "bg-marca-suave/70" : "hover:bg-lienzo"
              }`}
            >
              <Avatar nombre={nombreChat(c)} tipo={c.invitado_id && !c.prospecto_id ? "invitado" : "cliente"} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-2">
                  <span className={`truncate text-sm ${c.sin_leer ? "font-semibold text-ink" : "text-ink"}`}>{nombreChat(c)}</span>
                  <span className={`ml-auto shrink-0 text-[11px] ${c.sin_leer ? "text-emerald-700 font-medium" : "text-ink-tenue"}`}>
                    {cuandoCorto(c.creado_en)}
                  </span>
                </span>
                <span className="flex items-center gap-2 mt-0.5">
                  <span className={`truncate text-[12.5px] ${c.sin_leer ? "text-ink" : "text-ink-suave"}`}>
                    {c.direccion === "saliente" ? "Tú: " : ""}
                    {vistaPrevia(c)}
                  </span>
                  {c.sin_leer > 0 && (
                    <span className="ml-auto shrink-0 min-w-[1.25rem] text-center text-[10px] font-semibold bg-emerald-600 text-white rounded-full px-1.5 py-0.5">
                      {c.sin_leer}
                    </span>
                  )}
                </span>
                <span className="block mt-1 text-[10.5px] uppercase tracking-[.08em] text-ink-tenue truncate">
                  {c.prospecto_id ? `Cliente · ${ESTADOS[c.estado]?.nombre || c.estado}` : `Invitado · ${c.evento || ""}`}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ---------- Conversación ----------

function Conversacion({ telefono, chat, ajustes, onVolver, onCambio, onContexto }) {
  const toast = useToast();
  const [datos, setDatos] = useState(null);
  const [texto, setTexto] = useState("");
  const [archivo, setArchivo] = useState(null); // { dataUrl, nombre, mime, tamano }
  const [enviando, setEnviando] = useState(false);
  const [foto, setFoto] = useState(null);
  const fondo = useRef(null);
  const ultimoId = useRef(0);

  async function cargar(marcar = false) {
    try {
      const d = await api.crm.chat(telefono);
      setDatos(d);
      onContexto?.(d);
      const ult = d.mensajes[d.mensajes.length - 1]?.id || 0;
      const hayNuevos = ult !== ultimoId.current;
      ultimoId.current = ult;
      if ((marcar || hayNuevos) && d.mensajes.some((m) => m.direccion === "entrante" && !m.leido)) {
        await api.crm.chatLeido(telefono);
        onCambio();
      }
      if (hayNuevos) requestAnimationFrame(() => fondo.current?.scrollIntoView({ block: "end" }));
    } catch (e) {
      toast(e.message, "error");
    }
  }

  useEffect(() => {
    setDatos(null);
    ultimoId.current = 0;
    setTexto("");
    setArchivo(null);
    cargar(true);
    const t = setInterval(() => cargar(), 5000);
    return () => clearInterval(t);
  }, [telefono]);

  async function enviar(e) {
    e?.preventDefault();
    if (enviando || (!texto.trim() && !archivo)) return;
    setEnviando(true);
    try {
      if (archivo) await api.crm.chatArchivo(telefono, { archivo: archivo.dataUrl, nombre: archivo.nombre, texto: texto.trim() });
      else await api.crm.chatEnviar(telefono, texto.trim());
      setTexto("");
      setArchivo(null);
      await cargar();
      onCambio();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setEnviando(false);
    }
  }

  function elegirArchivo(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 12 * 1024 * 1024) return toast("El archivo pesa más de 12 MB", "error");
    const lector = new FileReader();
    lector.onload = () => setArchivo({ dataUrl: lector.result, nombre: f.name, mime: f.type, tamano: f.size });
    lector.readAsDataURL(f);
  }

  const p = datos?.prospecto;
  const respuestas = p ? ajustes?.respuestas || [] : [];
  const nombre = p?.nombre || datos?.invitado?.nombre || (chat && nombreChat(chat)) || `+${telefono}`;

  // Separadores por día.
  const filas = [];
  let dia = "";
  for (const m of datos?.mensajes || []) {
    const d = new Date(m.creado_en).toDateString();
    if (d !== dia) {
      dia = d;
      filas.push({ separador: diaLargo(m.creado_en), id: `d${m.id}` });
    }
    filas.push(m);
  }

  return (
    <div className="flex flex-col min-h-0 h-full">
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-borde bg-paper">
        <button onClick={onVolver} className="lg:hidden boton-texto !no-underline" aria-label="Volver a los chats">
          <Icono nombre="volver" className="w-5 h-5" />
        </button>
        <Avatar nombre={nombre} tipo={datos?.invitado && !p ? "invitado" : "cliente"} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink truncate">{nombre}</p>
          <p className="text-[11px] text-ink-tenue truncate">
            +{telefono}
            {p ? ` · cliente potencial` : datos?.invitado ? ` · invitado de ${datos.invitado.evento}` : ""}
          </p>
        </div>
        {p && (
          <button onClick={() => ir(`/clientes/${p.id}`)} className="boton-secundario !py-1.5 hidden sm:inline-flex">
            Ficha
          </button>
        )}
        {datos?.invitado && (
          <button onClick={() => ir(`/evento/${datos.invitado.invitacion_id}/invitados`)} className="boton-secundario !py-1.5 hidden sm:inline-flex">
            Evento
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 bandeja-fondo">
        {!datos ? (
          <p className="text-sm text-ink-tenue text-center mt-10">Cargando conversación…</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filas.map((m) =>
              m.separador ? (
                <p key={m.id} className="self-center my-2 text-[11px] uppercase tracking-[.1em] text-ink-suave bg-paper/90 border border-borde rounded-full px-3 py-1">
                  {m.separador}
                </p>
              ) : (
                <div key={m.id} className={`flex ${m.direccion === "saliente" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2 shadow-tarjeta border ${
                      m.direccion === "saliente" ? "bg-[#F6E3D7] border-[#EDD3C2] rounded-br-md" : "bg-paper border-borde rounded-bl-md"
                    }`}
                  >
                    {m.tipo !== "texto" && m.tipo !== "otro" && (
                      <div className="mb-1">
                        <Archivo m={m} onVer={setFoto} />
                      </div>
                    )}
                    {m.texto && !(m.tipo === "documento" && m.texto === m.archivo) && (
                      <p className="text-[14px] text-ink whitespace-pre-wrap break-words">{m.texto}</p>
                    )}
                    <p className="text-[10.5px] text-ink-tenue text-right mt-0.5">
                      {m.tipo === "audio" && m.segundos ? `${Math.floor(m.segundos / 60)}:${String(m.segundos % 60).padStart(2, "0")} · ` : ""}
                      {hora(m.creado_en)}
                    </p>
                  </div>
                </div>
              )
            )}
            <div ref={fondo} />
          </div>
        )}
      </div>

      <form onSubmit={enviar} className="border-t border-borde bg-paper px-3 py-2.5 flex flex-col gap-2">
        {datos && !datos.whatsapp && (
          <p className="text-[12px] text-amber-700">El WhatsApp de Sivú no está vinculado: puedes leer, pero no enviar.</p>
        )}
        {respuestas.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto">
            {respuestas.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setTexto(rellenar(r.texto, valoresDe(p, { pagos: ajustes?.pagos })))}
                className="chip-filtro shrink-0 !py-1 !text-[11.5px]"
              >
                {r.titulo}
              </button>
            ))}
          </div>
        )}
        {archivo && (
          <div className="flex items-center gap-3 rounded-xl border border-borde bg-lienzo px-3 py-2">
            {archivo.mime.startsWith("image/") ? (
              <img src={archivo.dataUrl} alt="" className="w-12 h-12 object-cover rounded-lg" />
            ) : (
              <span className="text-2xl">{archivo.mime.startsWith("audio/") ? "🎤" : archivo.mime.startsWith("video/") ? "🎥" : "📄"}</span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] text-ink truncate">{archivo.nombre}</span>
              <span className="block text-[11px] text-ink-tenue">{Math.max(1, Math.round(archivo.tamano / 1024))} KB · lo que escribas va como descripción</span>
            </span>
            <button type="button" onClick={() => setArchivo(null)} className="boton-texto">
              quitar
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <label className="boton-secundario !p-2.5 cursor-pointer shrink-0" title="Adjuntar foto, video, audio o documento">
            <Icono nombre="mas" className="w-4 h-4" />
            <input type="file" className="hidden" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" onChange={elegirArchivo} />
          </label>
          <textarea
            id="bandeja-texto"
            rows={1}
            className="campo !rounded-2xl resize-none max-h-40 min-h-[2.6rem]"
            placeholder={archivo ? "Descripción (opcional)" : "Escribe un mensaje"}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) enviar(e);
            }}
          />
          <button disabled={enviando || (!texto.trim() && !archivo) || (datos && !datos.whatsapp)} className="boton-primario !p-3 shrink-0" title="Enviar">
            {enviando ? "…" : "➤"}
          </button>
        </div>
      </form>

      {foto && (
        <button onClick={() => setFoto(null)} className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-6 !rounded-none" aria-label="Cerrar foto">
          <img src={foto} alt="Foto" className="max-w-full max-h-full rounded-lg" />
        </button>
      )}
    </div>
  );
}

// ---------- Contexto ----------

function Contexto({ datos }) {
  if (!datos) return null;
  const p = datos.prospecto;
  const v = datos.invitado;
  return (
    <div className="h-full overflow-y-auto bg-paper border-l border-borde p-4 flex flex-col gap-4">
      {p && (
        <section className="flex flex-col gap-2">
          <p className="etiqueta !mb-0">Cliente potencial</p>
          <p className="font-display text-lg leading-tight text-ink">{p.nombre || `+${p.telefono}`}</p>
          <span className={`insignia self-start ${ESTADOS[p.estado]?.clase || "insignia-neutra"}`}>{ESTADOS[p.estado]?.nombre || p.estado}</span>
          <dl className="text-[12.5px] text-ink-suave flex flex-col gap-1 mt-1">
            {p.evento && <div>{EVENTOS[p.evento] || p.evento}{p.cuando ? ` · ${CUANDO[p.cuando] || p.cuando}` : ""}</div>}
            {p.ciudad && <div>{p.ciudad}</div>}
            {p.valor_cotizado && <div>Cotizado: <b className="text-ink">{peso(p.valor_cotizado)}</b></div>}
            {p.notas && <div className="whitespace-pre-wrap text-ink-tenue">{p.notas}</div>}
          </dl>
          <button onClick={() => ir(`/clientes/${p.id}`)} className="boton-primario self-start mt-1">
            Abrir ficha
          </button>
        </section>
      )}
      {v && (
        <section className="flex flex-col gap-2">
          <p className="etiqueta !mb-0">Invitado</p>
          <p className="font-display text-lg leading-tight text-ink">{v.nombre}</p>
          <p className="text-[12.5px] text-ink-suave">{v.evento}</p>
          <div className="flex flex-wrap gap-1.5">
            {v.confirmados > 0 && <span className="insignia insignia-ok">{v.confirmados} asiste{v.confirmados === 1 ? "" : "n"}</span>}
            {v.no_asisten > 0 && <span className="insignia insignia-no">{v.no_asisten} no asiste{v.no_asisten === 1 ? "" : "n"}</span>}
            {v.pendientes > 0 && <span className="insignia insignia-aviso">{v.pendientes} sin responder</span>}
          </div>
          <p className="text-[12px] text-ink-tenue">{v.enviado_en ? "Ya recibió su invitación." : "Aún no se le ha enviado la invitación."}</p>
          <button onClick={() => ir(`/evento/${v.invitacion_id}/invitados`)} className="boton-secundario self-start mt-1">
            Abrir evento
          </button>
        </section>
      )}
    </div>
  );
}

// ---------- Pantalla ----------

export default function Bandeja({ sub }) {
  const [chats, setChats] = useState(null);
  const [ajustes, setAjustes] = useState(null);
  const [contexto, setContexto] = useState(null);
  const abierto = /^\d{6,}$/.test(String(sub || "")) ? String(sub) : null;

  const cargar = () => api.crm.chats().then(setChats).catch(() => setChats((c) => c || []));
  useEffect(() => {
    cargar();
    api.crm.ajustes().then((r) => setAjustes(r.ajustes)).catch(() => {});
    const t = setInterval(cargar, 10000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => setContexto(null), [abierto]);

  const chat = chats?.find((c) => c.telefono === abierto);

  return (
    <div className="-mx-5 -my-8 sm:-mx-10 sm:-my-10 lg:mx-0 lg:my-0">
      <div
        className="bandeja grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[21rem_minmax(0,1fr)] xl:grid-cols-[21rem_minmax(0,1fr)_17rem] lg:border lg:border-borde lg:rounded-2xl overflow-hidden lg:shadow-tarjeta"
      >
        <div className={`${abierto ? "hidden lg:block" : "block"} min-h-0 h-full`}>
          <ListaChats chats={chats} abierto={abierto} onAbrir={(t) => ir(`/mensajes/${t}`)} />
        </div>
        <div className={`${abierto ? "flex" : "hidden lg:flex"} min-w-0 min-h-0 h-full bg-lienzo [&>*]:flex-1 [&>*]:min-w-0`}>
          {abierto ? (
            <Conversacion
              key={abierto}
              telefono={abierto}
              chat={chat}
              ajustes={ajustes}
              onVolver={() => ir("/mensajes")}
              onCambio={cargar}
              onContexto={setContexto}
            />
          ) : (
            <div className="m-auto text-center px-8">
              <p className="marca-firma !text-marca-dark !text-5xl">Sivú</p>
              <p className="text-sm text-ink-suave mt-3 max-w-xs">
                Elige un chat para leerlo y responder. Lo que mandes sale por el WhatsApp vinculado de Sivú.
              </p>
            </div>
          )}
        </div>
        <div className="hidden xl:block min-h-0 h-full">
          {abierto ? <Contexto datos={contexto} /> : <div className="h-full bg-paper border-l border-borde" />}
        </div>
      </div>
    </div>
  );
}
