import express from "express";
import cors from "cors";
import { existsSync } from "node:fs";
import path from "node:path";
import "dotenv/config";
import { authRouter } from "./routes/auth.js";
import { llavesRouter } from "./routes/llaves.js";
import { v1Router } from "./routes/v1.js";
import { manejadorDeErrores } from "./errores.js";
import { DATOS_DIR } from "./almacen.js";
import { iniciarCola } from "./cola.js";
import { cabecerasSeguras, limitador } from "./seguridad.js";
import { motorActual } from "./motores/index.js";

// Falla al arrancar, no en la primera petición, si falta configuración.
if (!process.env.JWT_SECRET) throw new Error("Falta JWT_SECRET en el entorno");
motorActual();

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(cabecerasSeguras);
// La API se usa desde cualquier origen con llave en el encabezado (sin
// cookies), así que CORS abierto no expone nada.
app.use(cors());
// Una imagen de 10 MB en base64 ocupa ~13.4 MB.
app.use(express.json({ limit: "15mb" }));

const limiteLogin = limitador({
  ventanaMs: 15 * 60 * 1000,
  maximo: 10,
  mensaje: "Demasiados intentos. Espera unos minutos.",
});
app.use(["/api/auth/login", "/api/auth/registro"], limiteLogin);
app.use("/api/auth", authRouter);
app.use("/api/llaves", llavesRouter);
app.use("/v1", v1Router);

// Videos e imágenes. Los nombres son UUID: no se pueden adivinar.
app.use("/archivos", express.static(DATOS_DIR, { dotfiles: "deny", index: false, maxAge: "7d" }));

// La web compilada (web/dist), si existe: así todo vive en un solo servicio.
const web = path.resolve(process.env.WEB_DIST || new URL("../web/dist", import.meta.url).pathname);
if (existsSync(web)) {
  app.use(express.static(web));
} else {
  app.get("/", (_req, res) => res.send("API de Wan Studio funcionando. La web no está compilada."));
}

app.use(manejadorDeErrores);

const PORT = process.env.PORT || 4100;
app.listen(PORT, () => {
  console.log(`Wan Studio escuchando en http://localhost:${PORT}`);
  iniciarCola();
});
