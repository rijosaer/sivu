import { SITIO_URL } from "../api";

// Vocabulario y utilidades de la parte del negocio (solo el dueño): clientes
// potenciales, cotizaciones y producción. Espejo de server/ajustes.js.

export const EVENTOS = {
  boda: "Boda",
  xv: "XV años",
  bautizo: "Bautizo / comunión",
  baby: "Baby shower",
  cumple: "Cumpleaños",
  grado: "Grado",
  empresa: "Empresa",
  otro: "Otro",
};
export const EVENTO_EN_FRASE = {
  boda: "tu boda", xv: "tus XV años", bautizo: "tu celebración", baby: "tu baby shower",
  cumple: "tu cumpleaños", grado: "tu grado", empresa: "tu evento de empresa", otro: "tu evento",
};
// Tipo de evento del panel (al convertir un cliente en evento).
export const EVENTO_A_TIPO = {
  boda: "boda", xv: "xv", bautizo: "bautizo", baby: "baby_shower", cumple: "cumpleanos",
  grado: "otro", empresa: "corporativo", otro: "otro",
};
export const CUANDO = { mes: "Este mes", "1a3": "En 1 a 3 meses", "3a6": "En 3 a 6 meses", mas6: "En más de 6 meses" };
export const INVITADOS = { menos50: "Menos de 50", "50a100": "50 a 100", "100a200": "100 a 200", mas200: "Más de 200" };
export const ORIGENES = { anuncio: "Anuncio", whatsapp: "WhatsApp", instagram: "Instagram", referido: "Referido", otro: "Otro" };
export const ESTADOS = {
  nuevo: { nombre: "Nuevo", clase: "insignia-aviso" },
  contactado: { nombre: "Contactado", clase: "insignia-info" },
  cotizado: { nombre: "Cotizado", clase: "insignia-info" },
  ganado: { nombre: "Ganado", clase: "insignia-ok" },
  perdido: { nombre: "Perdido", clase: "insignia-neutra" },
  frio: { nombre: "Frío", clase: "insignia-neutra" },
};
export const PRIORIDAD = {
  alta: { emoji: "🔥", nombre: "Prioridad alta" },
  media: { emoji: "🌤", nombre: "Prioridad media" },
  baja: { emoji: "❄", nombre: "Prioridad baja" },
};
export const MOTIVOS_PERDIDA = ["Precio", "No respondió", "Eligió a otro", "Canceló el evento", "Ya no lo necesita", "Otro"];
export const ETAPAS = {
  datos: "Esperando datos",
  diseno: "En diseño",
  revision: "Revisión del cliente",
  aprobado: "Aprobado",
  enviando: "Enviando invitaciones",
  realizado: "Realizado",
};

export const peso = (n) => (n === null || n === undefined || n === "" ? "—" : `$${Math.round(Number(n)).toLocaleString("es-CO")}`);
export const soloFecha = (v) => (v ? String(v).slice(0, 10) : "");
export const hoyIso = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

export function fechaCorta(v) {
  if (!v) return "";
  return new Date(`${soloFecha(v)}T12:00:00-05:00`).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export function haceCuanto(iso) {
  if (!iso) return "";
  const min = Math.round((Date.now() - new Date(iso)) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `hace ${d} d`;
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export function diasHasta(fecha) {
  if (!fecha) return null;
  return Math.round((new Date(`${soloFecha(fecha)}T00:00:00`) - new Date(`${hoyIso()}T00:00:00`)) / 86400000);
}

// Enlace que abre el chat de WhatsApp con el texto ya escrito. En el celular
// abre la app (si hay varias, el teléfono pregunta con cuál).
export const waUrl = (telefono, texto = "") =>
  `https://wa.me/${String(telefono || "").replace(/\D/g, "")}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;

export const CATALOGO = () => `${SITIO_URL.replace(/\/+$/, "")}/#modelos`;

// Reemplaza {nombre}, {evento}... (igual que el servidor): las líneas cuyo
// comodín no tiene valor se quitan.
export function rellenar(texto, valores) {
  return String(texto || "")
    .split("\n")
    .filter((linea) => [...linea.matchAll(/\{(\w+)\}/g)].every((m) => valores[m[1]] !== "" && valores[m[1]] !== undefined))
    .map((linea) => linea.replace(/\{(\w+)\}/g, (m, k) => valores[k]))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function valoresDe(p, extra = {}) {
  return {
    nombre: (p.nombre || "").split(/\s+/)[0] || "",
    evento: EVENTO_EN_FRASE[p.evento] || "tu evento",
    valor: p.valor_cotizado ? peso(p.valor_cotizado) : "",
    catalogo: CATALOGO(),
    cotizacion: extra.cotizacion || "",
    datos: extra.datos || "",
  };
}

// CSV que Excel abre bien en español: separador «;» y BOM para las tildes.
export function descargarCsv(nombre, filas) {
  const escapar = (v) => {
    const t = String(v ?? "");
    return /[;"\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const csv = "﻿" + filas.map((f) => f.map(escapar).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// Campos del formulario de datos del evento (espejo de src/datos/campos.js
// del sitio): clave → etiqueta.
export const CAMPOS_DATOS = [
  ["nombres", "Quién(es) celebra(n)"],
  ["frase", "Frase o texto de bienvenida"],
  ["padres", "Padres / padrinos"],
  ["fecha", "Fecha"],
  ["hora", "Hora"],
  ["lugar", "Lugar (ceremonia o evento)"],
  ["direccion", "Dirección"],
  ["mapa", "Ubicación en Google Maps"],
  ["lugar_recepcion", "Lugar de la recepción"],
  ["direccion_recepcion", "Dirección de la recepción"],
  ["hora_recepcion", "Hora de la recepción"],
  ["vestimenta", "Vestimenta"],
  ["regalos", "Regalos / lluvia de sobres"],
  ["limite_confirmacion", "Fecha límite para confirmar"],
  ["telefono_avisos", "WhatsApp para recibir las confirmaciones"],
  ["estilo", "Estilo, colores e ideas"],
  ["cancion", "Canción"],
  ["notas", "Algo más"],
];
