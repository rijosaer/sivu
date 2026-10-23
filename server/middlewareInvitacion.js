import { createHmac, timingSafeEqual } from "node:crypto";
import { pool } from "./db.js";
import { capturar } from "./errores.js";
import { secretoFirma } from "./auth.js";
import { esIdValido, SLUG_RE } from "./seguridad.js";

// Token de vista previa: deja al panel mostrar en su iframe una invitación
// que es «solo con enlace personal» sin tener que inventar un invitado. Lo
// emite GET /api/admin/invitaciones/:id/vista a quien ya administra el evento.
export function tokenVista(invitacionId) {
  return createHmac("sha256", secretoFirma("vista")).update(String(invitacionId)).digest("base64url").slice(0, 24);
}

function vistaValida(invitacionId, token) {
  if (typeof token !== "string" || token.length !== 24) return false;
  const a = Buffer.from(tokenVista(invitacionId));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Admin: la invitación se identifica por su id numérico en la URL
// (/api/admin/invitaciones/:invitacionId/...). El panel puede operar sobre
// una invitación desactivada (por ejemplo, para terminar de armarla antes de
// activarla), así que aquí no se filtra por "activo".
export const resolverInvitacionAdmin = capturar(async (req, res, next) => {
  if (!esIdValido(req.params.invitacionId)) {
    return res.status(400).json({ error: "Invitación no válida" });
  }
  const id = Number(req.params.invitacionId);
  // Un cliente solo existe para su propio evento: cualquier otro id responde
  // igual que uno inexistente, para no revelar qué otros eventos hay.
  if (req.admin?.invitacionId && req.admin.invitacionId !== id) {
    return res.status(404).json({ error: "Invitación no encontrada" });
  }
  const { rows } = await pool.query(
    "SELECT id, slug, nombre, tipo_evento, diseno, activo, es_plantilla, solo_codigo FROM invitaciones WHERE id = $1",
    [id]
  );
  if (!rows.length) return res.status(404).json({ error: "Invitación no encontrada" });
  req.invitacionId = id;
  req.invitacion = rows[0];
  next();
});

// Público: la invitación se identifica por su slug
// (/api/public/invitaciones/:slug/...). Una invitación desactivada no existe
// para el público: se responde 404 igual que si el slug no existiera, para
// no revelar que hubo (o habrá) un evento con ese enlace.
export const resolverInvitacionPublica = capturar(async (req, res, next) => {
  // Un slug con forma imposible ni siquiera llega a la base.
  if (!SLUG_RE.test(req.params.slug || "")) {
    return res.status(404).json({ error: "Invitación no encontrada" });
  }
  const { rows } = await pool.query(
    "SELECT id, slug, nombre, tipo_evento, diseno, solo_codigo FROM invitaciones WHERE slug = $1 AND activo = true",
    [req.params.slug]
  );
  if (!rows.length) return res.status(404).json({ error: "Invitación no encontrada" });
  req.invitacionId = rows[0].id;
  req.invitacion = rows[0];
  next();
});

// ¿Quien pide puede ver el contenido de esta invitación? Siempre, salvo que
// el evento sea «solo con enlace personal»: ahí hace falta el código de un
// invitado de ESTE evento (?i=) o el token de vista previa del panel (?vista=).
// Lo que no cumple responde 404, igual que un slug que no existe.
export const exigirAccesoPublico = capturar(async (req, res, next) => {
  if (!req.invitacion.solo_codigo) return next();
  if (vistaValida(req.invitacionId, req.query.vista)) return next();
  const codigo = req.query.i;
  if (typeof codigo === "string" && /^[A-Za-z0-9_-]{3,40}$/.test(codigo)) {
    const { rowCount } = await pool.query(
      "SELECT 1 FROM invitados WHERE codigo = $1 AND invitacion_id = $2",
      [codigo, req.invitacionId]
    );
    if (rowCount) return next();
  }
  return res.status(404).json({ error: "Invitación no encontrada" });
});
