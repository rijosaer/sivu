import { useEffect, useMemo, useState } from "react";
import Icono from "../ui/Icono";
import { COLUMNAS, OPCIONES_INICIALES, USOS, construirDocumento, imprimirDocumento } from "./documento";

// Descargar la lista: se elige PARA QUÉ es (catering, entrada, organizadora,
// mesas, tarjetas, resumen) y queda armada; después se puede cambiar todo:
// quiénes salen, el orden, las columnas, el estilo, el tamaño de la letra y el
// papel. A la derecha se ve el documento mismo (el HTML que se imprime, no una
// imitación). Lo que se arma se puede guardar como formato para la próxima.
//
// Las preferencias se recuerdan en el navegador: esto se usa varias veces
// seguidas y volver a marcar las mismas casillas cansa.

const GUARDADO = "exportar-pdf-opciones";
const FORMATOS_GUARDADOS = "sivu-formatos-exportar";

function leer(clave, respaldo) {
  try {
    const x = JSON.parse(localStorage.getItem(clave) || "null");
    return x ?? respaldo;
  } catch {
    return respaldo;
  }
}
function escribir(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    /* sin almacenamiento: igual funciona mientras la ventana esté abierta */
  }
}

const QUIENES = [
  ["confirmado", "Los que van"],
  ["todos", "Todos"],
  ["pendiente", "Sin responder"],
  ["no_asistira", "Los que no van"],
];
const ORDENES = [
  ["apellido", "Por apellido A–Z"],
  ["nombre", "Por nombre A–Z"],
  ["invitacion", "Por invitación"],
  ["grupo", "Por grupo"],
  ["respuesta", "Por fecha de respuesta"],
];
const ESTILOS = [
  ["colores", "Con los colores de la invitación"],
  ["sobrio", "Sobrio"],
  ["ahorro", "Ahorra tinta"],
];
const LETRAS = [
  ["normal", "Letra normal"],
  ["grande", "Letra grande"],
  ["muy-grande", "Letra muy grande"],
];
const PAPELES = [
  ["letter", "Carta"],
  ["a4", "A4"],
  ["oficio", "Oficio"],
];

const apellido = (n) => {
  const p = String(n || "").trim().split(/\s+/);
  return (p.length > 1 ? p[p.length - 1] + " " + p.slice(0, -1).join(" ") : p[0] || "").toLowerCase();
};
const comparar = (a, b) => a.localeCompare(b, "es", { sensitivity: "base" });

function Chip({ activo, onClick, children, conCheck }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={activo} className={`chip-filtro !text-[13px] !py-1.5 ${activo ? "chip-filtro-activo" : ""}`}>
      {conCheck && activo && <Icono nombre="check" className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
}

function Interruptor({ activo, onCambio, children }) {
  return (
    <label className="inline-flex items-center gap-2 text-[13.5px] text-ink cursor-pointer">
      <input type="checkbox" className="sr-only peer" checked={activo} onChange={(e) => onCambio(e.target.checked)} />
      <span className={`relative w-9 h-5 rounded-full transition-colors ${activo ? "bg-emerald-600" : "bg-borde-fuerte"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${activo ? "left-[1.1rem]" : "left-0.5"}`} />
      </span>
      {children}
    </label>
  );
}

function Seccion({ titulo, children }) {
  return (
    <div>
      <p className="text-[11.5px] uppercase tracking-[.14em] font-semibold text-ink-tenue mb-2">{titulo}</p>
      {children}
    </div>
  );
}

export default function DialogoExportar({ datos, onCerrar }) {
  const [opciones, setOpciones] = useState(() => ({ ...OPCIONES_INICIALES, ...leer(GUARDADO, {}) }));
  const [guardados, setGuardados] = useState(() => leer(FORMATOS_GUARDADOS, []));
  const [zoom, setZoom] = useState(0.5);

  useEffect(() => escribir(GUARDADO, opciones), [opciones]);

  // Cerrar con Esc, como cualquier diálogo.
  useEffect(() => {
    const alTeclear = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  const cambiar = (campo, valor) => setOpciones((prev) => ({ ...prev, [campo]: valor, para: campo === "para" ? valor : "libre" }));
  const usar = (uso) => setOpciones((prev) => ({ ...prev, ...uso.opciones, para: uso.key }));
  const alternarColumna = (c) =>
    setOpciones((prev) => {
      const tiene = prev.columnas.includes(c);
      const orden = COLUMNAS.map(([k]) => k);
      const columnas = tiene ? prev.columnas.filter((x) => x !== c) : [...prev.columnas, c].sort((a, b) => orden.indexOf(a) - orden.indexOf(b));
      return { ...prev, columnas, para: "libre" };
    });

  const todas = datos.todas || datos.filas || [];
  const invitaciones = datos.invitaciones || [];
  const grupos = useMemo(() => [...new Set(todas.map((f) => (f.grupo || "").trim()).filter(Boolean))].sort(comparar), [todas]);

  // Quiénes salen y en qué orden.
  const filas = useMemo(() => {
    let f = todas.filter((x) => opciones.quienes === "todos" || x.estado === opciones.quienes);
    if (opciones.grupo) f = f.filter((x) => (x.grupo || "").trim() === opciones.grupo);
    const clave = {
      apellido: (x) => apellido(x.nombre),
      nombre: (x) => (x.nombre || "").toLowerCase(),
      invitacion: (x) => `${x.invitacion || ""} ${x.nombre || ""}`.toLowerCase(),
      grupo: (x) => `${x.grupo || "~"} ${apellido(x.nombre)}`.toLowerCase(),
    }[opciones.orden];
    if (opciones.orden === "respuesta") f = [...f].sort((a, b) => (Date.parse(b.respondidoEn || 0) || 0) - (Date.parse(a.respondidoEn || 0) || 0));
    else if (clave) f = [...f].sort((a, b) => comparar(clave(a), clave(b)));
    if (opciones.agrupar === "grupo" && opciones.orden !== "grupo") f = [...f].sort((a, b) => comparar(a.grupo || "~", b.grupo || "~"));
    return f;
  }, [todas, opciones.quienes, opciones.grupo, opciones.orden, opciones.agrupar]);

  // Las mismas personas agrupadas por invitación (para los formatos por
  // invitación y las tarjetas).
  const porInvitacion = useMemo(() => {
    const mapa = new Map();
    for (const f of filas) {
      if (!mapa.has(f.codigo)) {
        const inv = invitaciones.find((i) => i.codigo === f.codigo);
        const total = inv?.tipo === "cupos" ? inv.cupos || 0 : 0;
        const usados = (inv?.miembros || []).filter((m) => m.es_acompanante).length;
        mapa.set(f.codigo, { codigo: f.codigo, invitacion: f.invitacion, tipo: f.tipo, total: f.totalMiembros, grupo: f.grupo, telefono: f.telefono, cuposLibres: total - usados, personas: [] });
      }
      mapa.get(f.codigo).personas.push(f);
    }
    const lista = [...mapa.values()];
    if (opciones.orden === "grupo") return lista.sort((a, b) => comparar(`${a.grupo || "~"} ${a.invitacion}`, `${b.grupo || "~"} ${b.invitacion}`));
    if (opciones.orden !== "respuesta") return lista.sort((a, b) => comparar(a.invitacion || "", b.invitacion || ""));
    return lista;
  }, [filas, invitaciones, opciones.orden]);

  const etiquetaFiltro = [QUIENES.find(([k]) => k === opciones.quienes)?.[1].toLowerCase(), opciones.grupo].filter(Boolean).join(" · ");
  const html = useMemo(
    () => construirDocumento({ ...datos, filas, grupos: porInvitacion, opciones, etiquetaFiltro }),
    [datos, filas, porInvitacion, opciones, etiquetaFiltro]
  );

  const esResumen = opciones.formato === "resumen";
  const porPersona = opciones.formato === "lista";
  const uso = USOS.find((u) => u.key === opciones.para);
  const nombreArchivo = `${(datos.evento?.novioEl || "lista").toLowerCase().replace(/\s+/g, "-")}-${opciones.para || "lista"}`;

  function guardarFormato() {
    const nombre = window.prompt("Nombre para este formato (ej. «Catering de Maite»):", uso ? uso.label : "Mi formato");
    if (!nombre?.trim()) return;
    const lista = [{ nombre: nombre.trim(), opciones }, ...guardados.filter((g) => g.nombre !== nombre.trim())].slice(0, 8);
    setGuardados(lista);
    escribir(FORMATOS_GUARDADOS, lista);
  }

  function borrarFormato(nombre) {
    const lista = guardados.filter((g) => g.nombre !== nombre);
    setGuardados(lista);
    escribir(FORMATOS_GUARDADOS, lista);
  }

  // Excel: las mismas personas y columnas que se están viendo.
  function excel() {
    const cols = [["nombre", "Nombre"], ...COLUMNAS.filter(([k]) => opciones.columnas.includes(k) && k !== "casilla")];
    const valor = (f, k) =>
      ({ nombre: f.nombre, estado: { confirmado: "Asiste", no_asistira: "No asiste", pendiente: "Sin responder" }[f.estado] || f.estado, invitacion: f.invitacion, grupo: f.grupo, telefono: f.telefono, restriccion: f.restriccion, observaciones: f.comentario, codigo: f.codigo })[k] ?? "";
    const escapar = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const texto = ["sep=;", cols.map(([, t]) => escapar(t)).join(";"), ...filas.map((f) => cols.map(([k]) => escapar(valor(f, k))).join(";"))].join("\r\n");
    const blob = new Blob(["﻿" + texto], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${nombreArchivo}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // WhatsApp no deja adjuntar un PDF desde un enlace: se manda la lista como
  // texto, que para el catering o la organizadora suele bastar.
  function whatsapp() {
    const lineas = filas.map((f, i) => {
      const extra = [opciones.columnas.includes("restriccion") && f.restriccion, opciones.columnas.includes("observaciones") && f.comentario].filter(Boolean).join(" · ");
      return `${i + 1}. ${f.nombre}${extra ? ` — ${extra}` : ""}`;
    });
    const titulo = `*${uso?.label || "Lista"}${datos.evento?.novioEl ? ` · ${[datos.evento.novioEl, datos.evento.novioElla].filter(Boolean).join(" & ")}` : ""}*`;
    const texto = [titulo, `${filas.length} ${filas.length === 1 ? "persona" : "personas"}`, "", ...lineas, ...(opciones.notas?.trim() ? ["", opciones.notas.trim()] : [])].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener");
  }

  const anchoHoja = opciones.orientacion === "landscape" ? 1056 : 816;
  const altoHoja = opciones.orientacion === "landscape" ? 816 : opciones.tamano === "oficio" ? 1248 : 1056;

  return (
    <div className="fixed inset-0 z-50 bg-ink/50 flex items-stretch sm:items-center justify-center p-0 sm:p-5" onClick={onCerrar}>
      <div className="bg-paper w-full max-w-[86rem] sm:rounded-3xl shadow-flotante flex flex-col max-h-full sm:max-h-[94vh] overflow-hidden" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Descargar la lista">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-borde">
          <div className="flex-1">
            <h3 className="font-display text-[1.4rem] text-ink leading-tight">Descargar la lista</h3>
            <p className="text-[13.5px] text-ink-suave">Elige para qué la necesitas y ajusta lo que quieras. A la derecha ves cómo queda.</p>
          </div>
          <button onClick={onCerrar} className="grid place-items-center w-9 h-9 rounded-full hover:bg-lienzo text-ink-suave" aria-label="Cerrar">
            <Icono nombre="cerrar" className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden grid lg:grid-cols-[17.5rem_minmax(0,1fr)_minmax(0,26rem)]">
          {/* Para qué */}
          <div className="bg-lienzo border-b lg:border-b-0 lg:border-r border-borde p-4 lg:overflow-y-auto">
            <p className="text-[11.5px] uppercase tracking-[.14em] font-semibold text-ink-tenue mb-2 px-1">¿Para qué la necesitas?</p>
            <div className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1">
              {USOS.map((u) => {
                const sel = opciones.para === u.key;
                return (
                  <button key={u.key} onClick={() => usar(u)} className={`shrink-0 w-56 lg:w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left border transition-colors ${sel ? "bg-paper border-marca border-[1.5px]" : "border-transparent hover:bg-paper/70"}`}>
                    <Icono nombre={u.icono} className={`w-5 h-5 shrink-0 ${sel ? "text-marca" : "text-ink-suave"}`} />
                    <span className="min-w-0">
                      <span className={`block text-[14px] ${sel ? "font-semibold" : "font-medium"} text-ink`}>{u.label}</span>
                      <span className="block text-[12.5px] text-ink-suave leading-snug">{u.para}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {guardados.length > 0 && (
              <>
                <p className="text-[11.5px] uppercase tracking-[.14em] font-semibold text-ink-tenue mt-5 mb-1.5 px-1">Tus formatos guardados</p>
                {guardados.map((g) => (
                  <div key={g.nombre} className="flex items-center group">
                    <button onClick={() => setOpciones({ ...OPCIONES_INICIALES, ...g.opciones, para: "libre" })} className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-left text-[14px] text-ink hover:bg-paper/70">
                      <span className="text-oro">★</span>
                      {g.nombre}
                    </button>
                    <button onClick={() => borrarFormato(g.nombre)} className="opacity-0 group-hover:opacity-100 px-2 text-ink-tenue hover:text-marca" aria-label={`Borrar ${g.nombre}`}>
                      <Icono nombre="cerrar" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Ajustes */}
          <div className="p-5 sm:p-6 flex flex-col gap-5 lg:overflow-y-auto">
            {!esResumen && (
              <>
                <Seccion titulo="Quiénes salen">
                  <div className="flex flex-wrap gap-2">
                    {QUIENES.map(([k, t]) => (
                      <Chip key={k} activo={opciones.quienes === k} onClick={() => cambiar("quienes", k)}>
                        {t} · {k === "todos" ? todas.length : todas.filter((f) => f.estado === k).length}
                      </Chip>
                    ))}
                    {grupos.length > 0 && (
                      <select className="campo !w-auto !py-1.5 !text-[13px] !rounded-full" value={opciones.grupo} onChange={(e) => cambiar("grupo", e.target.value)} aria-label="Grupo">
                        <option value="">Todos los grupos</option>
                        {grupos.map((g) => (
                          <option key={g} value={g}>
                            Solo {g}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </Seccion>
                <Seccion titulo="Forma">
                  <div className="flex flex-wrap gap-2">
                    {[["lista", "Una línea por persona"], ["invitaciones", "Agrupada por invitación"], ["tarjetas", "Tarjetas de recepción"]].map(([k, t]) => (
                      <Chip key={k} activo={opciones.formato === k} onClick={() => cambiar("formato", k)}>
                        {t}
                      </Chip>
                    ))}
                  </div>
                </Seccion>
                <Seccion titulo="Orden y grupos">
                  <div className="flex flex-wrap gap-2">
                    {ORDENES.map(([k, t]) => (
                      <Chip key={k} activo={opciones.orden === k} onClick={() => cambiar("orden", k)}>
                        {t}
                      </Chip>
                    ))}
                  </div>
                  {porPersona && grupos.length > 0 && (
                    <div className="mt-2.5">
                      <Interruptor activo={opciones.agrupar === "grupo"} onCambio={(v) => cambiar("agrupar", v ? "grupo" : "")}>
                        Separar por grupo (sirve para armar las mesas)
                      </Interruptor>
                    </div>
                  )}
                </Seccion>
                <Seccion titulo="Columnas · toca para poner o quitar">
                  <div className="flex flex-wrap gap-2">
                    <Chip activo conCheck onClick={() => {}}>
                      Nombre
                    </Chip>
                    {COLUMNAS.filter(([k]) => porPersona || !["casilla", "estado", "invitacion"].includes(k)).map(([k, t]) => (
                      <Chip key={k} conCheck activo={opciones.columnas.includes(k)} onClick={() => alternarColumna(k)}>
                        {t}
                      </Chip>
                    ))}
                  </div>
                </Seccion>
              </>
            )}
            <Seccion titulo="Cómo se ve">
              <div className="grid grid-cols-3 gap-2.5 mb-3">
                {ESTILOS.map(([k, t]) => {
                  const muestra = { colores: ["#1B2A4A", "#E9C77B"], sobrio: ["#1C1712", "#FFFFFF"], ahorro: ["#FFFFFF", "#9A8C7C"] }[k];
                  const sel = opciones.estilo === k;
                  return (
                    <button key={k} onClick={() => cambiar("estilo", k)} className={`p-2 rounded-xl border text-left ${sel ? "border-marca border-[1.5px]" : "border-borde-fuerte"}`}>
                      <span className="flex h-6 rounded-md overflow-hidden border border-borde mb-1.5">
                        {muestra.map((c) => (
                          <span key={c} className="flex-1" style={{ background: c }} />
                        ))}
                      </span>
                      <span className={`text-[12.5px] leading-tight ${sel ? "font-semibold text-ink" : "text-ink-suave"}`}>{t}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {LETRAS.map(([k, t]) => (
                  <Chip key={k} activo={opciones.letra === k} onClick={() => cambiar("letra", k)}>
                    {t}
                  </Chip>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2.5">
                <Interruptor activo={opciones.portada} onCambio={(v) => cambiar("portada", v)}>
                  Portada con sus nombres
                </Interruptor>
                {!esResumen && (
                  <>
                    {porPersona && (
                      <Interruptor activo={opciones.numerar} onCambio={(v) => cambiar("numerar", v)}>
                        Numerar filas
                      </Interruptor>
                    )}
                    <Interruptor activo={opciones.totales} onCambio={(v) => cambiar("totales", v)}>
                      Totales arriba
                    </Interruptor>
                  </>
                )}
                <Interruptor activo={opciones.fechaCorte} onCambio={(v) => cambiar("fechaCorte", v)}>
                  Fecha de corte en el pie
                </Interruptor>
              </div>
            </Seccion>
            <Seccion titulo="Papel">
              <div className="flex flex-wrap gap-2">
                {PAPELES.map(([k, t]) => (
                  <Chip key={k} activo={opciones.tamano === k} onClick={() => cambiar("tamano", k)}>
                    {t}
                  </Chip>
                ))}
                <span className="w-px bg-borde mx-1" />
                {[["portrait", "Vertical"], ["landscape", "Horizontal"]].map(([k, t]) => (
                  <Chip key={k} activo={opciones.orientacion === k} onClick={() => cambiar("orientacion", k)}>
                    {t}
                  </Chip>
                ))}
              </div>
            </Seccion>
            <Seccion titulo="Nota para quien la reciba">
              <textarea value={opciones.notas} onChange={(e) => cambiar("notas", e.target.value)} rows={2} placeholder="Ej. Confirmados hasta el 1 de diciembre. Mesa de los novios para 8." className="campo resize-y" />
            </Seccion>
          </div>

          {/* Vista previa: el documento mismo */}
          <div className="bg-[#EDE5D8] p-4 flex flex-col items-center gap-3 lg:overflow-y-auto">
            <div className="flex items-center gap-3 text-[13px] text-ink-suave">
              <span>
                {esResumen ? "Resumen" : `${filas.length} ${filas.length === 1 ? "persona" : "personas"}`}
              </span>
              <span className="w-px h-4 bg-borde-fuerte" />
              <button onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(2)))} className="w-7 h-7 rounded-full hover:bg-paper" aria-label="Alejar">
                −
              </button>
              <span className="tabular-nums w-10 text-center">{Math.round(zoom * 100)} %</span>
              <button onClick={() => setZoom((z) => Math.min(1, +(z + 0.1).toFixed(2)))} className="w-7 h-7 rounded-full hover:bg-paper" aria-label="Acercar">
                +
              </button>
            </div>
            <div style={{ width: anchoHoja * zoom, height: altoHoja * zoom }} className="shrink-0 overflow-hidden rounded shadow-tarjeta bg-white">
              <iframe title="Vista previa" srcDoc={html} style={{ width: anchoHoja + 40, height: altoHoja + 40, transform: `scale(${zoom})`, transformOrigin: "0 0", border: 0, marginLeft: -18 * zoom, marginTop: -18 * zoom }} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-6 py-3.5 border-t border-borde">
          <button onClick={guardarFormato} className="flex items-center gap-1.5 text-[14px] font-medium text-marca hover:text-marca-dark mr-auto">
            <span className="text-oro">★</span>
            Guardar como formato
          </button>
          {!esResumen && (
            <button onClick={excel} className="boton-secundario !text-[13.5px] !py-2.5">
              Excel
            </button>
          )}
          <button onClick={() => imprimirDocumento(html)} className="boton-secundario !text-[13.5px] !py-2.5">
            Imprimir
          </button>
          {!esResumen && (
            <button onClick={whatsapp} className="boton-secundario !text-[13.5px] !py-2.5">
              <Icono nombre="chat" className="w-4 h-4" />
              Enviar por WhatsApp
            </button>
          )}
          <button onClick={() => imprimirDocumento(html)} className="boton-primario !text-[13.5px] !py-2.5" title="Se abre la ventana de impresión: elige «Guardar como PDF»">
            <Icono nombre="descargar" className="w-4 h-4" />
            Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
