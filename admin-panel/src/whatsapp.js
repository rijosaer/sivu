// Prefijo que se asume cuando el número se escribe sin indicativo de país.
const PAIS_POR_DEFECTO = "57"; // Colombia

// wa.me necesita el número en formato internacional y solo con dígitos: sin
// "+", sin espacios, sin guiones. Un número colombiano de 10 dígitos se
// completa con el 57; si ya trae indicativo se respeta tal cual.
export function normalizarTelefono(valor) {
  const digitos = String(valor || "").replace(/\D/g, "");
  if (!digitos) return "";
  if (digitos.length === 10) return PAIS_POR_DEFECTO + digitos;
  // Un 0 o un 00 al inicio son formas locales de marcar al exterior.
  return digitos.replace(/^0+/, "");
}

export function telefonoValido(valor) {
  const n = normalizarTelefono(valor);
  return n.length >= 10 && n.length <= 15;
}

// Días completos que faltan hasta `fecha`, contados en día calendario de
// Bogotá para que no se corran por la zona horaria del navegador. Acepta tanto
// "2026-10-15" como una fecha con hora ("2026-11-14T17:00:00-05:00"): en ambos
// casos compara solo el día. Devuelve null si la fecha no sirve.
export function diasHasta(fecha) {
  if (!fecha) return null;
  const destino = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? `${fecha}T12:00:00-05:00` : fecha
  );
  if (isNaN(destino)) return null;
  const diaEnBogota = (d) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  const ms = new Date(`${diaEnBogota(destino)}T00:00:00`) - new Date(`${diaEnBogota(new Date())}T00:00:00`);
  return Math.round(ms / 86400000);
}

// Los días se escriben como número pelado para que la plantilla los use como
// quiera ("faltan {dias} días"). Si la fecha ya pasó se muestra 0 en vez de un
// número negativo, que quedaría absurdo en el mensaje. Ojo: por eso el número
// solo no distingue "hoy es el último día" de "cerró hace una semana"; para
// hablar del plazo en un mensaje está {plazo}, que sí lo dice.
function numeroDias(dias) {
  if (dias === null || dias === undefined) return "";
  return String(Math.max(0, dias));
}

// Frase hecha del plazo de confirmación. Existe porque el número pelado se
// queda corto en los dos extremos: en español "quedan 1 días" está mal escrito
// y "quedan 0 días" es mentira tanto el último día como después del cierre.
export function textoPlazo(dias) {
  if (dias === null || dias === undefined) return "";
  if (dias < 0) return "el plazo para confirmar ya cerró";
  if (dias === 0) return "hoy es el último día para confirmar";
  if (dias === 1) return "queda 1 día para confirmar";
  return `quedan ${dias} días para confirmar`;
}

// Frase hecha de los cupos, para las invitaciones de tipo "titular + cupos".
// Va con punto final y en mayúscula porque es una frase suelta: la plantilla
// es la misma para todos, y en una invitación sin cupos esto queda vacío. Por
// eso tiene que poder ocupar su propio renglón y desaparecer entero, en vez de
// dejar a medias una frase como "tienes __ cupos".
export function textoCupos(cupos) {
  if (!cupos) return "";
  return cupos === 1
    ? "Tu invitación incluye un cupo adicional: al confirmar escribes el nombre de tu acompañante."
    : `Tu invitación incluye ${cupos} cupos adicionales: al confirmar escribes los nombres de tus acompañantes.`;
}

function conMayuscula(texto) {
  return texto ? texto[0].toUpperCase() + texto.slice(1) : texto;
}

// Cualquier cosa entre llaves, en una sola línea. Lo que no se reconozca se
// deja intacto: quien escriba llaves por gusto no debería ver desaparecer su
// texto.
const MARCADOR = /\{([^{}\n]+)\}/g;

// Escribir "{días_limite}" es lo natural en español, y antes esa tilde bastaba
// para que el marcador viajara tal cual hasta el WhatsApp del invitado. Se
// comparan sin tildes, sin mayúsculas y con espacios o guiones como "_", que es
// como la gente lo teclea de verdad.
function normalizarClave(bruta) {
  return bruta
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // los acentos van aparte tras NFD
    .replace(/[\s-]+/g, "_");
}

// Nombres alternativos que alguien puede escribir de memoria sin volver a mirar
// la ayuda del panel.
const ALIAS = {
  link: "enlace",
  url: "enlace",
  invitacion: "enlace",
  dias_boda: "dias",
  diaslimite: "dias_limite",
  dias_limites: "dias_limite",
  limite: "dias_limite",
  fecha_limite: "dias_limite",
  cupo: "cupos",
  cupos_texto: "cupos",
  acompanantes: "cupos",
  numero_cupos: "cupos_numero",
  cantidad_cupos: "cupos_numero",
  cupos_num: "cupos_numero",
};

function valoresDe({ nombre, enlace, dias, diasLimite, cupos }) {
  return {
    nombre: nombre || "",
    enlace: enlace || "",
    dias: numeroDias(dias),
    dias_limite: numeroDias(diasLimite),
    plazo: textoPlazo(diasLimite),
    // Los dos quedan vacíos en las invitaciones que no manejan cupos, que son
    // la mayoría: la plantilla es una sola para todas.
    cupos: textoCupos(cupos),
    cupos_numero: cupos ? String(cupos) : "",
  };
}

function claveDe(bruta) {
  const clave = normalizarClave(bruta);
  return ALIAS[clave] || clave;
}

// True cuando la fecha límite ya pasó. El panel lo usa para no ofrecer
// recordatorios que mandarían a la gente a un formulario que el servidor
// rechaza.
export function plazoCerrado(diasLimite) {
  return diasLimite !== null && diasLimite !== undefined && diasLimite < 0;
}

// Marcadores escritos en la plantilla que no se van a reemplazar. El panel los
// muestra mientras se escribe el mensaje: es la única forma de enterarse antes
// de que le llegue al invitado.
export function marcadoresDesconocidos(plantilla) {
  const conocidos = valoresDe({});
  const encontrados = String(plantilla || "").match(MARCADOR) || [];
  return [...new Set(encontrados.filter((m) => !(claveDe(m.slice(1, -1)) in conocidos)))];
}

// {nombre}, {enlace}, {dias}, {dias_limite}, {plazo}, {cupos} y {cupos_numero}
// son lo único que se reemplaza. Si el marcador se escribió con inicial
// mayúscula ("¡{Plazo}!", que en español es justo donde se quiere poner la
// frase), el texto sale también con mayúscula.
//
// Un renglón que existía solo por un marcador y que se queda vacío desaparece:
// {cupos} no dice nada en las invitaciones sin cupos, y sin esto la mayoría de
// los mensajes saldrían con un renglón en blanco de más. Los renglones vacíos
// que el usuario escribió a propósito no se tocan: solo se quitan los que
// cambiaron al reemplazar.
export function armarMensaje(plantilla, datos) {
  const valores = valoresDe(datos);
  let seVacio = false;
  const lineas = [];
  for (const linea of String(plantilla || "").split("\n")) {
    const nueva = linea.replace(MARCADOR, (entero, bruta) => {
      const clave = claveDe(bruta);
      if (!(clave in valores)) return entero;
      return /^\p{Lu}/u.test(bruta.trim()) ? conMayuscula(valores[clave]) : valores[clave];
    });
    if (nueva !== linea && !nueva.trim()) {
      seVacio = true;
      continue;
    }
    lineas.push(nueva);
  }
  const texto = lineas.join("\n");
  // Al borrar ese renglón puede quedar un hueco doble donde antes había uno.
  return seVacio ? texto.replace(/\n{3,}/g, "\n\n") : texto;
}

export function enlaceWhatsApp(telefono, mensaje) {
  const numero = normalizarTelefono(telefono);
  const texto = encodeURIComponent(mensaje);
  // Sin número, wa.me abre el selector de contacto de WhatsApp con el
  // mensaje ya escrito: sirve para los invitados a los que no les guardaste
  // el teléfono.
  return numero ? `https://wa.me/${numero}?text=${texto}` : `https://wa.me/?text=${texto}`;
}

export function fechaLegible(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    timeZone: "America/Bogota",
  });
}
