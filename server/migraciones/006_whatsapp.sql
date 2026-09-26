-- Envío de invitaciones por WhatsApp.
--
-- El teléfono se guarda tal como lo escriba el usuario; la normalización a
-- formato internacional se hace al armar el enlace, no aquí, para no perder
-- lo que tecleó si se equivoca.
ALTER TABLE invitados ADD COLUMN IF NOT EXISTS telefono TEXT NOT NULL DEFAULT '';

-- Cuándo se envió. NULL = todavía no se ha mandado. Se guarda la fecha y no
-- un simple sí/no para poder saber cuándo se mandó cada una.
ALTER TABLE invitados ADD COLUMN IF NOT EXISTS enviado_en TIMESTAMPTZ;

-- Plantilla del mensaje, configurable desde el panel. {nombre} y {enlace} se
-- reemplazan al momento de enviar.
INSERT INTO tema (clave, valor) VALUES (
  'whatsapp-plantilla',
  'Hola {nombre}, ¡nos casamos! 💍' || chr(10) || chr(10) ||
  'Te compartimos tu invitación personal:' || chr(10) ||
  '{enlace}' || chr(10) || chr(10) ||
  'Ahí puedes confirmar tu asistencia. ¡Nos encantaría contar contigo!'
) ON CONFLICT (clave) DO NOTHING;
