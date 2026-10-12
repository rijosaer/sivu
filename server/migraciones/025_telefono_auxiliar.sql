-- ------------------------------------------------------------------
-- Número auxiliar de WhatsApp por invitación
-- ------------------------------------------------------------------
-- Hay invitados con dos números (el suyo y el de un hijo, o uno viejo y
-- uno nuevo). El auxiliar es opcional: cuando está, el panel permite mandar
-- la misma invitación (o el recordatorio) también a ese número.
-- ------------------------------------------------------------------

ALTER TABLE invitados ADD COLUMN IF NOT EXISTS telefono_aux TEXT NOT NULL DEFAULT '';
