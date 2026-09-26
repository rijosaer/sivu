import { useEffect, useState } from "react";
import { api } from "../api";
import { usePendientes } from "../estado/Pendientes";
import Icono from "../ui/Icono";

function Dato({ label, valor, color, destacado }) {
  return (
    <div className="tarjeta p-4">
      <p className={`text-3xl font-semibold tabular-nums ${color || "text-ink"}`}>{valor ?? 0}</p>
      <p className="text-[11px] uppercase tracking-wide text-ink-tenue mt-1">{label}</p>
      {destacado && <p className="text-[11px] text-ink-tenue mt-1">{destacado}</p>}
    </div>
  );
}

// Días que faltan para la fecha límite de confirmación, contando en hora de
// Bogotá para que no se adelante o atrase por la zona del navegador. Devuelve
// null si no hay fecha configurada.
function diasParaCierre(limite) {
  if (!limite || !/^\d{4}-\d{2}-\d{2}$/.test(limite)) return null;
  const hoy = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const ms = new Date(`${limite}T00:00:00`) - new Date(`${hoy}T00:00:00`);
  return Math.round(ms / 86400000);
}

function fechaLarga(limite) {
  return new Date(`${limite}T12:00:00-05:00`).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Bogota",
  });
}

function CuentaRegresiva({ limite, pendientes }) {
  const dias = diasParaCierre(limite);
  if (dias === null) return null;

  let texto;
  let clase;
  if (dias > 1) {
    texto = `Faltan ${dias} días para el cierre de confirmaciones`;
    clase = "bg-marca-suave text-marca border-[#dbe2da]";
  } else if (dias === 1) {
    texto = "Mañana cierra el plazo de confirmaciones";
    clase = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (dias === 0) {
    texto = "Hoy cierra el plazo de confirmaciones";
    clase = "bg-amber-50 text-amber-700 border-amber-200";
  } else {
    texto = "El plazo de confirmaciones ya cerró";
    clase = "bg-lienzo text-ink-suave border-borde";
  }

  return (
    <div
      className={`rounded-xl border px-4 py-3 mb-4 text-sm flex flex-wrap items-center justify-between gap-2 ${clase}`}
    >
      <span>
        {texto} <span className="opacity-70">({fechaLarga(limite)})</span>
      </span>
      {dias >= 0 && pendientes > 0 && (
        <span className="text-xs">
          {pendientes} {pendientes === 1 ? "persona" : "personas"} sin responder
        </span>
      )}
    </div>
  );
}

// Una tarea pendiente, con el botón que lleva justo a donde se resuelve. Es lo
// que antes había que deducir mirando números sueltos.
function Tarea({ icono, texto, accion, onIr }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-borde first:border-t-0">
      <Icono nombre={icono} className="w-4 h-4 text-ink-tenue shrink-0" />
      <p className="text-sm text-ink flex-1">{texto}</p>
      <button onClick={onIr} className="boton-secundario shrink-0">
        {accion}
      </button>
    </div>
  );
}

export default function Resumen({ irA }) {
  const [datos, setDatos] = useState(null);
  const [limite, setLimite] = useState(null);
  const { hayPendientes, seccionesPendientes } = usePendientes();

  useEffect(() => {
    let vivo = true;
    const cargar = () =>
      api
        .resumen()
        .then((d) => vivo && setDatos(d))
        .catch(() => {});
    cargar();
    // La fecha límite vive en el contenido de la sección de información.
    api
      .secciones()
      .then((secs) => {
        const info = secs.find((s) => s.tipo === "informacion_boda")?.contenido || {};
        if (vivo) setLimite(info.fechaLimiteConfirmacion || null);
      })
      .catch(() => {});
    // Refresco en vivo: los contadores se actualizan conforme responden.
    const id = setInterval(cargar, 30000);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, []);

  if (!datos) return <p className="text-sm text-ink-tenue">Cargando...</p>;

  const inv = datos.invitaciones || {};
  const respondieron = (datos.confirmados || 0) + (datos.no_asisten || 0);
  const avance = datos.total ? Math.round((respondieron / datos.total) * 100) : 0;

  // Solo se listan las tareas que de verdad están pendientes: una lista que
  // siempre dice lo mismo se deja de leer.
  const tareas = [
    inv.sin_responder > 0 && {
      icono: "sobre",
      texto: `${inv.sin_responder} ${
        inv.sin_responder === 1 ? "invitación no ha recibido" : "invitaciones no han recibido"
      } ninguna respuesta.`,
      accion: "Ver invitaciones",
      ir: "invitados",
    },
    datos.pendientes > 0 && {
      icono: "persona",
      texto: `${datos.pendientes} ${
        datos.pendientes === 1 ? "persona sigue" : "personas siguen"
      } sin decir si asisten.`,
      accion: "Recordarles",
      ir: "invitados",
    },
    inv.cupos_libres > 0 && {
      icono: "persona",
      texto: `${inv.cupos_libres} de ${inv.cupos_totales} cupos siguen sin nombre: podrían sumarse hasta esas personas más.`,
      accion: "Ver cupos",
      ir: "invitados",
    },
    hayPendientes && {
      icono: "texto",
      texto: `Tienes cambios sin publicar en ${seccionesPendientes.join(", ")}.`,
      accion: "Publicar",
      ir: "contenido",
    },
  ].filter(Boolean);

  return (
    <div>
      <h2 className="panel-titulo">Resumen</h2>
      <p className="panel-subtitulo mb-6">
        Confirmaciones contadas por persona y actualizadas automáticamente.
      </p>

      <CuentaRegresiva limite={limite} pendientes={datos.pendientes} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <Dato label="Personas invitadas" valor={datos.total} />
        <Dato label="Asisten" valor={datos.confirmados} color="text-emerald-600" />
        <Dato label="No asisten" valor={datos.no_asisten} color="text-red-600" />
        <Dato label="Sin responder" valor={datos.pendientes} color="text-amber-600" />
      </div>

      <div className="tarjeta p-4 mb-6">
        <div className="flex justify-between text-xs text-ink-suave mb-2">
          <span>Avance de confirmaciones</span>
          <span className="tabular-nums">
            {respondieron} de {datos.total} · {avance}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-lienzo overflow-hidden">
          <div className="h-full bg-marca transition-all" style={{ width: `${avance}%` }} />
        </div>
      </div>

      {tareas.length > 0 && (
        <>
          <h3 className="bloque-titulo mb-2">Qué falta por hacer</h3>
          <div className="tarjeta mb-6">
            {tareas.map((t) => (
              <Tarea
                key={t.texto}
                icono={t.icono}
                texto={t.texto}
                accion={t.accion}
                onIr={() => irA?.(t.ir)}
              />
            ))}
          </div>
        </>
      )}

      <h3 className="bloque-titulo mb-2">Estado de los enlaces enviados</h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <Dato label="Total" valor={inv.total} />
        <Dato label="Individuales" valor={inv.individuales} />
        <Dato label="De pareja" valor={inv.parejas} />
        <Dato label="Familiares" valor={inv.familias} />
        <Dato label="Titular + cupos" valor={inv.con_cupos} />
      </div>

      <div className="tarjeta p-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-suave">
          ¿Necesitas la lista completa para el catering o la wedding planner?
        </p>
        <button onClick={() => irA?.("lista")} className="boton-secundario">
          <Icono nombre="lista" className="w-3.5 h-3.5" />
          Ver lista de personas
        </button>
      </div>
    </div>
  );
}
