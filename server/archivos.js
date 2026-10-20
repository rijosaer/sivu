import { createHmac, timingSafeEqual } from "node:crypto";
import { secretoFirma } from "./auth.js";

// Archivos subidos (fotos, audio, fondo, decoraciones): qué se acepta, cómo
// se comprueba que el archivo sea de verdad lo que dice ser, y cómo se sirve
// sin que pueda convertirse en una página ejecutable del dominio de la API.

export const MAX_BYTES = 12 * 1024 * 1024; // tope por archivo, ya decodificado

// El tipo lo declara el navegador de quien sube, así que no vale por sí solo:
// además se miran los primeros bytes. HTML, SVG, JS, PDF... nada de eso entra:
// antes cualquiera con acceso al panel podía subir "data:text/html;base64,..."
// y la API lo servía como página en api.heysivu.com (XSS almacenado).
const FIRMAS = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/gif": (b) => b.subarray(0, 4).toString("latin1") === "GIF8",
  "image/webp": (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
  "image/avif": (b) => b.subarray(4, 8).toString("latin1") === "ftyp" && /avi[fs]/.test(b.subarray(8, 12).toString("latin1")),
  "audio/mpeg": (b) => b.subarray(0, 3).toString("latin1") === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0),
  "audio/mp4": (b) => b.subarray(4, 8).toString("latin1") === "ftyp",
  "audio/aac": (b) => b[0] === 0xff && (b[1] & 0xf6) === 0xf0,
  "audio/ogg": (b) => b.subarray(0, 4).toString("latin1") === "OggS",
  "audio/wav": (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WAVE",
  "audio/webm": (b) => b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])),
};

// Sinónimos que mandan algunos navegadores para el mismo formato.
const ALIAS = {
  "image/jpg": "image/jpeg",
  "audio/mp3": "audio/mpeg",
  "audio/x-m4a": "audio/mp4",
  "audio/m4a": "audio/mp4",
  "audio/x-wav": "audio/wav",
  "audio/wave": "audio/wav",
  "audio/vnd.wave": "audio/wav",
  "audio/x-aac": "audio/aac",
  "image/pjpeg": "image/jpeg",
  "image/x-png": "image/png",
  "audio/x-mpeg": "audio/mpeg",
  "audio/mpeg3": "audio/mpeg",
};

export const IMAGENES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];
export const AUDIOS = ["audio/mpeg", "audio/mp4", "audio/aac", "audio/ogg", "audio/wav", "audio/webm"];

// Acepta "data:image/png;base64,AAA..." y devuelve { mime, buffer } solo si
// el tipo está en la lista y los bytes lo confirman. Si no, null.
export function leerDataUrl(dataUrl, permitidos) {
  if (typeof dataUrl !== "string") return null;
  const m = /^data:([a-z0-9.+/-]{3,60})(?:;[a-z0-9=.-]{1,40})*;base64,([A-Za-z0-9+/=\s]+)$/i.exec(dataUrl);
  if (!m) return null;
  const mime = ALIAS[m[1].toLowerCase()] || m[1].toLowerCase();
  if (!permitidos.includes(mime)) return null;
  const buffer = Buffer.from(m[2], "base64");
  if (buffer.length < 12 || buffer.length > MAX_BYTES) return null;
  if (!FIRMAS[mime]?.(buffer)) return null;
  return { mime, buffer, dataUrl: `data:${mime};base64,${buffer.toString("base64")}` };
}

// Envía un archivo de una invitación (foto, audio, fondo, decoración). Lo que
// se guardó antes de este filtro puede venir con otro nombre para el mismo
// formato (audio/mp3, audio/x-m4a, image/jpg...) o ser un SVG: se normaliza y
// se sigue mostrando, para que ninguna invitación existente pierda su música
// ni sus imágenes. El CSP sandbox de la respuesta impide que un SVG ejecute
// código aunque se abra directo. Cualquier otro tipo (HTML, JS...) se entrega
// como descarga binaria, nunca como página.
const MOSTRABLES = new Set([
  ...IMAGENES, "image/heic", "image/heif", "image/svg+xml",
  ...AUDIOS, "video/mp4", "video/webm",
]);

export function enviarArchivo(res, mime, buffer) {
  const base = String(mime || "").toLowerCase().split(";")[0].trim();
  const tipo = ALIAS[base] || base;
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  res.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  if (!MOSTRABLES.has(tipo)) {
    res.set("Content-Disposition", "attachment");
    return res.type("application/octet-stream").send(buffer);
  }
  res.type(tipo).send(buffer);
}

// Archivos que llegan de afuera (WhatsApp, comprobantes, el formulario del
// cliente) y que el panel muestra. Quien los manda decide el tipo que
// declaran: un "documento" de WhatsApp con tipo text/html, abierto desde el
// panel, se ejecutaba con la sesión del dueño. Solo se respeta el tipo si es
// imagen, audio, video o PDF; cualquier otro se entrega como binario para
// descargar, nunca para mostrar.
const SERVIBLES = new Set([
  ...IMAGENES, "image/heic", "image/heif",
  ...AUDIOS, "audio/ogg; codecs=opus", "audio/amr", "audio/3gpp",
  "video/mp4", "video/webm", "video/3gpp", "video/quicktime",
  "application/pdf",
]);

export function tipoServible(mime) {
  const base = String(mime || "").toLowerCase().split(";")[0].trim();
  return SERVIBLES.has(base) ? base : "application/octet-stream";
}

export function enviarAdjunto(res, mime, buffer, { nombre = "", inline = true, cache } = {}) {
  const tipo = tipoServible(mime);
  const archivo = encodeURIComponent(nombre || "archivo");
  const modo = inline && tipo !== "application/octet-stream" ? "inline" : "attachment";
  res.set("Content-Type", tipo);
  res.set("Content-Disposition", `${modo}; filename="${archivo}"`);
  res.set("Content-Security-Policy", "default-src 'none'; sandbox");
  if (cache) res.set("Cache-Control", cache);
  res.send(buffer);
}

// ---------- URLs firmadas de /api/public/medio/:id ----------
// Los ids de medios son consecutivos: con solo ir sumando 1 se podían bajar
// las fotos de todos los eventos, incluidos los que aún no se publican. Ahora
// cada URL lleva una firma HMAC que solo el servidor sabe calcular, y la
// entrega únicamente a quien ya podía ver ese archivo (el sitio del evento o
// su panel). Sin firma válida, el archivo "no existe".

function firma(id) {
  return createHmac("sha256", secretoFirma("medios")).update(String(id)).digest("base64url").slice(0, 22);
}

export function urlMedio(id) {
  return `/api/public/medio/${id}?f=${firma(id)}`;
}

export function firmaValida(id, f) {
  if (typeof f !== "string" || f.length !== 22) return false;
  const a = Buffer.from(firma(id));
  const b = Buffer.from(f);
  return a.length === b.length && timingSafeEqual(a, b);
}
