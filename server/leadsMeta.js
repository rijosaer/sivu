import { pool } from "./db.js";
import { enviarTexto, whatsappConectado } from "./whatsappWeb.js";
import { normalizarTelefono, telefonosDe } from "./avisosWhatsapp.js";
import { ahoraEnBogota } from "./hora.js";

// Clientes potenciales de los anuncios de Sivú en Facebook e Instagram. Todo
// se atiende por WhatsApp, así que cada minuto se revisan los
// formularios de cotización de la página y, por cada contacto nuevo:
//  1. Se le escribe desde el WhatsApp de Sivú vinculado (saludo con lo que
//     pidió), para que la conversación quede abierta en ese chat.
//  2. Se avisa a los números del equipo con sus datos.
//
// Variables (servicio invitacion-api):
//   META_PAGE_TOKEN  token de la página con permiso leads_retrieval. Si sale
//                    de un token de usuario de larga duración, no vence.
//   META_LEAD_FORMS  ids de formularios separados por coma (opcional: si no
//                    está, se revisan todos los formularios activos de
//                    META_PAGE_ID).
//   META_PAGE_ID     id de la página (solo si no hay META_LEAD_FORMS).
//   LEADS_WHATSAPP   números del equipo que reciben el aviso (opcional).
//   LEADS_SALUDO     «no» para no escribirle al contacto (por defecto sí).
//
// El saludo al contacto sale de 7 a. m. a 9 p. m. (hora de Colombia); si el
// formulario llega de noche, sale a primera hora. El aviso al equipo sale de
// inmediato. Si el WhatsApp está desvinculado, se reintenta en la siguiente
// revisión.

const API = "https://graph.facebook.com/v21.0";
const CADA_MS = 60 * 1000;
// Contactos de más de un día (por ejemplo, de antes de activar esto) se anotan
// como vistos sin escribirles: un saludo tan tarde ya no tiene sentido.
const VIGENCIA_MS = 24 * 3600 * 1000;
const MAX_INTENTOS = 5;

const OPCIONES = {
  evento: {
    boda: "Boda", xv: "XV años", bautizo: "Bautizo o primera comunión", baby: "Baby shower o revelación",
    cumple: "Cumpleaños", grado: "Grado", empresa: "Evento de empresa", otro: "Otro evento",
  },
  cuando: { mes: "Este mes", "1a3": "En 1 a 3 meses", "3a6": "En 3 a 6 meses", mas6: "En más de 6 meses" },
  invitados: { menos50: "Menos de 50", "50a100": "Entre 50 y 100", "100a200": "Entre 100 y 200", mas200: "Más de 200" },
};

// Cómo se nombra el evento dentro de una frase: «tu boda», «tus XV años».
const EN_FRASE = {
  boda: "tu boda", xv: "tus XV años", bautizo: "tu celebración", baby: "tu baby shower",
  cumple: "tu cumpleaños", grado: "tu grado", empresa: "tu evento de empresa",
};

const configurado = () => Boolean(process.env.META_PAGE_TOKEN && (process.env.META_LEAD_FORMS || process.env.META_PAGE_ID));

async function graph(ruta, params = {}) {
  const url = new URL(`${API}/${ruta}`);
  for (const [k, v] of Object.entries({ ...params, access_token: process.env.META_PAGE_TOKEN })) url.searchParams.set(k, v);
  const r = await fetch(url);
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

const etiqueta = (pregunta, valor) => OPCIONES[pregunta]?.[valor] || valor || "";

// Meta puede devolver la clave de la opción («boda») o su texto («Boda»).
function claveEvento(valor) {
  if (OPCIONES.evento[valor]) return valor;
  return Object.entries(OPCIONES.evento).find(([, t]) => t.toLowerCase() === String(valor).toLowerCase())?.[0] || "";
}

export function textoSaludo(campos) {
  const nombre = (campos.full_name || "").split(/\s+/)[0] || "";
  const evento = EN_FRASE[claveEvento(campos.evento)] || "tu evento";
  return [
    `¡Hola${nombre ? ` ${nombre}` : ""}! 💌 Soy Sivú, de invitaciones digitales.`,
    `Recibimos tu solicitud desde nuestro anuncio para ${evento}.`,
    "",
    "Cuéntanos la fecha y el estilo que te imaginas, y te mostramos diseños y la cotización por aquí mismo.",
  ].join("\n");
}

export function textoAviso(campos, telefono, creado) {
  const hora = new Date(creado).toLocaleString("es-CO", {
    timeZone: "America/Bogota", day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
  });
  return [
    "🎯 *Nuevo cliente potencial · Sivú*",
    "",
    `👤 ${campos.full_name || "Sin nombre"}`,
    telefono ? `📱 +${telefono} · wa.me/${telefono}` : "📱 Sin teléfono",
    campos.city ? `📍 ${campos.city}` : null,
    "",
    `🎉 ${etiqueta("evento", campos.evento) || "—"}`,
    `📅 ${etiqueta("cuando", campos.cuando) || "—"}`,
    `👥 ${etiqueta("invitados", campos.invitados) || "—"}`,
    "",
    `_Llegó ${hora} desde el formulario del anuncio._`,
  ].filter((l) => l !== null).join("\n");
}

async function guardarNuevos() {
  const ids = await formularios();
  for (const formulario of ids) {
    const { data = [] } = await graph(`${formulario}/leads`, { fields: "id,created_time,field_data", limit: 100 });
    for (const lead of data) {
      const campos = leerCampos(lead);
      const viejo = Date.now() - new Date(lead.created_time) > VIGENCIA_MS;
      await pool.query(
        `INSERT INTO leads_meta (id, formulario, creado_en, nombre, telefono, datos, saludado_en, avisado_en, detalle)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
          lead.id, formulario, lead.created_time, campos.full_name || "",
          normalizarTelefono(campos.phone_number), campos,
          viejo ? new Date() : null, viejo ? "Llegó hace más de un día: no se escribió" : "",
        ]
      );
    }
  }
}

async function atenderPendientes() {
  if (!whatsappConectado()) return;
  const equipo = telefonosDe(process.env.LEADS_WHATSAPP);
  const saludar = !/^(no|0|false)$/i.test(process.env.LEADS_SALUDO || "");
  const { hora } = ahoraEnBogota();
  const horaDeSaludar = hora >= 7 && hora < 21;

  const { rows } = await pool.query(
    `SELECT * FROM leads_meta
     WHERE (saludado_en IS NULL OR avisado_en IS NULL) AND intentos < $1
     ORDER BY creado_en`,
    [MAX_INTENTOS]
  );
  for (const lead of rows) {
    const errores = [];
    if (lead.avisado_en === null) {
      if (!equipo.length) {
        await pool.query("UPDATE leads_meta SET avisado_en = now() WHERE id = $1", [lead.id]);
      } else {
        let ok = true;
        for (const tel of equipo) {
          const r = await enviarTexto(tel, textoAviso(lead.datos, lead.telefono, lead.creado_en));
          if (r.estado !== "enviado") { ok = false; errores.push(`Aviso a +${tel}: ${r.detalle}`); }
        }
        if (ok) await pool.query("UPDATE leads_meta SET avisado_en = now() WHERE id = $1", [lead.id]);
      }
    }
    if (lead.saludado_en === null) {
      if (!saludar || lead.telefono.length < 11) {
        await pool.query("UPDATE leads_meta SET saludado_en = now(), detalle = $2 WHERE id = $1", [
          lead.id, saludar ? "Teléfono no válido: no se le escribió" : "Saludo apagado",
        ]);
      } else if (horaDeSaludar) {
        const r = await enviarTexto(lead.telefono, textoSaludo(lead.datos));
        if (r.estado === "enviado") await pool.query("UPDATE leads_meta SET saludado_en = now() WHERE id = $1", [lead.id]);
        else errores.push(`Saludo: ${r.detalle}`);
      }
    }
    if (errores.length) {
      // «Ese número no tiene WhatsApp» no se arregla reintentando.
      const definitivo = errores.some((e) => e.includes("no tiene WhatsApp"));
      await pool.query(
        "UPDATE leads_meta SET intentos = CASE WHEN $3 THEN $4 ELSE intentos + 1 END, detalle = $2 WHERE id = $1",
        [lead.id, errores.join(" · "), definitivo, MAX_INTENTOS]
      );
      console.error(`Lead ${lead.id}:`, errores.join(" · "));
    }
  }
}

let ultimoError = "";
export async function revisarLeads() {
  try {
    await guardarNuevos();
    ultimoError = "";
  } catch (e) {
    // El mismo error (p. ej. token vencido) se anota una vez, no en cada revisión.
    if (e.message !== ultimoError) console.error("Leads de Meta:", e.message);
    ultimoError = e.message;
  }
  await atenderPendientes();
}

export function iniciarLeads() {
  if (!configurado()) return;
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
