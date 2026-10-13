import { Router } from "express";
import { pool } from "../db.js";
import { capturar } from "../errores.js";

// Lo que los invitados de un evento le escriben al WhatsApp de Sivú
// («gracias», «¿puedo llevar a mi hijo?», «¿a qué hora es?»). Se guarda
// aunque el chat esté archivado, para que nada se pierda y el cliente
// también lo vea desde su panel.
export const mensajesEventoRouter = Router({ mergeParams: true });

mensajesEventoRouter.get(
  "/mensajes",
  capturar(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT m.id, m.telefono, m.direccion, m.texto, m.tipo, m.creado_en, m.leido, m.nombre_contacto,
              m.invitado_id, v.nombre AS invitado
       FROM mensajes_whatsapp m LEFT JOIN invitados v ON v.id = m.invitado_id
       WHERE m.invitacion_id = $1
       ORDER BY m.creado_en DESC LIMIT 500`,
      [req.invitacionId]
    );
    res.json(rows);
  })
);

mensajesEventoRouter.post(
  "/mensajes/leidos",
  capturar(async (req, res) => {
    await pool.query("UPDATE mensajes_whatsapp SET leido = true WHERE invitacion_id = $1 AND NOT leido", [req.invitacionId]);
    res.json({ ok: true });
  })
);
