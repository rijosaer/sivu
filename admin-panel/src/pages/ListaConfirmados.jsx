import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { paraBuscar } from "./Invitados";
import DialogoExportar from "../exportar/DialogoExportar";
import { contextoDe, esUnaSolaPersona } from "../relaciones";

const ESTADOS = {
  confirmado: { etiqueta: "Asiste", clase: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  no_asistira: { etiqueta: "No asiste", clase: "bg-red-50 text-red-700 border-red-200" },
  pendiente: { etiqueta: "Sin responder", clase: "bg-lienzo text-ink/50 border-borde" },
};

const TIPOS = {
  individual: "Individual",
  pareja: "Pareja",
  familia: "Familia",
  cupos: "Titular + cupos",
};

const FILTROS = [
  { key: "confirmado", label: "Asisten" },
  { key: "no_asistira", label: "No asisten" },
  { key: "pendiente", label: "Sin responder" },
  { key: "todos", label: "Todos" },
];

// Una fila por persona. Se ordena poniendo primero a quienes respondieron más
// recientemente (para ver quién acaba de confirmar); las que aún no responden
// van después, por orden alfabético.
function aplanar(invitaciones) {
  const filas = [];
  for (const inv of invitaciones) {
    for (const m of inv.miembros || []) {
      filas.push({
        id: m.id,
        nombre: m.nombre,
        estado: m.estado,
        invitacion: inv.familia || inv.nombre,
        tipo: TIPOS[inv.tipo] || inv.tipo,
        codigo: inv.codigo,
        restriccion: m.restriccion || "",
        comentario: m.comentario || "",
        respondidoEn: m.respondido_en || null,
        // Cuántas personas tiene la invitación completa. Al agrupar, la lista
        // ya viene filtrada por estado, así que sin este dato no hay forma de
        // distinguir una individual de una pareja a la que el filtro le dejó
        // un solo miembro.
        totalMiembros: (inv.miembros || []).length,
      });
    }
  }
  return filas.sort(porReciente);
}

// Más reciente primero; sin responder al final (alfabético entre ellas).
function porReciente(a, b) {
  const ta = a.respondidoEn ? Date.parse(a.respondidoEn) : 0;
  const tb = b.respondidoEn ? Date.parse(b.respondidoEn) : 0;
  if (ta !== tb) return tb - ta;
  return (a.nombre || "").localeCompare(b.nombre || "", "es");
}

function descargar(nombre, contenido, mime) {
  const blob = new Blob([contenido], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

function hoyBogota() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function ListaConfirmados() {
  const [filas, setFilas] = useState(null);
  const [filtro, setFiltro] = useState("confirmado");
  const [busqueda, setBusqueda] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [menuExportacion, setMenuExportacion] = useState(false);
  // "invitacion": agrupa las personas bajo su invitación (útil cuando un
  // miembro se llama "Esposo" y solo se entiende junto a su familia).
  // "persona": una fila por persona, plano.
  const [vista, setVista] = useState("invitacion");
  // Si en la invitación no se le pregunta al invitado por la restricción
  // alimentaria o por observaciones, esas columnas no tienen nada que decir:
  // salían siempre vacías y solo estorbaban en la hoja de cálculo.
  const [preguntas, setPreguntas] = useState({ restriccion: true, observaciones: true });
  // Para el PDF: las invitaciones sin aplanar (cupos, tipo), los datos de la
  // boda que van en la portada y los colores de la invitación.
  const [invitaciones, setInvitaciones] = useState([]);
  const [evento, setEvento] = useState({});
  const [tema, setTema] = useState({});
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    let vivo = true;
    const cargar = () => {
      api.invitados().then((invs) => {
        if (!vivo) return;
        setInvitaciones(invs);
        setFilas(aplanar(invs));
      });
    };
    cargar();
    api
      .tema()
      .then((t) => {
        if (vivo) setTema(Object.fromEntries(t.map((x) => [x.clave, x.valor])));
      })
      .catch(() => {});
    api.secciones().then((secs) => {
      const info = secs.find((s) => s.tipo === "informacion_boda")?.contenido || {};
      const bienvenida = secs.find((s) => s.tipo === "welcome")?.contenido || {};
      if (!vivo) return;
      setPreguntas({
        restriccion: info.mostrarRestriccion !== false,
        observaciones: info.mostrarObservaciones !== false,
      });
      setEvento({
        novioEl: bienvenida.novioEl,
        novioElla: bienvenida.novioElla,
        antetitulo: bienvenida.bienvenidaTexto,
        fecha: info.fecha,
        lugar: info.lugar,
      });
    });
    // Refresco periódico para que las confirmaciones recientes aparezcan solas.
    const id = setInterval(cargar, 30000);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, []);

  const columnas = useMemo(() => {
    const c = ["Nombre", "Estado", "Invitación", "Tipo", "Código"];
    if (preguntas.restriccion) c.push("Restricción alimentaria");
    if (preguntas.observaciones) c.push("Observaciones");
    return c;
  }, [preguntas]);

  const visibles = useMemo(() => {
    if (!filas) return [];
    // Sin tildes: buscar "Gomez" tiene que encontrar a "Gómez".
    const q = paraBuscar(busqueda.trim());
    return filas.filter((f) => {
      if (filtro !== "todos" && f.estado !== filtro) return false;
      if (!q) return true;
      return (
        paraBuscar(f.nombre).includes(q) ||
        paraBuscar(f.invitacion).includes(q) ||
        paraBuscar(f.codigo).includes(q)
      );
    });
  }, [filas, filtro, busqueda]);

  // Las mismas personas visibles, pero agrupadas por su invitación.
  const agrupadas = useMemo(() => {
    const mapa = new Map();
    for (const f of visibles) {
      if (!mapa.has(f.codigo)) {
        mapa.set(f.codigo, {
          codigo: f.codigo,
          invitacion: f.invitacion,
          tipo: f.tipo,
          total: f.totalMiembros,
          personas: [],
        });
      }
      mapa.get(f.codigo).personas.push(f);
    }
    const reciente = (g) =>
      Math.max(0, ...g.personas.map((p) => (p.respondidoEn ? Date.parse(p.respondidoEn) : 0)));
    // Las invitaciones que respondieron hace poco, primero.
    return [...mapa.values()].sort((a, b) => {
      const d = reciente(b) - reciente(a);
      return d !== 0 ? d : (a.invitacion || "").localeCompare(b.invitacion || "", "es");
    });
  }, [visibles]);

  const conteo = useMemo(() => {
    const c = { confirmado: 0, no_asistira: 0, pendiente: 0, todos: 0 };
    for (const f of filas || []) {
      c[f.estado] = (c[f.estado] || 0) + 1;
      c.todos++;
    }
    return c;
  }, [filas]);

  // "Con quién viene" para la vista plana: en las individuales y de pareja el
  // nombre de la invitación repetía lo que ya dice la fila.
  const porCodigo = useMemo(() => new Map(agrupadas.map((g) => [g.codigo, g])), [agrupadas]);
  const contextoDeFila = (f) =>
    contextoDe(
      f.nombre,
      f.invitacion,
      (porCodigo.get(f.codigo)?.personas || []).filter((p) => p.id !== f.id).map((p) => p.nombre)
    );

  // Los grupos que van al PDF llevan además los cupos que siguen sin nombre:
  // en la puerta hay que saber que esa invitación todavía puede traer gente.
  const gruposParaPdf = useMemo(
    () =>
      agrupadas.map((g) => {
        const inv = invitaciones.find((i) => i.codigo === g.codigo);
        const total = inv?.tipo === "cupos" ? inv.cupos || 0 : 0;
        const usados = (inv?.miembros || []).filter((m) => m.es_acompanante).length;
        return { ...g, cuposLibres: total - usados };
      }),
    [agrupadas, invitaciones]
  );

  const datosResumen = useMemo(() => {
    const porTipo = {};
    let cuposTotales = 0;
    let cuposUsados = 0;
    for (const i of invitaciones) {
      const etiqueta = TIPOS[i.tipo] || i.tipo;
      porTipo[etiqueta] = (porTipo[etiqueta] || 0) + 1;
      if (i.tipo === "cupos") {
        cuposTotales += i.cupos || 0;
        cuposUsados += (i.miembros || []).filter((m) => m.es_acompanante).length;
      }
    }
    return {
      conteo: { ...conteo, total: conteo.todos },
      porTipo,
      pendientes: (filas || []).filter((f) => f.estado === "pendiente"),
      cupos: { totales: cuposTotales, libres: cuposTotales - cuposUsados },
    };
  }, [invitaciones, conteo, filas]);

  if (!filas) return <p className="text-sm text-ink/50">Cargando lista...</p>;

  const etiquetaFiltro = FILTROS.find((f) => f.key === filtro)?.label.toLowerCase() || filtro;

  function aCSV(personas) {
    const escapar = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lineas = [
      columnas.join(";"),
      ...personas.map((f) => {
        const fila = [f.nombre, ESTADOS[f.estado]?.etiqueta || f.estado, f.invitacion, f.tipo, f.codigo];
        if (preguntas.restriccion) fila.push(f.restriccion);
        if (preguntas.observaciones) fila.push(f.comentario);
        return fila.map(escapar).join(";");
      }),
    ];
    // "sep=;" le dice a Excel qué separador usar; sin esto, en configuración
    // regional española mete todas las columnas en una sola. El ﻿ es el
    // BOM: sin él Excel muestra los acentos rotos.
    return `﻿sep=;\r\n${lineas.join("\r\n")}`;
  }

  function exportar() {
    descargar(`invitados-${etiquetaFiltro}-${hoyBogota()}.csv`, aCSV(visibles), "text/csv;charset=utf-8");
  }

  function exportarTodo() {
    descargar(`invitados-todos-los-estados-${hoyBogota()}.csv`, aCSV(filas), "text/csv;charset=utf-8");
  }

  function exportarEstado(estado) {
    const personas = filas.filter((f) => f.estado === estado);
    const etiqueta = FILTROS.find((f) => f.key === estado)?.label.toLowerCase() || estado;
    descargar(`invitados-${etiqueta}-${hoyBogota()}.csv`, aCSV(personas), "text/csv;charset=utf-8");
    setMenuExportacion(false);
  }

  async function copiar() {
    const texto = visibles
      .map((f) =>
        [f.nombre, ESTADOS[f.estado]?.etiqueta, preguntas.restriccion ? f.restriccion : ""]
          .filter(Boolean)
          .join(" — ")
      )
      .join("\n");
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const ocultas = [
    !preguntas.restriccion && "restricción alimentaria",
    !preguntas.observaciones && "observaciones",
  ].filter(Boolean);

  return (
    <div className="tarjeta p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <p className="ayuda max-w-md">
          El CSV se abre directo en Excel; el PDF sale listo para imprimir.
          {ocultas.length > 0 && ` No se exporta ${ocultas.join(" ni ")}: no se pregunta en la invitación.`}
        </p>
        <div className="flex gap-2 relative">
          <button
            onClick={copiar}
            disabled={!visibles.length}
            className="boton-secundario"
          >
            {copiado ? "Copiado" : "Copiar"}
          </button>
          <button
            onClick={() => setExportando(true)}
            disabled={!visibles.length}
            className="boton-secundario"
          >
            PDF / Imprimir
          </button>
          <div className="relative">
            <button onClick={() => setMenuExportacion((v) => !v)} disabled={!filas.length} className="boton-primario">
              Exportar <span className="ml-1.5 opacity-70">⌄</span>
            </button>
            {menuExportacion && (
              <div className="absolute right-0 top-full mt-2 z-20 w-64 bg-white border border-[#E3D4BD] rounded-lg shadow-[0_12px_28px_rgb(30_35_33/.12)] p-1.5">
                <p className="px-2.5 py-2 text-[10px] uppercase tracking-[.12em] text-slate-400">Descargar CSV</p>
                <button onClick={() => { exportar(); setMenuExportacion(false); }} disabled={!visibles.length} className="w-full text-left px-2.5 py-2 rounded-md text-xs text-slate-700 hover:bg-[#FBF6EE] disabled:opacity-40">Vista actual <span className="float-right text-slate-400">{visibles.length}</span></button>
                <button onClick={() => { exportarTodo(); setMenuExportacion(false); }} className="w-full text-left px-2.5 py-2 rounded-md text-xs text-slate-700 hover:bg-[#FBF6EE]">Todas las personas <span className="float-right text-slate-400">{filas.length}</span></button>
                <div className="border-t border-[#F3E9DA] my-1.5" />
                {FILTROS.filter((f) => f.key !== "todos").map((f) => <button key={f.key} onClick={() => exportarEstado(f.key)} className="w-full text-left px-2.5 py-2 rounded-md text-xs text-slate-600 hover:bg-[#FBF6EE]">Solo {f.label.toLowerCase()} <span className="float-right text-slate-400">{conteo[f.key]}</span></button>)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {FILTROS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`chip-filtro ${filtro === f.key ? "chip-filtro-activo" : ""}`}
          >
            {f.label}
            <span className="chip-cuenta">{conteo[f.key] ?? 0}</span>
          </button>
        ))}
        <span className="w-px h-5 bg-borde mx-1" />
        {[
          { k: "invitacion", l: "Por invitación" },
          { k: "persona", l: "Por persona" },
        ].map((v) => (
          <button
            key={v.k}
            onClick={() => setVista(v.k)}
            className={`chip-filtro ${vista === v.k ? "chip-filtro-activo" : ""}`}
          >
            {v.l}
          </button>
        ))}
      </div>

      <input
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar por nombre, familia o código"
        className="campo mb-3"
      />

      {visibles.length === 0 ? (
        <div className="vacio">
          <p className="text-sm text-ink">Nadie por aquí todavía.</p>
          <p className="ayuda mt-1">
            Cuando crees invitaciones y la gente confirme, aparecerán en esta lista.
          </p>
        </div>
      ) : vista === "invitacion" ? (
        // Agrupado por invitación: cada persona queda bajo su invitación, para
        // entender los "Esposo"/"Esposa" sin nombre por el contexto.
        <div className="space-y-3">
          {agrupadas.map((g) => (
            <div key={g.codigo} className="border border-borde rounded-xl overflow-hidden">
              <div className="bg-lienzo px-3 py-2 flex items-center justify-between gap-2 border-b border-borde">
                <span className="text-sm font-medium text-ink">{g.invitacion}</span>
                <span className="flex items-center gap-2">
                  {/* En una individual el encabezado y su única fila decían lo
                      mismo: el estado sube aquí y la fila no se dibuja. */}
                  {esUnaSolaPersona(g) && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full border ${
                        ESTADOS[g.personas[0].estado]?.clase || ""
                      }`}
                    >
                      {ESTADOS[g.personas[0].estado]?.etiqueta || g.personas[0].estado}
                    </span>
                  )}
                  {/* El filtro puede dejar fuera a parte de la invitación. Sin
                      decirlo, una pareja con una sola respuesta se lee como si
                      hubiera respondido entera. */}
                  {g.total > g.personas.length && (
                    <span
                      className="text-[10px] text-ink-tenue"
                      title={`${g.personas.length} de ${g.total} personas de esta invitación coinciden con el filtro`}
                    >
                      {g.personas.length} de {g.total}
                    </span>
                  )}
                  <span className="text-[10px] uppercase tracking-wide text-ink-tenue">
                    {g.tipo} · {g.codigo}
                  </span>
                </span>
              </div>
              <div className="divide-y divide-borde">
                {(esUnaSolaPersona(g)
                  ? g.personas.filter((f) => f.restriccion || f.comentario)
                  : g.personas
                ).map((f) => (
                  <div key={f.id} className="px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {!esUnaSolaPersona(g) && (
                      <>
                        <span className="text-sm text-ink flex-1 min-w-[120px]">{f.nombre}</span>
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full border ${
                            ESTADOS[f.estado]?.clase || ""
                          }`}
                        >
                          {ESTADOS[f.estado]?.etiqueta || f.estado}
                        </span>
                      </>
                    )}
                    {preguntas.restriccion && f.restriccion && (
                      <span className="text-[11px] text-ink/50 italic w-full sm:w-auto">
                        🍽 {f.restriccion}
                      </span>
                    )}
                    {preguntas.observaciones && f.comentario && (
                      <span className="text-[11px] text-ink/50 italic w-full sm:w-auto">
                        💬 {f.comentario}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-borde rounded-xl overflow-x-auto">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Invitación</th>
                {preguntas.restriccion && <th>Restricción</th>}
                {preguntas.observaciones && <th>Observaciones</th>}
              </tr>
            </thead>
            <tbody>
              {visibles.map((f) => (
                <tr key={f.id} className="border-t border-borde align-top">
                  <td className="px-3 py-2 text-ink">{f.nombre}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full border ${
                        ESTADOS[f.estado]?.clase || ""
                      }`}
                    >
                      {ESTADOS[f.estado]?.etiqueta || f.estado}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-ink/60">
                    {contextoDeFila(f) || "—"}
                    <span className="block text-[10px] text-ink/35 uppercase tracking-wide">
                      {f.tipo} · {f.codigo}
                    </span>
                  </td>
                  {preguntas.restriccion && (
                    <td className="px-3 py-2 text-ink/60">{f.restriccion || "—"}</td>
                  )}
                  {preguntas.observaciones && (
                    <td className="px-3 py-2 text-ink/60">{f.comentario || "—"}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-[11px] text-ink/40 mt-2">
        Mostrando {visibles.length} de {conteo.todos} personas.
      </p>

      {exportando && (
        <DialogoExportar
          onCerrar={() => setExportando(false)}
          datos={{
            filas: visibles,
            grupos: gruposParaPdf,
            datos: datosResumen,
            evento,
            tema,
            preguntas,
            etiquetaFiltro,
          }}
        />
      )}
    </div>
  );
}
