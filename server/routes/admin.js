import { Router } from "express";
import { requiereAdmin } from "../auth.js";
import { resolverInvitacionAdmin } from "../middlewareInvitacion.js";
import { invitacionesRouter } from "./invitaciones.js";
import { recursosRouter } from "./recursos.js";

// Todo /api/admin exige sesión. Dos cosas cuelgan de aquí:
//  - /invitaciones            CRUD de los eventos en sí (crear, listar, editar).
//  - /invitaciones/:id/...    todo lo de un evento puntual (secciones, tema,
//                             decoraciones, invitados...), antes montado
//                             directo en /api/admin y ahora resuelto contra
//                             esa invitación concreta.
export const adminRouter = Router();
adminRouter.use(requiereAdmin);

adminRouter.use("/invitaciones", invitacionesRouter);
adminRouter.use("/invitaciones/:invitacionId", resolverInvitacionAdmin, recursosRouter);
