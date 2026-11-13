import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import Icono from "../ui/Icono";
import { usePendientes } from "../estado/Pendientes";
import { useEvento, diasPara, fechaBonita } from "../estado/Evento";

// El inicio de cada evento. Antes era un tablero de 17 números sueltos que
// mezclaba «invitaciones» con «personas» y usaba palabras internas («cupos»,
// «titular + cupos»): quien no conocía Sivú no lo entendía. Ahora responde
// con palabras las preguntas que de verdad se hace la gente:
//   ¿Ya les llegó? · ¿Ya respondieron? · ¿Cuántos van? · ¿Para cuántos pido comida?
// y arriba de todo, lo que sigue, con un solo botón.

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

function Barra({ partes }) {
  const total = partes.reduce((s, [n]) => s + n, 0) || 1;
  return (
    <div className="flex gap-[3px] h-2.5 w-full" aria-hidden="true">
      {partes
        .filter(([n]) => n > 0)
        .map(([n, clase], i) => (
          <span key={i} className={`h-full rounded-full ${clase}`} style={{ width: `${(n / total) * 100}%` }} />
        ))}
      {partes.every(([n]) => !n) && <span className="h-full w-full rounded-full bg-borde" />}
    </div>
  );
}

function Pregunta({ titulo, grande, unidad, colorGrande = "text-ink", partes, leyenda, explicacion, accion, onAccion }) {
  return (
    <div className="tarjeta p-5 flex flex-col gap-2.5">
      <p className="text-[14px] font-semibold text-ink-suave">{titulo}</p>
      <p className="flex items-baseline gap-2">
        <span className={`font-display text-[2rem] leading-none font-medium tabular-nums ${colorGrande}`}>{grande}</span>
        <span className="text-[14px] text-ink-suave">{unidad}</span>
      </p>
      <Barra partes={partes} />
      {leyenda && <p className="text-[13.5px] text-ink-suave leading-snug">{leyenda}</p>}
      {explicacion && (
        <p className="flex gap-2 text-[13px] text-ink leading-snug bg-lienzo rounded-xl px-3 py-2.5">
          <span className="font-semibold text-marca">i</span>
          {explicacion}
        </p>
      )}
      <span className="flex-1" />
      {accion && (
        <button onClick={onAccion} className="self-start text-[14px] font-medium text-marca hover:text-marca-dark">
          {accion} →
        </button>
      )}
    </div>
  );
}

function hace(iso) {
  const min = Math.round((Date.now() - new Date(iso)) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

// Evento recién creado: los 4 pasos explicados para quien nunca usó Sivú.
function Bienvenida({ irA, invitacionLista }) {
  const PASOS = [
    ["invitacion", "sobre", "Tu invitación", "Textos, fotos y música. Cuando te guste, la apruebas y queda lista para enviar.", invitacionLista ? "Lista" : "Se está diseñando", "Ver cómo va"],
    ["invitados", "personas", "Tus invitados", "Sube tu lista en Excel o agrégalos uno a uno. Cada invitación puede ser para una persona, una pareja o una familia.", "Empieza por aquí", "Agregar invitados"],
    ["envios", "envio", "Enviar", "Desde tu WhatsApp, uno por uno, o Sivú las envía por ti. Cada quien recibe su propio enlace.", "Cuando tengas invitados", null],
    ["respuestas", "respuesta", "Respuestas", "Aquí verás quién va, quién no, y la lista lista para el lugar y la comida.", "Al enviar las primeras", null],
  ];
  return (
    <div>
      <h2 className="font-display text-[1.8rem] leading-tight text-ink">Así funciona tu evento en Sivú</h2>
      <p className="text-[15px] text-ink-suave mt-1.5 mb-6 max-w-[64ch]">Son 4 pasos. Sigue en orden y Sivú te va diciendo qué hacer en cada momento.</p>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {PASOS.map(([k, ic, t, d, estado, accion], i) => {
          const activo = k === "invitados";
          return (
            <div key={k} className={`tarjeta p-5 flex flex-col gap-3 ${activo ? "!border-marca border-2" : ""}`}>
              <div className="flex items-center gap-2.5">
                <span className={`grid place-items-center w-11 h-11 rounded-full ${activo ? "bg-marca text-white" : i === 0 ? "bg-oro-suave text-oro-oscuro" : "bg-lienzo text-ink-tenue"}`}>
                  <Icono nombre={ic} className="w-5 h-5" />
                </span>
                <span className="text-[11.5px] uppercase tracking-[.14em] font-semibold text-ink-tenue">Paso {i + 1}</span>
              </div>
              <p className={`font-display text-xl ${i > 1 ? "text-ink-suave" : "text-ink"}`}>{t}</p>
              <p className="text-[14px] text-ink-suave leading-relaxed flex-1">{d}</p>
              <span className={`insignia self-start ${activo ? "insignia-info" : i === 0 ? "insignia-oro" : "insignia-neutra"}`}>{estado}</span>
              {accion && (
                <button onClick={() => irA(k)} className={activo ? "boton-primario" : "boton-secundario"}>
                  {accion}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function InicioEvento({ irA }) {
  const { resumen, datosInfo, info, fecha } = useEvento();
  const { hayPendientes, seccionesPendientes } = usePendientes();
  const [lista, setLista] = useState(null);
  const [novedades, setNovedades] = useState([]);

  useEffect(() => {
    let vivo = true;
    api.invitados().then((l) => vivo && setLista(l)).catch(() => vivo && setLista([]));
    api.novedades().then((n) => vivo && setNovedades(n.slice(0, 5))).catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  const sinEnviar = useMemo(() => (lista || []).filter((i) => !i.enviado_en), [lista]);

  if (!resumen || !lista) return <p className="text-sm text-ink-tenue">Cargando...</p>;

  const inv = resumen.invitaciones || {};
  const totalInv = inv.total || 0;
  const enviadas = inv.enviadas ?? totalInv - sinEnviar.length;
  const conNombre = resumen.total || 0;
  const porConfirmar = resumen.cupos?.por_confirmar || 0;
  const personas = conNombre + porConfirmar;
  const van = resumen.confirmados || 0;
  const noVan = resumen.no_asisten || 0;
  const faltanResponder = resumen.pendientes || 0;
  const respondieron = van + noVan;
  const maximo = van + faltanResponder + porConfirmar;
  const diasCierre = diasPara(datosInfo?.fechaLimiteConfirmacion);
  const diasEvento = diasPara(fecha);
  const invitacionLista = ["aprobado", "enviando", "realizado"].includes(info?.etapa) || enviadas > 0;

  if (!totalInv) return <Bienvenida irA={irA} invitacionLista={invitacionLista} />;

  // Lo que sigue: una sola cosa, la más importante ahora.
  let sigue;
  if (hayPendientes) {
    sigue = { icono: "texto", titulo: "Publica los cambios de la invitación", detalle: `Cambiaste ${seccionesPendientes.join(", ")} y tus invitados todavía no lo ven.`, botones: [["boton-primario", "Revisar y publicar", () => irA("invitacion", "textos")]] };
  } else if (sinEnviar.length) {
    const nombres = sinEnviar.slice(0, 3).map((i) => i.nombre);
    sigue = {
      icono: "envio",
      titulo: `Enviar ${sinEnviar.length === 1 ? "la invitación que falta" : `las ${sinEnviar.length} invitaciones que faltan`}`,
      detalle: `${nombres.join(", ")}${sinEnviar.length > 3 ? ` y ${sinEnviar.length - 3} más` : ""}${diasEvento > 0 ? ` · el evento es en ${diasEvento} días` : ""}`,
      botones: [
        ["boton-secundario", "Ver cómo enviar", () => irA("envios")],
        ["boton-verde", "Enviar uno por uno", () => irA("envios", "uno")],
      ],
    };
  } else if (faltanResponder > 0 && (diasCierre === null || diasCierre >= 0)) {
    sigue = { icono: "campana", titulo: `Recordar a ${plural(faltanResponder, "persona que no ha", "personas que no han")} respondido`, detalle: "Un mensaje corto para quienes ya recibieron la invitación.", botones: [["boton-verde", "Enviar recordatorio", () => irA("envios", "recordar")]] };
  } else {
    sigue = { icono: "respuesta", titulo: "¡Ya respondieron todos!", detalle: "Descarga la lista para el lugar y la comida.", botones: [["boton-primario", "Descargar la lista", () => irA("respuestas", "exportar")]] };
  }

  const resaltar = (t) => <strong className="font-semibold text-marca">{t}</strong>;

  return (
    <div className="flex flex-col gap-5">
      <p className="font-display text-[1.45rem] sm:text-[1.6rem] leading-snug text-ink">
        Van {resaltar(`${van} de ${personas}`)} personas.
        {sinEnviar.length > 0 && <> Faltan {resaltar(plural(sinEnviar.length, "invitación", "invitaciones"))} por enviar</>}
        {sinEnviar.length > 0 && faltanResponder > 0 && " y"}
        {faltanResponder > 0 && (
          <>
            {sinEnviar.length ? " " : " Faltan "}
            {resaltar(plural(faltanResponder, "persona", "personas"))} por responder
          </>
        )}
        .
      </p>

      <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-marca-suave px-5 py-4">
        <span className="grid place-items-center w-11 h-11 rounded-full bg-marca text-white shrink-0">
          <Icono nombre={sigue.icono} className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-[14rem]">
          <p className="text-[11.5px] uppercase tracking-[.14em] font-semibold text-marca">Lo que sigue</p>
          <p className="text-[16px] font-semibold text-ink">{sigue.titulo}</p>
          <p className="text-[13.5px] text-ink-suave">{sigue.detalle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {sigue.botones.map(([clase, texto, fn]) => (
            <button key={texto} onClick={fn} className={`${clase} !text-[13.5px] !px-4 !py-2.5`}>
              {texto}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Pregunta
          titulo="¿Ya les llegó la invitación?"
          grande={`${enviadas} de ${totalInv}`}
          unidad="invitaciones enviadas"
          partes={[[enviadas, "bg-emerald-600"], [totalInv - enviadas, "bg-borde"]]}
          leyenda={sinEnviar.length ? `${plural(sinEnviar.length, "todavía no se ha enviado", "todavía no se han enviado")}.` : "Ya salieron todas."}
          explicacion={totalInv !== conNombre ? `Una invitación es un enlace. Puede ser para una persona, una pareja o una familia: por eso son ${totalInv} invitaciones para ${personas} personas.` : null}
          accion={sinEnviar.length ? `Enviar ${sinEnviar.length === 1 ? "la que falta" : `las ${sinEnviar.length} que faltan`}` : "Ver los envíos"}
          onAccion={() => irA("envios")}
        />
        <Pregunta
          titulo="¿Ya respondieron?"
          grande={`${respondieron} de ${conNombre}`}
          unidad="personas"
          partes={[[respondieron, "bg-emerald-600"], [faltanResponder, "bg-amber-200"]]}
          leyenda={faltanResponder ? `Faltan ${plural(faltanResponder, "persona", "personas")} por decir si van.${porConfirmar ? ` Además, ${plural(porConfirmar, "acompañante", "acompañantes")} sin nombre todavía.` : ""}` : "Ya respondieron todos."}
          accion={faltanResponder ? "Recordarles con un mensaje" : null}
          onAccion={() => irA("envios", "recordar")}
        />
        <Pregunta
          titulo="¿Cuántos van?"
          grande={van}
          unidad={van === 1 ? "persona va" : "personas van"}
          colorGrande="text-emerald-700"
          partes={[[van, "bg-emerald-600"], [noVan, "bg-marca"]]}
          leyenda={noVan ? `${plural(noVan, "persona dijo", "personas dijeron")} que no puede${noVan === 1 ? "" : "n"} ir.` : "Nadie ha dicho que no."}
          accion="Ver quién va"
          onAccion={() => irA("respuestas")}
        />
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem] gap-4">
        <div className="tarjeta p-5 flex flex-wrap items-center gap-6">
          <div className="flex-1 min-w-[15rem]">
            <p className="text-[15px] font-semibold text-ink">Para el lugar y la comida</p>
            <p className="text-[14px] text-ink-suave mt-1">
              Cuenta con {plural(van, "persona segura", "personas seguras")}
              {maximo > van ? ` y hasta ${maximo} si responden que sí las que faltan` : ""}.
            </p>
            <div className="flex gap-8 mt-3">
              <p>
                <span className="block font-display text-[1.8rem] leading-none text-emerald-700 tabular-nums">{van}</span>
                <span className="text-[13px] text-ink-suave">seguras</span>
              </p>
              <p>
                <span className="block font-display text-[1.8rem] leading-none text-ink tabular-nums">{maximo}</span>
                <span className="text-[13px] text-ink-suave">como máximo</span>
              </p>
            </div>
          </div>
          <button onClick={() => irA("respuestas", "exportar")} className="boton-secundario !text-[13.5px] !px-4 !py-2.5">
            <Icono nombre="descargar" className="w-4 h-4" />
            Descargar lista para el catering
          </button>
        </div>
        <div className="tarjeta p-5">
          <p className="text-[15px] font-semibold text-ink">Cierre de confirmaciones</p>
          {datosInfo?.fechaLimiteConfirmacion ? (
            <>
              <p className="font-display text-[1.6rem] leading-tight text-ink mt-1">{fechaBonita(datosInfo.fechaLimiteConfirmacion, false)}</p>
              <p className={`text-[14px] font-medium ${diasCierre < 0 ? "text-ink-suave" : diasCierre <= 3 ? "text-amber-700" : "text-ink-suave"}`}>
                {diasCierre < 0 ? "Ya cerró" : diasCierre === 0 ? "Cierra hoy" : diasCierre === 1 ? "Cierra mañana" : `Faltan ${diasCierre} días`}
              </p>
              <p className="text-[13px] text-ink-suave mt-1.5">Después de esa fecha la invitación ya no deja confirmar.</p>
            </>
          ) : (
            <>
              <p className="text-[14px] text-ink-suave mt-1.5">No tiene fecha límite: se puede confirmar hasta el día del evento.</p>
              <button onClick={() => irA("invitacion", "textos")} className="text-[14px] font-medium text-marca mt-2">
                Poner una fecha →
              </button>
            </>
          )}
        </div>
      </div>

      {novedades.length > 0 && (
        <div className="tarjeta px-5 pt-4 pb-2">
          <p className="text-[15px] font-semibold text-ink mb-1">Lo último que pasó</p>
          {novedades.map((n, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-t border-borde first:border-t-0">
              <span className={`grid place-items-center w-8 h-8 rounded-full shrink-0 ${n.tipo === "apertura" ? "bg-lienzo text-ink-suave" : n.estado === "confirmado" ? "bg-emerald-50 text-emerald-700" : "bg-marca-suave text-marca"}`}>
                <Icono nombre={n.tipo === "apertura" ? "ojo" : n.estado === "confirmado" ? "check" : "cerrar"} className="w-4 h-4" />
              </span>
              <p className="flex-1 text-[14px] text-ink">
                {n.tipo === "apertura" ? `${n.familia || n.invitacion} abrió la invitación` : `${n.nombre} ${n.estado === "confirmado" ? "confirmó que va" : "dijo que no puede ir"}`}
              </p>
              <span className="text-[12.5px] text-ink-tenue shrink-0">{hace(n.cuando)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
