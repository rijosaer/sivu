import { pool } from "./db.js";
import { enviarTexto, whatsappConectado } from "./whatsappWeb.js";
import { leerAjuste, leerInterno, guardarInterno, telefonosReporte, EVENTO_NOMBRE, CUANDO_NOMBRE } from "./ajustes.js";
import { enfriar, prioridad, EMOJI_PRIORIDAD } from "./prospectos.js";
import { estadoLeads } from "./leadsMeta.js";

// Reporte de cada mañana por WhatsApp a los números del equipo, y las mismas
// cifras para el tablero del panel. Dice qué pasó (anuncios, contactos) y,
// sobre todo, qué hay que hacer hoy (a quién escribir, qué evento está
// atrasado, qué saldo falta cobrar). Los lunes suma la semana anterior.
//
// Los datos de los anuncios salen de la API de Meta con META_ADS_TOKEN (token
// de usuario con ads_read) y META_ADS_ACCOUNT (act_...); se cuentan solo las
// campañas cuyo nombre contiene el filtro de Configuración («Sivú»).

const API = "https://graph.facebook.com/v21.0";
const peso = (n) => `$${Math.round(Number(n) || 0).toLocaleString("es-CO")}`;
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

function fechaBogota(desplazamientoDias = 0) {
  const d = new Date(Date.now() + desplazamientoDias * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(d);
}

function ahora() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Bogota", hour: "2-digit", minute: "2-digit", weekday: "short", hourCycle: "h23",
    }).formatToParts(new Date()).map((x) => [x.type, x.value])
  );
  return { hora: Number(p.hour), minuto: Number(p.minute), lunes: p.weekday === "Mon" };
}

// ---------- Anuncios (Meta) ----------

const sinAcentos = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
// Memoria por rango de fechas (el reporte pide ayer y antier; el panel, el mes).
const cacheAnuncios = new Map(); // clave → { hasta, datos }

// Gasto, alcance y clientes potenciales de las campañas de Sivú entre dos
// fechas (YYYY-MM-DD, ambas incluidas).
export async function anuncios(desde, hasta) {
  const token = process.env.META_ADS_TOKEN;
  const cuenta = process.env.META_ADS_ACCOUNT;
  if (!token || !cuenta) return { configurado: false };
  const clave = `${desde}|${hasta}`;
  const guardado = cacheAnuncios.get(clave);
  if (guardado && guardado.hasta > Date.now()) return guardado.datos;
  const { filtroCampana } = await leerAjuste("reporte");
  const url = new URL(`${API}/${cuenta}/insights`);
  url.searchParams.set("level", "campaign");
  url.searchParams.set("time_range", JSON.stringify({ since: desde, until: hasta }));
  url.searchParams.set("fields", "campaign_name,spend,reach,impressions,clicks,actions");
  url.searchParams.set("limit", "100");
  url.searchParams.set("access_token", token);
  try {
    const r = await fetch(url);
    const json = await r.json();
    if (json.error) throw new Error(json.error.message);
    const filtro = sinAcentos(filtroCampana || "");
    const filas = (json.data || []).filter((f) => !filtro || sinAcentos(f.campaign_name).includes(filtro));
    const datos = {
      configurado: true,
      gasto: filas.reduce((s, f) => s + Number(f.spend || 0), 0),
      alcance: filas.reduce((s, f) => s + Number(f.reach || 0), 0),
      impresiones: filas.reduce((s, f) => s + Number(f.impressions || 0), 0),
      clics: filas.reduce((s, f) => s + Number(f.clicks || 0), 0),
      leads: filas.reduce(
        (s, f) => s + Number((f.actions || []).find((a) => a.action_type === "lead")?.value || 0),
        0
      ),
    };
    cacheAnuncios.set(clave, { hasta: Date.now() + 10 * 60 * 1000, datos });
    return datos;
  } catch (e) {
    return { configurado: true, error: e.message };
  }
}

// Para el panel: nunca hace esperar. Devuelve lo último que se sabe (aunque
// tenga unos minutos) y, si ya está viejo, lo actualiza por detrás para la
// próxima vez. Sin nada guardado todavía, responde «cargando».
const refrescando = new Set();
export function anunciosSinEsperar(desde, hasta) {
  if (!process.env.META_ADS_TOKEN || !process.env.META_ADS_ACCOUNT) return { configurado: false };
  const clave = `${desde}|${hasta}`;
  const guardado = cacheAnuncios.get(clave);
  if ((!guardado || guardado.hasta <= Date.now()) && !refrescando.has(clave)) {
    refrescando.add(clave);
    anuncios(desde, hasta).finally(() => refrescando.delete(clave));
  }
  return guardado ? guardado.datos : { configurado: true, cargando: true };
}

// ---------- Cifras del negocio ----------

export async function metricas() {
  const hoy = fechaBogota(0);
  const inicioSemana = fechaBogota(-6);
  const inicioMes = `${hoy.slice(0, 7)}-01`;
  const { rows: [m] } = await pool.query(
    `SELECT
       count(*) FILTER (WHERE creado_en >= $1::date AT TIME ZONE 'America/Bogota')::int AS semana,
       count(*) FILTER (WHERE cotizado_en >= $1::date AT TIME ZONE 'America/Bogota')::int AS cotizados_semana,
       count(*) FILTER (WHERE ganado_en >= $1::date AT TIME ZONE 'America/Bogota')::int AS ganados_semana,
       count(*) FILTER (WHERE estado = 'nuevo')::int AS sin_contactar,
       count(*) FILTER (WHERE estado IN ('nuevo', 'contactado', 'cotizado'))::int AS abiertos,
       COALESCE(sum(valor_cotizado) FILTER (WHERE estado = 'cotizado'), 0)::bigint AS cotizado_abierto,
       COALESCE(sum(valor_ganado) FILTER (WHERE ganado_en >= $2::date AT TIME ZONE 'America/Bogota'), 0)::bigint AS ganado_mes,
       count(*) FILTER (WHERE ganado_en >= $2::date AT TIME ZONE 'America/Bogota')::int AS ganados_mes,
       count(*) FILTER (WHERE proximo_seguimiento <= $3::date AND estado IN ('contactado', 'cotizado'))::int AS seguimientos_hoy
     FROM prospectos`,
    [inicioSemana, inicioMes, hoy]
  );
  const { rows: porOrigen } = await pool.query(
    `SELECT origen, count(*)::int AS n, count(*) FILTER (WHERE estado = 'ganado')::int AS ganados
     FROM prospectos WHERE creado_en >= now() - interval '30 days' GROUP BY origen ORDER BY n DESC`
  );
  const { rows: porEvento } = await pool.query(
    `SELECT evento, count(*)::int AS n, count(*) FILTER (WHERE estado = 'ganado')::int AS ganados
     FROM prospectos WHERE creado_en >= now() - interval '30 days' AND evento <> '' GROUP BY evento ORDER BY n DESC`
  );
  const adsMes = anunciosSinEsperar(inicioMes, hoy);
  return {
    ...m,
    cotizado_abierto: Number(m.cotizado_abierto),
    ganado_mes: Number(m.ganado_mes),
    porOrigen,
    porEvento,
    anunciosMes: adsMes,
    costoPorVentaMes: adsMes.gasto && m.ganados_mes ? Math.round(adsMes.gasto / m.ganados_mes) : null,
  };
}

// Qué hay que hacer hoy (también lo muestra el panel arriba).
export async function pendientesDeHoy() {
  const hoy = fechaBogota(0);
  const { rows: abiertos } = await pool.query(
    `SELECT p.*, EXISTS (SELECT 1 FROM cotizaciones c WHERE c.prospecto_id = p.id AND c.vistas > 0) AS cotizacion_vista
     FROM prospectos p WHERE estado IN ('nuevo', 'contactado', 'cotizado') ORDER BY creado_en`
  );
  const sinContactar = abiertos.filter((p) => p.estado === "nuevo");
  const calientes = sinContactar.filter((p) => prioridad(p) === "alta");
  const seguimientos = abiertos.filter(
    (p) => p.estado !== "nuevo" && p.proximo_seguimiento && String(p.proximo_seguimiento.toISOString?.() || p.proximo_seguimiento).slice(0, 10) <= hoy
  );
  const sinLeer = abiertos.filter((p) => p.sin_leer > 0);
  const { rows: eventos } = await pool.query(
    `SELECT i.id, i.nombre, i.fecha_evento, i.etapa, i.valor_total,
            (i.fecha_evento - $1::date) AS dias,
            COALESCE((SELECT sum(valor) FROM pagos p WHERE p.invitacion_id = i.id), 0)::bigint AS pagado,
            i.datos_recibidos_en
     FROM invitaciones i
     WHERE NOT i.es_plantilla AND i.activo AND i.etapa <> 'realizado'
       AND i.fecha_evento IS NOT NULL AND i.fecha_evento >= $1::date
     ORDER BY i.fecha_evento`,
    [hoy]
  );
  const atrasados = eventos.filter((e) => e.dias <= 10 && ["datos", "diseno", "revision"].includes(e.etapa));
  const saldos = eventos.filter((e) => e.dias <= 7 && e.valor_total && Number(e.pagado) < Number(e.valor_total));
  return { sinContactar, calientes, seguimientos, sinLeer, atrasados, saldos };
}

const ETAPA = { datos: "esperando datos", diseno: "en diseño", revision: "en revisión del cliente" };
const nombreCorto = (p) => (p.nombre || `+${p.telefono}`).split(/\s+/).slice(0, 2).join(" ");

export async function armarReporte() {
  const ayer = fechaBogota(-1);
  const antier = fechaBogota(-2);
  const [adsAyer, adsAntier, pend, { rows: [c] }] = await Promise.all([
    anuncios(ayer, ayer),
    anuncios(antier, antier),
    pendientesDeHoy(),
    pool.query(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE origen = 'anuncio')::int AS anuncio,
              count(*) FILTER (WHERE origen = 'whatsapp')::int AS whatsapp
       FROM prospectos
       WHERE (creado_en AT TIME ZONE 'America/Bogota')::date = $1::date`,
      [ayer]
    ),
  ]);
  const { rows: eventosAyer } = await pool.query(
    `SELECT evento, count(*)::int AS n FROM prospectos
     WHERE (creado_en AT TIME ZONE 'America/Bogota')::date = $1::date AND evento <> ''
     GROUP BY evento ORDER BY n DESC LIMIT 3`,
    [ayer]
  );

  const fecha = new Date(`${fechaBogota(0)}T12:00:00-05:00`).toLocaleDateString("es-CO", {
    weekday: "long", day: "numeric", month: "short", timeZone: "America/Bogota",
  });
  const l = [`📊 *Sivú · ${fecha.charAt(0).toUpperCase()}${fecha.slice(1)}*`];
  let hayAlgo = false;

  // Anuncios de ayer.
  if (adsAyer.configurado) {
    l.push("", "*Anuncios ayer*");
    if (adsAyer.error) {
      l.push(`⚠️ No pude leer los anuncios: ${adsAyer.error.slice(0, 120)}`);
      hayAlgo = true;
    } else if (adsAyer.gasto > 0) {
      hayAlgo = true;
      l.push(`💸 ${peso(adsAyer.gasto)} · 👀 ${adsAyer.alcance.toLocaleString("es-CO")} personas · 🎯 ${plural(c.anuncio, "contacto", "contactos")}`);
      if (c.anuncio) {
        const cpl = adsAyer.gasto / c.anuncio;
        let comp = "";
        if (adsAntier.gasto > 0 && adsAntier.leads > 0) {
          const cplAntes = adsAntier.gasto / adsAntier.leads;
          comp = ` (antier: ${peso(cplAntes)} ${cpl <= cplAntes ? "↓" : "↑"})`;
        }
        l.push(`💰 ${peso(cpl)} por contacto${comp}`);
      }
    } else {
      l.push("😴 Los anuncios no gastaron nada ayer. ¿Están activos y con la tarjeta al día?");
      hayAlgo = true;
    }
  }

  if (c.total) {
    hayAlgo = true;
    const tipos = eventosAyer.map((e) => `${EVENTO_NOMBRE[e.evento] || e.evento} (${e.n})`).join(", ");
    l.push("", `*Llegaron ayer:* ${plural(c.total, "cliente potencial", "clientes potenciales")}${c.whatsapp ? ` (${c.whatsapp} por WhatsApp directo)` : ""}`);
    if (tipos) l.push(`🏆 Lo más pedido: ${tipos}`);
  }

  // Para hoy.
  const hoy = [];
  if (pend.calientes.length) {
    hoy.push(
      `🔥 ${plural(pend.calientes.length, "sin contactar con prioridad alta", "sin contactar con prioridad alta")}: ` +
        pend.calientes.slice(0, 4).map((p) => `${nombreCorto(p)} (${EVENTO_NOMBRE[p.evento] || "evento"}${p.cuando ? `, ${CUANDO_NOMBRE[p.cuando]?.toLowerCase()}` : ""})`).join(", ") +
        (pend.calientes.length > 4 ? "…" : "")
    );
  }
  const otrosNuevos = pend.sinContactar.length - pend.calientes.length;
  if (otrosNuevos > 0) hoy.push(`⏳ ${plural(otrosNuevos, "cliente más sin contactar", "clientes más sin contactar")}`);
  if (pend.seguimientos.length) {
    hoy.push(
      `📅 ${plural(pend.seguimientos.length, "seguimiento", "seguimientos")}: ` +
        pend.seguimientos.slice(0, 4).map((p) => `${nombreCorto(p)}${p.evento ? ` (${EVENTO_NOMBRE[p.evento]})` : ""}`).join(", ") +
        (pend.seguimientos.length > 4 ? "…" : "")
    );
  }
  const { rows: [{ n: porConfirmar }] } = await pool.query(
    "SELECT count(*)::int AS n FROM pagos_reportados WHERE estado = 'pendiente'"
  );
  if (porConfirmar) {
    hoy.push(`💵 ${plural(porConfirmar, "pago reportado", "pagos reportados")} por confirmar: revisa tu Nequi/banco y confírmalos en el panel`);
  }
  if (pend.sinLeer.length) hoy.push(`💬 ${plural(pend.sinLeer.length, "cliente te escribió", "clientes te escribieron")} y no has leído en el panel`);
  for (const e of pend.atrasados.slice(0, 4)) {
    hoy.push(`⚠️ ${e.nombre}: faltan ${plural(e.dias, "día", "días")} y sigue ${ETAPA[e.etapa]}`);
  }
  for (const e of pend.saldos.slice(0, 4)) {
    hoy.push(`💵 ${e.nombre}: falta cobrar ${peso(Number(e.valor_total) - Number(e.pagado))} (evento en ${plural(e.dias, "día", "días")})`);
  }
  if (hoy.length) {
    hayAlgo = true;
    l.push("", "*Para hoy*", ...hoy);
  }

  // Los lunes, la semana anterior.
  if (ahora().lunes) {
    const desde = fechaBogota(-7);
    const ads = await anuncios(desde, ayer);
    const { rows: [s] } = await pool.query(
      `SELECT count(*) FILTER (WHERE creado_en >= $1::date AT TIME ZONE 'America/Bogota' AND creado_en < $2::date AT TIME ZONE 'America/Bogota')::int AS nuevos,
              count(*) FILTER (WHERE cotizado_en >= $1::date AT TIME ZONE 'America/Bogota' AND cotizado_en < $2::date AT TIME ZONE 'America/Bogota')::int AS cotizados,
              count(*) FILTER (WHERE ganado_en >= $1::date AT TIME ZONE 'America/Bogota' AND ganado_en < $2::date AT TIME ZONE 'America/Bogota')::int AS ganados,
              COALESCE(sum(valor_ganado) FILTER (WHERE ganado_en >= $1::date AT TIME ZONE 'America/Bogota' AND ganado_en < $2::date AT TIME ZONE 'America/Bogota'), 0)::bigint AS vendido
       FROM prospectos`,
      [desde, fechaBogota(0)]
    );
    if (s.nuevos || ads.gasto) {
      hayAlgo = true;
      l.push(
        "",
        "*La semana pasada*",
        `${plural(s.nuevos, "contacto", "contactos")} · ${plural(s.cotizados, "cotizado", "cotizados")} · ${plural(s.ganados, "ganado", "ganados")}` +
          (Number(s.vendido) ? ` · vendido ${peso(s.vendido)}` : "")
      );
      if (ads.gasto) {
        l.push(`💸 Anuncios: ${peso(ads.gasto)}${s.ganados ? ` · ${peso(ads.gasto / s.ganados)} por venta` : ""}`);
      }
    }
  }

  const leads = estadoLeads();
  if (leads.error) {
    hayAlgo = true;
    l.push("", `⚠️ No estoy pudiendo leer los formularios de Meta: ${leads.error.slice(0, 120)}. Revisa el token.`);
  }

  if (process.env.PANEL_URL) l.push("", `Ver todo: ${process.env.PANEL_URL}`);
  return { hayAlgo, texto: l.join("\n") };
}

export async function enviarReporte({ siempre = false } = {}) {
  if (!whatsappConectado()) return { error: "El WhatsApp de Sivú no está vinculado" };
  const { hayAlgo, texto } = await armarReporte();
  if (!hayAlgo && !siempre) return { omitido: "Sin novedades" };
  const resultados = [];
  for (const tel of await telefonosReporte()) {
    const r = await enviarTexto(tel, texto);
    resultados.push({ telefono: tel, estado: r.estado, detalle: r.estado === "enviado" ? "" : r.detalle });
  }
  return { texto, resultados };
}

async function revisar() {
  const cfg = await leerAjuste("reporte");
  const { hora, minuto } = ahora();
  if (hora * 60 + minuto < cfg.hora * 60 + cfg.minuto) return;
  const hoy = fechaBogota(0);
  if ((await leerInterno("reporte_ultimo")) === hoy) return;
  await guardarInterno("reporte_ultimo", hoy);
  // Una vez al día, antes del reporte: lo que lleva días quieto pasa a frío.
  const { diasFrio } = await leerAjuste("seguimiento");
  await enfriar(diasFrio);
  if (!cfg.activo) return;
  const r = await enviarReporte();
  if (r.error || r.omitido) console.log("Reporte de la mañana:", r.error || r.omitido);
}

export function iniciarReporte() {
  // Deja listos los datos de anuncios del mes: el panel nunca los espera.
  const hoy = fechaBogota(0);
  anunciosSinEsperar(`${hoy.slice(0, 7)}-01`, hoy);
  setInterval(() => revisar().catch((e) => console.error("Reporte de la mañana:", e)), 60 * 1000);
}

export { EMOJI_PRIORIDAD };
