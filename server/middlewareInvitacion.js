import { pool } from "./db.js";
import { capturar } from "./errores.js";
import { esIdValido, SLUG_RE } from "./seguridad.js";

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
    "SELECT id, slug, nombre, tipo_evento, diseno, activo, es_plantilla FROM invitaciones WHERE id = $1",
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
    "SELECT id, slug, nombre, tipo_evento, diseno FROM invitaciones WHERE slug = $1 AND activo = true",
    [req.params.slug]
  );
  if (!rows.length) return res.status(404).json({ error: "Invitación no encontrada" });
  req.invitacionId = rows[0].id;
  req.invitacion = rows[0];
  next();
});
