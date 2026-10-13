import { useState } from "react";
import { api } from "../api";
import { useToast } from "../ui/Toast";
import { EVENTOS, ORIGENES, peso } from "./comun";
import PagosPorConfirmar from "./PagosPorConfirmar";

// Pantalla de inicio del dueño: qué hay que hacer hoy y cómo va el negocio.
// Cada tarjeta de «Para hoy» lleva a donde se resuelve.

function Tarea({ emoji, texto, accion, onIr, tono = "" }) {
  return (
    <button onClick={onIr} className={`w-full text-left flex items-center gap-3 px-4 py-3 border-t border-borde first:border-t-0 hover:bg-lienzo ${tono}`}>
      <span className="text-lg w-6 text-center">{emoji}</span>
      <span className="text-sm text-ink flex-1">{texto}</span>
      <span className="text-[11px] text-ink-tenue shrink-0">{accion} →</span>
    </button>
  );
}

function Dato({ label, valor, nota }) {
  return (
    <div className="tarjeta p-4">
      <p className="text-2xl font-semibold tabular-nums text-ink">{valor}</p>
      <p className="text-[11px] uppercase tracking-wide text-ink-tenue mt-1">{label}</p>
      {nota && <p className="text-[11px] text-ink-tenue mt-1">{nota}</p>}
    </div>
  );
}

function Barras({ titulo, filas, nombres }) {
  const max = Math.max(1, ...filas.map((f) => f.n));
  if (!filas.length) return null;
  return (
    <div className="tarjeta p-4">
      <p className="bloque-titulo mb-3">{titulo}</p>
      <div className="flex flex-col gap-2">
        {filas.map((f) => (
          <div key={f.origen || f.evento} className="text-[12px]">
            <div className="flex justify-between text-ink-suave mb-0.5">
              <span>{nombres[f.origen || f.evento] || f.origen || f.evento}</span>
              <span className="tabular-nums">
                {f.n} {f.ganados ? `· ${f.ganados} ganado${f.ganados === 1 ? "" : "s"}` : ""}
              </span>
            </div>
            <div className="h-2 rounded-full bg-lienzo overflow-hidden">
              <div className="h-full bg-marca" style={{ width: `${(f.n / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Hoy({ tablero, irA, onCambio }) {
  const toast = useToast();
  const [reporte, setReporte] = useState(null);
  const [enviando, setEnviando] = useState(false);
  if (!tablero) return <p className="text-sm text-ink-tenue">Cargando...</p>;
  const { metricas: m, hoy, conteos } = tablero;

  const tareas = [
    hoy.calientes > 0 && {
      emoji: "🔥",
      texto: `${hoy.calientes} ${hoy.calientes === 1 ? "cliente con prioridad alta sin contactar" : "clientes con prioridad alta sin contactar"}`,
      accion: "Atender",
      ir: () => irA("clientes"),
      tono: "bg-red-50/40",
    },
    hoy.sinContactar - hoy.calientes > 0 && {
      emoji: "⏳",
      texto: `${hoy.sinContactar - hoy.calientes} más sin contactar`,
      accion: "Ver",
      ir: () => irA("clientes"),
    },
    hoy.sinLeer > 0 && {
      emoji: "💬",
      texto: `${hoy.sinLeer} ${hoy.sinLeer === 1 ? "cliente te escribió" : "clientes te escribieron"} y no lo has leído aquí`,
      accion: "Leer",
      ir: () => irA("clientes"),
    },
    hoy.seguimientos > 0 && {
      emoji: "📅",
      texto: `${hoy.seguimientos} ${hoy.seguimientos === 1 ? "seguimiento toca hoy" : "seguimientos tocan hoy"}`,
      accion: "Hacer",
      ir: () => irA("clientes"),
    },
    ...hoy.atrasados.map((e) => ({
      emoji: "⚠️",
      texto: `${e.nombre}: faltan ${e.dias} días y sigue en «${{ datos: "esperando datos", diseno: "diseño", revision: "revisión" }[e.etapa]}»`,
      accion: "Producción",
      ir: () => irA("produccion"),
    })),
    ...hoy.saldos.map((e) => ({
      emoji: "💵",
      texto: `${e.nombre}: falta cobrar ${peso(e.falta)} (evento en ${e.dias} días)`,
      accion: "Producción",
      ir: () => irA("produccion"),
    })),
  ].filter(Boolean);

  async function verReporte() {
    try {
      setReporte(await api.crm.vistaReporte());
    } catch (e) {
      toast(e.message, "error");
    }
  }

  async function enviarReporte() {
    setEnviando(true);
    try {
      const r = await api.crm.enviarReporte();
      const fallo = r.resultados?.find((x) => x.estado !== "enviado");
      toast(fallo ? `No salió a +${fallo.telefono}: ${fallo.detalle}` : "Reporte enviado a tu WhatsApp", fallo ? "error" : undefined);
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setEnviando(false);
    }
  }

  const ads = m.anunciosMes;
  return (
    <div>
      <h2 className="panel-titulo">Hoy</h2>
      <p className="panel-subtitulo mb-6">Lo que hay que hacer hoy y cómo va el negocio.</p>

      {(!tablero.whatsapp || tablero.leads?.error) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm px-4 py-3 mb-4 flex flex-col gap-1">
          {!tablero.whatsapp && (
            <p>
              ⚠️ El WhatsApp de Sivú no está vinculado: no salen avisos, reportes ni mensajes.{" "}
              <button className="underline" onClick={() => irA("eventos")}>
                Vincularlo
              </button>
            </p>
          )}
          {tablero.leads?.error && <p>⚠️ No se están pudiendo leer los formularios de Meta: {tablero.leads.error}. Hay que renovar el token.</p>}
        </div>
      )}

      <PagosPorConfirmar key={tablero.pagosPorConfirmar} onCambio={onCambio} />

      <h3 className="bloque-titulo mb-2">Para hoy</h3>
      {tareas.length ? (
        <div className="tarjeta p-0 overflow-hidden mb-6">
          {tareas.map((t, i) => (
            <Tarea key={i} emoji={t.emoji} texto={t.texto} accion={t.accion} onIr={t.ir} tono={t.tono} />
          ))}
        </div>
      ) : (
        <div className="vacio mb-6">
          <p className="text-sm text-ink-suave">Todo al día ✨</p>
        </div>
      )}

      <h3 className="bloque-titulo mb-2">El negocio</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Dato label="Contactos esta semana" valor={m.semana} nota={`${m.cotizados_semana} cotizados · ${m.ganados_semana} ganados`} />
        <Dato label="En cotizaciones abiertas" valor={peso(m.cotizado_abierto)} nota={`${conteos.cotizado} por cerrar`} />
        <Dato label="Vendido este mes" valor={peso(m.ganado_mes)} nota={`${m.ganados_mes} ${m.ganados_mes === 1 ? "venta" : "ventas"}`} />
        <Dato
          label="Anuncios este mes"
          valor={ads?.configurado ? (ads.error ? "—" : ads.cargando ? "…" : peso(ads.gasto)) : "—"}
          nota={
            !ads?.configurado
              ? "Sin conectar a la cuenta de anuncios"
              : ads.error
                ? "No se pudo leer Meta"
                : ads.cargando
                  ? "Consultando Meta…"
                : m.costoPorVentaMes
                  ? `${peso(m.costoPorVentaMes)} por venta`
                  : `${ads.leads} contactos`
          }
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <Barras titulo="De dónde llegan (30 días)" filas={m.porOrigen} nombres={ORIGENES} />
        <Barras titulo="Qué piden (30 días)" filas={m.porEvento} nombres={EVENTOS} />
      </div>

      <div className="tarjeta p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="bloque-titulo">Reporte de la mañana</p>
            <p className="ayuda">Llega a tu WhatsApp cada día (se configura en Configuración). Mira cómo saldría hoy.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={verReporte} className="boton-secundario">
              Ver cómo sale
            </button>
            <button onClick={enviarReporte} disabled={enviando} className="boton-secundario">
              {enviando ? "Enviando..." : "Enviármelo ahora"}
            </button>
          </div>
        </div>
        {reporte && (
          <pre className="mt-3 whitespace-pre-wrap text-[13px] font-sans bg-[#e2f0dc] rounded-xl p-4 text-ink">
            {reporte.texto}
            {!reporte.hayAlgo && "\n\n(Hoy no tendría novedades: con la configuración actual no se enviaría.)"}
          </pre>
        )}
      </div>
    </div>
  );
}
