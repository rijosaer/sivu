import express, { Router } from "express";
import { requiereAdmin, soloDueno } from "../auth.js";
import { resolverInvitacionAdmin } from "../middlewareInvitacion.js";
import { cuerpoSeguro, limitador, soloMetodos } from "../seguridad.js";
import { invitacionesRouter } from "./invitaciones.js";
import { recursosRouter } from "./recursos.js";
import { whatsappRouter } from "./whatsapp.js";
import { crmRouter } from "./crm.js";
import { mensajesEventoRouter } from "./mensajesEvento.js";

// Todo /api/admin exige sesión. Dos cosas cuelgan de aquí:
//  - /invitaciones            CRUD de los eventos en sí (crear, listar, editar).
//  - /invitaciones/:id/...    todo lo de un evento puntual (secciones, tema,
//                             decoraciones, invitados...), antes montado
//                             directo en /api/admin y ahora resuelto contra
//                             esa invitación concreta.
// Y /whatsapp, el número de Sivú que manda los avisos (solo el dueño).
export const adminRouter = Router();
adminRouter.use(soloMetodos("GET", "POST", "PUT", "DELETE"));
adminRouter.use(requiereAdmin);

// Una sesión robada o un script desbocado no puede martillar la API: el panel
// normal, con su sondeo de novedades, no pasa de unas decenas por minuto.
adminRouter.use(
  limitador({
    ventanaMs: 60 * 1000,
    maximo: 300,
    clave: (req) => `a:${req.admin.usuario}`,
    mensaje: "Demasiadas solicitudes desde el panel. Espera un momento.",
  })
);

// El cuerpo se lee DESPUÉS de comprobar la sesión: así nadie sin usuario
// puede mandar 20 MB para ocupar memoria. El tope es generoso porque las
// fotos, el audio y las decoraciones se suben en base64 (un tercio más); el
// tope real por archivo (12 MB) lo pone archivos.js.
adminRouter.use(express.json({ limit: "20mb", strict: true }), cuerpoSeguro);

adminRouter.use("/whatsapp", soloDueno, whatsappRouter);
// Clientes potenciales, configuración, cotizaciones y producción (solo dueño).
adminRouter.use("/crm", soloDueno, crmRouter);
adminRouter.use("/invitaciones", invitacionesRouter);
adminRouter.use("/invitaciones/:invitacionId", resolverInvitacionAdmin, recursosRouter);
adminRouter.use("/invitaciones/:invitacionId", resolverInvitacionAdmin, mensajesEventoRouter);
