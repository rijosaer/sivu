-- ------------------------------------------------------------------
-- Resumen diario del avance de confirmaciones por WhatsApp
-- ------------------------------------------------------------------
-- Además del aviso por cada respuesta, el cliente puede recibir una vez al
-- día cómo va su evento: quiénes respondieron ese día y cuántos asisten, no
-- asisten o faltan por responder. Va a los mismos números de los avisos.
--
--   avisos_resumen        → prendido o apagado.
--   avisos_resumen_hora   → hora de Colombia (0-23) en que sale.
--   avisos_resumen_ultimo → cuándo salió el último; marca el comienzo de las
--                           «respuestas nuevas» del siguiente y evita
--                           mandar dos el mismo día.
-- ------------------------------------------------------------------

ALTER TABLE invitaciones ADD COLUMN IF NOT EXISTS avisos_resumen BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE invitaciones ADD COLUMN IF NOT EXISTS avisos_resumen_hora SMALLINT NOT NULL DEFAULT 19
  CHECK (avisos_resumen_hora BETWEEN 0 AND 23);
ALTER TABLE invitaciones ADD COLUMN IF NOT EXISTS avisos_resumen_ultimo TIMESTAMPTZ;
