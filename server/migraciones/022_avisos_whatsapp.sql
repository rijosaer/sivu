-- ------------------------------------------------------------------
-- Avisos por WhatsApp en tiempo real
-- ------------------------------------------------------------------
-- Cuando un invitado responde desde su enlace, Sivú le escribe por WhatsApp
-- al cliente (los novios, la mamá de la quinceañera...) sin que tenga que
-- tener el panel abierto. Lo prende el dueño en cada evento: no va atado a
-- un paquete.
--
--   avisos_whatsapp   → prendido o apagado.
--   avisos_telefonos  → a quién se le escribe; uno o varios números
--                       separados por coma, tal como los escriba el dueño.
--
-- avisos_enviados guarda cada intento (bien o mal) para poder ver en el panel
-- si el aviso salió y, si no, por qué.
-- ------------------------------------------------------------------

ALTER TABLE invitaciones ADD COLUMN IF NOT EXISTS avisos_whatsapp BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE invitaciones ADD COLUMN IF NOT EXISTS avisos_telefonos TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS avisos_enviados (
  id SERIAL PRIMARY KEY,
  invitacion_id INTEGER NOT NULL REFERENCES invitaciones(id) ON DELETE CASCADE,
  invitado_id INTEGER REFERENCES invitados(id) ON DELETE SET NULL,
  telefono TEXT NOT NULL,
  texto TEXT NOT NULL,
  estado TEXT NOT NULL,          -- enviado | error | simulado
  detalle TEXT NOT NULL DEFAULT '',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS avisos_enviados_invitacion ON avisos_enviados (invitacion_id, creado_en DESC);
