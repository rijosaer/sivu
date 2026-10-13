import { pool } from "./db.js";
import { telefonosDe } from "./avisosWhatsapp.js";

// Configuración del negocio editable desde el panel (pestaña Configuración):
// todo lo que antes vivía en variables de Railway o en el código y que el
// dueño quiere poder cambiar sin pedirle a nadie. Se guarda por bloques en la
// tabla «ajustes» (clave → JSON); lo que no se ha tocado sale de DEFECTOS.

export const SITIO = () => (process.env.SITIO_URL || "https://heysivu.com").replace(/\/+$/, "");

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export const DEFECTOS = {
  // Mensaje automático al cliente que llena el formulario del anuncio. Arranca
  // apagado: el dueño lo prende cuando defina el texto y el horario.
  saludo: {
    activo: false,
    texto: [
      "¡Hola {nombre}! 💌 Gracias por escribirnos. Somos *Sivú*, invitaciones digitales.",
      "",
      "Ya recibimos tu solicitud para {evento}. Una persona de nuestro equipo te escribirá por este chat para conocer tu evento y enviarte la cotización.",
      "",
      "🕘 Atendemos {horario}.",
      "",
      "Mientras tanto, si quieres adelantar, cuéntanos por aquí:",
      "• Fecha y ciudad del evento",
      "• El estilo o los colores que te imaginas",
      "• Si tienes alguna invitación de referencia que te guste",
      "",
      "Así, cuando te escribamos, llegamos con todo listo. ✨",
    ].join("\n"),
    // Fuera del horario de atención cambia la línea del equipo.
    textoFueraHorario: [
      "¡Hola {nombre}! 💌 Gracias por escribirnos. Somos *Sivú*, invitaciones digitales.",
      "",
      "Ya recibimos tu solicitud para {evento}. En este momento estamos fuera de horario; te escribiremos {proxima_atencion} para conocer tu evento y enviarte la cotización.",
      "",
      "Mientras tanto, si quieres adelantar, cuéntanos por aquí:",
      "• Fecha y ciudad del evento",
      "• El estilo o los colores que te imaginas",
      "• Si tienes alguna invitación de referencia que te guste",
      "",
      "Así, cuando te escribamos, llegamos con todo listo. ✨",
    ].join("\n"),
    // Para quien escribe directo por WhatsApp (sin formulario): apagado por
    // defecto, porque al número también escriben amigos y proveedores.
    responderWhatsappDirecto: false,
    // Nunca se escribe de madrugada: fuera de esta franja el mensaje espera.
    enviarDesde: 7,
    enviarHasta: 21,
  },
  // Horario de atención del equipo. Sin definir, los mensajes no lo mencionan.
  horario: { definido: false, dias: [1, 2, 3, 4, 5, 6], desde: 8, hasta: 18 },
  // Quién recibe el aviso de cada cliente potencial nuevo.
  avisos: { telefonos: [], whatsappDirecto: true, cotizacionAceptada: true, datosRecibidos: true },
  // Captura: quien escribe por primera vez al WhatsApp de Sivú y no es
  // invitado ni cliente se vuelve cliente potencial.
  captura: { whatsappDirecto: true },
  // Reporte de cada mañana.
  reporte: { activo: true, hora: 7, minuto: 30, telefonos: [], filtroCampana: "Sivú" },
  // Orden del WhatsApp: etiquetas de WhatsApp Business y archivo automático
  // de los chats de invitados después de enviarles su invitación.
  whatsapp: { etiquetar: true, archivarInvitados: true },
  // Seguimientos.
  seguimiento: { diasCotizado: 2, diasFrio: 7 },
  // Textos que el dueño manda con un toque desde la ficha del cliente.
  respuestas: [
    {
      id: "datos",
      titulo: "Pedir datos",
      texto:
        "¡Hola {nombre}! Soy de Sivú 💌 Para prepararte la cotización de {evento}, cuéntame:\n• Fecha y ciudad\n• Número aproximado de invitados\n• El estilo o los colores que te imaginas\n• Si tienes alguna invitación de referencia",
    },
    {
      id: "catalogo",
      titulo: "Enviar catálogo",
      texto:
        "¡Hola {nombre}! Aquí puedes ver nuestros diseños y cómo funcionan las invitaciones (confirmación de asistencia, música, mapa y más): {catalogo}\n\nCuéntame cuál te gusta y lo adaptamos a {evento} ✨",
    },
    {
      id: "cotizacion",
      titulo: "Enviar cotización",
      texto: "¡Hola {nombre}! Te comparto la cotización de {evento} 💌\n{cotizacion}\n\nCualquier ajuste me dices y lo revisamos.",
    },
    {
      id: "seguimiento1",
      titulo: "Seguimiento 1",
      texto: "¡Hola {nombre}! ¿Pudiste revisar la cotización de {evento}? Si quieres ajustamos algo o te muestro más diseños 😊",
    },
    {
      id: "seguimiento2",
      titulo: "Seguimiento 2",
      texto:
        "¡Hola {nombre}! Te escribo de Sivú para saber si sigues interesada/o en la invitación de {evento}. Las fechas se nos llenan, así que si quieres te aparto el espacio desde ya 💌",
    },
    {
      id: "bienvenida",
      titulo: "Bienvenida de cliente",
      texto:
        "¡{nombre}, bienvenida/o a Sivú! 🎉 Gracias por confiar en nosotros para {evento}.\n\nPara empezar, llena aquí los datos de tu evento (puedes subir fotos, música y tu lista de invitados): {datos}\n\nApenas lo recibamos arrancamos con el diseño.",
    },
  ],
  // Planes y extras para armar cotizaciones.
  planes: [
    {
      id: "general",
      nombre: "General",
      precio: 150000,
      descripcion: "Una tarjeta, toda la información, un solo enlace para todos.",
      incluye: [
        "Tarjeta con toda la información del evento",
        "Diseño temático a tu elección",
        "Cuenta regresiva y agregar al calendario",
        "Confirmación de asistencia general",
      ],
    },
    {
      id: "personalizada",
      nombre: "Personalizada",
      precio: 200000,
      descripcion: "Todo lo de General, más control de quién confirma.",
      incluye: [
        "Enlace único por invitado, familia o cupo",
        "Tablero de confirmados y pendientes",
        "Exportación de la lista en PDF",
        "Recordatorios personalizados a quien falta",
      ],
    },
    {
      id: "gestion",
      nombre: "Personalizada + Gestión",
      precio: 250000,
      descripcion: "Todo lo anterior, pero lo operamos nosotros por ti.",
      incluye: [
        "Cargamos tu lista de invitados",
        "Enviamos cada enlace personalizado",
        "Seguimiento diario de confirmaciones",
        "Entrega final del PDF de confirmados",
      ],
    },
  ],
  extras: [],
  // Lo que ve el cliente en la cotización.
  cotizacion: {
    vigenciaDias: 8,
    notas: "El valor final depende del número de invitados y del evento. Se separa la fecha con el 50 % y el saldo se paga antes del envío.",
    pago: "",
  },
};

export const CLAVES = Object.keys(DEFECTOS);

export async function leerAjuste(clave) {
  const { rows } = await pool.query("SELECT valor FROM ajustes WHERE clave = $1", [clave]);
  const def = DEFECTOS[clave];
  if (!rows.length) return structuredClone(def);
  const valor = rows[0].valor;
  // Bloques objeto: lo guardado manda, y lo que falte sale del defecto (así
  // un ajuste nuevo en el código no deja vacío lo que ya se había guardado).
  if (def && !Array.isArray(def) && typeof def === "object") return { ...structuredClone(def), ...valor };
  return valor;
}

export async function leerAjustes() {
  const { rows } = await pool.query("SELECT clave, valor FROM ajustes");
  const guardados = Object.fromEntries(rows.map((r) => [r.clave, r.valor]));
  const todo = {};
  for (const clave of CLAVES) {
    const def = DEFECTOS[clave];
    const g = guardados[clave];
    todo[clave] = g === undefined ? structuredClone(def) : !Array.isArray(def) ? { ...structuredClone(def), ...g } : g;
  }
  return todo;
}

export async function guardarAjuste(clave, valor) {
  await pool.query(
    `INSERT INTO ajustes (clave, valor) VALUES ($1, $2)
     ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, actualizado_en = now()`,
    [clave, JSON.stringify(valor)]
  );
}

// Valores internos (no los edita el dueño): marcas como «último reporte».
export async function leerInterno(clave) {
  const { rows } = await pool.query("SELECT valor FROM ajustes WHERE clave = $1", [`_${clave}`]);
  return rows.length ? rows[0].valor : null;
}
export async function guardarInterno(clave, valor) {
  await guardarAjuste(`_${clave}`, valor);
}

// ---------- Números de aviso ----------

// Los del panel; si todavía no se guardó ninguno, los de LEADS_WHATSAPP.
export async function telefonosAviso() {
  const { telefonos } = await leerAjuste("avisos");
  const lista = telefonosDe((telefonos || []).join(","));
  return lista.length ? lista : telefonosDe(process.env.LEADS_WHATSAPP);
}

export async function telefonosReporte() {
  const { telefonos } = await leerAjuste("reporte");
  const lista = telefonosDe((telefonos || []).join(","));
  return lista.length ? lista : telefonosAviso();
}

// ---------- Horario ----------

const hora12 = (h) => (h === 0 ? "12 a. m." : h < 12 ? `${h} a. m.` : h === 12 ? "12 m." : `${h - 12} p. m.`);

// «de lunes a sábado, de 8 a. m. a 6 p. m.»
export function describirHorario(h) {
  if (!h?.definido) return "";
  const dias = [...new Set(h.dias)].sort((a, b) => a - b);
  let texto;
  const seguidos = dias.length > 1 && dias.every((d, i) => i === 0 || d === dias[i - 1] + 1);
  if (dias.length === 7) texto = "todos los días";
  else if (seguidos) texto = `de ${DIAS[dias[0]]} a ${DIAS[dias.at(-1)]}`;
  else texto = `los ${dias.map((d) => DIAS[d]).join(", ").replace(/, ([^,]*)$/, " y $1")}`;
  return `${texto}, de ${hora12(h.desde)} a ${hora12(h.hasta)}`;
}

// Hora y día de la semana en Colombia de una fecha.
function enBogota(fecha = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Bogota", weekday: "short", hour: "2-digit", hourCycle: "h23",
    }).formatToParts(fecha).map((x) => [x.type, x.value])
  );
  const dia = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { dia, hora: Number(p.hour) };
}

export function dentroDeHorario(h, fecha = new Date()) {
  if (!h?.definido) return true;
  const { dia, hora } = enBogota(fecha);
  return h.dias.includes(dia) && hora >= h.desde && hora < h.hasta;
}

// «hoy a las 8 a. m.», «mañana a primera hora», «el lunes en la mañana»...
export function proximaAtencion(h, fecha = new Date()) {
  if (!h?.definido) return "en cuanto podamos";
  const { dia, hora } = enBogota(fecha);
  if (h.dias.includes(dia) && hora < h.desde) return `hoy desde las ${hora12(h.desde)}`;
  for (let i = 1; i <= 7; i++) {
    const d = (dia + i) % 7;
    if (h.dias.includes(d)) return i === 1 ? "mañana a primera hora" : `el ${DIAS[d]} en la mañana`;
  }
  return "en cuanto podamos";
}

// Cómo se nombra cada evento dentro de una frase.
export const EVENTO_EN_FRASE = {
  boda: "tu boda", xv: "tus XV años", bautizo: "tu celebración", baby: "tu baby shower",
  cumple: "tu cumpleaños", grado: "tu grado", empresa: "tu evento de empresa", otro: "tu evento",
};
export const EVENTO_NOMBRE = {
  boda: "Boda", xv: "XV años", bautizo: "Bautizo o primera comunión", baby: "Baby shower o revelación",
  cumple: "Cumpleaños", grado: "Grado", empresa: "Evento de empresa", otro: "Otro evento",
};
export const CUANDO_NOMBRE = { mes: "Este mes", "1a3": "En 1 a 3 meses", "3a6": "En 3 a 6 meses", mas6: "En más de 6 meses" };
export const INVITADOS_NOMBRE = {
  menos50: "Menos de 50", "50a100": "Entre 50 y 100", "100a200": "Entre 100 y 200", mas200: "Más de 200",
};

// Reemplaza {nombre}, {evento}... Las líneas cuyo comodín quedó vacío se
// quitan (p. ej. «Atendemos {horario}.» sin horario definido).
export function rellenar(texto, valores) {
  return String(texto || "")
    .split("\n")
    .filter((linea) => !/\{(\w+)\}/.test(linea) || [...linea.matchAll(/\{(\w+)\}/g)].every((m) => valores[m[1]] !== ""))
    .map((linea) => linea.replace(/\{(\w+)\}/g, (m, k) => (k in valores ? valores[k] : m)))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
