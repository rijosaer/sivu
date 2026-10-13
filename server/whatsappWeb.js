import makeWASocket, {
  Browsers, BufferJSON, DisconnectReason, downloadMediaMessage, fetchLatestBaileysVersion, initAuthCreds, proto,
} from "@whiskeysockets/baileys";
import pino from "pino";
import QRCode from "qrcode";
import { pool } from "./db.js";

// Conexión a WhatsApp como dispositivo vinculado (lo mismo que WhatsApp Web),
// con la librería Baileys. Es la salida provisional de los avisos mientras no
// esté la cuenta oficial de WhatsApp Business: no es un canal autorizado por
// WhatsApp y el número puede ser bloqueado, así que debe ser un número aparte
// de Sivú, nunca el personal.
//
// El dueño lo vincula desde el panel escaneando un QR. La sesión vive en la
// tabla whatsapp_sesion, así sobrevive a reinicios y despliegues.

const silencio = pino({ level: "silent" });

let sock = null;
let estado = "apagado"; // apagado | conectando | qr | conectado
let qr = null; // imagen del QR (data URL) mientras se espera el escaneo
let numero = null;
let reintento = null;
let ultimoError = "";
const oyentes = new Set();
const etiquetas = new Map(); // id → { nombre, borrada }

export function alRecibirMensajes(fn) {
  oyentes.add(fn);
}
export const socketActual = () => (estado === "conectado" ? sock : null);
export const numeroVinculado = () => numero;
export const etiquetasConocidas = () => etiquetas;

// ---------- Sesión en Postgres (espejo de useMultiFileAuthState) ----------

async function leer(clave) {
  const { rows } = await pool.query("SELECT valor FROM whatsapp_sesion WHERE clave = $1", [clave]);
  return rows.length ? JSON.parse(rows[0].valor, BufferJSON.reviver) : null;
}
async function escribir(clave, valor) {
  await pool.query(
    `INSERT INTO whatsapp_sesion (clave, valor) VALUES ($1, $2)
     ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, actualizado_en = now()`,
    [clave, JSON.stringify(valor, BufferJSON.replacer)]
  );
}
async function borrar(clave) {
  await pool.query("DELETE FROM whatsapp_sesion WHERE clave = $1", [clave]);
}
async function borrarSesion() {
  await pool.query("DELETE FROM whatsapp_sesion");
}

async function sesionEnBase() {
  const creds = (await leer("creds")) || initAuthCreds();
  return {
    state: {
      creds,
      keys: {
        get: async (tipo, ids) => {
          const datos = {};
          await Promise.all(
            ids.map(async (id) => {
              let valor = await leer(`${tipo}-${id}`);
              if (tipo === "app-state-sync-key" && valor) valor = proto.Message.AppStateSyncKeyData.fromObject(valor);
              datos[id] = valor;
            })
          );
          return datos;
        },
        set: async (datos) => {
          const tareas = [];
          for (const tipo in datos) {
            for (const id in datos[tipo]) {
              const valor = datos[tipo][id];
              tareas.push(valor ? escribir(`${tipo}-${id}`, valor) : borrar(`${tipo}-${id}`));
            }
          }
          await Promise.all(tareas);
        },
      },
    },
    guardarCreds: () => escribir("creds", creds),
  };
}

// ---------- Conexión ----------

export async function conectar() {
  if (sock && estado !== "apagado") return;
  clearTimeout(reintento);
  estado = "conectando";
  qr = null;
  ultimoError = "";
  const { state, guardarCreds } = await sesionEnBase();
  let version;
  try {
    ({ version } = await fetchLatestBaileysVersion());
  } catch {
    /* usa la versión que trae la librería */
  }
  const nuevo = makeWASocket({
    auth: state,
    version,
    logger: silencio,
    browser: Browsers.macOS("Chrome"),
    markOnlineOnConnect: false,
    syncFullHistory: false,
    shouldSyncHistoryMessage: () => false,
  });
  sock = nuevo;
  nuevo.ev.on("creds.update", guardarCreds);
  // Mensajes que entran y salen (también los que se escriben desde el
  // celular): los guarda waOrden.js para el panel.
  nuevo.ev.on("messages.upsert", (u) => {
    if (sock !== nuevo) return;
    for (const fn of oyentes) {
      Promise.resolve(fn(u)).catch((e) => console.error("WhatsApp (mensajes):", e.message));
    }
  });
  // Etiquetas de WhatsApp Business que ya existen en la cuenta (llegan al
  // sincronizar): para no repetir ids al crear las de Sivú.
  nuevo.ev.on("labels.edit", (l) => {
    if (l?.id) etiquetas.set(String(l.id), { nombre: l.name, borrada: Boolean(l.deleted) });
  });
  nuevo.ev.on("connection.update", async (u) => {
    if (sock !== nuevo) return; // una conexión vieja que se cerró tarde
    if (u.qr) {
      estado = "qr";
      qr = await QRCode.toDataURL(u.qr, { margin: 1, width: 280 });
    }
    if (u.connection === "open") {
      estado = "conectado";
      qr = null;
      numero = (nuevo.user?.id || "").split(/[:@]/)[0] || null;
      console.log(`WhatsApp vinculado: ${numero}`);
    }
    if (u.connection === "close") {
      const codigo = u.lastDisconnect?.error?.output?.statusCode;
      sock = null;
      numero = null;
      if (codigo === DisconnectReason.loggedOut) {
        // Lo desvincularon desde el celular: hay que escanear otra vez.
        await borrarSesion();
        estado = "apagado";
        qr = null;
        ultimoError = "El número se desvinculó desde el celular.";
        console.log("WhatsApp desvinculado");
        return;
      }
      // Justo después de escanear, WhatsApp cierra y pide reiniciar: eso no
      // es un QR vencido.
      if (estado === "qr" && codigo !== DisconnectReason.restartRequired) {
        // El QR venció sin escanearse: no se insiste solo.
        estado = "apagado";
        qr = null;
        ultimoError = "El QR venció. Vuelve a intentarlo.";
        return;
      }
      // Se cayó la conexión (reinicio pedido por WhatsApp, red...): se reintenta.
      estado = "conectando";
      reintento = setTimeout(() => {
        estado = "apagado";
        conectar().catch((e) => console.error("WhatsApp no pudo reconectar:", e));
      }, codigo === DisconnectReason.restartRequired ? 500 : 5000);
    }
  });
}

export async function desconectar() {
  clearTimeout(reintento);
  const viejo = sock;
  sock = null;
  try {
    await viejo?.logout();
  } catch {
    viejo?.end?.();
  }
  await borrarSesion();
  estado = "apagado";
  qr = null;
  numero = null;
}

export function estadoWhatsapp() {
  return { estado, qr, numero, error: ultimoError };
}

export const whatsappConectado = () => estado === "conectado" && Boolean(sock);

// Al arrancar el servidor: si ya había un número vinculado, se reconecta solo.
export async function reanudarWhatsapp() {
  try {
    if (await leer("creds")) await conectar();
  } catch (e) {
    console.error("No se pudo reanudar WhatsApp:", e.message);
  }
}

// ---------- Envío ----------
// De a uno, con pausas y «escribiendo...» como una persona: los envíos en
// ráfaga son lo que más marca a un número como bot.

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const azar = (min, max) => min + Math.random() * (max - min);
let cola = Promise.resolve();

// Números a los que el servidor les está escribiendo solo (saludo
// automático): sus mensajes no cuentan como «el dueño ya le escribió».
const automaticos = new Set();
export const esAutomatico = (telefono) => automaticos.has(String(telefono));

export function enviarTexto(telefono, texto, { automatico = false } = {}) {
  if (automatico) automaticos.add(String(telefono));
  const tarea = cola.then(async () => {
    if (!whatsappConectado()) return { estado: "error", detalle: "El WhatsApp de Sivú no está vinculado" };
    try {
      const [existe] = await sock.onWhatsApp(telefono);
      if (!existe?.exists) return { estado: "error", detalle: "Ese número no tiene WhatsApp" };
      const jid = existe.jid;
      await sock.sendPresenceUpdate("composing", jid);
      await espera(azar(1200, 2600));
      await sock.sendPresenceUpdate("paused", jid);
      const r = await sock.sendMessage(jid, { text: texto });
      await espera(azar(2500, 5000));
      return {
        estado: "enviado",
        detalle: r?.key?.id || "",
        jid: r?.key?.remoteJid || jid,
        key: r?.key,
        timestamp: r?.messageTimestamp,
        mensaje: r,
      };
    } catch (e) {
      return { estado: "error", detalle: e.message || "No se pudo enviar" };
    }
  });
  cola = tarea.catch(() => {});
  if (automatico) tarea.finally(() => setTimeout(() => automaticos.delete(String(telefono)), 15000));
  return tarea;
}

// Baja la foto, audio, video o documento de un mensaje recibido (o enviado).
// WhatsApp guarda los archivos cifrados en sus servidores un tiempo; si ya
// expiraron, se le pide al celular que los vuelva a subir.
export async function descargarMedia(m) {
  if (!whatsappConectado()) throw new Error("El WhatsApp de Sivú no está vinculado");
  return downloadMediaMessage(m, "buffer", {}, { logger: silencio, reuploadRequest: sock.updateMediaMessage });
}

// Manda un archivo desde la bandeja del panel: foto, documento o audio.
export function enviarArchivo(telefono, { tipo, buffer, mime, nombre, texto }) {
  const tarea = cola.then(async () => {
    if (!whatsappConectado()) return { estado: "error", detalle: "El WhatsApp de Sivú no está vinculado" };
    try {
      const [existe] = await sock.onWhatsApp(telefono);
      if (!existe?.exists) return { estado: "error", detalle: "Ese número no tiene WhatsApp" };
      const jid = existe.jid;
      const contenido =
        tipo === "imagen"
          ? { image: buffer, caption: texto || undefined, mimetype: mime }
          : tipo === "video"
            ? { video: buffer, caption: texto || undefined, mimetype: mime }
            : tipo === "audio"
              ? { audio: buffer, mimetype: mime, ptt: /ogg|opus|webm/.test(mime) }
              : { document: buffer, mimetype: mime || "application/octet-stream", fileName: nombre || "archivo", caption: texto || undefined };
      const r = await sock.sendMessage(jid, contenido);
      await espera(azar(1500, 3000));
      return { estado: "enviado", detalle: r?.key?.id || "", jid: r?.key?.remoteJid || jid, key: r?.key, timestamp: r?.messageTimestamp, mensaje: r };
    } catch (e) {
      return { estado: "error", detalle: e.message || "No se pudo enviar" };
    }
  });
  cola = tarea.catch(() => {});
  return tarea;
}
