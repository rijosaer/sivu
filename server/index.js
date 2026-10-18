import express from "express";
import cors from "cors";
import "dotenv/config";
import { publicRouter } from "./routes/public.js";
import { subidasNegocio } from "./routes/publicoNegocio.js";
import { disenosPublicosRouter } from "./disenos.js";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { manejadorDeErrores, noEncontrado } from "./errores.js";
import { reanudarWhatsapp } from "./whatsappWeb.js";
import { iniciarResumenes } from "./resumenDiario.js";
import { iniciarEnvios } from "./envioMasivo.js";
import { iniciarLeads } from "./leadsMeta.js";
import { iniciarOrdenWhatsapp } from "./waOrden.js";
import { iniciarReporte } from "./reporte.js";
import {
  cabecerasSeguras, corsOpciones, cuerpoSeguro, limitador, soloDesdeCloudflare, soloMetodos,
} from "./seguridad.js";

const app = express();

// Detrás del proxy de Railway. La IP del cliente para los limitadores no sale
// de aquí sino de clienteIp() (seguridad.js), que no se deja engañar por una
// cabecera X-Forwarded-For inventada.
app.set("trust proxy", 1);

// No anunciar el framework: es información gratis para un atacante.
app.disable("x-powered-by");
// Query string plana: ?a[b]=1 no se convierte en objeto. Corta de raíz los
// trucos de inyección que meten objetos u operadores por la URL.
app.set("query parser", "simple");
app.set("etag", false);

app.use(soloDesdeCloudflare);
app.use(cabecerasSeguras);
app.use(cors(corsOpciones));

// Freno a la fuerza bruta de contraseñas: pocos intentos por IP.
const limiteLogin = limitador({
  ventanaMs: 15 * 60 * 1000,
  maximo: 10,
  mensaje: "Demasiados intentos de acceso. Espera unos minutos e inténtalo de nuevo.",
});
// Freno general a lo público (scrapers, bucles). Una invitación con galería
// pide del orden de 20-40 archivos al abrirse, así que hay margen de sobra.
const limitePublico = limitador({
  ventanaMs: 60 * 1000,
  maximo: 120,
  mensaje: "Demasiadas solicitudes. Espera un momento.",
});

// Lo público y el login solo reciben JSON pequeño: una confirmación de
// asistencia ocupa unos cientos de bytes. El tope grande (fotos en base64)
// vive en admin.js y solo se aplica después de comprobar la sesión.
const jsonPequeno = express.json({ limit: "16kb", strict: true });

app.use("/api/public", soloMetodos("GET", "HEAD", "POST", "DELETE"), limitePublico);
// Excepción al tope pequeño: comprobantes de pago y archivos del formulario
// del cliente, solo con un token que exista (ver publicoNegocio.js). El lector
// pequeño de abajo ve el cuerpo ya leído y no hace nada.
app.use("/api/public", subidasNegocio);
app.use("/api/public", jsonPequeno, cuerpoSeguro);
app.use("/api/public/disenos", disenosPublicosRouter);
app.use("/api/public", publicRouter);
app.use("/api/auth/login", limiteLogin);
app.use("/api/auth", soloMetodos("GET", "POST"), jsonPequeno, cuerpoSeguro, authRouter);
app.use("/api/admin", adminRouter);

// Para monitores (UptimeRobot, Railway): sin nombre de producto ni versión.
app.get("/", (_req, res) => res.json({ ok: true }));
app.get("/salud", (_req, res) => res.json({ ok: true }));

// Cualquier otra ruta: el mismo 404 corto, sin pistas de qué existe.
app.use(noEncontrado);
// Va al final: recoge los errores de todas las rutas de arriba.
app.use(manejadorDeErrores);

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
  // Si ya había un número de WhatsApp vinculado, vuelve a conectarse solo.
  reanudarWhatsapp();
  // Revisa cada minuto qué eventos deben recibir su resumen diario.
  iniciarResumenes();
  // Cola del envío automático de invitaciones (sigue donde iba tras reiniciar).
  iniciarEnvios();
  // Clientes potenciales de los anuncios de Meta → WhatsApp de Sivú.
  iniciarLeads();
  // Guarda y ordena lo que entra y sale por el WhatsApp de Sivú.
  iniciarOrdenWhatsapp();
  // Reporte de cada mañana al equipo.
  iniciarReporte();
});

// Conexiones lentas a propósito (slowloris) no se quedan con el servidor:
// cabeceras en 15 s, petición completa (subidas incluidas) en 60 s.
server.headersTimeout = 15_000;
server.requestTimeout = 60_000;
server.keepAliveTimeout = 5_000;
