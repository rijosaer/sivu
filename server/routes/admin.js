import { Router } from "express";
import { requiereAdmin, soloDueno } from "../auth.js";
import { resolverInvitacionAdmin } from "../middlewareInvitacion.js";
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
adminRouter.use(requiereAdmin);

adminRouter.use("/whatsapp", soloDueno, whatsappRouter);
// Clientes potenciales, configuración, cotizaciones y producción (solo dueño).
adminRouter.use("/crm", soloDueno, crmRouter);
adminRouter.use("/invitaciones", invitacionesRouter);
adminRouter.use("/invitaciones/:invitacionId", resolverInvitacionAdmin, recursosRouter);
adminRouter.use("/invitaciones/:invitacionId", resolverInvitacionAdmin, mensajesEventoRouter);
