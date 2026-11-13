import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { coloresDelEvento, temaComoObjeto } from "./colores";
import { recordarEvento } from "./recientes";

// Lo que varias partes del evento necesitan a la vez (la cabecera, el inicio,
// las pestañas): sus datos, sus números y sus colores. Se pide una vez aquí y
// se comparte, en vez de que cada pantalla lo pida por su cuenta.

const Contexto = createContext(null);

export function EventoProvider({ evento, children }) {
  const [info, setInfo] = useState(null); // fila de la invitación (fecha, diseño, etapa)
  const [resumen, setResumen] = useState(null);
  const [tema, setTema] = useState({});
  const [datosInfo, setDatosInfo] = useState({}); // sección «información»: fecha, lugar, fecha límite

  const cargarResumen = useCallback(() => api.resumen().then(setResumen).catch(() => {}), []);

  useEffect(() => {
    let vivo = true;
    api
      .listarInvitaciones()
      .then((l) => vivo && setInfo(l.find((x) => String(x.id) === String(evento.id)) || null))
      .catch(() => {});
    api
      .tema()
      .then((t) => vivo && setTema(temaComoObjeto(t)))
      .catch(() => {});
    api
      .secciones()
      .then((s) => vivo && setDatosInfo(s.find((x) => x.tipo === "informacion_boda")?.contenido || {}))
      .catch(() => {});
    cargarResumen();
    // Los números se mueven solos mientras la gente responde.
    const t = setInterval(cargarResumen, 30000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, [evento.id, cargarResumen]);

  const colores = useMemo(() => coloresDelEvento(tema), [tema]);
  const fecha = info?.fecha_evento ? String(info.fecha_evento).slice(0, 10) : datosInfo.fecha || null;

  // Se recuerda en «Eventos recientes» con sus colores, para el menú.
  useEffect(() => {
    recordarEvento(evento, { fecha, etapa: info?.etapa, colores: { fondo: colores.fondo, acento: colores.acento, texto: colores.texto } });
  }, [evento.id, evento.nombre, fecha, info?.etapa, colores.fondo, colores.acento, colores.texto]);

  const valor = useMemo(
    () => ({ evento, info, resumen, tema, colores, datosInfo, fecha, recargarResumen: cargarResumen }),
    [evento, info, resumen, tema, colores, datosInfo, fecha, cargarResumen]
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useEvento() {
  return useContext(Contexto) || {};
}

// Días que faltan hasta una fecha AAAA-MM-DD, contando en hora de Bogotá.
export function diasPara(fecha) {
  if (!fecha || !/^\d{4}-\d{2}-\d{2}/.test(fecha)) return null;
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  return Math.round((new Date(`${String(fecha).slice(0, 10)}T00:00:00`) - new Date(`${hoy}T00:00:00`)) / 86400000);
}

export function fechaBonita(fecha, conDia = true) {
  if (!fecha) return "";
  const d = new Date(`${String(fecha).slice(0, 10)}T12:00:00-05:00`);
  const txt = d.toLocaleDateString("es-CO", { weekday: conDia ? "long" : undefined, day: "numeric", month: "long", timeZone: "America/Bogota" });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

// En qué va cada paso del evento, con un detalle corto para la pestaña.
// progreso: hecho | encurso | pendiente
export function pasosDelEvento({ resumen, info, hayPendientes }) {
  const inv = resumen?.invitaciones || {};
  const total = inv.total || 0;
  const enviadas = inv.enviadas || 0;
  const personas = (resumen?.total || 0) + (resumen?.cupos?.por_confirmar || 0);
  const van = resumen?.confirmados || 0;
  const faltan = resumen?.pendientes || 0;
  const etapa = info?.etapa;
  const invitacionLista = ["aprobado", "enviando", "realizado"].includes(etapa) || enviadas > 0;
  return {
    invitacion: {
      progreso: invitacionLista && !hayPendientes ? "hecho" : "encurso",
      detalle: hayPendientes ? "Cambios sin publicar" : invitacionLista ? "Lista" : etapa === "revision" ? "En revisión" : "En diseño",
    },
    invitados: {
      progreso: total > 0 ? "hecho" : "pendiente",
      detalle: total > 0 ? `${personas} ${personas === 1 ? "persona" : "personas"}` : "Aún no hay",
    },
    envios: {
      progreso: total > 0 && enviadas >= total ? "hecho" : enviadas > 0 ? "encurso" : "pendiente",
      detalle: total > 0 ? `${enviadas} de ${total}` : "—",
    },
    respuestas: {
      progreso: enviadas > 0 && faltan === 0 ? "hecho" : enviadas > 0 ? "encurso" : "pendiente",
      detalle: enviadas > 0 ? `${van} van · ${faltan} faltan` : "—",
    },
  };
}
