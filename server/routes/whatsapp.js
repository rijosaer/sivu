import { Router } from "express";
import { capturar } from "../errores.js";
import { conectar, desconectar, estadoWhatsapp } from "../whatsappWeb.js";

// El número de WhatsApp de Sivú vinculado como WhatsApp Web (para los avisos
// al cliente). Solo el dueño: lo monta admin.js detrás de soloDueno.
export const whatsappRouter = Router();

whatsappRouter.get("/", (_req, res) => res.json(estadoWhatsapp()));

// Arranca la conexión; si no hay sesión guardada, el estado pasa a "qr" y el
// panel muestra el código para escanear.
whatsappRouter.post(
  "/conectar",
  capturar(async (_req, res) => {
    await conectar();
    res.json(estadoWhatsapp());
  })
);

whatsappRouter.post(
  "/desconectar",
  capturar(async (_req, res) => {
    await desconectar();
    res.json(estadoWhatsapp());
  })
);
