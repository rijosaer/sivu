import { pool } from "./db.js";
import { enviarTexto, whatsappConectado } from "./whatsappWeb.js";
import { normalizarTelefono } from "./avisosWhatsapp.js";
import { telefonosAviso, EVENTO_NOMBRE, CUANDO_NOMBRE, INVITADOS_NOMBRE } from "./ajustes.js";
import { crearOUnir, prioridad, EMOJI_PRIORIDAD } from "./prospectos.js";
import { saludarPendientes, saludarSiToca } from "./saludo.js";
import { etiquetar, jidDe } from "./waOrden.js";

// Clientes potenciales de los anuncios de Sivú en Facebook e Instagram. Cada
// minuto se revisan los formularios de cotización de la página y, por cada
// contacto nuevo:
//  1. Queda como cliente potencial en el panel (o se une a su ficha si ese
//     número ya existía).
//  2. Se avisa a los números del equipo con sus datos (Configuración del
//     panel; si no hay, LEADS_WHATSAPP).
//  3. Si el mensaje automático está prendido en el panel, se le escribe
//     (saludo.js decide el texto y la hora).
//
// Variables (servicio invitacion-api):
//   META_PAGE_TOKEN  token de la página con permiso leads_retrieval. Si sale
//                    de un token de usuario de larga duración, no vence.
//   META_LEAD_FORMS  ids de formularios separados por coma (opcional: si no
//                    está, se revisan todos los formularios activos de
//                    META_PAGE_ID).
//   META_PAGE_ID     id de la página (solo si no hay META_LEAD_FORMS).
//   LEADS_WHATSAPP   números del equipo por defecto (el panel manda).

const API = "https://graph.facebook.com/v21.0";
const CADA_MS = 60 * 1000;
// Contactos de más de un día (por ejemplo, de antes de activar esto) se anotan
// como vistos sin avisar: un aviso tan tarde ya no sirve.
const VIGENCIA_MS = 24 * 3600 * 1000;
const MAX_INTENTOS = 5;

const configurado = () => Boolean(process.env.META_PAGE_TOKEN && (process.env.META_LEAD_FORMS || process.env.META_PAGE_ID));

async function graph(ruta, params = {}) {
  const url = new URL(`${API}/${ruta}`);
  for (const [k, v] of Object.entries({ ...params, access_token: process.env.META_PAGE_TOKEN })) url.searchParams.set(k, v);
  const r = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  const json = await r.json().catch(() => ({}));
  if (!r.ok || json.error) throw new Error(json.error?.message || `Meta respondió ${r.status}`);
  return json;
}

async function formularios() {
  const fijos = String(process.env.META_LEAD_FORMS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (fijos.length) return fijos;
  const { data = [] } = await graph(`${process.env.META_PAGE_ID}/leadgen_forms`, { fields: "id,status", limit: 50 });
  return data.filter((f) => f.status === "ACTIVE").map((f) => f.id);
}

// field_data → { evento: "boda", full_name: "Ana Pérez", ... }
export function leerCampos(lead) {
  const campos = {};
  for (const f of lead.field_data || []) campos[f.name] = (f.values || []).join(", ").trim();
  return campos;
}

// Meta puede devolver la clave de la opción («boda») o su texto («Boda»).
function clave(mapa, valor) {
  if (!valor) return "";
  if (mapa[valor]) return valor;
  return Object.entries(mapa).find(([, t]) => t.toLowerCase() === String(valor).toLowerCase())?.[0] || "";
}

export function textoAviso(p, creado) {
  const hora = new Date(creado).toLocaleString("es-CO", {
    timeZone: "America/Bogota", day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
  });
  const prio = prioridad(p);
  return [
    `${EMOJI_PRIORIDAD[prio] || "🎯"} *Nuevo cliente potencial · Sivú*`,
    "",
    `👤 ${p.nombre || "Sin nombre"}`,
    p.telefono ? `📱 +${p.telefono} · wa.me/${p.telefono}` : "📱 Sin teléfono",
    p.ciudad ? `📍 ${p.ciudad}` : null,
    "",
    `🎉 ${EVENTO_NOMBRE[p.evento] || "—"}`,
    `📅 ${CUANDO_NOMBRE[p.cuando] || "—"}`,
    `👥 ${INVITADOS_NOMBRE[p.invitados] || "—"}`,
    "",
    `_Llegó ${hora} desde el formulario del anuncio${prio === "alta" ? " · prioridad alta" : ""}._`,
    ...(process.env.PANEL_URL ? [`_Ficha en el panel: ${process.env.PANEL_URL}_`] : []),
  ].filter((l) => l !== null).join("\n");
}

async function guardarNuevos() {
  const ids = await formularios();
  for (const formulario of ids) {
    const { data = [] } = await graph(`${formulario}/leads`, { fields: "id,created_time,field_data", limit: 100 });
    for (const lead of data) {
      const { rows: [ya] } = await pool.query("SELECT 1 FROM leads_meta WHERE id = $1", [lead.id]);
      if (ya) continue;
      const campos = leerCampos(lead);
      const viejo = Date.now() - new Date(lead.created_time) > VIGENCIA_MS;
      const telefono = normalizarTelefono(campos.phone_number);
      // Antes que nada, la ficha: el contacto no se pierde aunque el aviso falle.
      const { prospecto, nuevo } = await crearOUnir({
        origen: "anuncio",
        nombre: campos.full_name,
        telefono,
        evento: clave({ boda: 1, xv: 1, bautizo: 1, baby: 1, cumple: 1, grado: 1, empresa: 1, otro: 1 }, campos.evento) ||
          clave(EVENTO_NOMBRE, campos.evento),
        cuando: clave(CUANDO_NOMBRE, campos.cuando),
        invitados: clave(INVITADOS_NOMBRE, campos.invitados),
        ciudad: campos.city,
      });
      await pool.query(
        `INSERT INTO leads_meta (id, formulario, creado_en, nombre, telefono, datos, saludado_en, avisado_en, detalle, prospecto_id)
         VALUES ($1, $2, $3, $4, $5, $6, now(), $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [
          lead.id, formulario, lead.created_time, campos.full_name || "", telefono, campos,
          viejo ? new Date() : null, viejo ? "Llegó hace más de un día: no se avisó" : "", prospecto.id,
        ]
      );
      if (nuevo && telefono) etiquetar(jidDe(telefono), "🎯 Cliente potencial");
    }
  }
}

async function avisarPendientes() {
  if (!whatsappConectado()) return;
  const equipo = await telefonosAviso();
  const { rows } = await pool.query(
    `SELECT l.id AS lead_id, l.creado_en AS lead_creado, p.*
     FROM leads_meta l JOIN prospectos p ON p.id = l.prospecto_id
     WHERE l.avisado_en IS NULL AND l.intentos < $1
     ORDER BY l.creado_en`,
    [MAX_INTENTOS]
  );
  for (const lead of rows) {
    const errores = [];
    for (const tel of equipo) {
      const r = await enviarTexto(tel, textoAviso(lead, lead.lead_creado));
      if (r.estado !== "enviado") errores.push(`Aviso a +${tel}: ${r.detalle}`);
    }
    if (!errores.length) {
      await pool.query("UPDATE leads_meta SET avisado_en = now() WHERE id = $1", [lead.lead_id]);
    } else {
      await pool.query("UPDATE leads_meta SET intentos = intentos + 1, detalle = $2 WHERE id = $1", [
        lead.lead_id,
        errores.join(" · "),
      ]);
      console.error(`Lead ${lead.lead_id}:`, errores.join(" · "));
    }
    await saludarSiToca(lead.id);
  }
}

let ultimoError = "";
export const estadoLeads = () => ({ configurado: configurado(), error: ultimoError });

export async function revisarLeads() {
  if (configurado()) {
    try {
      await guardarNuevos();
      ultimoError = "";
    } catch (e) {
      // El mismo error (p. ej. token vencido) se anota una vez, no en cada revisión.
      if (e.message !== ultimoError) console.error("Leads de Meta:", e.message);
      ultimoError = e.message;
    }
  }
  await avisarPendientes();
  await saludarPendientes();
}

export function iniciarLeads() {
  // Una revisión a la vez: si los envíos de una tardan más de un minuto, la
  // siguiente no arranca encima (le escribiría dos veces al mismo contacto).
  let ocupado = false;
  const revisar = async () => {
    if (ocupado) return;
    ocupado = true;
    try {
      await revisarLeads();
    } catch (e) {
      console.error("Leads de Meta:", e);
    } finally {
      ocupado = false;
    }
  };
  setTimeout(revisar, 20 * 1000);
  setInterval(revisar, CADA_MS);
}
