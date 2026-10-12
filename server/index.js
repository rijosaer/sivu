import express from "express";
import cors from "cors";
import "dotenv/config";
import { publicRouter } from "./routes/public.js";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { manejadorDeErrores } from "./errores.js";
import { reanudarWhatsapp } from "./whatsappWeb.js";
import { iniciarResumenes } from "./resumenDiario.js";
import { iniciarEnvios } from "./envioMasivo.js";
import { cabecerasSeguras, corsOpciones, limitador } from "./seguridad.js";

const app = express();

// Detrás del proxy de Railway: confiar en un solo salto para leer la IP real
// del cliente (para el limitador) sin dejar que la cabecera X-Forwarded-For
// del cliente se pueda falsificar más allá de ese salto.
app.set("trust proxy", 1);

// No anunciar el framework: es información gratis para un atacante.
app.disable("x-powered-by");

app.use(cabecerasSeguras);
app.use(cors(corsOpciones));
// Límite generoso: las fotos, el audio y las decoraciones se suben en base64,
// que abulta el archivo un tercio. El tope real por archivo lo pone la API.
app.use(express.json({ limit: "20mb" }));

// Freno a la fuerza bruta de contraseñas: pocos intentos por IP.
const limiteLogin = limitador({
  ventanaMs: 15 * 60 * 1000,
  maximo: 10,
  mensaje: "Demasiados intentos de acceso. Espera unos minutos e inténtalo de nuevo.",
});
// Freno suave a la adivinación de códigos de invitado y al spam de respuestas.
const limitePublico = limitador({
  ventanaMs: 60 * 1000,
  maximo: 60,
  mensaje: "Demasiadas solicitudes. Espera un momento.",
});

app.use("/api/public", limitePublico, publicRouter);
app.use("/api/auth/login", limiteLogin);
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);

app.get("/", (_req, res) => res.send("Backend de la invitación funcionando."));

// Va al final: recoge los errores de todas las rutas de arriba.
app.use(manejadorDeErrores);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  // Si ya había un número de WhatsApp vinculado, vuelve a conectarse solo.
  reanudarWhatsapp();
  // Revisa cada minuto qué eventos deben recibir su resumen diario.
  iniciarResumenes();
  // Cola del envío automático de invitaciones (sigue donde iba tras reiniciar).
  iniciarEnvios();
});
